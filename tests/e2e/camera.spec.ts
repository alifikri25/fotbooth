import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { photoBytes } from './helpers';
test('camera denial preserves an immediately usable upload path', async ({ page }) => {
  await page.addInitScript(() => {
    const deny = async () => {
      throw new DOMException('Denied', 'NotAllowedError');
    };
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = deny;
    else
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: deny, enumerateDevices: async () => [] },
      });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.getByRole('button', { name: 'Pakai frame Orbit Club', exact: true }).click();
  await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('izin');
  await page.getByRole('button', { name: 'Pilih foto dari perangkat' }).click();
  const buffer = await photoBytes(page);
  await page
    .locator('input[type=file]')
    .setInputFiles(
      [1, 2, 3].map((i) => ({ name: `fallback-${i}.png`, mimeType: 'image/png', buffer })),
    );
  await expect(page.getByRole('heading', { name: 'Atur fotomu' })).toBeVisible();
  await expect(page.getByTestId('photo-count')).toHaveText('3/8 foto');
  await page.getByRole('button', { name: 'Lihat hasil' }).click();
  await page.getByLabel('Ukuran hasil').selectOption('light');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
  expect((await download).suggestedFilename()).toMatch(/^photobooth-orbit-club-.*\.png$/);
});

test('a complete camera burst exports and retaking slot two preserves the other photos and crops', async ({
  browserName,
  playwright,
}) => {
  test.skip(browserName !== 'chromium', 'Fake-device capture is available only in Chromium.');
  const browser = await playwright.chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/');
    await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
    await page.getByRole('button', { name: 'Pakai frame Orbit Club', exact: true }).click();
    await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    const stream = await page.locator('video').evaluateHandle((v: HTMLVideoElement) => v.srcObject);
    await page.getByLabel('Timer kamera').selectOption('0');
    await page.getByLabel('Ambil rangkaian').check();
    await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toHaveText('3/3 terisi');
    await page.getByRole('button', { name: 'Lanjut edit' }).click();
    await expect(page.getByTestId('photo-count')).toHaveText('3/8 foto');
    expect(
      await stream.evaluate((s: MediaStream) =>
        s.getTracks().every((t) => t.readyState === 'ended'),
      ),
    ).toBe(true);

    await page.getByRole('button', { name: 'Pilih slot 1', exact: true }).click();
    await page.getByLabel('Perbesar foto').fill('2');
    await page.getByRole('button', { name: 'Geser kanan' }).click();
    await page.getByRole('button', { name: 'Pilih slot 3', exact: true }).click();
    await page.getByRole('button', { name: 'Tampilkan utuh' }).click();
    await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
    const unchangedSlots = async () =>
      page.locator('canvas').evaluate(async (canvas: HTMLCanvasElement) => {
        // Orbit's first and third photo windows occupy these independently specified vertical bands.
        const hashes: string[] = [];
        for (const [top, bottom] of [
          [0.06, 0.31],
          [0.6, 0.9],
        ]) {
          const y = Math.ceil(canvas.height * top),
            height = Math.floor(canvas.height * bottom) - y;
          const pixels = canvas.getContext('2d')!.getImageData(0, y, canvas.width, height).data;
          const digest = await crypto.subtle.digest('SHA-256', pixels);
          hashes.push(
            Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(''),
          );
        }
        return hashes;
      });
    const before = await unchangedSlots();
    await page.getByRole('button', { name: 'Pakai kamera', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Pilih foto kamera 2', exact: true }).click();
    await page.getByLabel('Timer kamera').selectOption('0');
    await page.getByRole('button', { name: 'Mirror aktif', exact: true }).click();
    await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
    await page.getByRole('button', { name: 'Lanjut edit' }).click();
    await expect(page.getByTestId('photo-count')).toHaveText('4/8 foto');
    await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
    expect(await unchangedSlots()).toEqual(before);
    await expect(page.getByRole('button', { name: 'Gunakan foto 4 pada slot 2' })).toHaveClass(
      /active/,
    );
    await expect(page.getByRole('button', { name: 'Balik horizontal' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page.getByRole('button', { name: 'Pilih slot 1', exact: true }).click();
    await expect(page.getByLabel('Perbesar foto')).toHaveValue('2');
    await expect(page.getByRole('button', { name: 'Balik horizontal' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Pilih slot 3', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Tampilkan utuh' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Lihat hasil' }).click();
    for (const format of ['png', 'jpg']) {
      await page.getByLabel('Format hasil').selectOption(format);
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
      const file = await downloaded;
      const bytes = await fs.readFile((await file.path())!);
      const dimensions = await page.evaluate(async (data) => {
        const image = await createImageBitmap(new Blob([new Uint8Array(data)]));
        const result = [image.width, image.height];
        image.close();
        return result;
      }, Array.from(bytes));
      expect(dimensions).toEqual([1200, 3600]);
    }
    await page.getByRole('button', { name: 'Kembali edit' }).click();
    await page.getByRole('button', { name: 'Pakai kamera', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    const clearingStream = await page
      .locator('video')
      .evaluateHandle((v: HTMLVideoElement) => v.srcObject);
    await page.getByRole('button', { name: 'Hapus sesi', exact: true }).click();
    await page.getByRole('button', { name: 'Ya, hapus sesi' }).click();
    await expect(page.getByRole('button', { name: 'Mulai bikin foto' })).toBeVisible();
    expect(
      await clearingStream.evaluate((s: MediaStream) =>
        s.getTracks().every((t) => t.readyState === 'ended'),
      ),
    ).toBe(true);
  } finally {
    await browser.close();
  }
});
test('real browser fake camera captures, cancels a burst, retakes one slot, and stops on exit', async ({
  browserName,
  playwright,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Chromium fake-device coverage; physical cameras tracked separately.',
  );
  const browser = await playwright.chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/');
    await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
    await page.getByRole('button', { name: 'Pakai frame Orbit Club', exact: true }).click();
    await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    const stream = await page.locator('video').evaluateHandle((v: HTMLVideoElement) => v.srcObject);
    await page.getByLabel('Timer kamera').selectOption('0');
    await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toContainText('1/3 terisi');
    await page.getByLabel('Timer kamera').selectOption('3');
    await page.getByLabel('Ambil rangkaian').check();
    await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Hentikan' })).toBeVisible();
    await page.getByRole('button', { name: 'Hentikan' }).click();
    await page.waitForTimeout(3200);
    await expect(page.getByTestId('camera-progress')).toContainText('1/3 terisi');
    await page.getByLabel('Ambil rangkaian').uncheck();
    await page.getByRole('button', { name: 'Pilih foto kamera 1' }).click();
    await page.getByLabel('Timer kamera').selectOption('0');
    // Keep the real encoder, but expose the async interval the lifecycle test must respect.
    await page.evaluate(() => {
      const encode = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        HTMLCanvasElement.prototype.toBlob = encode;
        encode.call(this, (blob) => setTimeout(() => callback(blob), 250), ...args);
      };
    });
    await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
    // A retake leaves the filled-slot count unchanged. Wait until encoding and ingest finish.
    await expect(page.getByRole('button', { name: 'Lanjut edit' })).toBeEnabled();
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    expect(
      await stream.evaluate((s: MediaStream) =>
        s.getTracks().every((t) => t.readyState === 'ended'),
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    const reopened = await page
      .locator('video')
      .evaluateHandle((v: HTMLVideoElement) => v.srcObject);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(
      await reopened.evaluate((s: MediaStream) =>
        s.getTracks().every((t) => t.readyState === 'ended'),
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Lanjut edit' }).click();
    await expect(page.getByTestId('photo-count')).toHaveText('2/8 foto');
  } finally {
    await browser.close();
  }
});
