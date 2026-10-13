import { test, expect } from '@playwright/test';
import { photoBytes } from './helpers';

test('source screen presents the camera first as the primary action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.getByRole('button', { name: 'Pakai frame Orbit Club', exact: true }).click();

  const source = page.locator('.source-page');
  const camera = source.getByRole('button', { name: 'Buka kamera', exact: true });
  const upload = source.getByRole('button', { name: 'Pilih foto', exact: true });
  await expect(source.getByRole('button').first()).toHaveAccessibleName('Buka kamera');
  await expect(camera).toHaveClass(/\bprimary\b/);
  await expect(upload).toHaveClass(/\bsecondary\b/);
  const cameraBounds = await camera.boundingBox();
  const uploadBounds = await upload.boundingBox();
  expect(cameraBounds!.y).toBeLessThan(uploadBounds!.y);
  await expect(page.locator('video')).toHaveCount(0);
});

test('source upload remains usable without opening the camera', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.getByRole('button', { name: 'Pakai frame Orbit Club', exact: true }).click();

  const buffer = await photoBytes(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Pilih foto', exact: true }).click();
  await (await chooser).setFiles({ name: 'upload-fallback.png', mimeType: 'image/png', buffer });

  await expect(page.getByRole('heading', { name: 'Atur fotomu' })).toBeVisible();
  await expect(page.getByTestId('photo-count')).toHaveText('1/8 foto');
});
