import { test, expect } from '@playwright/test';

test('finds a frame in the 60-frame library by name, collection, format and photo count', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('60 frame orisinal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(60);
  await page.getByLabel('Cari frame').fill('ribbon diary');
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(4);
  await page.getByLabel('Format frame').selectOption('card');
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(2);
  await page.getByLabel('Jumlah foto').selectOption('2');
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Pakai frame Ribbon Diary Portrait', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Mulai dengan senyum kamu.' })).toBeVisible();
});

test('collection filtering and an empty search can recover the complete catalog', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Koleksi frame', exact: true }).click();
  await page.getByLabel('Koleksi').selectOption('Denim Daisy');
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(3);
  await page.getByLabel('Cari frame').fill('tidak ada frame ini');
  await expect(page.getByText('Frame belum ketemu.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(60);
});
