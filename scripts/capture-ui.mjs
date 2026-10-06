import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await fs.mkdir('docs/qa', { recursive: true });
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'docs/qa/home-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.locator('.frame-art img').evaluateAll((images) =>
    Promise.all(
      images.map(async (image) => {
        image.loading = 'eager';
        await image.decode();
      }),
    ),
  );
  await page.screenshot({ path: 'docs/qa/gallery-desktop.png' });
  await page.setViewportSize({ width: 360, height: 1100 });
  await page.screenshot({ path: 'docs/qa/library-mobile.png' });
  await page.getByRole('button', { name: 'Cartoon', exact: true }).click();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator('.frame-art img').evaluateAll((images) =>
    Promise.all(
      images.map(async (image) => {
        image.loading = 'eager';
        await image.decode();
      }),
    ),
  );
  await page.screenshot({ path: 'docs/qa/cartoon-gallery-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Semua frame', exact: true }).click();
  await page.getByRole('button', { name: 'Pakai frame Ribbon Diary Trio', exact: true }).click();
  const image = await page.evaluate(async () => {
    const source = new Image();
    source.src = '/samples/friend-2.svg';
    await source.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    canvas.getContext('2d').drawImage(source, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles(
    [1, 2, 3].map((i) => ({
      name: `original-illustration-${i}.png`,
      mimeType: 'image/png',
      buffer: Buffer.from(image, 'base64'),
    })),
  );
  await page.getByRole('button', { name: 'Lihat hasil' }).waitFor({ state: 'visible' });
  await page.waitForFunction(
    () =>
      !Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Lihat hasil')
        ?.disabled,
  );
  await page.getByLabel('Caption').fill('hari ini, kita.');
  await page.screenshot({ path: 'docs/qa/editor-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole('button', { name: 'Lihat hasil' }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.screenshot({ path: 'docs/qa/editor-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Lihat hasil' }).click();
  await page.screenshot({ path: 'docs/qa/result-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'docs/qa/result-desktop.png', fullPage: true });
  console.log(
    'Captured home/gallery/editor/result at desktop and 360px, using original licensed sample illustrations.',
  );
} finally {
  await browser.close();
}
