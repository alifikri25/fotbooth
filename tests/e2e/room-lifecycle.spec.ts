import { test, expect, type Page, type WebSocketRoute } from '@playwright/test';

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'These lifecycle checks use a real canvas captureStream.');
});

async function coloredCamera(page: Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#bce5c9';
      context.fillRect(0, 0, canvas.width, canvas.height);
      return canvas.captureStream(5);
    };
  });
}

async function createHostRoom(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Foto bareng online', exact: true }).click();
  await page.getByLabel('Nama kamu', { exact: true }).fill('Ali');
  await page.getByRole('button', { name: 'Buat room', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Room foto bareng', exact: true })).toBeVisible();
}

function firstRoomState(page: Page) {
  return new Promise<void>((resolve) => {
    page.on('websocket', (socket) => {
      if (!socket.url().includes('/socket?')) return;
      socket.on('framereceived', (frame) => {
        if (typeof frame.payload !== 'string') return;
        try {
          if (JSON.parse(frame.payload).type === 'state') resolve();
        } catch {
          /* Ignore unrelated websocket transport frames. */
        }
      });
    });
  });
}

test('host choices made before camera activation survive the initial room state', async ({
  page,
}) => {
  await coloredCamera(page);
  await createHostRoom(page);
  await page.getByLabel('Frame foto bareng', { exact: true }).selectOption('online-surat-rindu');
  await page.getByLabel('Latar bersama', { exact: true }).selectOption('sunset');
  await page.getByLabel('Pisahkan latar kamera', { exact: true }).uncheck();
  const stateReceived = firstRoomState(page);
  await page.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
  await stateReceived;
  await expect(page.getByLabel('Frame foto bareng', { exact: true })).toHaveValue(
    'online-surat-rindu',
  );
  await expect(page.getByLabel('Latar bersama', { exact: true })).toHaveValue('sunset');
  await expect(page.getByLabel('Pisahkan latar kamera', { exact: true })).not.toBeChecked();
});

test('a camera track ending clears its stream and offers camera activation again', async ({
  page,
}) => {
  await coloredCamera(page);
  await createHostRoom(page);
  const stateReceived = firstRoomState(page);
  await page.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
  await stateReceived;
  const camera = page.locator('video').first();
  const track = await camera.evaluateHandle(
    (video) => ((video as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0],
  );
  try {
    await track.evaluate((track) => track.dispatchEvent(new Event('ended')));
    await expect(page.getByRole('button', { name: 'Nyalakan kamera', exact: true })).toBeVisible();
    expect(await camera.evaluate((video) => (video as HTMLVideoElement).srcObject)).toBeNull();
    expect(await track.evaluate((track) => track.readyState)).toBe('ended');
    await expect(page.getByRole('alert')).toBeVisible();
  } finally {
    await track.dispose();
  }
});

test('opening another invitation while inside a room starts a fresh join screen', async ({
  page,
}) => {
  const oldHash = new URLSearchParams({ room: 'a'.repeat(32), key: 'A'.repeat(43) }).toString();
  const newHash = new URLSearchParams({ room: 'b'.repeat(32), key: 'B'.repeat(43) }).toString();
  await page.goto('/#' + oldHash);
  await page.getByLabel('Nama kamu', { exact: true }).fill('Rani');
  await page.getByRole('button', { name: 'Masuk room', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Room foto bareng', exact: true })).toBeVisible();
  await page.evaluate((hash) => {
    location.hash = hash;
  }, newHash);
  await expect(
    page.getByRole('heading', { name: 'Gabung foto bareng', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Masuk room', exact: true })).toBeVisible();
  await expect(page.getByLabel('Nama kamu', { exact: true })).toHaveValue('');
});

for (const closure of [
  {
    name: 'an unexpected server disconnect',
    code: 1001,
    reason: 'Server restarting',
    message: /terputus/i,
  },
  { name: 'room expiry', code: 4004, reason: 'Room expired', message: /kedaluwarsa/i },
]) {
  test(`${closure.name} stops the camera and offers recovery outside a capture`, async ({
    page,
  }) => {
    let roomSocket: WebSocketRoute | undefined;
    let connected = false;
    await page.routeWebSocket(/\/api\/rooms\/[^/]+\/socket\?/, (socket) => {
      roomSocket = socket;
      const server = socket.connectToServer();
      server.onMessage((message) => {
        socket.send(message);
        if (typeof message === 'string' && JSON.parse(message).type === 'state') connected = true;
      });
    });
    await coloredCamera(page);
    await createHostRoom(page);
    await page.getByLabel('Pisahkan latar kamera', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Matikan kamera', exact: true })).toBeVisible();
    await expect.poll(() => connected).toBe(true);
    const camera = page.locator('video').first();
    const track = await camera.evaluateHandle(
      (video) => ((video as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0],
    );
    try {
      await roomSocket!.close({ code: closure.code, reason: closure.reason });
      await expect(page.getByRole('alert')).toContainText(closure.message);
      await expect(
        page.getByRole('button', { name: 'Nyalakan kamera', exact: true }),
      ).toBeVisible();
      expect(await camera.evaluate((video) => (video as HTMLVideoElement).srcObject)).toBeNull();
      expect(await track.evaluate((track) => track.readyState)).toBe('ended');
      if (closure.code === 1001) {
        const firstSocket = roomSocket;
        connected = false;
        await page.getByRole('button', { name: 'Nyalakan kamera', exact: true }).click();
        await expect.poll(() => roomSocket !== firstSocket).toBe(true);
        await expect.poll(() => connected).toBe(true);
        await expect(
          page.getByRole('button', { name: 'Matikan kamera', exact: true }),
        ).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);
        expect(
          await camera.evaluate(
            (video) =>
              ((video as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0].readyState,
          ),
        ).toBe('live');
        await page.getByRole('button', { name: 'Matikan kamera', exact: true }).click();
        await expect(
          page.getByRole('button', { name: 'Nyalakan kamera', exact: true }),
        ).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);
      }
    } finally {
      await track.dispose();
    }
  });
}
