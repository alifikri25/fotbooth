import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

// Removing the worker model, mask or drawing path must change actual pixels, not just a label.
test('real local face and person models produce aligned accessories and masked backgrounds', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/tests/harness.html');
  const result = await page.evaluate(async () => {
    const { ARRuntime } = await import('/src/core/ar/runtime.ts');
    const { drawAR } = await import('/src/core/ar/draw.ts');
    const image = new Image();
    image.src = '/artwork/materials/portrait-a.jpg';
    await image.decode();
    const engine = new ARRuntime();
    const face = await engine.infer(image, 'face');
    const pair = document.createElement('canvas');
    pair.width = 640;
    pair.height = 480;
    const pairContext = pair.getContext('2d')!;
    pairContext.fillStyle = '#d9cbbd';
    pairContext.fillRect(0, 0, 640, 480);
    const pairHeight = (270 * image.naturalHeight) / image.naturalWidth;
    pairContext.drawImage(image, 35, 35, 270, pairHeight);
    pairContext.drawImage(image, 335, 35, 270, pairHeight);
    // Video tracking needs a second frame to acquire a newly entered face.
    let two = await engine.infer(pair, 'face');
    for (let i = 0; i < 4 && two.faces.length < 2; i++) two = await engine.infer(pair, 'face');
    const person = await engine.infer(image, 'person');
    const c = document.createElement('canvas');
    c.width = 600;
    c.height = 900;
    const ctx = c.getContext('2d')!;
    drawAR(c, image, { effect: 'none', time: 0, faces: [] });
    const original = ctx.getImageData(0, 0, 600, 900).data;
    const changes: Record<string, number> = {};
    for (const effect of [
      'cat',
      'bunny',
      'bear',
      'glasses',
      'crown',
      'ribbon',
      'party',
      'blush',
      'hearts',
      'butterflies',
      'confetti',
      'comic',
    ]) {
      drawAR(c, image, {
        ...face,
        effect,
        time: 1234,
        faces: face.faces.map((f) => ({
          ...f,
          expressions: { mouthSmileLeft: 0.8, mouthSmileRight: 0.8, jawOpen: 0.8 },
        })),
      });
      const data = ctx.getImageData(0, 0, 600, 900).data;
      changes[effect] = data.reduce((n, v, i) => n + (Math.abs(v - original[i]) > 10 ? 1 : 0), 0);
    }
    const alpha = person.mask!.values;
    for (const effect of ['studio', 'aquarium', 'neon', 'outline']) {
      drawAR(c, image, { ...person, effect, time: 1234 });
      const data = ctx.getImageData(0, 0, 600, 900).data;
      changes[effect] = data.reduce((n, v, i) => n + (Math.abs(v - original[i]) > 10 ? 1 : 0), 0);
    }
    const personAt = (x: number, y: number) =>
      alpha[
        Math.floor(y * person.mask!.height) * person.mask!.width +
          Math.floor(x * person.mask!.width)
      ];
    drawAR(c, image, { ...person, effect: 'studio', time: 0 });
    const bg = Array.from(ctx.getImageData(5, 5, 1, 1).data);
    engine.close();
    return {
      faces: face.faces.length,
      landmarks: face.faces[0]?.points.length,
      person: alpha.reduce((a, b) => Math.max(a, b), 0),
      background: alpha.reduce((a, b) => Math.min(a, b), 1),
      changes,
      bg,
      centerPerson: personAt(0.5, 0.4),
      cornerPerson: personAt(0.01, 0.01),
      pairFaces: two.faces.length,
    };
  });
  expect(result.faces).toBeGreaterThan(0);
  expect(result.landmarks).toBe(478);
  expect(result.pairFaces).toBe(2);
  expect(result.person).toBeGreaterThan(0.9);
  expect(result.background).toBeLessThan(0.1);
  expect(result.centerPerson).toBeGreaterThan(0.8);
  expect(result.cornerPerson).toBeLessThan(0.1);
  for (const [effect, pixels] of Object.entries(result.changes))
    expect(pixels, effect).toBeGreaterThan(200);
  expect(result.bg[3]).toBe(255);
  expect(result.bg[0]).toBeGreaterThan(result.bg[2]);
});

async function portraitCamera(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const im = new Image();
      im.src = '/artwork/materials/portrait-a.jpg';
      await im.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      const draw = () => {
        ctx.fillStyle = '#d9cbbd';
        ctx.fillRect(0, 0, 900, 600);
        ctx.drawImage(im, 275, 90, 350, (350 * im.naturalHeight) / im.naturalWidth);
      };
      draw();
      const stream = canvas.captureStream(15);
      const tick = setInterval(draw, 66);
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
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.getByRole('button', { name: 'Pakai frame Night Market', exact: true }).click();
  await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
}
test('camera AR loads on demand, follows capture into the editor, supports undo and exports', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Canvas captureStream test camera needs Chromium. Real inference is covered in both engines.',
  );
  test.setTimeout(90000);
  const models: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).pathname.startsWith('/ar/')) models.push(r.url());
  });
  await portraitCamera(page);
  expect(models).toEqual([]);
  await page.getByRole('button', { name: 'AR Golden Crown', exact: true }).click();
  await expect(page.getByTestId('ar-status')).toContainText('1 wajah', { timeout: 45000 });
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator('.camera-live').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('ar-camera-mobile.png') });
  await page.getByLabel('Timer kamera').selectOption('0');
  await page.getByLabel('Ambil rangkaian').check();
  await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
  await expect(page.getByTestId('camera-progress')).toHaveText('3/3 terisi', { timeout: 20000 });
  await page.getByRole('button', { name: 'Lanjut edit', exact: true }).click();
  await expect
    .poll(() => page.workers().filter((w) => w.url().includes('/ar/worker')).length)
    .toBe(0);
  await page.getByRole('button', { name: 'Pilih slot 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lihat hasil', exact: true })).toBeEnabled();
  const pixels = () =>
    page
      .locator('.composition canvas')
      .evaluate((c: HTMLCanvasElement) =>
        Array.from(c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data).reduce(
          (a, b, i) => a + (i % 4 === 3 ? 0 : b),
          0,
        ),
      );
  const withAR = await pixels();
  await page.getByLabel('Tampilkan AR pada foto ini').uncheck();
  await expect.poll(pixels).not.toBe(withAR);
  await page.getByRole('button', { name: 'Urungkan', exact: true }).click();
  await expect(page.getByLabel('Tampilkan AR pada foto ini')).toBeChecked();
  await expect.poll(pixels).toBe(withAR);
  await page.getByRole('button', { name: 'Balik horizontal', exact: true }).click();
  await page.getByRole('button', { name: 'Putar 90°', exact: true }).click();
  await page.getByRole('button', { name: 'Efek Vintage', exact: true }).click();
  await page.getByRole('button', { name: 'Lihat hasil', exact: true }).click();
  await page.getByLabel('Ukuran hasil').selectOption('light');
  for (const format of ['png', 'jpg']) {
    await page.getByLabel('Format hasil').selectOption(format);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Siapkan dan unduh', exact: true }).click();
    expect(await (await download).failure()).toBeNull();
  }
});
test('AR model failure leaves normal camera capture available', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Canvas test camera needs Chromium.');
  await page.route('**/ar/face_landmarker-v1.task', (route) => route.abort());
  await portraitCamera(page);
  await page.getByRole('button', { name: 'AR Kitty Club', exact: true }).click();
  await expect(page.getByTestId('ar-status')).toContainText('belum bisa', { timeout: 45000 });
  await page.getByRole('button', { name: 'AR Tanpa AR', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
  await page.getByLabel('Timer kamera').selectOption('0');
  await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
  await expect(page.getByTestId('camera-capture-review')).toBeVisible();
  await expect(
    page
      .getByTestId('camera-capture-review')
      .getByRole('img', { name: 'Hasil foto 1', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('camera-progress')).toHaveText('0/3 terisi');
  await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
  await expect(page.getByTestId('camera-progress')).toHaveText('1/3 terisi');
});

test('single AR shots stay in review until accepted, then advance after asynchronous ingestion', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Canvas test camera needs Chromium.');
  await portraitCamera(page);
  await page.getByLabel('Timer kamera').selectOption('0');
  for (const [i, name] of ['Golden Crown', 'Aqua World', 'Heart Orbit'].entries()) {
    await page.getByRole('button', { name: 'AR ' + name, exact: true }).click();
    await expect(page.getByTestId('ar-status')).toContainText(/wajah terdeteksi|Latar siap/, {
      timeout: 45000,
    });
    await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
    await expect(page.getByTestId('camera-capture-review')).toBeVisible();
    await expect(
      page
        .getByTestId('camera-capture-review')
        .getByRole('img', { name: `Hasil foto ${i + 1}`, exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('camera-progress')).toHaveText(`${i}/3 terisi`);
    await expect(
      page.getByRole('button', { name: `Pilih foto kamera ${i + 1}`, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() => page.workers().filter((w) => w.url().includes('/ar/worker')).length)
      .toBe(0);
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    if (i < 2) {
      await expect(page.getByTestId('camera-progress')).toHaveText(`${i + 1}/3 terisi`);
      await expect(
        page.getByRole('button', { name: `Pilih foto kamera ${i + 2}`, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    } else {
      await expect(page.getByRole('heading', { name: 'Atur fotomu' })).toBeVisible();
      await expect(page.getByTestId('photo-count')).toHaveText('3/8 foto');
      await expect(page.getByRole('button', { name: 'Lihat hasil', exact: true })).toBeEnabled();
    }
  }
});

// A renderer that forgets saved AR or transforms it independently of the photo breaks these coordinates.
test('saved AR shares the photo transform and can be removed in preview and PNG/JPEG', async ({
  page,
}) => {
  await page.goto('/tests/harness.html');
  const result = await page.evaluate(async () => {
    const { renderComposition } = await import('/src/core/renderer.ts');
    const points = Array.from({ length: 478 }, () => ({ x: 0.375, y: 0.5 }));
    points[33] = { x: 0.25, y: 0.5 };
    points[263] = { x: 0.5, y: 0.5 };
    const raw = document.createElement('canvas');
    raw.width = raw.height = 600;
    raw.getContext('2d')!.fillRect(0, 0, 600, 600);
    const frame = {
      designWidth: 600,
      designHeight: 600,
      palette: { background: '#ffffff' },
      layers: {},
      slots: [
        { id: 'a', x: 0, y: 0, w: 1, h: 1, shape: 'rect', rotationDeg: 0, matteColor: '#ffffff' },
      ],
      textAreas: [],
    };
    const placement = {
      slotId: 'a',
      photoId: 'p',
      fitMode: 'contain',
      centerX: 0.5,
      centerY: 0.5,
      zoom: 1,
      rotation: 0,
      mirror: false,
    };
    const source = async () => ({
      image: raw,
      width: 600,
      height: 600,
      ar: { effect: 'crown', time: 0, faces: [{ points, expressions: {} }] },
    });
    const c = document.createElement('canvas'),
      ctx = c.getContext('2d')!;
    const pixel = (x: number, y: number) =>
      Array.from(ctx.getImageData(Math.floor(x * 600), Math.floor(y * 600), 1, 1).data);
    await renderComposition(
      c,
      frame,
      { placements: [placement], caption: '', date: '' },
      source,
      600,
      600,
    );
    const plain = pixel(0.375, 0.28),
      encoded: Record<string, number[]> = {};
    for (const format of ['image/png', 'image/jpeg']) {
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), format, 0.95)),
        im = await createImageBitmap(blob);
      ctx.drawImage(im, 0, 0);
      im.close();
      encoded[format] = pixel(0.375, 0.28);
    }
    await renderComposition(
      c,
      frame,
      { placements: [{ ...placement, mirror: true }], caption: '', date: '' },
      source,
      600,
      600,
    );
    const mirror = pixel(0.625, 0.28),
      old = pixel(0.375, 0.28);
    await renderComposition(
      c,
      frame,
      { placements: [{ ...placement, rotation: 90 }], caption: '', date: '' },
      source,
      600,
      600,
    );
    const rotated = pixel(0.72, 0.375);
    await renderComposition(
      c,
      frame,
      { placements: [{ ...placement, arEnabled: false }], caption: '', date: '' },
      source,
      600,
      600,
    );
    return { plain, mirror, old, rotated, off: pixel(0.375, 0.28), encoded };
  });
  expect(result.plain).toEqual([255, 219, 99, 255]);
  expect(result.mirror).toEqual([255, 219, 99, 255]);
  expect(result.rotated).toEqual([255, 219, 99, 255]);
  expect(result.old).toEqual([0, 0, 0, 255]);
  expect(result.off).toEqual([0, 0, 0, 255]);
  for (const p of Object.values(result.encoded)) {
    expect(p[0]).toBeGreaterThan(245);
    expect(p[1]).toBeGreaterThan(205);
    expect(p[2]).toBeLessThan(110);
  }
});

test('built AR loads real models under the Cloudflare CSP without external photo requests', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Built camera stream uses Chromium; WebKit real models are tested separately.',
  );
  test.setTimeout(90000);
  const root = path.resolve('dist'),
    headerFile = await fs.readFile(path.join(root, '_headers'), 'utf8');
  const headers: Record<string, string> = {};
  for (const line of headerFile.split(/\r?\n/).slice(1)) {
    if (!line.trim()) break;
    const colon = line.indexOf(':');
    headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  const mime: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.wasm': 'application/wasm',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.woff2': 'font/woff2',
  };
  await page.route('**/*', async (route) => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    if (pathname === '/artwork/materials/portrait-a.jpg')
      return route.fulfill({
        body: await fs.readFile('artwork/materials/portrait-a.jpg'),
        contentType: 'image/jpeg',
      });
    const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(root + path.sep)) return route.abort();
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
  const errors: string[] = [],
    external: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (new URL(r.url()).origin !== 'http://127.0.0.1:5173') external.push(r.url());
  });
  await portraitCamera(page);
  await page.getByRole('button', { name: 'AR Kitty Club', exact: true }).click();
  await expect(page.getByTestId('ar-status')).toContainText('1 wajah', { timeout: 45000 });
  await page.getByRole('button', { name: 'AR Aqua World', exact: true }).click();
  await expect(page.getByTestId('ar-status')).toContainText('Latar siap', { timeout: 45000 });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('stopping AR aborts an in-flight model load promptly in both inference paths', async ({
  page,
}) => {
  await page.route('**/ar/face_landmarker-v1.task', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto('/tests/harness.html');
  const request = page.waitForRequest('**/ar/face_landmarker-v1.task');
  await page.evaluate(async () => {
    const { ARRuntime } = await import('/src/core/ar/runtime.ts');
    const im = new Image();
    im.src = '/artwork/materials/portrait-a.jpg';
    await im.decode();
    const engine = new ARRuntime();
    (window as any).stopAR = () => engine.close();
    (window as any).arOutcome = engine.infer(im, 'face').then(
      () => 'success',
      (error) => error.name,
    );
  });
  await request;
  const outcome = await page.evaluate(async () => {
    (window as any).stopAR();
    return Promise.race([
      (window as any).arOutcome,
      new Promise((r) => setTimeout(() => r('still loading'), 100)),
    ]);
  });
  expect(outcome).toBe('AbortError');
});
