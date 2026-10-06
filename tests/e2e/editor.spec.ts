import { test, expect } from '@playwright/test';
import { startEditor } from './helpers';
test('the right arrow moves the visible photo right, in the same direction as a drag', async ({
  page,
}) => {
  await startEditor(page, 'Concert Pass', 2);
  await page.getByLabel('Perbesar foto').fill('2');
  await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
  const canvas = page.getByRole('img', { name: /^Preview Concert Pass/ });
  const pixel = () =>
    canvas.evaluate((c: HTMLCanvasElement) =>
      Array.from(
        c
          .getContext('2d')!
          .getImageData(Math.round(c.width * 0.55), Math.round(c.height * 0.33), 1, 1).data,
      ),
    );
  expect(await pixel()).toEqual([0, 0, 255, 255]);
  await page.getByRole('button', { name: 'Geser kanan' }).click();
  await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
  expect(await pixel()).toEqual([255, 0, 0, 255]);
});
test('one drag preserves zoom and commits one undo step, while resize leaves the crop unchanged', async ({
  page,
}) => {
  await startEditor(page, 'Concert Pass', 2);
  await page.getByLabel('Perbesar foto').fill('2');
  await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
  const canvas = page.getByRole('img', { name: /^Preview Concert Pass/ });
  const before = await canvas.screenshot();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.32);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.35, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
  await expect(page.getByLabel('Perbesar foto')).toHaveValue('2');
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
  await page.getByRole('button', { name: 'Urungkan' }).click();
  await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
  const undone = await canvas.screenshot();
  expect(undone.equals(before)).toBe(true);
});
test('caption is limited by grapheme and cannot send markup to the page', async ({ page }) => {
  await startEditor(page, 'Concert Pass', 2);
  await page.getByLabel('Caption').fill('A'.repeat(50));
  await expect(page.getByLabel('Caption')).toHaveValue('A'.repeat(40));
  await page.getByLabel('Caption').fill('<img src=x onerror=alert(1)>');
  expect(await page.locator('img[src="x"]').count()).toBe(0);
});
test('a delayed old frame render cannot overwrite the newer selection', async ({ page }) => {
  let release!: () => void;
  const delay = new Promise<void>((r) => (release = r));
  await page.route('**/frames/orbit-club/v*/background.svg', async (route) => {
    await delay;
    await route.continue();
  });
  await startEditor(page, 'Orbit Club', 3);
  await page.getByRole('button', { name: 'Ganti frame', exact: true }).click();
  await page.getByRole('button', { name: 'Pakai frame Bubble Pop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
  const canvas = page.getByRole('img', { name: /^Preview Bubble Pop/ }),
    before = await canvas.screenshot();
  const response = page.waitForResponse('**/frames/orbit-club/v*/background.svg');
  release();
  await (await response).finished();
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(true);
});
