import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
export async function photoBytes(page: Page, color = 'red') {
  const encoded = await page.evaluate((color) => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 600;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = 'blue';
    ctx.fillRect(400, 0, 400, 600);
    return c.toDataURL('image/png').split(',')[1];
  }, color);
  return Buffer.from(encoded, 'base64');
}
export async function startEditor(page: Page, frame = 'Pocket Arcade', count = 4) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.getByRole('button', { name: `Pakai frame ${frame}`, exact: true }).click();
  const bytes = await photoBytes(page);
  await page
    .locator('input[type=file]')
    .setInputFiles(
      Array.from({ length: count }, (_, i) => ({
        name: `test-${i}.png`,
        mimeType: 'image/png',
        buffer: bytes,
      })),
    );
  await expect(page.getByRole('heading', { name: 'Atur fotomu' })).toBeVisible();
  await expect(page.getByTestId('photo-count')).toHaveText(`${count}/8 foto`);
  return bytes;
}
