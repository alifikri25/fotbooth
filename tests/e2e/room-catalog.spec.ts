import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { definitions } from '../../src/frames/definitions';

const site = process.env.FOTBOOTH_ROOM_TEST_URL ?? 'http://127.0.0.1:5173';
const hostColors = ['#ff0000', '#00ff00', '#0000ff', '#ff8800'];
const guestColors = ['#00ffff', '#ff00ff', '#ffff00', '#8800ff'];

async function poseCamera(page: Page, colors: string[]) {
  await page.addInitScript((colors) => {
    let pose = 0;
    const shots: number[] = [];
    Object.assign(window, { roomTestShots: shots });
    const NativeSocket = window.WebSocket;
    window.WebSocket = class extends NativeSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        this.addEventListener('message', (event) => {
          if (typeof event.data !== 'string') return;
          const message = JSON.parse(event.data);
          if (message.type === 'capture') {
            pose = message.series?.index ?? 0;
            shots.push(pose);
          }
        });
      }
    };
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext('2d')!;
      const paint = () => {
        context.fillStyle = colors[pose];
        context.fillRect(0, 0, canvas.width, canvas.height);
      };
      paint();
      const stream = canvas.captureStream(20);
      const interval = setInterval(paint, 40);
      for (const track of stream.getTracks()) {
        const stop = track.stop.bind(track);
        track.stop = () => {
          clearInterval(interval);
          stop();
        };
      }
      return stream;
    };
  }, colors);
}

async function createHost(page: Page) {
  await page.goto(site);
  await page.getByRole('button', { name: 'Foto bareng online', exact: true }).click();
  await page.getByLabel('Nama kamu', { exact: true }).fill('Ali');
  await page.getByRole('button', { name: 'Buat room', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Room foto bareng' })).toBeVisible();
}

test('room offers every prepared catalogue frame and keeps the three dedicated choices', async ({
  page,
}) => {
  await createHost(page);
  const select = page.getByLabel('Frame foto bareng', { exact: true });
  const ids = await select
    .locator('option')
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(ids).toHaveLength(83);
  for (const frame of definitions) expect(ids).toContain(frame.id);
  for (const id of ['online-satu-tempat', 'online-surat-rindu', 'online-night-date'])
    expect(ids).toContain(id);
  await select.selectOption('pocket-arcade');
  await expect(page.getByTestId('room-frame-info')).toContainText('4 pose');
  await expect(page.getByLabel('Pratinjau foto bareng', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keluar room', exact: true }).click();
});

for (const transport of ['direct', 'relay'] as const) {
  test(`four fresh paired poses fill a prepared frame and both downloads match using ${transport}`, async ({
    browser,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Synthetic moving cameras require captureStream.');
    test.setTimeout(120000);
    const hostContext = await browser.newContext(),
      guestContext = await browser.newContext();
    const host = await hostContext.newPage(),
      guest = await guestContext.newPage();
    try {
      await poseCamera(host, hostColors);
      await poseCamera(guest, guestColors);
      if (transport === 'relay') {
        for (const page of [host, guest])
          await page.addInitScript(() => {
            Object.defineProperty(window, 'RTCPeerConnection', { value: undefined });
          });
      }
      await createHost(host);
      await host.getByLabel('Frame foto bareng', { exact: true }).selectOption('pocket-arcade');
      await host.getByLabel('Pisahkan latar kamera').uncheck();
      const invite = await host.getByLabel('Tautan undangan', { exact: true }).inputValue();
      await guest.goto(invite);
      await guest.getByLabel('Nama kamu', { exact: true }).fill('Rani');
      await guest.getByRole('button', { name: 'Masuk room', exact: true }).click();
      await host.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
      await guest.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
      await expect(host.getByTestId('room-peer-status')).toContainText('Terhubung', {
        timeout: 45000,
      });
      await expect(guest.getByTestId('room-peer-status')).toContainText('Terhubung', {
        timeout: 45000,
      });
      await expect(guest.getByLabel('Frame foto bareng', { exact: true })).toHaveValue(
        'pocket-arcade',
      );
      await expect(guest.getByLabel('Frame foto bareng', { exact: true })).toBeDisabled();
      await host.getByRole('button', { name: 'Aku siap', exact: true }).click();
      await guest.getByRole('button', { name: 'Aku siap', exact: true }).click();
      await expect(
        host.getByRole('main').getByRole('button', { name: 'Foto bareng', exact: true }),
      ).toBeEnabled();
      await host
        .getByRole('main')
        .getByRole('button', { name: 'Foto bareng', exact: true })
        .click();
      await expect(host.getByTestId('room-shot-progress')).toContainText('Pose 3 dari 4', {
        timeout: 45000,
      });
      const frame = definitions.find((frame) => frame.id === 'pocket-arcade')!;
      const preview = await host.getByLabel('Pratinjau foto bareng', { exact: true }).evaluate(
        (canvas, slots) => {
          const surface = canvas as HTMLCanvasElement;
          const context = surface.getContext('2d')!;
          return slots.map((slot) =>
            [0.25, 0.75].map((side) =>
              Array.from(
                context.getImageData(
                  Math.round((slot.x + slot.w * side) * surface.width),
                  Math.round((slot.y + slot.h * 0.5) * surface.height),
                  1,
                  1,
                ).data,
              ),
            ),
          );
        },
        frame.slots.slice(0, 2),
      );
      expect(preview[0][0].slice(0, 3)).toEqual([255, 0, 0]);
      expect(preview[1][0].slice(0, 3)).toEqual([0, 255, 0]);
      for (const page of [host, guest])
        await expect(page.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toBeVisible(
          { timeout: 45000 },
        );
      const downloadBytes = async (page: Page) => {
        const pending = page.waitForEvent('download');
        await page.getByRole('link', { name: 'Unduh PNG', exact: true }).click();
        const download = await pending;
        expect(await download.failure()).toBeNull();
        return fs.readFile((await download.path())!);
      };
      const [a, b] = await Promise.all([downloadBytes(host), downloadBytes(guest)]);
      expect(a.equals(b)).toBe(true);
      const pixels = await host.evaluate(
        async ({ bytes, slots }) => {
          const bitmap = await createImageBitmap(
            new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
          );
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d')!;
          context.drawImage(bitmap, 0, 0);
          const samples = slots.map((slot) =>
            [0.25, 0.75].map((side) =>
              Array.from(
                context.getImageData(
                  Math.round((slot.x + slot.w * side) * canvas.width),
                  Math.round((slot.y + slot.h * 0.5) * canvas.height),
                  1,
                  1,
                ).data,
              ),
            ),
          );
          bitmap.close();
          return { width: canvas.width, height: canvas.height, samples };
        },
        { bytes: Array.from(a), slots: frame.slots },
      );
      const rgb = (hex: string) =>
        [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
      for (let pose = 0; pose < 4; pose++) {
        expect(pixels.samples[pose][0].slice(0, 3)).toEqual(rgb(hostColors[pose]));
        expect(pixels.samples[pose][1].slice(0, 3)).toEqual(rgb(guestColors[pose]));
      }
      expect(await host.evaluate(() => (window as any).roomTestShots)).toEqual([0, 1, 2, 3]);
      expect(await guest.evaluate(() => (window as any).roomTestShots)).toEqual([0, 1, 2, 3]);
      expect([pixels.width, pixels.height]).toEqual([frame.designWidth, frame.designHeight]);
      await host.evaluate(() => window.scrollTo(0, 0));
      await host.screenshot({
        path: `docs/qa/online-room-catalog-${transport}-desktop.png`,
        fullPage: true,
      });
      await host.setViewportSize({ width: 390, height: 844 });
      await host.evaluate(() => window.scrollTo(0, 0));
      expect(await host.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
      await host.screenshot({
        path: `docs/qa/online-room-catalog-${transport}-mobile.png`,
        fullPage: true,
      });
      await fs.writeFile(
        `docs/qa/online-room-catalog-${transport}-verification.json`,
        JSON.stringify(
          {
            verifiedAt: new Date().toISOString(),
            site,
            transport,
            syntheticCameras: true,
            frame: frame.id,
            poses: 4,
            distinctPairsPerSlot: true,
            identicalDownloads: true,
            bytes: a.length,
            sha256: createHash('sha256').update(a).digest('hex'),
            ...pixels,
          },
          null,
          2,
        ),
      );
      await guest.getByRole('button', { name: 'Keluar room', exact: true }).click();
      await expect(host.getByRole('link', { name: 'Unduh PNG', exact: true })).toBeVisible();
      await host.getByRole('button', { name: 'Matikan kamera', exact: true }).click();
      await expect(host.getByRole('link', { name: 'Unduh PNG', exact: true })).toBeVisible();
      await host.getByRole('button', { name: 'Foto ulang', exact: true }).click();
      await expect(host.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toHaveCount(
        0,
      );
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
}
