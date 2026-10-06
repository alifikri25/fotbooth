import { test, expect } from '@playwright/test';
test('all 60 packages load real thumbnails, preserve protected photo interiors, and export standard/light files', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto('/tests/harness.html');
  const evidence = await page.evaluate(async () => {
    const { definitions } = await import('/src/frames/definitions.ts');
    const { renderComposition, loadLayer, slotPath } = await import('/src/core/renderer.ts');
    const { ensureFonts } = await import('/src/core/text.ts');
    await ensureFonts();
    const photos = await Promise.all([1, 2, 3].map((n) => loadLayer(`/samples/friend-${n}.svg`)));
    const results = [];
    for (const frame of definitions) {
      const thumb = await loadLayer(frame.thumbnail);
      const overlay = await loadLayer(frame.layers.foreground);
      const layer = document.createElement('canvas');
      layer.width = frame.designWidth;
      layer.height = frame.designHeight;
      const c = layer.getContext('2d')!;
      c.drawImage(overlay, 0, 0);
      let blocked = 0;
      for (const slot of frame.slots) {
        const w = slot.w * frame.designWidth,
          h = slot.h * frame.designHeight;
        const path = slotPath(slot, w, h),
          angle = (slot.rotationDeg * Math.PI) / 180;
        for (let y = 0.1; y <= 0.9; y += 0.1)
          for (let x = 0.1; x <= 0.9; x += 0.1) {
            // Protected interior excludes the documented 8% decoration band along the actual mask edge.
            if (
              ![-0.08, 0, 0.08].every((dx) =>
                [-0.08, 0, 0.08].every((dy) => c.isPointInPath(path, (x + dx) * w, (y + dy) * h)),
              )
            )
              continue;
            const dx = (x - 0.5) * w,
              dy = (y - 0.5) * h;
            const px =
              (slot.x + slot.w / 2) * frame.designWidth +
              dx * Math.cos(angle) -
              dy * Math.sin(angle);
            const py =
              (slot.y + slot.h / 2) * frame.designHeight +
              dx * Math.sin(angle) +
              dy * Math.cos(angle);
            if (c.getImageData(Math.round(px), Math.round(py), 1, 1).data[3] > 0) blocked++;
          }
      }
      const session = {
        caption: 'Hari yang akan selalu kita ingat bersama',
        date: '2026-10-06',
        placements: frame.slots.map((s, i) => ({
          slotId: s.id,
          photoId: String(i % 3),
          fitMode: 'cover',
          centerX: 0.5,
          centerY: 0.5,
          zoom: 1,
          rotation: 0,
          mirror: false,
        })),
      };
      const canvas = document.createElement('canvas');
      const dims = [];
      for (const scale of [1, 0.5]) {
        await renderComposition(
          canvas,
          frame,
          session,
          async (id) => ({ image: photos[Number(id)], width: 800, height: 1000 }),
          frame.designWidth * scale,
          frame.designHeight * scale,
        );
        for (const format of ['image/png', 'image/jpeg']) {
          const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), format, 0.92));
          const image = await createImageBitmap(blob);
          dims.push([image.width, image.height, blob.size]);
          image.close();
        }
      }
      results.push({
        id: frame.id,
        format: frame.format,
        blocked,
        thumb: thumb.naturalWidth,
        dims,
      });
    }
    return results;
  });
  expect(evidence).toHaveLength(60);
  for (const frame of evidence) {
    expect(frame.blocked, frame.id).toBe(0);
    expect(frame.thumb).toBeGreaterThan(100);
    for (const dims of frame.dims) expect(dims[2]).toBeGreaterThan(100);
    const [w, h] = frame.format === 'strip' ? [1200, 3600] : [1800, 2700];
    expect(
      frame.dims.map((d) => d.slice(0, 2)),
      frame.id,
    ).toEqual([
      [w, h],
      [w, h],
      [w / 2, h / 2],
      [w / 2, h / 2],
    ]);
  }
});

test('new cartoon and dynamic collections filter and open usable frames', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('60 frame orisinal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(60);
  await expect(page.getByRole('button', { name: /^Pakai frame / }).first()).toHaveAccessibleName(
    'Pakai frame Velvet Premiere',
  );
  await page.getByRole('button', { name: 'Cartoon', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(13);
  await page.getByRole('button', { name: 'Dynamic', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(10);
  for (const name of ['Comic Dash', 'Candy Bounce', 'Space Pals', 'Monster Moods'])
    await expect(
      page.getByRole('button', { name: `Pakai frame ${name}`, exact: true }),
    ).toBeVisible();
  await page.getByRole('button', { name: 'Pakai frame Comic Dash', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mulai dengan senyum kamu.' })).toBeVisible();
});
