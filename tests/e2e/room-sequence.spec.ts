import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const catalogIds = fs
  .readdirSync('src/frames/manifests')
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.slice(0, -5))
  .sort();
const colors = [
  { host: [255, 0, 0], guest: [0, 0, 255] },
  { host: [255, 255, 0], guest: [0, 255, 255] },
  { host: [255, 0, 255], guest: [255, 128, 0] },
  { host: [0, 255, 0], guest: [128, 0, 255] },
];

test.beforeEach(async ({ page }) => {
  // This renderer harness has no app UI; suppress development reloads during independent UI work.
  await page.route('**/@vite/client', (route) => route.abort());
  await page.goto('/tests/harness.html');
});

test('room sequence maps fresh pairs by slot order and preview retains completed pairs', async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const composition = await import('/src/core/room/composition.ts');
    if (typeof composition.exportRoomSequence !== 'function')
      throw new Error('Missing paired room sequence export.');
    const portrait = (color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 100;
      const context = canvas.getContext('2d')!;
      context.fillStyle = color;
      context.fillRect(0, 0, 100, 100);
      return canvas;
    };
    const pairs = [
      { host: portrait('#ff0000'), guest: portrait('#0000ff') },
      { host: portrait('#ffff00'), guest: portrait('#00ffff') },
    ];
    const frame = {
      id: 'ordered-pair-proof',
      version: 1,
      name: 'Ordered Pair Proof',
      format: 'card',
      categories: [],
      designWidth: 400,
      designHeight: 400,
      palette: { background: '#ffffff', ink: '#000000', accent: '#ff0000', secondary: '#eeeeee' },
      layers: { background: '', foreground: '' },
      textAreas: [],
      thumbnail: '',
      licenses: [],
      description: '',
      slots: [
        {
          id: 'last',
          order: 2,
          x: 0,
          y: 0.5,
          w: 1,
          h: 0.5,
          shape: 'rect',
          rotationDeg: 0,
          matteColor: '#ffffff',
        },
        {
          id: 'first',
          order: 1,
          x: 0,
          y: 0,
          w: 1,
          h: 0.5,
          shape: 'rect',
          rotationDeg: 0,
          matteColor: '#ffffff',
        },
      ],
    };
    const png = (canvas: HTMLCanvasElement) =>
      new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
    const encoded = await Promise.all(
      pairs.map(async (pair) => ({ host: await png(pair.host), guest: await png(pair.guest) })),
    );
    const blob = await composition.exportRoomSequence(encoded, frame as never, 'studio');
    const bitmap = await createImageBitmap(blob);
    const output = document.createElement('canvas');
    output.width = output.height = 400;
    output.getContext('2d')!.drawImage(bitmap, 0, 0);
    bitmap.close();
    const preview = document.createElement('canvas');
    preview.width = preview.height = 400;
    await composition.drawRoomFrame(
      preview,
      pairs[1].host,
      pairs[1].guest,
      frame as never,
      'studio',
      [pairs[0]],
    );
    const pixel = (canvas: HTMLCanvasElement, x: number, y: number) =>
      Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
    let extraPreviewRejected = false;
    try {
      await composition.drawRoomFrame(preview, null, null, frame as never, 'studio', [
        pairs[0],
        pairs[1],
        pairs[0],
      ]);
    } catch {
      extraPreviewRejected = true;
    }
    return {
      firstHost: pixel(output, 100, 100),
      firstGuest: pixel(output, 300, 100),
      lastHost: pixel(output, 100, 300),
      lastGuest: pixel(output, 300, 300),
      previewFirstHost: pixel(preview, 100, 100),
      previewFirstGuest: pixel(preview, 300, 100),
      previewLastHost: pixel(preview, 100, 300),
      previewLastGuest: pixel(preview, 300, 300),
      extraPreviewRejected,
    };
  });
  // WebKit's PNG color conversion adds one red byte per encode/decode to cyan and green.
  // Two bytes still sharply distinguish each shot and side while keeping alpha exact.
  const expectPixel = (actual: number[], expected: number[]) => {
    for (let channel = 0; channel < 3; channel++)
      expect(Math.abs(actual[channel] - expected[channel])).toBeLessThanOrEqual(2);
    expect(actual[3]).toBe(255);
  };
  for (const [actual, expected] of [
    [result.firstHost, [255, 0, 0]],
    [result.firstGuest, [0, 0, 255]],
    [result.lastHost, [255, 255, 0]],
    [result.lastGuest, [0, 255, 255]],
    [result.previewFirstHost, [255, 0, 0]],
    [result.previewFirstGuest, [0, 0, 255]],
    [result.previewLastHost, [255, 255, 0]],
    [result.previewLastGuest, [0, 255, 255]],
  ])
    expectPixel(actual, expected);
  expect(result.extraPreviewRejected).toBe(true);
});

for (let start = 0; start < catalogIds.length; start += 10) {
  const ids = catalogIds.slice(start, start + 10);
  test(`prepared catalog room export ${start + 1}–${start + ids.length} keeps each paired shot in its own slot`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const results = await page.evaluate(
      async ({ ids, colors }) => {
        const { exportRoomSequence } = await import('/src/core/room/composition.ts');
        const { onlineRoomFrames, getRoomFrame } = await import('/src/core/room/frames.ts');
        if (typeof exportRoomSequence !== 'function' || !Array.isArray(onlineRoomFrames))
          throw new Error('Missing prepared catalog room sequence support.');
        const portrait = (rgb: number[]) => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 100;
          const context = canvas.getContext('2d')!;
          context.fillStyle = `rgb(${rgb.join(',')})`;
          context.fillRect(0, 0, 100, 100);
          return new Promise<Blob>((resolve) =>
            canvas.toBlob((value) => resolve(value!), 'image/png'),
          );
        };
        const originals = await Promise.all(
          colors.map(async (pair) => ({
            host: await portrait(pair.host),
            guest: await portrait(pair.guest),
          })),
        );
        const results = [];
        for (const id of ids) {
          const frame = getRoomFrame(id);
          const slots = [...frame.slots].sort((a, b) => a.order - b.order);
          const blob = await exportRoomSequence(originals.slice(0, slots.length), frame, 'studio');
          const decoded = await createImageBitmap(blob);
          const canvas = document.createElement('canvas');
          canvas.width = decoded.width;
          canvas.height = decoded.height;
          const context = canvas.getContext('2d')!;
          context.drawImage(decoded, 0, 0);
          decoded.close();
          const shots = slots.map((slot, index) => {
            const sw = slot.w * canvas.width,
              sh = slot.h * canvas.height;
            const cx = (slot.x + slot.w / 2) * canvas.width,
              cy = (slot.y + slot.h / 2) * canvas.height;
            const angle = (slot.rotationDeg * Math.PI) / 180;
            const matches = (side: 'host' | 'guest') => {
              let count = 0;
              for (const x of side === 'host'
                ? [0.2, 0.25, 0.3, 0.35, 0.4]
                : [0.6, 0.65, 0.7, 0.75, 0.8]) {
                for (const y of [0.35, 0.425, 0.5, 0.575, 0.65]) {
                  const dx = (x - 0.5) * sw,
                    dy = (y - 0.5) * sh;
                  const px = Math.round(cx + dx * Math.cos(angle) - dy * Math.sin(angle));
                  const py = Math.round(cy + dx * Math.sin(angle) + dy * Math.cos(angle));
                  const sample = context.getImageData(px, py, 1, 1).data;
                  if (
                    colors[index][side].every(
                      (value, channel) => Math.abs(sample[channel] - value) <= 2,
                    ) &&
                    sample[3] === 255
                  )
                    count++;
                }
              }
              return count;
            };
            return {
              order: slot.order,
              hostMatches: matches('host'),
              guestMatches: matches('guest'),
            };
          });
          results.push({
            requestedId: id,
            actualId: frame.id,
            width: canvas.width,
            height: canvas.height,
            expectedWidth: frame.designWidth,
            expectedHeight: frame.designHeight,
            bytes: blob.size,
            type: blob.type,
            shots,
          });
          canvas.width = canvas.height = 1;
        }
        return results;
      },
      { ids, colors },
    );
    await test.info().attach('paired-slot-pixel-proof', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });
    expect(results).toHaveLength(ids.length);
    for (const result of results) {
      expect(result.actualId, result.requestedId).toBe(result.requestedId);
      expect([result.width, result.height], result.requestedId).toEqual([
        result.expectedWidth,
        result.expectedHeight,
      ]);
      expect(result.type, result.requestedId).toBe('image/png');
      expect(result.bytes, result.requestedId).toBeGreaterThan(1000);
      for (const shot of result.shots) {
        expect(
          shot.hostMatches,
          `${result.requestedId} slot ${shot.order}: host`,
        ).toBeGreaterThanOrEqual(8);
        expect(
          shot.guestMatches,
          `${result.requestedId} slot ${shot.order}: guest`,
        ).toBeGreaterThanOrEqual(8);
      }
    }
  });
}
