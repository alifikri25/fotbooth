import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test('the production catalog works with the actual Cloudflare security headers', async ({
  page,
}) => {
  const buildRoot = path.resolve('dist');
  const headerFile = await fs.readFile(path.join(buildRoot, '_headers'), 'utf8');
  const headers: Record<string, string> = {};
  for (const line of headerFile.split(/\r?\n/).slice(1)) {
    if (!line.trim()) break;
    const colon = line.indexOf(':');
    headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  const mime: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
  };
  await page.route('**/*', async (route) => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    const filename = path.resolve(buildRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(buildRoot + path.sep)) return route.abort();
    try {
      await route.fulfill({
        body: await fs.readFile(filename),
        headers: {
          ...headers,
          'Content-Type': mime[path.extname(filename)] ?? 'application/octet-stream',
        },
      });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('60 frame orisinal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(60);
  await page.getByLabel('Cari frame').fill('ribbon diary');
  await expect(page.getByRole('button', { name: /^Pakai frame / })).toHaveCount(4);
  await page.getByRole('button', { name: 'Pakai frame Rose Ribbon Salon', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mulai dengan senyum kamu.' })).toBeVisible();
  expect(errors).toEqual([]);
});
