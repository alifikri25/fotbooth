import fs from 'node:fs/promises';
import { chromium, webkit, expect } from '@playwright/test';
import { definitions } from '../src/frames/definitions.ts';
import { signatureIds } from '../src/frames/signature.ts';

const baseURL = process.env.FOTBOOTH_SMOKE_URL ?? 'http://127.0.0.1:5173';
const browserName = process.env.FOTBOOTH_SMOKE_BROWSER ?? 'chromium';
const reportPath = process.env.FOTBOOTH_SIGNATURE_REPORT ?? 'docs/qa/signature-smoke.json';
const browser = await { chromium, webkit }[browserName].launch();
const evidence = [];
const viewport = { width: Number(process.env.FOTBOOTH_SMOKE_WIDTH ?? 1440), height: 900 };
try {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  for (const id of signatureIds) {
    const frame = definitions.find((frame) => frame.id === id);
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
    await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(60);
    await page.getByRole('button', { name: `Pakai frame ${frame.name}`, exact: true }).click();
    const fixture = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const c = canvas.getContext('2d');
      c.fillStyle = '#d6e9c7';
      c.fillRect(0, 0, 800, 1000);
      c.fillStyle = '#596aaf';
      c.fillRect(150, 200, 500, 600);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await page
      .locator('input[type=file]')
      .setInputFiles(
        [1, 2, 3, 4].map((i) => ({
          name: `fixture-${i}.png`,
          mimeType: 'image/png',
          buffer: Buffer.from(fixture, 'base64'),
        })),
      );
    await expect(page.getByTestId('photo-count')).toHaveText('4/8 foto');
    await page.getByLabel('Caption').fill('Hari yang akan selalu kita ingat bersama');
    await page.getByRole('button', { name: 'Lihat hasil' }).click();
    await page.getByLabel('Ukuran hasil').selectOption('light');
    const outputs = [];
    for (const format of ['png', 'jpg']) {
      await page.getByLabel('Format hasil').selectOption(format);
      const downloadPending = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Siapkan dan unduh' }).click();
      const download = await downloadPending;
      expect(await download.failure()).toBeNull();
      const bytes = await fs.readFile(await download.path());
      const dimensions = await page.evaluate(
        async ({ data, mime }) => {
          const bitmap = await createImageBitmap(
            new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type: mime }),
          );
          const dims = [bitmap.width, bitmap.height];
          bitmap.close();
          return dims;
        },
        { data: bytes.toString('base64'), mime: format === 'png' ? 'image/png' : 'image/jpeg' },
      );
      expect(dimensions).toEqual([frame.designWidth / 2, frame.designHeight / 2]);
      outputs.push({ format, dimensions, bytes: bytes.length });
    }
    evidence.push({ id, name: frame.name, version: frame.version, outputs });
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
        evidence,
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Signature smoke passed on ${browserName}: all ${evidence.length} designs, uploads, captions and ${evidence.length * 2} decoded PNG/JPEG downloads.`,
  );
} finally {
  await browser.close();
}
