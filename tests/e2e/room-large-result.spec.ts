import { test, expect, chromium, webkit, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const apiBase = process.env.FOTBOOTH_ROOM_TEST_API_URL ?? '';

async function prepare(page: Page, forcedRelay: boolean) {
  await page.route('**/@vite/client', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto('/tests/harness.html');
  await page.evaluate(async (forcedRelay) => {
    if (forcedRelay) Object.defineProperty(window, 'RTCPeerConnection', { value: undefined });
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const context = canvas.getContext('2d')!, pixels = context.createImageData(1280, 720);
    let seed = 12345;
    const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed >>> 24; };
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      pixels.data[offset] = next(); pixels.data[offset + 1] = next(); pixels.data[offset + 2] = next(); pixels.data[offset + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    const ownPhoto = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
    (window as any).largeRoom = { ownPhoto, photos: [], results: [], captures: [], errors: [], modes: [], statuses: [] };
  }, forcedRelay);
}

for (const transport of ['direct', 'relay'] as const) {
  test(`high-detail catalog PNG above 8 MiB reaches an identical download over ${transport}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Creates a separate guest engine; the relay guest runs WebKit.');
    test.setTimeout(150000);
    const guestBrowser = await (transport === 'relay' ? webkit : chromium).launch();
    const guest = await guestBrowser.newPage();
    try {
      await Promise.all([prepare(page, transport === 'relay'), prepare(guest, transport === 'relay')]);
      const identity = await page.evaluate(async (apiBase) => {
        const { createRoom, RoomConnection } = await import('/src/core/room/client.ts');
        const { getRoomFrame } = await import('/src/core/room/frames.ts');
        const frame = getRoomFrame('kpop-starlight-wander');
        const created = await createRoom(apiBase, 'Host', { frameId: frame.id, scene: 'studio', cutout: false });
        const fixture = (window as any).largeRoom;
        fixture.connection = new RoomConnection({ apiBase, roomId: created.roomId, token: created.hostToken, name: 'Host',
          onState: (state) => { fixture.state = state; }, onCapture: (capture) => fixture.captures.push(capture),
          onPhoto: (_id, photo) => fixture.photos.push(photo), onResult: (_id, result) => fixture.results.push(result),
          onRemoteStream() {}, onConnection: (status) => fixture.statuses.push(status), onMode: (mode) => fixture.modes.push(mode),
          onError: (message) => fixture.errors.push(message),
        });
        await fixture.connection.connect({ getTracks: () => [] } as unknown as MediaStream);
        return { roomId: created.roomId, guestToken: created.guestToken, apiBase, poses: frame.slots.length };
      }, apiBase);
      await guest.evaluate(async (identity) => {
        const { RoomConnection } = await import('/src/core/room/client.ts');
        const fixture = (window as any).largeRoom;
        fixture.connection = new RoomConnection({ apiBase: identity.apiBase, roomId: identity.roomId, token: identity.guestToken, name: 'Guest',
          onState: (state) => { fixture.state = state; }, onCapture: (capture) => fixture.captures.push(capture),
          onPhoto: (_id, photo) => fixture.photos.push(photo), onResult: (_id, result) => fixture.results.push(result),
          onRemoteStream() {}, onConnection: (status) => fixture.statuses.push(status), onMode: (mode) => fixture.modes.push(mode),
          onError: (message) => fixture.errors.push(message),
        });
        await fixture.connection.connect({ getTracks: () => [] } as unknown as MediaStream);
      }, identity);
      for (const participant of [page, guest]) {
        await expect.poll(() => participant.evaluate(() => (window as any).largeRoom.statuses.at(-1)), { timeout: 15000 }).toBe('connected');
        expect(await participant.evaluate(() => (window as any).largeRoom.ownPhoto.size)).toBeLessThanOrEqual(8 * 1024 * 1024);
      }
      await expect.poll(() => page.evaluate(() => (window as any).largeRoom.modes.at(-1) ?? 'direct')).toBe(transport);
      await Promise.all([page, guest].map((participant) => participant.evaluate(() => (window as any).largeRoom.connection.send({ type: 'ready', ready: true }))));
      await expect.poll(() => page.evaluate(() => (window as any).largeRoom.state.phase)).toBe('ready');
      await page.evaluate(() => (window as any).largeRoom.connection.send({ type: 'capture' }));
      for (let index = 0; index < identity.poses; index++) {
        await Promise.all([page, guest].map(async (participant) => {
          await expect.poll(() => participant.evaluate(() => (window as any).largeRoom.captures.length)).toBe(index + 1);
        }));
        const sharedCapture = await Promise.all([page, guest].map((participant) => participant.evaluate((index) => (window as any).largeRoom.captures[index], index)));
        expect(sharedCapture[1]).toEqual(sharedCapture[0]);
        await Promise.all([page, guest].map(async (participant) => {
          await participant.evaluate(async (index) => {
            const fixture = (window as any).largeRoom;
            // Match the UI: both have accepted this capture, and originals leave only at its shared shutter.
            await new Promise((resolve) => setTimeout(resolve, Math.max(0, fixture.captures[index].at - fixture.connection.serverNow())));
            await fixture.connection.sendPhoto(fixture.captures[index].captureId, fixture.ownPhoto);
          }, index);
        }));
        await Promise.all([page, guest].map(async (participant) => {
          const originalBudgetRemaining = await participant.evaluate((index) => {
            const fixture = (window as any).largeRoom;
            return Math.max(1, fixture.captures[index].at + 45000 - fixture.connection.serverNow());
          }, index);
          await expect.poll(() => participant.evaluate(() => {
            const fixture = (window as any).largeRoom;
            return { receivedOriginals: fixture.photos.length, errors: fixture.errors };
          }), { timeout: originalBudgetRemaining }).toEqual({ receivedOriginals: index + 1, errors: [] });
          await participant.evaluate((index) => {
            const fixture = (window as any).largeRoom;
            fixture.connection.send({ type: 'captured', captureId: fixture.captures[index].captureId });
          }, index);
        }));
        await expect.poll(() => page.evaluate(() => (window as any).largeRoom.state.phase)).toBe('result');
        if (index + 1 < identity.poses) await page.evaluate((index) => {
          const fixture = (window as any).largeRoom;
          fixture.connection.send({ type: 'advance', captureId: fixture.captures[index].captureId });
        }, index);
      }
      const details = await page.evaluate(async () => {
        const { exportRoomSequence } = await import('/src/core/room/composition.ts');
        const { getRoomFrame } = await import('/src/core/room/frames.ts');
        const fixture = (window as any).largeRoom, frame = getRoomFrame('kpop-starlight-wander');
        fixture.result = await exportRoomSequence(fixture.photos.map((guest: Blob) => ({ host: fixture.ownPhoto, guest })), frame, 'studio');
        return { resultBytes: fixture.result.size, originalBytes: fixture.ownPhoto.size, poses: fixture.photos.length };
      });
      expect(details.resultBytes).toBeGreaterThan(8 * 1024 * 1024);
      expect(details.resultBytes).toBeLessThanOrEqual(20 * 1024 * 1024);
      const started = Date.now();
      await page.evaluate(async () => {
        const fixture = (window as any).largeRoom;
        await fixture.connection.sendResult(fixture.captures.at(-1).captureId, fixture.result);
      });
      await expect.poll(() => guest.evaluate(() => (window as any).largeRoom.results.length), { timeout: 60000 }).toBe(1);
      const transferMs = Date.now() - started;
      const finalModes = await Promise.all([page, guest].map((participant) => participant.evaluate(() => (window as any).largeRoom.modes.at(-1) ?? 'direct')));
      expect(finalModes).toEqual([transport, transport]);
      const downloads = [];
      for (const [participant, role] of [[page, 'host'], [guest, 'guest']] as const) {
        await participant.evaluate((role) => {
          const fixture = (window as any).largeRoom, blob = role === 'host' ? fixture.result : fixture.results[0];
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob); link.download = 'detailed-room.png'; link.textContent = 'Download detailed result'; document.body.append(link);
        }, role);
        const downloadEvent = participant.waitForEvent('download');
        await participant.getByRole('link', { name: 'Download detailed result' }).click();
        downloads.push(await fs.readFile((await (await downloadEvent).path())!));
        expect(await participant.evaluate(() => (window as any).largeRoom.errors)).toEqual([]);
      }
      expect(downloads[0].length).toBe(details.resultBytes);
      expect(downloads[1]).toEqual(downloads[0]);
      expect([downloads[0].readUInt32BE(16), downloads[0].readUInt32BE(20)]).toEqual([1200, 3600]);
      const report = { testedAt: new Date().toISOString(), transport, coordinator: apiBase || 'local Vite proxy',
        frameId: 'kpop-starlight-wander', hostEngine: 'chromium', guestEngine: transport === 'relay' ? 'webkit' : 'chromium',
        fixture: 'deterministic opaque RGB1280×720 PNG portraits, seed12345; pre-encoded snapshots, no physical camera',
        bothParticipantsAcceptSameCaptureBeforeSending: true, sharedShutterHonored: true,
        originalReceiptWithin45sOfShutter: true, finalModes,
        ...details, transferMs, identicalDownloadBytes: true,
        sha256: downloads.map((bytes) => createHash('sha256').update(bytes).digest('hex')), width: 1200, height: 3600 };
      const reportDirectory = process.env.FOTBOOTH_ROOM_RESULT_REPORT_DIR ?? 'docs/qa';
      await fs.mkdir(reportDirectory, { recursive: true });
      await fs.writeFile(`${reportDirectory}/online-room-large-result-${apiBase ? 'remote' : 'local'}-${transport}-verification.json`, JSON.stringify(report, null, 2));
    } finally {
      const diagnostics = await Promise.allSettled([page, guest].map((participant) => participant.evaluate(() => {
        const fixture = (window as any).largeRoom;
        if (!fixture) return null;
        const connection = fixture.connection, transfer = connection?.relayAssembler?.transfer;
        return { role: fixture.state?.self, receivedPhotos: fixture.photos.length,
          captureIds: fixture.captures.map((capture: any) => capture.captureId), stateCaptureId: fixture.state?.capture?.id,
          activeCaptureId: connection?.captureId, assemblerCaptureId: connection?.relayAssembler?.captureId,
          pendingTransfer: transfer ? { id: transfer.id, bytes: transfer.bytes.length, offset: transfer.offset } : null,
          receivedCaptureId: connection?.receivedCaptureId, relayCaptureId: connection?.relayCaptureId,
          transportGeneration: connection?.generation, transferGeneration: connection?.transferGeneration,
          directPeerState: connection?.peer?.connectionState, directChannelState: connection?.channel?.readyState, phase: fixture.state?.phase,
          errors: fixture.errors, statuses: fixture.statuses, modes: fixture.modes, socketReadyState: connection?.socket?.readyState };
      })));
      await test.info().attach('high-detail-transfer-state', { body: JSON.stringify(diagnostics, null, 2), contentType: 'application/json' });
      await Promise.allSettled([page, guest].map((participant) => participant.evaluate(() => (window as any).largeRoom?.connection?.close())));
      await guestBrowser.close();
    }
  });
}
