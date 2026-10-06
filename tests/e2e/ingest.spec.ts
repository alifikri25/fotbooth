import { test, expect } from '@playwright/test';
test('square, panorama, tall portrait, small and transparent PNG files retain logical dimensions and bounded previews', async ({
  page,
}) => {
  await page.goto('/tests/harness.html');
  const cases = await page.evaluate(async () => {
    const { ingestPhoto } = await import('/src/core/ingest.ts');
    const results = [];
    for (const [width, height] of [
      [2000, 2000],
      [5000, 300],
      [100, 4000],
      [1, 1],
      [640, 480],
    ]) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, Math.max(1, width / 2), height);
      const png = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
      const photo = await ingestPhoto(new Blob([png], { type: '' }));
      results.push({
        expected: [width, height],
        actual: [photo.width, photo.height],
        preview: [photo.preview.width, photo.preview.height],
      });
      URL.revokeObjectURL(photo.thumbnailUrl);
      if ('close' in photo.preview) photo.preview.close();
    }
    return results;
  });
  for (const item of cases) {
    expect(item.actual).toEqual(item.expected);
    expect(Math.max(...item.preview)).toBeLessThanOrEqual(1600);
    expect(Math.min(...item.preview)).toBeGreaterThan(0);
  }
});
for (const fallback of [false, true])
  test(`local ${fallback ? 'HTML image fallback' : 'bitmap decoder'} handles required formats and EXIF 1–8 exactly once`, async ({
    page,
  }) => {
    if (fallback)
      await page.addInitScript(() => {
        (window as any).createImageBitmap = undefined;
      });
    await page.goto('/tests/harness.html');
    const result = await page.evaluate(async () => {
      const { ingestPhoto, decodeSource } = await import('/src/core/ingest.ts');
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const c = canvas.getContext('2d')!;
      for (const [x, y, color] of [
        [0, 0, 'red'],
        [200, 0, 'lime'],
        [0, 150, 'blue'],
        [200, 150, 'yellow'],
      ] as const) {
        c.fillStyle = color;
        c.fillRect(x, y, 200, 150);
      }
      const values = [];
      for (const type of ['image/png', 'image/webp', 'image/jpeg']) {
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), type, 0.95));
        const photo = await ingestPhoto(blob);
        values.push([photo.width, photo.height]);
        URL.revokeObjectURL(photo.thumbnailUrl);
        if ('close' in photo.preview) photo.preview.close();
      }
      const jpeg = new Uint8Array(
        await (
          await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 0.98))
        ).arrayBuffer(),
      );
      const oriented = [];
      for (let orientation = 1; orientation <= 8; orientation++) {
        const segment = new Uint8Array([
          255,
          225,
          0,
          34,
          69,
          120,
          105,
          102,
          0,
          0,
          73,
          73,
          42,
          0,
          8,
          0,
          0,
          0,
          1,
          0,
          18,
          1,
          3,
          0,
          1,
          0,
          0,
          0,
          orientation,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ]);
        const blob = new Blob([jpeg.slice(0, 2), segment, jpeg.slice(2)], { type: 'image/jpeg' });
        const photo = await ingestPhoto(blob);
        const source = await decodeSource(blob);
        const p = document.createElement('canvas');
        p.width = photo.preview.width;
        p.height = photo.preview.height;
        const ctx = p.getContext('2d')!;
        ctx.drawImage(photo.preview, 0, 0);
        const color = Array.from(ctx.getImageData(20, 20, 1, 1).data).slice(0, 3);
        ctx.clearRect(0, 0, p.width, p.height);
        ctx.drawImage(source.image, 0, 0, p.width, p.height);
        const fullColor = Array.from(ctx.getImageData(20, 20, 1, 1).data).slice(0, 3);
        oriented.push({ orientation, width: photo.width, height: photo.height, color, fullColor });
        source.release?.();
        URL.revokeObjectURL(photo.thumbnailUrl);
        if ('close' in photo.preview) photo.preview.close();
      }
      return { values, oriented };
    });
    expect(result.values).toEqual([
      [400, 300],
      [400, 300],
      [400, 300],
    ]);
    const colors = [
      [255, 0, 0],
      [0, 255, 0],
      [255, 255, 0],
      [0, 0, 255],
      [255, 0, 0],
      [0, 0, 255],
      [255, 255, 0],
      [0, 255, 0],
    ];
    for (const image of result.oriented) {
      expect([image.width, image.height]).toEqual(image.orientation >= 5 ? [300, 400] : [400, 300]);
      image.color.forEach((v, i) =>
        expect(Math.abs(v - colors[image.orientation - 1][i])).toBeLessThan(5),
      );
      expect(image.fullColor).toEqual(image.color);
    }
  });
