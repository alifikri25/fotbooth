import { test, expect } from '@playwright/test';

test('masked people share a continuous scene, remain left/right, and fill every exported frame slot', async ({
  page,
}) => {
  await page.goto('/tests/harness.html');
  const result = await page.evaluate(async () => {
    const { makeRoomPortrait, drawRoomScene, drawRoomFrame, exportRoomFrame } =
      await import('/src/core/room/composition.ts');
    const person = (color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#00ff00'; // Original camera background must never survive segmentation.
      context.fillRect(0, 0, 400, 400);
      context.fillStyle = color;
      context.fillRect(120, 80, 160, 320);
      const values = new Float32Array(400 * 400);
      for (let y = 80; y < 400; y++) for (let x = 120; x < 280; x++) values[y * 400 + x] = 1;
      return makeRoomPortrait(canvas, 400, 400, { width: 400, height: 400, values });
    };
    const host = person('#ff0000'),
      guest = person('#0000ff');
    const pair = document.querySelector('canvas')!;
    pair.width = 800;
    pair.height = 400;
    drawRoomScene(pair, host, guest, 'studio');
    const pixel = (canvas: HTMLCanvasElement, x: number, y: number) =>
      Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
    const live = {
      left: pixel(pair, 200, 220),
      right: pixel(pair, 600, 220),
      leftBackground: pixel(pair, 20, 20),
      rightBackground: pixel(pair, 780, 20),
      seamLeft: pixel(pair, 399, 30),
      seamRight: pixel(pair, 400, 30),
      transparent: pixel(host, 10, 10),
    };
    const asymmetric = document.createElement('canvas');
    asymmetric.width = 100;
    asymmetric.height = 100;
    asymmetric.getContext('2d')!.fillStyle = '#ff0000';
    asymmetric.getContext('2d')!.fillRect(0, 0, 50, 100);
    asymmetric.getContext('2d')!.fillStyle = '#0000ff';
    asymmetric.getContext('2d')!.fillRect(50, 0, 50, 100);
    const mirrored = makeRoomPortrait(asymmetric, 100, 100, undefined, true);
    const mirroredLeft = pixel(mirrored, 10, 50);
    const blob = (canvas: HTMLCanvasElement) =>
      new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
    const frame = {
      id: 'room-proof',
      version: 1,
      name: 'Room Proof',
      format: 'card',
      categories: [],
      designWidth: 800,
      designHeight: 1200,
      palette: { background: '#ffffff', ink: '#000000', accent: '#ff0000', secondary: '#eeeeee' },
      layers: { background: '', foreground: '' },
      textAreas: [],
      thumbnail: '',
      licenses: [],
      description: '',
      slots: [
        {
          id: 'wide',
          order: 1,
          x: 0,
          y: 0,
          w: 1,
          h: 1 / 3,
          shape: 'rect',
          rotationDeg: 0,
          matteColor: '#ffffff',
        },
        {
          id: 'square',
          order: 2,
          x: 0,
          y: 1 / 3,
          w: 1,
          h: 2 / 3,
          shape: 'rect',
          rotationDeg: 0,
          matteColor: '#ffffff',
        },
      ],
    };
    const exported = await exportRoomFrame(
      await blob(host),
      await blob(guest),
      frame as never,
      'studio',
    );
    const preview = document.createElement('canvas');
    preview.width = 400;
    preview.height = 600;
    await drawRoomFrame(preview, host, guest, frame as never, 'studio');
    const decoded = await createImageBitmap(exported);
    const output = document.createElement('canvas');
    output.width = decoded.width;
    output.height = decoded.height;
    output.getContext('2d')!.drawImage(decoded, 0, 0);
    decoded.close();
    return {
      live,
      mirroredLeft,
      type: exported.type,
      size: exported.size,
      width: output.width,
      height: output.height,
      wideLeft: pixel(output, 200, 220),
      wideRight: pixel(output, 600, 220),
      squareLeft: pixel(output, 200, 850),
      squareRight: pixel(output, 600, 850),
      squareBackground: pixel(output, 400, 430),
      previewLeft: pixel(preview, 100, 425),
      previewRight: pixel(preview, 300, 425),
    };
  });
  expect(result.live.left).toEqual([255, 0, 0, 255]);
  expect(result.live.right).toEqual([0, 0, 255, 255]);
  expect(result.live.transparent[3]).toBe(0);
  for (let channel = 0; channel < 4; channel++)
    expect(
      Math.abs(result.live.leftBackground[channel] - result.live.rightBackground[channel]),
    ).toBeLessThanOrEqual(1);
  expect(result.live.leftBackground).not.toEqual([0, 255, 0, 255]);
  // Chromium dithers gradient channels by one byte even on adjacent pixels at the same y.
  for (let channel = 0; channel < 4; channel++)
    expect(
      Math.abs(result.live.seamLeft[channel] - result.live.seamRight[channel]),
    ).toBeLessThanOrEqual(1);
  expect(result.mirroredLeft).toEqual([0, 0, 255, 255]);
  expect(result.type).toBe('image/png');
  expect(result.size).toBeGreaterThan(1000);
  expect([result.width, result.height]).toEqual([800, 1200]);
  expect(result.wideLeft).toEqual([255, 0, 0, 255]);
  expect(result.wideRight).toEqual([0, 0, 255, 255]);
  expect(result.squareLeft).toEqual([255, 0, 0, 255]);
  expect(result.squareRight).toEqual([0, 0, 255, 255]);
  expect(result.squareBackground).not.toEqual([255, 255, 255, 255]);
  expect(result.squareBackground).not.toEqual([0, 255, 0, 255]);
  expect(result.previewLeft).toEqual([255, 0, 0, 255]);
  expect(result.previewRight).toEqual([0, 0, 255, 255]);
});

test('the room presets export one wide photo with both people and an intact printed footer', async ({
  page,
}) => {
  await page.goto('/tests/harness.html');
  const results = await page.evaluate(async () => {
    const { exportRoomFrame } = await import('/src/core/room/composition.ts');
    const { roomFrames } = await import('/src/core/room/frames.ts');
    const person = (color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 400;
      const context = canvas.getContext('2d')!;
      context.fillStyle = color;
      context.fillRect(120, 70, 160, 330);
      return new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
    };
    const host = await person('#ff0000'),
      guest = await person('#0000ff');
    const results = [];
    for (const frame of roomFrames) {
      const blob = await exportRoomFrame(host, guest, frame, 'studio');
      const decoded = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = decoded.width;
      canvas.height = decoded.height;
      canvas.getContext('2d')!.drawImage(decoded, 0, 0);
      decoded.close();
      const pixel = (x: number, y: number) =>
        Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
      let printedFooterPixels = 0;
      const footer = canvas.getContext('2d')!.getImageData(90, 1100, 700, 130).data;
      const background = pixel(900, 1300);
      for (let i = 0; i < footer.length; i += 4) {
        if (
          Math.abs(footer[i] - background[0]) +
            Math.abs(footer[i + 1] - background[1]) +
            Math.abs(footer[i + 2] - background[2]) >
          50
        )
          printedFooterPixels++;
      }
      results.push({
        id: frame.id,
        width: canvas.width,
        height: canvas.height,
        left: pixel(491, 650),
        right: pixel(1309, 650),
        footer: pixel(900, 1300),
        printedFooterPixels,
      });
    }
    return results;
  });
  expect(results).toHaveLength(3);
  for (const frame of results) {
    expect([frame.width, frame.height]).toEqual([1800, 1350]);
    expect(frame.left).toEqual([255, 0, 0, 255]);
    expect(frame.right).toEqual([0, 0, 255, 255]);
    expect(frame.footer[3]).toBe(255);
    expect(frame.footer).not.toEqual([255, 0, 0, 255]);
    expect(frame.footer).not.toEqual([0, 0, 255, 255]);
    expect(frame.printedFooterPixels).toBeGreaterThan(1000);
  }
});
