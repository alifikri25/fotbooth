import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { startEditor } from './helpers';

async function pixel(page: import('@playwright/test').Page, x: number, y: number) {
  return page
    .locator('.composition canvas')
    .evaluate(
      (c: HTMLCanvasElement, { x, y }) =>
        Array.from(
          c.getContext('2d')!.getImageData(Math.floor(c.width * x), Math.floor(c.height * y), 1, 1)
            .data,
        ),
      { x, y },
    );
}

test('per-photo monochrome changes real preview and downloaded pixels, and can be undone', async ({
  page,
}) => {
  await startEditor(page, 'Pocket Arcade');
  const original = await pixel(page, 0.25, 0.16);
  const adjacent = await pixel(page, 0.25, 0.37);
  const decoration = await pixel(page, 0.5, 0.02);
  await page.getByRole('button', { name: 'Efek Hitam putih', exact: true }).click();
  await expect.poll(async () => (await pixel(page, 0.25, 0.16)).slice(0, 3)).toEqual([54, 54, 54]);
  expect(await pixel(page, 0.25, 0.37)).toEqual(adjacent);
  expect(await pixel(page, 0.5, 0.02)).toEqual(decoration);
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click();
  await expect.poll(() => pixel(page, 0.25, 0.16)).toEqual(original);
  await page.getByRole('button', { name: 'Ulangi perubahan', exact: true }).click();
  await page.getByRole('button', { name: 'Lihat hasil', exact: true }).click();
  await page.getByLabel('Ukuran hasil').selectOption('light');
  for (const format of ['png', 'jpg']) {
    await page.getByLabel('Format hasil').selectOption(format);
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Siapkan dan unduh', exact: true }).click();
    const bytes = await fs.readFile((await (await downloaded).path())!);
    const pixels = await page.evaluate(async (data) => {
      const image = await createImageBitmap(new Blob([new Uint8Array(data)]));
      const c = document.createElement('canvas');
      c.width = image.width;
      c.height = image.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      image.close();
      return Array.from(
        ctx.getImageData(Math.floor(c.width * 0.25), Math.floor(c.height * 0.16), 1, 1).data,
      );
    }, Array.from(bytes));
    expect(Math.abs(pixels[0] - pixels[1])).toBeLessThanOrEqual(2);
    expect(Math.abs(pixels[1] - pixels[2])).toBeLessThanOrEqual(2);
  }
  await page.getByRole('button', { name: 'Kembali edit', exact: true }).click();
  await page.getByRole('button', { name: 'Efek Original', exact: true }).click();
  await expect.poll(() => pixel(page, 0.25, 0.16)).toEqual(original);
});

test('all presets render on uploaded photos, zero intensity restores the original, and sepia has real color', async ({
  page,
}) => {
  await startEditor(page, 'Night Market', 3, '#b77e67');
  const original = await pixel(page, 0.25, 0.2);
  for (const name of [
    'Hitam putih',
    'Sepia',
    'Vintage',
    'Warm',
    'Cool',
    'Vivid',
    'Soft',
    'Noir',
    'Faded',
    'Rose',
    'Cinema',
  ]) {
    await page.getByRole('button', { name: `Efek ${name}`, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Lihat hasil', exact: true })).toBeEnabled();
    await expect.poll(() => pixel(page, 0.25, 0.2), { message: name }).not.toEqual(original);
    if (name === 'Sepia')
      expect((await pixel(page, 0.25, 0.2)).slice(0, 3)).toEqual([188, 168, 131]);
    await page.getByLabel('Intensitas efek').fill('0');
    await expect.poll(() => pixel(page, 0.25, 0.2)).toEqual(original);
  }
  await page.setViewportSize({ width: 390, height: 800 });
  await page.getByRole('button', { name: 'Efek Vintage', exact: true }).click();
  await page.getByLabel('Intensitas efek').fill('0.55');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator('.photo-effects').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('effects-editor-mobile.png') });
});

test('live camera selection survives capture and remains reversible in the editor', async ({
  browserName,
  playwright,
}) => {
  test.skip(browserName !== 'chromium', 'Synthetic camera device is supported by Chromium.');
  const browser = await playwright.chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await page.goto('http://127.0.0.1:5173/');
    await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
    await page.getByRole('button', { name: 'Pakai frame Night Market', exact: true }).click();
    await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Efek Hitam putih', exact: true }).click();
    expect(await page.locator('video').evaluate((v) => getComputedStyle(v).filter)).toBe(
      'grayscale(1)',
    );
    await page.getByLabel('Timer kamera').selectOption('0');
    await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
    await expect(page.getByTestId('camera-capture-review')).toBeVisible();
    const review = page
      .getByTestId('camera-capture-review')
      .getByRole('img', { name: 'Hasil foto 1', exact: true });
    await expect(review).toBeVisible();
    await expect
      .poll(() =>
        review.evaluate((canvas: HTMLCanvasElement) => {
          // Night Market has rounded photo corners; their frame-colored background is not photo content.
          const x = Math.ceil(canvas.width * 0.1),
            y = Math.ceil(canvas.height * 0.1),
            width = Math.floor(canvas.width * 0.8),
            height = Math.floor(canvas.height * 0.8);
          const pixels = canvas.getContext('2d')!.getImageData(x, y, width, height).data;
          let colored = 0,
            opaque = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3]) opaque++;
            if (pixels[i] !== pixels[i + 1] || pixels[i + 1] !== pixels[i + 2]) colored++;
          }
          return { colored, opaque: opaque > 0 };
        }),
      )
      .toEqual({ colored: 0, opaque: true });
    await expect(page.getByTestId('camera-progress')).toHaveText('0/3 terisi');
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toHaveText('1/3 terisi');
    await page.getByRole('button', { name: 'Lanjut edit', exact: true }).click();
    await page.getByRole('button', { name: 'Pilih slot 1', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Efek Hitam putih', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    const gray = await pixel(page, 0.5, 0.2);
    expect(gray[0]).toBe(gray[1]);
    expect(gray[1]).toBe(gray[2]);
    await page.getByRole('button', { name: 'Efek Original', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Efek Original', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect.poll(() => pixel(page, 0.5, 0.2)).not.toEqual(gray);
  } finally {
    await browser.close();
  }
});
