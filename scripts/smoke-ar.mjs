import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, webkit, expect } from '@playwright/test';
const baseURL = process.env.FOTBOOTH_SMOKE_URL ?? 'http://127.0.0.1:8788';
const browserName = process.env.FOTBOOTH_SMOKE_BROWSER ?? 'chromium';
const reportPath = process.env.FOTBOOTH_AR_REPORT ?? 'docs/qa/ar-smoke.json';
const browser = await { chromium, webkit }[browserName].launch();
const portrait = await fs.readFile('artwork/materials/portrait-a.jpg');
const manifest = JSON.parse(
  await fs.readFile('artwork/provenance/ar-runtime-20261007.json', 'utf8'),
);
const detectorFile = (await fs.readdir('dist/assets')).find((name) =>
  /^detector-.*\.js$/.test(name),
);
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  const errors = [],
    external = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL).origin) external.push(request.url());
  });
  const response = await page.goto(baseURL),
    headers = response.headers();
  expect((await response.body()).equals(await fs.readFile('dist/index.html'))).toBe(true);
  expect(headers['content-security-policy']).toContain("'wasm-unsafe-eval'");
  expect(headers['content-security-policy']).toContain("worker-src 'self'");
  const assets = [];
  for (const item of manifest.files) {
    const url = '/' + item.file.replace(/^public\//, ''),
      response = await page.request.get(baseURL + url);
    expect(response.status(), url).toBe(200);
    const hash = createHash('sha256')
      .update(await response.body())
      .digest('hex');
    expect(hash, url).toBe(item.sha256);
    assets.push({ url, sha256: hash, cache: response.headers()['cache-control'] });
  }
  // Exercise the built Safari fallback with actual HTTP CSP and models; no test hook in production code.
  const model = await page.evaluate(
    async ({ path, bytes }) => {
      const { ARDetector } = await import(path);
      const bitmap = await createImageBitmap(
        new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }),
      );
      const detector = new ARDetector();
      try {
        const face = await detector.infer(bitmap, 'face'),
          person = await detector.infer(bitmap, 'person');
        const m = person.mask;
        return {
          faces: face.faces.length,
          landmarks: face.faces[0]?.points.length,
          person: m.values[Math.floor(m.height * 0.4) * m.width + Math.floor(m.width * 0.5)],
          background: m.values[Math.floor(m.height * 0.01) * m.width + Math.floor(m.width * 0.01)],
        };
      } finally {
        detector.close();
        bitmap.close();
      }
    },
    { path: '/assets/' + detectorFile, bytes: Array.from(portrait) },
  );
  expect(model.faces).toBe(1);
  expect(model.landmarks).toBe(478);
  expect(model.person).toBeGreaterThan(0.8);
  expect(model.background).toBeLessThan(0.1);
  const effects = [],
    exports = [];
  if (browserName === 'chromium') {
    await page.addInitScript(
      ({ data }) => {
        navigator.mediaDevices.getUserMedia = async () => {
          const im = new Image();
          im.src = 'data:image/jpeg;base64,' + data;
          await im.decode();
          const c = document.createElement('canvas');
          c.width = 900;
          c.height = 600;
          const x = c.getContext('2d');
          const draw = () => {
            x.fillStyle = '#d9cbbd';
            x.fillRect(0, 0, 900, 600);
            x.drawImage(im, 275, 90, 350, (350 * im.naturalHeight) / im.naturalWidth);
          };
          draw();
          const stream = c.captureStream(15),
            tick = setInterval(draw, 66);
          stream.getTracks().forEach((track) => {
            const stop = track.stop.bind(track);
            track.stop = () => {
              clearInterval(tick);
              stop();
            };
          });
          return stream;
        };
        navigator.mediaDevices.enumerateDevices = async () => [];
      },
      { data: portrait.toString('base64') },
    );
    await page.reload();
    await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
    await page.getByRole('button', { name: 'Pakai frame Night Market', exact: true }).click();
    await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    for (const name of [
      'Kitty Club',
      'Bunny Pop',
      'Teddy Mood',
      'Disco Glasses',
      'Golden Crown',
      'Ribbon Crush',
      'Party Time',
      'Peach Freckles',
      'Heart Orbit',
      'Butterfly Halo',
      'Smile Confetti',
      'Comic Boom',
      'Peach Studio',
      'Aqua World',
      'Neon City',
      'Neon Silhouette',
    ]) {
      await page.getByRole('button', { name: 'AR ' + name, exact: true }).click();
      await expect(page.getByTestId('ar-status')).toContainText(/wajah terdeteksi|Latar siap/, {
        timeout: 45000,
      });
      effects.push(name);
    }
    await page.getByLabel('Timer kamera').selectOption('0');
    for (const [i, name] of ['Golden Crown', 'Aqua World', 'Heart Orbit'].entries()) {
      await page.getByRole('button', { name: 'AR ' + name, exact: true }).click();
      await expect(page.getByTestId('ar-status')).toContainText(/wajah terdeteksi|Latar siap/, {
        timeout: 45000,
      });
      await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
      await expect(page.getByTestId('camera-progress')).toHaveText(`${i + 1}/3 terisi`);
    }
    await page.getByRole('button', { name: 'Lanjut edit', exact: true }).click();
    await page.getByRole('button', { name: 'Pilih slot 1', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Lihat hasil', exact: true })).toBeEnabled();
    const sum = () =>
      page.locator('.composition canvas').evaluate((c) =>
        c
          .getContext('2d')
          .getImageData(0, 0, c.width, c.height)
          .data.reduce((a, b, i) => a + (i % 4 === 3 ? 0 : b), 0),
      );
    const before = await sum();
    await page.getByLabel('Tampilkan AR pada foto ini').uncheck();
    await expect.poll(sum).not.toBe(before);
    await page.getByRole('button', { name: 'Urungkan', exact: true }).click();
    await expect.poll(sum).toBe(before);
    await page.getByRole('button', { name: 'Efek Vintage', exact: true }).click();
    await page.getByRole('button', { name: 'Lihat hasil', exact: true }).click();
    await page.getByLabel('Ukuran hasil').selectOption('light');
    for (const format of ['png', 'jpg']) {
      await page.getByLabel('Format hasil').selectOption(format);
      const downloaded = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Siapkan dan unduh', exact: true }).click();
      const bytes = await fs.readFile(await (await downloaded).path());
      const dimensions = await page.evaluate(async (data) => {
        const im = await createImageBitmap(new Blob([new Uint8Array(data)]));
        const d = [im.width, im.height];
        im.close();
        return d;
      }, Array.from(bytes));
      expect(dimensions).toEqual([600, 1800]);
      exports.push({
        format,
        bytes: bytes.length,
        dimensions,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        date: '2026-10-07',
        baseURL,
        browser: browserName,
        headers,
        assets,
        model,
        effects,
        exports,
        errors,
        external,
        scope:
          browserName === 'chromium'
            ? 'All 16 live AR selections, synthetic camera capture, reversible editor, real model masks/landmarks and PNG/JPEG under actual HTTPS CSP.'
            : 'Built Safari fallback performs real face/person inference under actual HTTPS CSP. Physical camera/phone is not covered.',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `AR HTTPS smoke passed (${browserName}): ${assets.length} pinned assets, real face/person models, ${effects.length} camera effects, ${exports.length} exports.`,
  );
} finally {
  await browser.close();
}
