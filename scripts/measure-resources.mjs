import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';

const evidence = [];
for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      const urls = new Set(),
        bitmaps = new Set();
      const peaks = { urls: 0, bitmaps: 0 };
      const create = URL.createObjectURL.bind(URL),
        revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        const url = create(blob);
        urls.add(url);
        peaks.urls = Math.max(peaks.urls, urls.size);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        urls.delete(url);
        revoke(url);
      };
      const decode = window.createImageBitmap.bind(window);
      window.createImageBitmap = async (...args) => {
        const image = await decode(...args),
          close = image.close.bind(image);
        bitmaps.add(image);
        peaks.bitmaps = Math.max(peaks.bitmaps, bitmaps.size);
        image.close = () => {
          bitmaps.delete(image);
          close();
        };
        return image;
      };
      window.__qaResourceCounts = () => ({
        urls: urls.size,
        bitmaps: bitmaps.size,
        peaks: { ...peaks },
      });
    });
    await page.goto('http://127.0.0.1:5173/');
    const encoded = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 3200;
      const context = canvas.getContext('2d');
      context.fillStyle = '#bc4236';
      context.fillRect(0, 0, 2400, 3200);
      context.fillStyle = '#2368b8';
      context.fillRect(0, 0, 1200, 1600);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    const buffer = Buffer.from(encoded, 'base64'),
      cycles = [];
    for (let cycle = 1; cycle <= 10; cycle++) {
      // Keep the same document alive: reload would hide leaks by destroying all resources.
      await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
      await page.getByRole('button', { name: 'Pakai frame Gallery Issue', exact: true }).click();
      await page.locator('input[type=file]').setInputFiles(
        [1, 2, 3, 4].map((i) => ({
          name: `resource-${i}.png`,
          mimeType: 'image/png',
          buffer,
        })),
      );
      await expect(page.getByTestId('photo-count')).toHaveText('4/8 foto');
      await page.getByLabel('Perbesar foto').fill('2');
      await page.getByRole('button', { name: 'Ganti frame', exact: true }).click();
      await page.getByRole('button', { name: 'Pakai frame Concert Pass', exact: true }).click();
      await page.getByRole('button', { name: 'Ganti frame', exact: true }).click();
      await page.getByRole('button', { name: 'Pakai frame Gallery Issue', exact: true }).click();
      await expect(page.getByLabel('Perbesar foto')).toHaveValue('2');
      await page.getByRole('button', { name: 'Lihat hasil' }).click();
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
      const bytes = await fs.readFile(await (await downloaded).path());
      const dimensions = await page.evaluate(async (data) => {
        const image = await createImageBitmap(new Blob([new Uint8Array(data)]));
        const dimensions = [image.width, image.height];
        image.close();
        return dimensions;
      }, Array.from(bytes));
      expect(dimensions).toEqual([1800, 2700]);
      const afterExport = await page.evaluate(() => window.__qaResourceCounts());
      expect(afterExport.urls).toBe(5);
      expect(afterExport.bitmaps).toBe(4);
      await page.getByRole('button', { name: 'Hapus sesi', exact: true }).click();
      await page.getByRole('button', { name: 'Ya, hapus sesi' }).click();
      await expect(page.getByRole('button', { name: 'Mulai bikin foto' })).toBeVisible();
      const afterClear = await page.evaluate(() => window.__qaResourceCounts());
      expect(afterClear.urls).toBe(0);
      expect(afterClear.bitmaps).toBe(0);
      cycles.push({ cycle, dimensions, afterExport, afterClear });
    }
    evidence.push({ engine, version: browser.version(), cycles });
    console.log(
      `${engine}: 10 complete cycles, exports decoded, all tracked resources released after each clear.`,
    );
  } finally {
    await browser.close();
  }
}
await fs.mkdir('docs/qa', { recursive: true });
await fs.writeFile(
  'docs/qa/resource-cycles.json',
  JSON.stringify(
    {
      testedAt: new Date().toISOString(),
      input: { photos: 4, width: 2400, height: 3200 },
      scope:
        'Automation host, same document for all cycles; live Object URLs and ImageBitmaps, not a heap profile or physical-device memory proof.',
      evidence,
    },
    null,
    2,
  ) + '\n',
);
