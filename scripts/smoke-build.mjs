import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';
import { definitions } from '../src/frames/definitions.ts';

const baseURL = process.env.FOTBOOTH_SMOKE_URL ?? 'http://127.0.0.1:8788';
const reportPath = process.env.FOTBOOTH_SMOKE_REPORT ?? 'docs/qa/cloudflare-local-smoke.json';
const isRemote = new URL(baseURL).protocol === 'https:';
const browserName = process.env.FOTBOOTH_SMOKE_BROWSER ?? 'chromium';
const browserType = { chromium, webkit }[browserName];
if (!browserType) throw new Error(`Unsupported smoke browser: ${browserName}`);
const viewport = { width: Number(process.env.FOTBOOTH_SMOKE_WIDTH ?? 1440), height: 900 };
const browser = await browserType.launch();
try {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  const response = await page.goto(baseURL);
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['permissions-policy']).toBe('camera=(self), microphone=()');
  expect(headers['x-content-type-options']).toBe('nosniff');
  await expect(page.getByText('60 frame orisinal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewport.width,
  );
  const thumbs = await page.locator('.frame-art img').evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        image.loading = 'eager';
        await image.decode();
      }),
    );
    return images.map((image) => image.naturalWidth);
  });
  expect(thumbs).toHaveLength(60);
  expect(thumbs.every((width) => width >= 200)).toBe(true);
  for (const frame of definitions) {
    for (const asset of [frame.layers.background, frame.layers.foreground, frame.thumbnail]) {
      const assetResponse = await page.request.get(`${baseURL}${asset}`);
      expect(assetResponse.status(), asset).toBe(200);
    }
  }
  await page.getByLabel('Cari frame').fill('ribbon diary');
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(4);
  await page.getByRole('button', { name: 'Pakai frame Ribbon Diary Trio', exact: true }).click();
  const fixture = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 1000;
    const g = c.getContext('2d');
    g.fillStyle = '#d3e8b9';
    g.fillRect(0, 0, 800, 1000);
    g.fillStyle = '#7b65b3';
    g.fillRect(100, 150, 600, 700);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles(
    [1, 2, 3].map((i) => ({
      name: `smoke-${i}.png`,
      mimeType: 'image/png',
      buffer: Buffer.from(fixture, 'base64'),
    })),
  );
  await expect(page.getByTestId('photo-count')).toHaveText('3/8 foto');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewport.width,
  );
  await page.getByLabel('Caption').fill('frame baru, cerita baru');
  await page.getByRole('button', { name: 'Lihat hasil' }).click();
  const exports = [];
  await page.getByLabel('Ukuran hasil').selectOption('light');
  for (const format of ['png', 'jpg']) {
    await page.getByLabel('Format hasil').selectOption(format);
    const pendingDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
    const download = await pendingDownload;
    expect(await download.failure()).toBeNull();
    const bytes = await fs.readFile(await download.path());
    const dimensions = await page.evaluate(
      async ({ data, mime }) => {
        const bitmap = await createImageBitmap(
          new Blob([Uint8Array.from(atob(data), (char) => char.charCodeAt(0))], { type: mime }),
        );
        const result = [bitmap.width, bitmap.height];
        bitmap.close();
        return result;
      },
      { data: bytes.toString('base64'), mime: format === 'png' ? 'image/png' : 'image/jpeg' },
    );
    expect(dimensions).toEqual([600, 1800]);
    exports.push({ format, dimensions, bytes: bytes.length });
  }
  expect(errors).toEqual([]);
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()),
        baseURL,
        browser: browserName,
        viewport,
        frames: 60,
        thumbnailCount: thumbs.length,
        headers,
        exports,
        errors,
        scope: `${isRemote ? 'Cloudflare Pages HTTPS deployment' : 'Cloudflare Pages local runtime'}: built app, all 180 layer/thumbnail URLs, search, upload, caption, result and decoded PNG/JPEG downloads. Physical cameras and phones are not covered.`,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Cloudflare Pages ${isRemote ? 'HTTPS' : 'local'} smoke passed: 60 thumbnails, 180 frame assets, security headers and upload/PNG/JPEG download flow.`,
  );
} finally {
  await browser.close();
}
