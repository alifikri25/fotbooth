import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

export async function photoBytes(page: import('@playwright/test').Page, color = 'red') {
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
export async function startEditor(
  page: import('@playwright/test').Page,
  frame = 'Pocket Arcade',
  count = 4,
) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.getByRole('button', { name: `Pakai frame ${frame}`, exact: true }).click();
  const bytes = await photoBytes(page);
  await page.locator('input[type=file]').setInputFiles(
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
test('upload → edit → switch 4→2→4 → undo → caption → real PNG/JPEG download retains the session', async ({
  page,
}) => {
  await startEditor(page);
  await page.getByLabel('Perbesar foto').fill('2');
  await page.getByRole('button', { name: 'Ganti frame', exact: true }).click();
  await page.getByRole('button', { name: 'Pakai frame After Hours Ticket', exact: true }).click();
  await expect(page.getByTestId('photo-count')).toHaveText('4/8 foto');
  await page.getByRole('button', { name: 'Ganti frame', exact: true }).click();
  await page.getByRole('button', { name: 'Pakai frame Pocket Arcade', exact: true }).click();
  await expect(page.getByLabel('Perbesar foto')).toHaveValue('2');
  await page.getByRole('button', { name: 'Putar 90°' }).click();
  await expect(page.getByLabel('Perbesar foto')).toHaveValue('1');
  await page.getByRole('button', { name: 'Urungkan' }).click();
  await expect(page.getByLabel('Perbesar foto')).toHaveValue('2');
  await page.getByLabel('Caption').fill('hari ini, kita.');
  await page.getByRole('button', { name: 'Lihat hasil' }).click();
  await page.getByLabel('Ukuran hasil').selectOption('light');
  for (const format of ['png', 'jpg']) {
    await page.getByLabel('Format hasil').selectOption(format);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      new RegExp(`^photobooth-pocket-arcade-\\d{8}-\\d{6}\\.${format}$`),
    );
    const filename = await download.path();
    const buffer = await fs.readFile(filename!);
    expect(buffer.length).toBeGreaterThan(100);
    const dimensions = await page.evaluate(
      async ({ bytes, type }) => {
        const blob = new Blob([new Uint8Array(bytes)], { type });
        const image = await createImageBitmap(blob);
        return [image.width, image.height];
      },
      { bytes: Array.from(buffer), type: format === 'png' ? 'image/png' : 'image/jpeg' },
    );
    expect(dimensions).toEqual([600, 1800]);
  }
  await page.getByRole('button', { name: 'Kembali edit' }).click();
  await expect(page.getByLabel('Caption')).toHaveValue('hari ini, kita.');
});
test('a corrupt replacement keeps existing photos and clear-session really releases the working state', async ({
  page,
}) => {
  await startEditor(page, 'After Hours Ticket', 2);
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('broken') });
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('photo-count')).toHaveText('2/8 foto');
  await page.getByRole('button', { name: 'Hapus sesi', exact: true }).click();
  await page.getByRole('button', { name: 'Ya, hapus sesi' }).click();
  await expect(page.getByRole('button', { name: 'Mulai bikin foto' })).toBeVisible();
});
for (const width of [360, 1440]) {
  test(`keyboard alone completes upload, slot/photo selection, crop and download at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const bytes = await photoBytes(page);
    const tabTo = async (target: import('@playwright/test').Locator) => {
      await expect(target).toBeEnabled();
      for (let i = 0; i < 80; i++) {
        if (await target.evaluate((element) => element === document.activeElement)) return;
        await page.keyboard.press('Tab');
      }
      await expect(target).toBeFocused();
    };
    const activate = async (name: string) => {
      await tabTo(page.getByRole('button', { name, exact: true }));
      await page.keyboard.press('Enter');
    };
    await activate('Mulai bikin foto');
    await activate('Pakai frame After Hours Ticket');
    const chooser = page.waitForEvent('filechooser');
    await activate('Pilih foto');
    await (
      await chooser
    ).setFiles(
      [1, 2].map((i) => ({ name: `keyboard-${i}.png`, mimeType: 'image/png', buffer: bytes })),
    );
    await expect(page.getByTestId('photo-count')).toHaveText('2/8 foto');
    await activate('Pilih slot 2');
    await activate('Gunakan foto 1 pada slot 2');
    await expect(page.getByRole('button', { name: 'Gunakan foto 1 pada slot 2' })).toHaveClass(
      /active/,
    );
    await activate('Tampilkan utuh');
    await expect(page.getByLabel('Perbesar foto')).toBeDisabled();
    await activate('Isi frame');
    await tabTo(page.getByLabel('Perbesar foto'));
    await page.keyboard.press('ArrowRight');
    await expect(page.getByLabel('Perbesar foto')).toHaveValue('1.05');
    await activate('Geser kiri');
    await tabTo(page.getByLabel('Caption'));
    await page.keyboard.type('bisa lewat keyboard');
    await activate('Lihat hasil');
    await tabTo(page.getByLabel('Ukuran hasil'));
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Ukuran hasil')).toHaveValue('light');
    const download = page.waitForEvent('download');
    await activate('Siapkan dan unduh');
    const file = await download;
    expect((await fs.readFile((await file.path())!)).length).toBeGreaterThan(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
