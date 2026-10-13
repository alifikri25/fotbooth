import { test, expect, type Browser, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { definitions } from '../../src/frames/definitions';

const site = process.env.FOTBOOTH_ROOM_TEST_URL ?? 'http://127.0.0.1:5173';
const originalHost = ['#ff0000', '#00ff00', '#0000ff', '#ff8800'];
const originalGuest = ['#00ffff', '#ff00ff', '#ffff00', '#8800ff'];
const freshHost = ['#0000ff', '#ffff00'];
const freshGuest = ['#00ff00', '#ff0000'];

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'The moving camera fixture uses canvas.captureStream.');
});

async function cameraAndDecodeProbe(page: Page, colors: string[], relay: boolean) {
  // Keep this independent integration check stable while the main UI owner edits source.
  await page.route('**/@vite/client', route => route.fulfill({
    contentType: 'application/javascript',
    body: `
      const styles = new Map();
      export function createHotContext() {
        return { accept() {}, dispose() {}, invalidate() {}, prune() {}, on() {}, off() {}, send() {}, data: {} };
      }
      export function injectQuery(url) { return url; }
      export function updateStyle(id, content) {
        let style = styles.get(id);
        if (!style) { style = document.createElement('style'); styles.set(id, style); document.head.append(style); }
        style.textContent = content;
      }
      export function removeStyle(id) { styles.get(id)?.remove(); styles.delete(id); }
    `,
  }));
  await page.addInitScript(({ colors, relay }) => {
    const state = {
      colors,
      pose: 0,
      captures: [] as { captureId: string; series?: { seriesId: string; index: number; total: number } }[],
      created: 0,
      closed: 0,
      gateArmed: false,
      pending: 0,
      releases: [] as (() => void)[],
    };
    Object.assign(window, { roomRecoveryProbe: state });
    const nativeBitmap = window.createImageBitmap.bind(window);
    const tracked = new WeakSet<ImageBitmap>();
    const nativeClose = ImageBitmap.prototype.close;
    ImageBitmap.prototype.close = function () {
      if (tracked.delete(this)) state.closed++;
      nativeClose.call(this);
    };
    window.createImageBitmap = (async (...args: Parameters<typeof createImageBitmap>) => {
      const bitmap = await (nativeBitmap as (...args: unknown[]) => Promise<ImageBitmap>)(...args);
      if (args[0] instanceof Blob && args[0].type === 'image/png' && bitmap.width === 640 && bitmap.height === 480) {
        tracked.add(bitmap);
        state.created++;
        if (state.gateArmed) {
          state.pending++;
          await new Promise<void>(resolve => state.releases.push(() => {
            state.pending--;
            resolve();
          }));
        }
      }
      return bitmap;
    }) as typeof createImageBitmap;
    const NativeSocket = window.WebSocket;
    window.WebSocket = class extends NativeSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        this.addEventListener('message', event => {
          if (typeof event.data !== 'string') return;
          const message = JSON.parse(event.data);
          if (message.type === 'capture') {
            state.pose = message.series?.index ?? 0;
            state.captures.push({ captureId: message.captureId, series: message.series });
          }
        });
      }
    };
    if (relay) Object.defineProperty(window, 'RTCPeerConnection', { value: undefined });
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext('2d')!;
      const paint = () => {
        context.fillStyle = state.colors[state.pose];
        context.fillRect(0, 0, canvas.width, canvas.height);
      };
      paint();
      const stream = canvas.captureStream(20);
      const interval = setInterval(paint, 40);
      for (const track of stream.getTracks()) {
        const stop = track.stop.bind(track);
        track.stop = () => { clearInterval(interval); stop(); };
      }
      return stream;
    };
  }, { colors, relay });
}

async function pair(browser: Browser, relay = false) {
  const hostContext = await browser.newContext(), guestContext = await browser.newContext();
  const host = await hostContext.newPage(), guest = await guestContext.newPage();
  try {
    await cameraAndDecodeProbe(host, originalHost, relay);
    await cameraAndDecodeProbe(guest, originalGuest, relay);
    await host.goto(site);
    await host.getByRole('button', { name: 'Foto bareng online', exact: true }).click();
    await host.getByLabel('Nama kamu', { exact: true }).fill('Ali');
    await host.getByRole('button', { name: 'Buat room', exact: true }).click();
    await expect(host.getByRole('heading', { name: 'Room foto bareng', exact: true })).toBeVisible();
    await host.getByLabel('Frame foto bareng', { exact: true }).selectOption('pocket-arcade');
    await host.getByLabel('Pisahkan latar kamera').uncheck();
    const invitation = await host.getByLabel('Tautan undangan', { exact: true }).inputValue();
    await guest.goto(invitation);
    await guest.getByLabel('Nama kamu', { exact: true }).fill('Rani');
    await guest.getByRole('button', { name: 'Masuk room', exact: true }).click();
    await host.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
    await guest.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
    // Camera activation returns before ICE lookup and authenticated room state arrive.
    // Wait for that visible boundary before checking the guest's synchronized settings.
    for (const page of [host, guest])
      await expect(page.getByTestId('room-peer-status')).toContainText('Terhubung', { timeout: 45000 });
    await expect(guest.getByLabel('Frame foto bareng', { exact: true })).toHaveValue('pocket-arcade');
    return { host, guest, close: async () => { await hostContext.close(); await guestContext.close(); } };
  } catch (error) {
    await hostContext.close(); await guestContext.close();
    throw error;
  }
}

async function start(host: Page, guest: Page) {
  await host.getByRole('button', { name: 'Aku siap', exact: true }).click();
  await guest.getByRole('button', { name: 'Aku siap', exact: true }).click();
  const shutter = host.getByRole('main').getByRole('button', { name: 'Foto bareng', exact: true });
  await expect(shutter).toBeEnabled();
  await shutter.click();
}

async function assertCanceled(host: Page, guest: Page) {
  for (const page of [host, guest]) {
    await expect(page.getByTestId('room-shot-progress')).toHaveCount(0);
    await expect(page.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Unduh PNG', exact: true })).toHaveCount(0);
  }
}

async function assertReleased(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const probe = (window as any).roomRecoveryProbe;
    return { created: probe.created, closed: probe.closed };
  })).toEqual({ created: 2, closed: 2 });
}

async function finishFreshTwoPoses(host: Page, guest: Page) {
  await host.evaluate(colors => { (window as any).roomRecoveryProbe.colors = colors; }, freshHost);
  await guest.evaluate(colors => { (window as any).roomRecoveryProbe.colors = colors; }, freshGuest);
  await host.getByLabel('Frame foto bareng', { exact: true }).selectOption('concert-pass');
  await expect(guest.getByLabel('Frame foto bareng', { exact: true })).toHaveValue('concert-pass');
  await expect(host.getByTestId('room-frame-info')).toContainText('2 pose');
  await start(host, guest);
  for (const page of [host, guest])
    await expect(page.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toBeVisible({ timeout: 45000 });
  const bytes = async (page: Page) => {
    const pending = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Unduh PNG', exact: true }).click();
    const download = await pending;
    expect(await download.failure()).toBeNull();
    return fs.readFile((await download.path())!);
  };
  const [hostPNG, guestPNG] = await Promise.all([bytes(host), bytes(guest)]);
  expect(hostPNG.equals(guestPNG)).toBe(true);
  const frame = definitions.find(frame => frame.id === 'concert-pass')!;
  const samples = await host.evaluate(async ({ bytes, slots }) => {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0); bitmap.close();
    return slots.map(slot => [0.25, 0.75].map(side => Array.from(context.getImageData(
      Math.round((slot.x + slot.w * side) * canvas.width),
      Math.round((slot.y + slot.h * 0.5) * canvas.height), 1, 1,
    ).data)));
  }, { bytes: Array.from(hostPNG), slots: frame.slots });
  expect(samples).toEqual([
    [[0, 0, 255, 255], [0, 255, 0, 255]],
    [[255, 255, 0, 255], [255, 0, 0, 255]],
  ]);
  for (const page of [host, guest]) {
    const captures = await page.evaluate(() => (window as any).roomRecoveryProbe.captures);
    const fresh = captures.slice(-2);
    expect(fresh.map((capture: any) => capture.series.index)).toEqual([0, 1]);
    expect(fresh[0].series.total).toBe(2);
    expect(fresh[0].series.seriesId).not.toBe(captures[0].series.seriesId);
    expect(fresh[0].series.seriesId).toBe(fresh[1].series.seriesId);
    expect(new Set(captures.map((capture: any) => capture.captureId)).size).toBe(captures.length);
  }
}

for (const interruption of ['guest cancellation', 'guest disconnect with relay'] as const) {
  test(`${interruption} clears an unfinished four-pose series before same-room two-pose restart`, async ({ browser }) => {
    test.setTimeout(120000);
    const { host, guest, close } = await pair(browser, interruption.includes('relay'));
    try {
      await start(host, guest);
      for (const page of [host, guest])
        await expect(page.getByTestId('room-shot-progress')).toContainText('Pose 2 dari 4', { timeout: 45000 });
      if (interruption === 'guest cancellation')
        await guest.getByRole('button', { name: 'Batalkan pengambilan', exact: true }).click();
      else await guest.getByRole('button', { name: 'Matikan kamera', exact: true }).click();
      await assertCanceled(host, guest);
      await assertReleased(host); await assertReleased(guest);
      if (interruption.includes('relay')) {
        await guest.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
        await expect(host.getByTestId('room-peer-status')).toContainText('Terhubung', { timeout: 45000 });
      }
      await finishFreshTwoPoses(host, guest);
    } finally { await close(); }
  });
}

test('canceling while a portrait decode is pending releases late bitmaps and does not repopulate the next series', async ({ browser }) => {
  test.setTimeout(120000);
  const { host, guest, close } = await pair(browser);
  try {
    await host.evaluate(() => { (window as any).roomRecoveryProbe.gateArmed = true; });
    await start(host, guest);
    await expect.poll(() => host.evaluate(() => (window as any).roomRecoveryProbe.pending), { timeout: 15000 }).toBe(1);
    await host.getByRole('button', { name: 'Batalkan pengambilan', exact: true }).click();
    await assertCanceled(host, guest);
    await host.evaluate(() => {
      const probe = (window as any).roomRecoveryProbe;
      probe.gateArmed = false;
      for (const release of probe.releases.splice(0)) release();
    });
    await assertReleased(host); await assertReleased(guest);
    await finishFreshTwoPoses(host, guest);
  } finally { await close(); }
});
