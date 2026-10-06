import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test('asymmetric grid photos keep preview/export geometry through rotation, mirror, and all masks', async ({
  page,
  browserName,
}) => {
  test.setTimeout(180_000);
  await page.goto('/tests/harness.html');
  const results = await page.evaluate(async () => {
    const { definitions } = await import('/src/frames/definitions.ts');
    const { renderComposition } = await import('/src/core/renderer.ts');
    const { ensureFonts } = await import('/src/core/text.ts');
    await ensureFonts();
    const source = document.createElement('canvas');
    source.width = 4031;
    source.height = 3023;
    const c = source.getContext('2d')!;
    c.fillStyle = '#dc3422';
    c.fillRect(0, 0, 4031, 3023);
    c.fillStyle = '#24b666';
    c.fillRect(2015, 0, 2016, 3023);
    c.fillStyle = '#2466cd';
    c.fillRect(0, 1511, 2015, 1512);
    // Keep broad boundaries separate from thin grid strokes, whose resampling can
    // obscure a boundary in just one source. The grid still tests stable interiors below.
    const landmarkSource = document.createElement('canvas');
    landmarkSource.width = source.width;
    landmarkSource.height = source.height;
    landmarkSource.getContext('2d')!.drawImage(source, 0, 0);
    const landmarkSmall = await createImageBitmap(landmarkSource, {
      resizeWidth: 1600,
      resizeHeight: 1200,
    });
    for (let x = 0; x < 4031; x += 120) {
      c.fillStyle = '#222222';
      c.fillRect(x, 0, 12, 3023);
    }
    for (let y = 0; y < 3023; y += 120) c.fillRect(0, y, 4031, 12);
    const small = await createImageBitmap(source, { resizeWidth: 1600, resizeHeight: 1200 });
    const values = [];
    for (const frame of definitions) {
      const session = {
        caption: 'posisi sama',
        date: '2026-10-06',
        placements: frame.slots.map((s, i) => ({
          slotId: s.id,
          photoId: 'grid',
          fitMode: i % 2 ? 'contain' : 'cover',
          centerX: 0.58,
          centerY: 0.47,
          zoom: i % 2 ? 1 : 1.6,
          rotation: (i % 4) * 90,
          mirror: i % 2 === 0,
        })),
      };
      const output = document.createElement('canvas');
      await renderComposition(
        output,
        frame,
        session,
        async () => ({ image: source, width: 4031, height: 3023 }),
        frame.designWidth,
        frame.designHeight,
      );
      // Compare landmark edges at the same canonical size, rather than hiding displacement
      // inside a color tolerance or comparing an image against its own derived crop geometry.
      const canonicalOriginal = document.createElement('canvas');
      await renderComposition(
        canonicalOriginal,
        frame,
        session,
        async () => ({ image: landmarkSource, width: 4031, height: 3023 }),
        frame.designWidth,
        frame.designHeight,
      );
      const canonicalPreview = document.createElement('canvas');
      await renderComposition(
        canonicalPreview,
        frame,
        session,
        async () => ({ image: landmarkSmall, width: 4031, height: 3023 }),
        frame.designWidth,
        frame.designHeight,
      );
      const originalPixels = canonicalOriginal
        .getContext('2d')!
        .getImageData(0, 0, output.width, output.height).data;
      const reducedPixels = canonicalPreview
        .getContext('2d')!
        .getImageData(0, 0, output.width, output.height).data;
      let landmarks = 0,
        displacementPx = 0;
      const edgeIssues = [];
      for (const slot of frame.slots) {
        for (const axis of ['horizontal', 'vertical']) {
          const length = axis === 'horizontal' ? output.width : output.height;
          const origin = axis === 'horizontal' ? slot.x : slot.y;
          const span = axis === 'horizontal' ? slot.w : slot.h;
          const left = Math.ceil((origin + span * 0.15) * length);
          const right = Math.floor((origin + span * 0.85) * length);
          // Avoid a scan through the quadrant intersection: a 2-degree panel makes
          // that scan nearly tangent to the color seam, amplifying antialiasing width.
          for (const fraction of [0.25, 0.4, 0.6, 0.75]) {
            const fixed =
              axis === 'horizontal'
                ? Math.round((slot.y + slot.h * fraction) * output.height)
                : Math.round((slot.x + slot.w * fraction) * output.width);
            const scan = (pixels: Uint8ClampedArray) => {
              const edges: number[] = [];
              let previous = -1,
                previousX = left;
              for (let x = left; x < right; x++) {
                const offset =
                  (axis === 'horizontal' ? fixed * output.width + x : x * output.width + fixed) * 4;
                const rgb = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
                const dominant = rgb.indexOf(Math.max(...rgb));
                if (rgb[dominant] - Math.max(...rgb.filter((_, i) => i !== dominant)) < 40)
                  continue;
                // Measure the midpoint between strong color regions, excluding matte/antialias.
                if (previous !== -1 && previous !== dominant && x - previousX <= 3)
                  edges.push((x + previousX) / 2);
                previous = dominant;
                previousX = x;
              }
              return edges;
            };
            const referenceScan = scan(originalPixels),
              previewScan = scan(reducedPixels);
            if (referenceScan.length !== previewScan.length)
              edgeIssues.push({ slot: slot.id, axis, fraction, referenceScan, previewScan });
            for (const [a, b] of [
              [referenceScan, previewScan],
              [previewScan, referenceScan],
            ]) {
              for (const edge of a) {
                landmarks++;
                displacementPx = Math.max(
                  displacementPx,
                  b.length ? Math.min(...b.map((other) => Math.abs(edge - other))) : 10000,
                );
              }
            }
          }
        }
      }
      canonicalOriginal.width = canonicalOriginal.height = 1;
      canonicalPreview.width = canonicalPreview.height = 1;
      const expected = document.createElement('canvas');
      expected.width = frame.designWidth / 4;
      expected.height = frame.designHeight / 4;
      expected.getContext('2d')!.drawImage(output, 0, 0, expected.width, expected.height);
      const reference = expected
        .getContext('2d')!
        .getImageData(0, 0, expected.width, expected.height).data;
      {
        const preview = document.createElement('canvas');
        await renderComposition(
          preview,
          frame,
          session,
          async () => ({ image: small, width: 4031, height: 3023 }),
          frame.designWidth / 4,
          frame.designHeight / 4,
        );
        const pixels = preview
          .getContext('2d')!
          .getImageData(0, 0, preview.width, preview.height).data;
        // Exclude antialias borders: compare stable interior color regions independently of raster quality.
        let differences = 0,
          samples = 0;
        for (let y = 4; y < preview.height - 4; y += 8)
          for (let x = 4; x < preview.width - 4; x += 8) {
            const p = (y * preview.width + x) * 4;
            let stable = true;
            for (let dx = -4; dx <= 4; dx++)
              for (let dy = -4; dy <= 4; dy++) {
                const q = ((y + dy) * preview.width + x + dx) * 4;
                for (let k = 0; k < 3; k++)
                  if (Math.abs(reference[p + k] - reference[q + k]) > 8) stable = false;
              }
            if (!stable) continue;
            samples++;
            if ([0, 1, 2].some((k) => Math.abs(reference[p + k] - pixels[p + k]) > 12))
              differences++;
          }
        values.push({ id: frame.id, differences, samples, landmarks, displacementPx, edgeIssues });
      }
    }
    small.close();
    landmarkSmall.close();
    return values;
  });
  expect(results).toHaveLength(60);
  await fs.writeFile(
    `docs/qa/geometry-${browserName}.json`,
    JSON.stringify(
      {
        method:
          'Bidirectional horizontal/vertical broad red/green/blue boundary distances in canonical design pixels; dedicated source without thin grid strokes, 4031x3023 versus reduced 1600x1200, same logical source geometry. A separate grid source checks stable preview/export interiors.',
        results,
      },
      null,
      2,
    ) + '\n',
  );
  for (const r of results) {
    expect(r.samples).toBeGreaterThan(100);
    expect(r.differences / r.samples, r.id).toBeLessThan(0.005);
    expect(r.landmarks, r.id).toBeGreaterThanOrEqual(4);
    expect(r.edgeIssues, r.id).toHaveLength(0);
    expect(r.displacementPx, r.id).toBeLessThanOrEqual(1);
  }
});
for (const dpr of [1, 2, 3])
  test(`DPR ${dpr} leaves standard and light output sizes unchanged`, async ({ browser }) => {
    const context = await browser.newContext({ deviceScaleFactor: dpr });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/tests/harness.html');
    const results = await page.evaluate(async () => {
      const { definitions } = await import('/src/frames/definitions.ts');
      const { renderComposition } = await import('/src/core/renderer.ts');
      const { ensureFonts } = await import('/src/core/text.ts');
      await ensureFonts();
      const source = document.createElement('canvas');
      source.width = 400;
      source.height = 300;
      const c = source.getContext('2d')!;
      c.fillStyle = 'red';
      c.fillRect(0, 0, 400, 300);
      const frame = definitions[0],
        session = {
          caption: '',
          date: '',
          placements: frame.slots.map((s) => ({
            slotId: s.id,
            photoId: 'photo',
            fitMode: 'cover',
            centerX: 0.5,
            centerY: 0.5,
            zoom: 1,
            rotation: 0,
            mirror: false,
          })),
        };
      const dimensions = [];
      for (const scale of [1, 0.5]) {
        const canvas = document.createElement('canvas');
        await renderComposition(
          canvas,
          frame,
          session,
          async () => ({ image: source, width: 400, height: 300 }),
          1200 * scale,
          3600 * scale,
        );
        dimensions.push([canvas.width, canvas.height]);
      }
      return { dpr: devicePixelRatio, dimensions };
    });
    expect(results.dpr).toBe(dpr);
    expect(results.dimensions).toEqual([
      [1200, 3600],
      [600, 1800],
    ]);
    await context.close();
  });
