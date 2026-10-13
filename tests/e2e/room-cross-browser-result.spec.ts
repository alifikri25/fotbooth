import { test, expect, chromium, webkit, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

type FixturePage = Page;
const apiBase = process.env.FOTBOOTH_ROOM_TEST_API_URL ?? '';

async function prepare(page: FixturePage, role: 'host' | 'guest', forcedRelay: boolean) {
  // Keep a server-rendered test fixture stable while another local worker saves unrelated files.
  await page.route('**/@vite/client', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto('/tests/harness.html');
  await page.evaluate(async ({ role, forcedRelay }) => {
    if (forcedRelay) Object.defineProperty(window, 'RTCPeerConnection', { value: undefined });
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 400;
    const context = canvas.getContext('2d')!;
    context.fillStyle = role === 'host' ? '#ff0000' : '#0000ff';
    context.fillRect(120, 80, 160, 320);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
    (window as any).roomFixture = { ownPhoto: blob, photos: [], results: [], captures: [], errors: [], modes: [], statuses: [] };
  }, { role, forcedRelay });
}

for (const transport of ['direct', 'relay'] as const) {
  test(`one host-authored PNG reaches both downloads using ${transport}${transport === 'relay' ? ' across Chromium and WebKit' : ''}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Launches its own guest engine; Windows WebKit has no WebRTC.');
    test.setTimeout(60000);
    const guestBrowser = await (transport === 'relay' ? webkit : chromium).launch();
    const guest = await guestBrowser.newPage();
    try {
      await prepare(page, 'host', transport === 'relay');
      await prepare(guest, 'guest', transport === 'relay');
      const identity = await page.evaluate(async (apiBase) => {
        const { createRoom, RoomConnection } = await import('/src/core/room/client.ts');
        const created = await createRoom(apiBase, 'Host', { frameId: 'online-surat-rindu', scene: 'sunset', cutout: true });
        const fixture = (window as any).roomFixture;
        fixture.connection = new RoomConnection({ apiBase, roomId: created.roomId, token: created.hostToken, name: 'Host',
          onState: (state) => { fixture.state = state; }, onCapture: (capture) => fixture.captures.push(capture),
          onPhoto: (_id, photo) => fixture.photos.push(photo), onResult: (_id, result) => fixture.results.push(result),
          onRemoteStream() {}, onConnection: (status) => fixture.statuses.push(status), onMode: (mode) => fixture.modes.push(mode),
          onError: (message) => fixture.errors.push(message),
        });
        await fixture.connection.connect({ getTracks: () => [] } as unknown as MediaStream);
        return { roomId: created.roomId, guestToken: created.guestToken, apiBase };
      }, apiBase);
      await guest.evaluate(async (identity) => {
        const { RoomConnection } = await import('/src/core/room/client.ts');
        const fixture = (window as any).roomFixture;
        fixture.connection = new RoomConnection({ apiBase: identity.apiBase, roomId: identity.roomId, token: identity.guestToken, name: 'Guest',
          onState: (state) => { fixture.state = state; }, onCapture: (capture) => fixture.captures.push(capture),
          onPhoto: (_id, photo) => fixture.photos.push(photo), onResult: (_id, result) => fixture.results.push(result),
          onRemoteStream() {}, onConnection: (status) => fixture.statuses.push(status), onMode: (mode) => fixture.modes.push(mode),
          onError: (message) => fixture.errors.push(message),
        });
        await fixture.connection.connect({ getTracks: () => [] } as unknown as MediaStream);
      }, identity);
      await Promise.all([page, guest].map(async (participant) => {
        await expect.poll(() => participant.evaluate(() => (window as any).roomFixture.statuses.at(-1)), { timeout: 15000 }).toBe('connected');
      }));
      await expect.poll(() => page.evaluate(() => (window as any).roomFixture.modes.at(-1) ?? 'direct')).toBe(transport);
      // The pre-change implementation has no final-result transport; this is the regression gate.
      expect(await page.evaluate(() => typeof (window as any).roomFixture.connection.sendResult)).toBe('function');
      await Promise.all([page, guest].map((participant) => participant.evaluate(() => (window as any).roomFixture.connection.send({ type: 'ready', ready: true }))));
      await expect.poll(() => page.evaluate(() => (window as any).roomFixture.state.phase)).toBe('ready');
      await page.evaluate(() => (window as any).roomFixture.connection.send({ type: 'capture' }));
      await Promise.all([page, guest].map(async (participant) => {
        await expect.poll(() => participant.evaluate(() => (window as any).roomFixture.captures.length)).toBe(1);
        await participant.evaluate(async () => {
          const fixture = (window as any).roomFixture, capture = fixture.captures[0];
          await fixture.connection.sendPhoto(capture.captureId, fixture.ownPhoto);
          fixture.connection.send({ type: 'captured', captureId: capture.captureId });
        });
      }));
      await Promise.all([page, guest].map(async (participant) => {
        await expect.poll(() => participant.evaluate(() => (window as any).roomFixture.photos.length)).toBe(1);
      }));
      await page.evaluate(async () => {
        const { exportRoomFrame } = await import('/src/core/room/composition.ts');
        const { getRoomFrame } = await import('/src/core/room/frames.ts');
        const fixture = (window as any).roomFixture, capture = fixture.captures[0];
        fixture.result = await exportRoomFrame(fixture.ownPhoto, fixture.photos[0], getRoomFrame(capture.settings.frameId), capture.settings.scene);
        await fixture.connection.sendResult(capture.captureId, fixture.result);
      });
      await expect.poll(() => guest.evaluate(() => (window as any).roomFixture.results.length)).toBe(1);
      const downloads = [];
      for (const [participant, role] of [[page, 'host'], [guest, 'guest']] as const) {
        await participant.evaluate((role) => {
          const fixture = (window as any).roomFixture;
          const result = role === 'host' ? fixture.result : fixture.results[0];
          const link = document.createElement('a');
          link.href = URL.createObjectURL(result); link.download = 'room-result.png'; link.textContent = 'Download result';
          document.body.append(link);
        }, role);
        const downloaded = participant.waitForEvent('download');
        await participant.getByRole('link', { name: 'Download result' }).click();
        const download = await downloaded;
        downloads.push(await fs.readFile((await download.path())!));
        expect(await participant.evaluate(() => (window as any).roomFixture.errors)).toEqual([]);
      }
      expect(downloads[1]).toEqual(downloads[0]);
      expect(downloads[0].subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect([downloads[0].readUInt32BE(16), downloads[0].readUInt32BE(20)]).toEqual([1800, 1350]);
      const report = { testedAt: new Date().toISOString(), transport, hostEngine: 'chromium',
        guestEngine: transport === 'relay' ? 'webkit' : 'chromium', coordinator: apiBase || 'local Vite proxy',
        source: 'local imported production RoomConnection and exportRoomFrame modules',
        capture: 'pre-encoded transparent portrait PNGs; empty track providers; no physical camera',
        identicalDownloadBytes: true, bytes: downloads.map((value) => value.length),
        sha256: downloads.map((value) => createHash('sha256').update(value).digest('hex')),
        width: 1800, height: 1350,
        limitation: 'Windows Playwright WebKit lacks WebRTC and MediaStream; mixed-engine path uses the real room relay.' };
      const reportDirectory = process.env.FOTBOOTH_ROOM_RESULT_REPORT_DIR ?? 'docs/qa';
      await fs.mkdir(reportDirectory, { recursive: true });
      await fs.writeFile(`${reportDirectory}/online-room-canonical-${apiBase ? 'remote' : 'local'}-${transport}-verification.json`, JSON.stringify(report, null, 2));
    } finally {
      await Promise.allSettled([page, guest].map((participant) => participant.evaluate(() => (window as any).roomFixture?.connection?.close())));
      await guestBrowser.close();
    }
  });
}
