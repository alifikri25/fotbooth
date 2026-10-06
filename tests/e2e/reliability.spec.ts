import { test, expect } from '@playwright/test';
import { startEditor, photoBytes } from './helpers';
test('encoding failure retains edits, offers an explicit light retry, and allows a successful retry', async ({
  page,
}) => {
  await startEditor(page, 'Concert Pass', 2);
  await page.getByLabel('Caption').fill('simpan edit ini');
  await page.getByRole('button', { name: 'Lihat hasil' }).click();
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      HTMLCanvasElement.prototype.toBlob = original;
      callback(null);
    };
  });
  await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
  await expect(page.getByRole('alert')).toContainText('ringan');
  await page.getByRole('button', { name: 'Kembali edit' }).click();
  await expect(page.getByLabel('Caption')).toHaveValue('simpan edit ini');
  await page.getByRole('button', { name: 'Lihat hasil' }).click();
  await page.getByLabel('Ukuran hasil').selectOption('light');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
  await download;
});
test('incomplete slots block results, a mixed upload keeps valid files, and at most eight photos are retained', async ({
  page,
}) => {
  const bytes = await startEditor(page, 'Pocket Arcade', 1);
  await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeDisabled();
  await page.locator('input[type=file]').setInputFiles([
    { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('broken') },
    { name: 'valid.png', mimeType: 'image/png', buffer: bytes },
  ]);
  await expect(page.getByTestId('photo-count')).toHaveText('2/8 foto');
  await page
    .locator('input[type=file]')
    .setInputFiles(
      Array.from({ length: 8 }, (_, i) => ({
        name: `extra-${i}.png`,
        mimeType: 'image/png',
        buffer: bytes,
      })),
    );
  await expect(page.getByTestId('photo-count')).toHaveText('8/8 foto');
  await expect(page.getByRole('alert')).toContainText('8 foto');
});
test('application sends no photo/caption request and clears every photo/result Object URL after clear-session', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL),
      active = new Set<string>();
    (window as any).__activePhotoUrls = active;
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      active.add(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      active.delete(url);
      revoke(url);
    };
  });
  const requests: { method: string; url: string; body: string | null }[] = [];
  page.on('request', (r) =>
    requests.push({ method: r.method(), url: r.url(), body: r.postData() }),
  );
  await startEditor(page, 'Concert Pass', 2);
  await page.getByLabel('Caption').fill('private-caption-123');
  await page.getByRole('button', { name: 'Lihat hasil' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
  await download;
  expect(requests.filter((r) => r.method !== 'GET')).toEqual([]);
  expect(
    requests.some((r) => r.url.includes('private-caption') || r.body?.includes('private-caption')),
  ).toBe(false);
  expect(await page.evaluate(() => (window as any).__activePhotoUrls.size)).toBe(3);
  await page.getByRole('button', { name: 'Hapus sesi', exact: true }).click();
  await page.getByRole('button', { name: 'Ya, hapus sesi' }).click();
  expect(await page.evaluate(() => (window as any).__activePhotoUrls.size)).toBe(0);
});
test('responsive frames fit without overflow at 360, 768, 1024 and 1440px and dialogs restore focus', async ({
  page,
}) => {
  await startEditor(page, 'Gallery Issue', 4);
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole('button', { name: 'Cara pakai', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cara pakai', exact: true })).toBeFocused();
});
