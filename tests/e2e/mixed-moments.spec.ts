import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { startEditor } from './helpers';

test('Mixed Moments offers forty new themes with four photos each on desktop and mobile', async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Mulai bikin foto', exact: true }).click();
    await page.getByLabel('Koleksi').selectOption('Mixed Moments');
    await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(40);
    await expect(page.getByText('40 dari 120 frame', { exact: true })).toBeVisible();
    await page.getByLabel('Jumlah foto').selectOption('4');
    await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(40);
    const sizes = await page.locator('.frame-art img').evaluateAll(async (images) => {
      for (const element of images) {
        const image = element as HTMLImageElement;
        image.loading = 'eager';
        await image.decode();
      }
      return images.map((element) => (element as HTMLImageElement).naturalWidth);
    });
    expect(sizes.every((size) => size >= 200)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});

test('one mixed frame edits rectangular, star, heart and circular photos and downloads the real PNG', async ({
  page,
}) => {
  await startEditor(page, 'Rainy Window', 4);
  const paths: string[] = [];
  for (const order of [1, 2, 3, 4]) {
    await page.getByRole('button', { name: `Pilih slot ${order}`, exact: true }).click();
    await expect(
      page.getByRole('button', { name: `Pilih slot ${order}`, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    const outline = page.locator('.slot-outline');
    if (order === 2 || order === 3) {
      await expect(outline).toHaveClass(/is-sculpted/);
      paths.push((await outline.locator('path').first().getAttribute('d'))!);
    } else {
      await expect(outline.locator('svg')).toHaveCount(0);
      if (order === 4) await expect(outline).toHaveCSS('border-radius', '50%');
    }
  }
  expect(paths[0]).not.toBe(paths[1]);
  await page.getByRole('button', { name: 'Lihat hasil', exact: true }).click();
  await page.getByLabel('Ukuran hasil').selectOption('light');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Siapkan dan unduh', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toContain('rainy-window');
  const bytes = await fs.readFile((await file.path())!);
  const dimensions = await page.evaluate(async (bytes) => {
    const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
    const result = [image.width, image.height];
    image.close();
    return result;
  }, Array.from(bytes));
  expect(dimensions).toEqual([900, 1350]);
});
