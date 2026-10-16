import { test, expect } from '@playwright/test';

test('both foreheads and eyes survive eight sculpted masks and all revised or mixed layouts', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto('/tests/harness.html', { waitUntil: 'networkidle' });
  const results = await page.evaluate(async () => {
    const { drawRoomFrame, drawRoomScene, exportRoomFrame } =
      await import('/src/core/room/composition.ts');
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#00ffff', '#ff8800', '#8800ff'];
    const keys = new Map<number, number>();
    // Safari's PNG round trip shifts saturated green/cyan by one red byte.
    for (const [index, color] of colors.entries()) {
      const [red, green, blue] = [1, 3, 5].map((offset) =>
        parseInt(color.slice(offset, offset + 2), 16),
      );
      for (let r = Math.max(0, red - 2); r <= Math.min(255, red + 2); r++)
        for (let g = Math.max(0, green - 2); g <= Math.min(255, green + 2); g++)
          for (let b = Math.max(0, blue - 2); b <= Math.min(255, blue + 2); b++)
            keys.set((r << 16) | (g << 8) | b, index);
    }
    const portrait = (side: number, opaque: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext('2d')!;
      if (opaque) {
        context.fillStyle = '#cbd8bd';
        context.fillRect(0, 0, 640, 480);
      }
      context.fillStyle = '#e6b898';
      context.beginPath();
      context.ellipse(320, 108, 88, 105, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = side ? '#6e779a' : '#8c6371';
      context.fillRect(205, 204, 230, 276);
      // Three independent square landmarks: forehead, left eye, right eye.
      for (const [i, x, y] of [
        [0, 320, 48],
        [1, 269, 96],
        [2, 371, 96],
      ]) {
        context.fillStyle = colors[side * 3 + i];
        context.fillRect(x - 13, y - 13, 26, 26);
      }
      return canvas;
    };
    const measure = (canvas: HTMLCanvasElement) => {
      const result = colors.map(() => ({
        count: 0,
        left: Infinity,
        top: Infinity,
        right: -1,
        bottom: -1,
      }));
      const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let p = 0; p < data.length; p += 4) {
        const index = keys.get((data[p] << 16) | (data[p + 1] << 8) | data[p + 2]);
        if (index === undefined || data[p + 3] !== 255) continue;
        const mark = result[index],
          x = (p / 4) % canvas.width,
          y = Math.floor(p / 4 / canvas.width);
        mark.count++;
        mark.left = Math.min(mark.left, x);
        mark.right = Math.max(mark.right, x);
        mark.top = Math.min(mark.top, y);
        mark.bottom = Math.max(mark.bottom, y);
      }
      return result.map((mark) => ({
        ...mark,
        width: mark.right - mark.left + 1,
        height: mark.bottom - mark.top + 1,
      }));
    };
    const blob = (canvas: HTMLCanvasElement) =>
      new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
    const results = [];
    for (const opaque of [false, true]) {
      const host = portrait(0, opaque),
        guest = portrait(1, opaque);
      const hostBlob = await blob(host),
        guestBlob = await blob(guest);
      for (const ratio of [0.6, 1.8]) {
        const frame = {
          id: 'face-proof',
          name: 'Face proof',
          version: 1,
          format: 'card',
          categories: [],
          designWidth: 1200,
          designHeight: Math.round(1200 / ratio),
          palette: {
            background: '#ffffff',
            ink: '#000000',
            accent: '#111111',
            secondary: '#eeeeee',
          },
          layers: { background: '', foreground: '' },
          textAreas: [],
          thumbnail: '',
          licenses: [],
          description: '',
          slots: [
            {
              id: 'p1',
              order: 1,
              x: 0,
              y: 0,
              w: 1,
              h: 1,
              shape: 'path',
              pathRef: 'star',
              rotationDeg: 0,
              matteColor: '#ffffff',
            },
          ],
        };
        const reference = document.createElement('canvas');
        reference.width = frame.designWidth;
        reference.height = frame.designHeight;
        drawRoomScene(reference, host, guest, 'studio');
        const baseline = measure(reference);
        for (const ref of ['star', 'flower', 'cloud', 'pebble', 'wave', 'torn', 'heart', 'burst']) {
          frame.slots[0].pathRef = ref;
          const preview = document.createElement('canvas');
          preview.width = 600;
          preview.height = Math.round(600 / ratio);
          await drawRoomFrame(preview, host, guest, frame as never, 'studio');
          const exported = await exportRoomFrame(hostBlob, guestBlob, frame as never, 'studio');
          const image = await createImageBitmap(exported);
          const output = document.createElement('canvas');
          output.width = image.width;
          output.height = image.height;
          output.getContext('2d')!.drawImage(image, 0, 0);
          image.close();
          results.push({
            ref,
            ratio,
            opaque,
            baseline,
            preview: measure(preview),
            exported: measure(output),
          });
          preview.width = preview.height = output.width = output.height = 1;
        }
        reference.width = reference.height = 1;
      }
    }
    const { onlineRoomFrames } = await import('/src/core/room/frames.ts');
    const catalog = [];
    const host = portrait(0, false),
      guest = portrait(1, false);
    const revisedIds = [
      'aquarium-parade',
      'stellar-atlas',
      'desert-bazaar',
      'dragon-lantern',
      'froggy-day',
      'ribbon-diary-portrait',
      'denim-daisy-portrait',
      'botanical-journal-portrait',
      'wedding-bloom-portrait',
    ];
    const revisedFrames = onlineRoomFrames.filter(
      (frame) => revisedIds.includes(frame.id) || frame.collection === 'Mixed Moments',
    );
    for (const frame of revisedFrames) {
      for (const slot of frame.slots) {
        const ratio = (slot.w * frame.designWidth) / (slot.h * frame.designHeight);
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = Math.round(600 / ratio);
        const isolated = {
          ...frame,
          designWidth: canvas.width,
          designHeight: canvas.height,
          layers: { background: '', foreground: '' },
          textAreas: [],
          slots: [{ ...slot, x: 0, y: 0, w: 1, h: 1, rotationDeg: 0 }],
        };
        // Isolate each real window so one good slot cannot hide another slot's missing face.
        drawRoomScene(canvas, host, guest, 'studio');
        const baseline = measure(canvas);
        await drawRoomFrame(canvas, host, guest, isolated, 'studio');
        catalog.push({
          id: frame.id,
          slot: slot.id,
          ref: slot.pathRef ?? slot.shape,
          baseline,
          marks: measure(canvas),
        });
        canvas.width = canvas.height = 1;
      }
    }
    return {
      results,
      catalog,
      frameCount: onlineRoomFrames.length,
      revisedCount: revisedFrames.length,
    };
  });
  const issues: string[] = [];
  for (const result of results.results) {
    for (const [kind, marks, scale] of [
      ['preview', result.preview, 0.5],
      ['export', result.exported, 1],
    ] as const) {
      for (const [index, mark] of marks.entries()) {
        const label = `${result.ref} ${result.ratio} ${result.opaque ? 'opaque' : 'segmented'} ${kind} ${index < 3 ? 'host' : 'guest'} ${['forehead', 'left eye', 'right eye'][index % 3]}`;
        if (mark.count <= 5) {
          issues.push(`${label}: landmark lost`);
          continue;
        }
        const ratio = mark.width / mark.height;
        if (ratio <= 0.75 || ratio >= 1.33) issues.push(`${label}: stretched or clipped ${ratio}`);
        if (mark.count / (result.baseline[index].count * scale * scale) <= 0.38)
          issues.push(`${label}: face became too small or clipped`);
        if (index < 3 ? mark.right >= 600 * scale : mark.left <= 600 * scale)
          issues.push(`${label}: participant changed sides`);
      }
    }
  }
  expect(results.frameCount).toBe(123);
  expect(results.revisedCount).toBe(49);
  expect(results.catalog).toHaveLength(178);
  for (const slot of results.catalog) {
    for (const [index, mark] of slot.marks.entries()) {
      const label = `${slot.id} ${slot.slot} ${slot.ref} landmark ${index}`;
      if (mark.count <= 5) issues.push(`${label}: landmark lost`);
      else {
        if (mark.count / slot.baseline[index].count <= 0.38)
          issues.push(`${label}: face too small or clipped`);
        if (mark.width / mark.height <= 0.75 || mark.width / mark.height >= 1.33)
          issues.push(`${label}: stretched or clipped`);
        if (index < 3 ? mark.right >= 300 : mark.left <= 300)
          issues.push(`${label}: participant changed sides`);
      }
    }
  }
  expect(issues.slice(0, 16), `${issues.length} facial landmark issues`).toEqual([]);
});
