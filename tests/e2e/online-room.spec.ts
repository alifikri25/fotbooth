import { test, expect, type Page, type WebSocketRoute } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const site = process.env.FOTBOOTH_ROOM_TEST_URL ?? 'http://127.0.0.1:5173';

async function portraitCamera(page: Page, portrait: 'a' | 'b') {
  await page.addInitScript((portrait) => {
    navigator.mediaDevices.getUserMedia = async () => {
      const image = new Image();
      image.src = `/samples/signature-portrait-${portrait}.jpg`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const context = canvas.getContext('2d')!;
      const paint = () => {
        context.fillStyle = '#bce5c9';
        context.fillRect(0, 0, 800, 600);
        context.drawImage(image, 200, 20, 400, 580);
      };
      paint();
      const stream = canvas.captureStream(12);
      const timer = setInterval(paint, 80);
      for (const track of stream.getTracks()) {
        const stop = track.stop.bind(track);
        track.stop = () => {
          clearInterval(timer);
          stop();
        };
      }
      return stream;
    };
  }, portrait);
}

test('online entry explains invitation sharing before camera access', async ({ page }) => {
  await page.goto(site);
  await page.getByRole('button', { name: 'Foto bareng online', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Foto bareng, dari mana saja.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buat room', exact: true })).toBeVisible();
  await expect(
    page.getByText('Kamera dan foto dibagikan kepada orang yang masuk lewat undanganmu.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page
      .locator('video')
      .evaluateAll((videos) =>
        videos.some((video) => (video as HTMLVideoElement).srcObject !== null),
      ),
  ).toBe(false);
});

for (const transport of ['direct', 'relay'] as const) {
  test(`two people join, capture identical PNGs and retake using ${transport}`, async ({
    browser,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'The synthetic moving camera uses Chromium captureStream.',
    );
    test.setTimeout(150000);
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();
    try {
      // Model the guest's different browser rasterizer at the final-frame encoding boundary.
      // Portrait PNGs and preview canvases retain their real drawing/encoding behavior.
      await guest.addInitScript(() => {
        const encode = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
          if (this.width === 1800 && this.height === 1350) {
            const context = this.getContext('2d')!;
            context.fillStyle = '#ff00ff';
            context.fillRect(0, 0, 8, 8);
          }
          encode.call(this, callback, type, quality);
        };
      });
      let hostRoomSocket: WebSocketRoute | undefined;
      await host.routeWebSocket(/\/api\/rooms\/[^/]+\/socket\?/, (socket) => {
        hostRoomSocket = socket;
        socket.connectToServer();
      });
      if (transport === 'relay') {
        await Promise.all(
          [host, guest].map((page) =>
            page.addInitScript(() => {
              Object.defineProperty(window, 'RTCPeerConnection', { value: undefined });
            }),
          ),
        );
      }
      await portraitCamera(host, 'a');
      await portraitCamera(guest, 'b');
      await host.goto(site);
      await host.getByRole('button', { name: 'Foto bareng online', exact: true }).click();
      await host.getByLabel('Nama kamu', { exact: true }).fill('Ali');
      await host.getByRole('button', { name: 'Buat room', exact: true }).click();
      await expect(host.getByRole('heading', { name: 'Room foto bareng' })).toBeVisible();
      const invite = await host.getByLabel('Tautan undangan', { exact: true }).inputValue();
      expect(invite).toContain('#room=');
      expect(invite).not.toEqual(host.url());
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
      await expect(host.getByTestId('room-cutout-status')).toContainText('Latar bersama aktif', {
        timeout: 60000,
      });
      await expect(guest.getByTestId('room-cutout-status')).toContainText('Latar bersama aktif', {
        timeout: 60000,
      });
      const capturePair = async () => {
        await host.getByRole('button', { name: 'Aku siap', exact: true }).click();
        await guest.getByRole('button', { name: 'Aku siap', exact: true }).click();
        await expect(
          host.getByRole('main').getByRole('button', { name: 'Foto bareng', exact: true }),
        ).toBeEnabled();
        await host
          .getByRole('main')
          .getByRole('button', { name: 'Foto bareng', exact: true })
          .click();
        await expect(host.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toBeVisible(
          {
            timeout: 60000,
          },
        );
        await expect(
          guest.getByRole('img', { name: 'Hasil foto bareng', exact: true }),
        ).toBeVisible({
          timeout: 60000,
        });
      };
      await capturePair();
      const digest = async (page: Page) => {
        const pending = page.waitForEvent('download');
        await page.getByRole('link', { name: 'Unduh PNG', exact: true }).click();
        const file = await pending;
        expect(await file.failure()).toBeNull();
        const data = await fs.readFile((await file.path())!);
        return { bytes: data.byteLength, hash: createHash('sha256').update(data).digest('hex') };
      };
      const [a, b] = await Promise.all([digest(host), digest(guest)]);
      expect(a.bytes).toBeGreaterThan(10000);
      expect(a).toEqual(b);
      const download = host.waitForEvent('download');
      await host.getByRole('link', { name: 'Unduh PNG', exact: true }).click();
      await (await download).saveAs(`docs/qa/online-room-${transport}-result.png`);
      await expect(host.getByRole('link', { name: 'Unduh PNG', exact: true })).toBeVisible();
      await host.evaluate(() => window.scrollTo(0, 0));
      await host.screenshot({
        path: `docs/qa/online-room-${transport}-desktop.png`,
        fullPage: true,
      });
      await host.setViewportSize({ width: 390, height: 844 });
      await host.evaluate(() => window.scrollTo(0, 0));
      expect(await host.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
      await host.screenshot({
        path: `docs/qa/online-room-${transport}-mobile.png`,
        fullPage: true,
      });
      await host.getByRole('button', { name: 'Foto ulang', exact: true }).click();
      await expect(guest.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toHaveCount(
        0,
      );
      await expect(guest.getByRole('button', { name: 'Aku siap', exact: true })).toBeVisible();
      await capturePair();
      const offlineRetakePhoto = await digest(host);
      const offlineTrack = await host
        .locator('video')
        .first()
        .evaluateHandle(
          (video) => ((video as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0],
        );
      try {
        await offlineTrack.evaluate((track) => track.dispatchEvent(new Event('ended')));
        await expect(
          host.getByRole('button', { name: 'Nyalakan kamera', exact: true }),
        ).toBeVisible();
        expect(await digest(host)).toEqual(offlineRetakePhoto);
        await host.getByRole('button', { name: 'Foto ulang', exact: true }).click();
        await expect(host.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toHaveCount(
          0,
        );
        await expect(
          guest.getByRole('img', { name: 'Hasil foto bareng', exact: true }),
        ).toBeVisible();
        await host.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
        await expect(host.getByTestId('room-peer-status')).toContainText('Terhubung', {
          timeout: 45000,
        });
        await expect(
          guest.getByRole('img', { name: 'Hasil foto bareng', exact: true }),
        ).toHaveCount(0);
        await expect(guest.getByRole('button', { name: 'Aku siap', exact: true })).toBeVisible();
        await capturePair();
      } finally {
        await offlineTrack.dispose();
      }
      const retained = await digest(host);
      expect(await digest(guest)).toEqual(retained);
      await guest.getByRole('button', { name: 'Keluar room', exact: true }).click();
      await expect(host.getByTestId('room-peer-status')).toContainText('Menunggu');
      await expect(host.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toBeVisible();
      expect(await digest(host)).toEqual(retained);
      await guest.goto(invite);
      await guest.getByLabel('Nama kamu', { exact: true }).fill('Rani');
      await guest.getByRole('button', { name: 'Masuk room', exact: true }).click();
      await guest.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
      await expect(host.getByTestId('room-peer-status')).toContainText('Terhubung', {
        timeout: 45000,
      });
      await expect(host.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toBeVisible();
      expect(await digest(host)).toEqual(retained);
      const camera = host.locator('video').first();
      const completedTrack = await camera.evaluateHandle(
        (video) => ((video as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0],
      );
      try {
        await completedTrack.evaluate((track) => track.dispatchEvent(new Event('ended')));
        await expect(
          host.getByRole('button', { name: 'Nyalakan kamera', exact: true }),
        ).toBeVisible();
        expect(await camera.evaluate((video) => (video as HTMLVideoElement).srcObject)).toBeNull();
        expect(await completedTrack.evaluate((track) => track.readyState)).toBe('ended');
        await expect(
          host.getByRole('img', { name: 'Hasil foto bareng', exact: true }),
        ).toBeVisible();
        expect(await digest(host)).toEqual(retained);
      } finally {
        await completedTrack.dispose();
      }
      await host.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
      await expect(host.getByTestId('room-peer-status')).toContainText('Terhubung', {
        timeout: 45000,
      });
      expect(await digest(host)).toEqual(retained);
      await hostRoomSocket!.close({ code: 1001, reason: 'Server restarting' });
      await expect(host.getByRole('alert')).toContainText(/terputus/i);
      await expect(
        host.getByRole('button', { name: 'Nyalakan kamera', exact: true }),
      ).toBeVisible();
      await expect(host.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toBeVisible();
      expect(await digest(host)).toEqual(retained);
      const remainingDownload = host.waitForEvent('download');
      await host.getByRole('link', { name: 'Unduh PNG', exact: true }).click();
      expect(await (await remainingDownload).failure()).toBeNull();
      await host.getByRole('button', { name: 'Foto ulang', exact: true }).click();
      await expect(host.getByRole('img', { name: 'Hasil foto bareng', exact: true })).toHaveCount(
        0,
      );
      await fs.writeFile(
        `docs/qa/online-room-${transport}-verification.json`,
        JSON.stringify(
          {
            verifiedAt: new Date().toISOString(),
            site,
            transport,
            syntheticCameras: true,
            result: a,
            identicalResult: true,
            mobileWidth: 390,
            retake: true,
            offlineRetakeAndRecapture: true,
            disconnect: true,
            downloadAfterPartnerLeft: true,
            resultAfterPartnerRejoined: true,
            downloadAfterCameraEnded: true,
            downloadAfterServerDisconnected: true,
          },
          null,
          2,
        ),
      );
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
}
