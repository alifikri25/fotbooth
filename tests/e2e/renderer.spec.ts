import { test, expect } from '@playwright/test';

test('shared renderer clips, mirrors only the photo, and exports decodable files at exact sizes', async ({
  page,
}) => {
  await page.goto('/tests/harness.html');
  const result = await page.evaluate(async () => {
    const { renderComposition } = await import('/src/core/renderer.ts');
    const source = document.createElement('canvas');
    source.width = 400;
    source.height = 300;
    const c = source.getContext('2d')!;
    c.fillStyle = '#ff0000';
    c.fillRect(0, 0, 200, 300);
    c.fillStyle = '#0000ff';
    c.fillRect(200, 0, 200, 300);
    const frame = {
      id: 'proof',
      version: 1,
      name: 'Proof',
      designWidth: 1000,
      designHeight: 1000,
      palette: { background: '#ffffff' },
      layers: { background: '', foreground: '' },
      textAreas: [],
      slots: [
        {
          id: 'p1',
          order: 1,
          x: 0.1,
          y: 0.1,
          w: 0.8,
          h: 0.8,
          shape: 'circle',
          rotationDeg: 0,
          matteColor: '#00ff00',
        },
      ],
    };
    const session = {
      placements: [
        {
          slotId: 'p1',
          photoId: 'test',
          fitMode: 'cover',
          centerX: 0.5,
          centerY: 0.5,
          zoom: 1,
          rotation: 0,
          mirror: false,
        },
      ],
      caption: '',
      date: '',
    };
    const canvas = document.querySelector('canvas')!;
    const resolver = async () => ({ image: source, width: 400, height: 300 });
    const pixel = (x: number, y: number) =>
      Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
    await renderComposition(canvas, frame, session, resolver, 1000, 1000);
    const left = pixel(300, 500),
      corner = pixel(110, 110);
    session.placements[0].mirror = true;
    await renderComposition(canvas, frame, session, resolver, 1000, 1000);
    const mirrored = pixel(300, 500);
    session.placements[0].fitMode = 'contain';
    await renderComposition(canvas, frame, session, resolver, 500, 500);
    const matte = pixel(250, 70);
    const encoded: { type: string; width: number; height: number; size: number }[] = [];
    for (const type of ['image/png', 'image/jpeg']) {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), type, 0.92),
      );
      const decoded = await createImageBitmap(blob);
      encoded.push({
        type: blob.type,
        width: decoded.width,
        height: decoded.height,
        size: blob.size,
      });
      decoded.close();
    }
    return { left, corner, mirrored, matte, encoded };
  });
  expect(result.left).toEqual([255, 0, 0, 255]);
  expect(result.corner).toEqual([255, 255, 255, 255]);
  expect(result.mirrored).toEqual([0, 0, 255, 255]);
  expect(result.matte).toEqual([0, 255, 0, 255]);
  for (const image of result.encoded) {
    expect(image.width).toBe(500);
    expect(image.height).toBe(500);
    expect(image.size).toBeGreaterThan(100);
  }
});
