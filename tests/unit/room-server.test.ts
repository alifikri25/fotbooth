import { describe, expect, it } from 'vitest';
import {
  RoomCoordinator,
  createRoomRecord,
  parseRoomMessage,
  isAllowedOrigin,
  getIceConfiguration,
  PhotoRoom,
} from '../../worker/rooms';
import type { RoomRecord } from '../../worker/rooms';
import worker from '../../worker/rooms';
import type { RoomSettings } from '../../src/core/room/protocol';

const settings: RoomSettings = { frameId: 'online-satu-tempat', scene: 'studio', cutout: true };

function room() {
  let time = 1000;
  const record = createRoomRecord({ name: 'Ali', settings }, time);
  const coordinator = new RoomCoordinator(record, () => time);
  return { coordinator, record, setTime: (next: number) => { time = next; } };
}

function pair() {
  const fixture = room();
  fixture.coordinator.connect(fixture.record.hostToken, 'host-device', 'Ali');
  fixture.coordinator.connect(fixture.record.guestToken, 'guest-device', 'Aya');
  return fixture;
}

describe('private photo room coordinator', () => {
  it('creates separate unpredictable role tokens and an expiry one hour later', () => {
    const a = createRoomRecord({ name: 'Ali', settings }, 1000);
    const b = createRoomRecord({ name: 'Ali', settings }, 1000);
    expect(a.hostToken.length).toBeGreaterThanOrEqual(40);
    expect(a.guestToken).not.toBe(a.hostToken);
    expect(b.guestToken).not.toBe(a.guestToken);
    expect(a.expiresAt).toBe(3601000);
  });

  it('refuses unauthorized invitations without adding a participant', () => {
    const { coordinator } = room();
    expect(() => coordinator.connect('wrong-token', 'stranger', 'Bad')).toThrow('Invitation');
    expect(coordinator.state('host').participants).toEqual([]);
  });

  it('refuses a third browser using an occupied guest invitation', () => {
    const { coordinator, record } = pair();
    expect(() => coordinator.connect(record.guestToken, 'third-device', 'Third')).toThrow('occupied');
    expect(coordinator.state('host').participants.map(p => p.name)).toEqual(['Ali', 'Aya']);
  });

  it('allows the same client to reconnect and clears readiness', () => {
    const { coordinator, record } = pair();
    coordinator.handle('host', { type: 'ready', ready: true });
    coordinator.handle('guest', { type: 'ready', ready: true });
    const joined = coordinator.connect(record.guestToken, 'guest-device', 'Aya');
    expect(joined.replaced).toBe(true);
    expect(coordinator.state('host').phase).toBe('waiting');
    expect(coordinator.state('guest').participants.every(p => !p.ready)).toBe(true);
  });

  it('accepts a replacement guest after the old browser disconnects', () => {
    const { coordinator, record } = pair();
    coordinator.disconnect('guest', 'guest-device');
    coordinator.connect(record.guestToken, 'new-device', 'Bela');
    expect(coordinator.state('host').participants.find(p => p.role === 'guest')?.name).toBe('Bela');
  });

  it('permits only the host to change the shared scene and resets readiness', () => {
    const { coordinator } = pair();
    coordinator.handle('guest', { type: 'ready', ready: true });
    expect(() => coordinator.handle('guest', { type: 'settings', settings: { ...settings, scene: 'night' } })).toThrow('host');
    coordinator.handle('host', { type: 'settings', settings: { ...settings, scene: 'night' } });
    expect(coordinator.state('guest').settings.scene).toBe('night');
    expect(coordinator.state('guest').participants.every(p => !p.ready)).toBe(true);
  });

  it('gates capture on both participants being connected and ready', () => {
    const { coordinator } = pair();
    expect(() => coordinator.handle('host', { type: 'capture' })).toThrow('ready');
    coordinator.handle('host', { type: 'ready', ready: true });
    expect(() => coordinator.handle('host', { type: 'capture' })).toThrow('ready');
    coordinator.handle('guest', { type: 'ready', ready: true });
    expect(coordinator.state('host').phase).toBe('ready');
    const events = coordinator.handle('host', { type: 'capture' });
    expect(events[0]).toMatchObject({ to: 'all', message: { type: 'capture', at: 5000, settings } });
    expect(coordinator.state('guest').phase).toBe('countdown');
    expect(coordinator.state('guest').capture?.at).toBe(5000);
  });

  it('requires a host capture and refuses duplicate capture commands', () => {
    const { coordinator } = pair();
    coordinator.handle('host', { type: 'ready', ready: true });
    coordinator.handle('guest', { type: 'ready', ready: true });
    expect(() => coordinator.handle('guest', { type: 'capture' })).toThrow('host');
    coordinator.handle('host', { type: 'capture' });
    const id = coordinator.state('host').capture?.id;
    expect(() => coordinator.handle('host', { type: 'capture' })).toThrow('progress');
    expect(coordinator.state('host').capture?.id).toBe(id);
  });

  it('finishes only when both acknowledge the current capture', () => {
    const { coordinator } = pair();
    coordinator.handle('host', { type: 'ready', ready: true });
    coordinator.handle('guest', { type: 'ready', ready: true });
    coordinator.handle('host', { type: 'capture' });
    const captureId = coordinator.state('host').capture!.id;
    expect(() => coordinator.handle('guest', { type: 'captured', captureId: 'stale' })).toThrow('capture');
    coordinator.handle('host', { type: 'captured', captureId });
    expect(coordinator.state('guest').phase).toBe('countdown');
    coordinator.handle('guest', { type: 'captured', captureId });
    expect(coordinator.state('host').phase).toBe('result');
  });

  it('retake clears capture identity and readiness before another photo', () => {
    const { coordinator } = pair();
    coordinator.handle('host', { type: 'ready', ready: true });
    coordinator.handle('guest', { type: 'ready', ready: true });
    coordinator.handle('host', { type: 'capture' });
    const oldId = coordinator.state('host').capture!.id;
    coordinator.handle('guest', { type: 'retake' });
    expect(coordinator.state('host').capture).toBeUndefined();
    expect(coordinator.state('host').participants.every(p => !p.ready)).toBe(true);
    expect(() => coordinator.handle('host', { type: 'captured', captureId: oldId })).toThrow('capture');
  });

  it('revoking readiness during countdown cancels the capture for both participants', () => {
    const { coordinator } = pair();
    coordinator.handle('host', { type: 'ready', ready: true });
    coordinator.handle('guest', { type: 'ready', ready: true });
    coordinator.handle('host', { type: 'capture' });
    const oldId = coordinator.state('host').capture!.id;
    coordinator.handle('guest', { type: 'ready', ready: false });
    expect(coordinator.state('host').phase).toBe('waiting');
    expect(coordinator.state('host').capture).toBeUndefined();
    expect(coordinator.state('guest').participants.every(p => !p.ready)).toBe(true);
    expect(() => coordinator.handle('host', { type: 'captured', captureId: oldId })).toThrow('capture');
  });

  it('disconnect invalidates a coordinated capture and ignores an old replaced client', () => {
    const { coordinator, record } = pair();
    coordinator.handle('host', { type: 'ready', ready: true });
    coordinator.handle('guest', { type: 'ready', ready: true });
    coordinator.handle('host', { type: 'capture' });
    coordinator.disconnect('guest', 'guest-device');
    expect(coordinator.state('host').capture).toBeUndefined();
    expect(coordinator.state('host').phase).toBe('waiting');
    coordinator.connect(record.guestToken, 'new-device', 'Bela');
    coordinator.disconnect('guest', 'guest-device');
    expect(coordinator.state('host').participants.find(p => p.role === 'guest')?.connected).toBe(true);
  });

  it('relays signaling only to the other invited participant', () => {
    const { coordinator } = pair();
    const data = { description: { type: 'offer' as const, sdp: 'v=0\r\n' } };
    expect(coordinator.handle('host', { type: 'signal', data })).toEqual([
      { to: 'guest', message: { type: 'signal', from: 'host', data } },
    ]);
  });

  it('returns the authoritative clock for coordinated countdown', () => {
    const { coordinator, setTime } = pair();
    setTime(12345);
    expect(coordinator.handle('guest', { type: 'ping', clientTime: 9000 })).toEqual([
      { to: 'guest', message: { type: 'pong', clientTime: 9000, serverTime: 12345 } },
    ]);
  });

  it('relays bounded fallback data without persisting images in room metadata', () => {
    const { coordinator } = pair();
    const before = JSON.stringify(coordinator.record);
    expect(coordinator.handle('guest', { type: 'relay', data: '{"preview":"opaque-photo-data"}' })).toEqual([
      { to: 'host', message: { type: 'relay', from: 'guest', data: '{"preview":"opaque-photo-data"}' } },
    ]);
    expect(JSON.stringify(coordinator.record)).toBe(before);
    expect(() => parseRoomMessage(JSON.stringify({ type: 'relay', data: 'x'.repeat(24577) }))).toThrow();
  });

  it('limits relay bursts by sender and permits the next second of messages', () => {
    const { coordinator, setTime } = pair();
    for (let i = 0; i < 100; i++) coordinator.handle('host', { type: 'relay', data: 'chunk' });
    expect(() => coordinator.handle('host', { type: 'relay', data: 'chunk' })).toThrow('limit');
    expect(coordinator.handle('guest', { type: 'relay', data: 'chunk' })[0]?.to).toBe('host');
    setTime(2000);
    expect(coordinator.handle('host', { type: 'relay', data: 'chunk' })[0]?.to).toBe('guest');
  });

  it('expires membership and messages at the one-hour boundary', () => {
    const { coordinator, record, setTime } = pair();
    setTime(record.expiresAt);
    expect(() => coordinator.connect(record.hostToken, 'host-device', 'Ali')).toThrow('expired');
    expect(() => coordinator.handle('guest', { type: 'ping', clientTime: 0 })).toThrow('expired');
  });

  it('bounds ICE credential requests independently for each invited role', () => {
    const { coordinator, record, setTime } = pair();
    for (let i = 0; i < 20; i++) coordinator.authorizeIce(record.hostToken);
    expect(() => coordinator.authorizeIce(record.hostToken)).toThrow('limit');
    expect(coordinator.authorizeIce(record.guestToken)).toBe('guest');
    setTime(61000);
    expect(coordinator.authorizeIce(record.hostToken)).toBe('host');
  });

  it('preserves the ICE request limit when the room hibernates', () => {
    const { coordinator, record } = pair();
    for (let i = 0; i < 20; i++) coordinator.authorizeIce(record.hostToken);
    const restored = new RoomCoordinator(JSON.parse(JSON.stringify(coordinator.record)), () => 2000);
    expect(() => restored.authorizeIce(record.hostToken)).toThrow('limit');
  });

  it('restores a stored capture while preserving each role and acknowledgements', () => {
    const { coordinator } = pair();
    coordinator.handle('host', { type: 'ready', ready: true });
    coordinator.handle('guest', { type: 'ready', ready: true });
    coordinator.handle('host', { type: 'capture' });
    const captureId = coordinator.state('host').capture!.id;
    coordinator.handle('host', { type: 'captured', captureId });
    const restored = new RoomCoordinator(JSON.parse(JSON.stringify(coordinator.record)), () => 2000);
    restored.handle('guest', { type: 'captured', captureId });
    expect(restored.state('guest')).toMatchObject({ self: 'guest', phase: 'result', capture: { id: captureId } });
    expect(JSON.stringify(restored.state('guest'))).not.toContain(coordinator.record.hostToken);
  });

  it('releases disconnected slots after reconstruction when no actual socket survived', async () => {
    const { coordinator, record } = pair();
    coordinator.handle('host', { type: 'ready', ready: true });
    coordinator.handle('guest', { type: 'ready', ready: true });
    coordinator.handle('host', { type: 'capture' });
    let stored = JSON.parse(JSON.stringify(coordinator.record)) as RoomRecord;
    let initialized: Promise<unknown> = Promise.resolve();
    new PhotoRoom({
      storage: {
        get: async <T>() => stored as T,
        put: async (_key, value) => { stored = value as RoomRecord; },
        setAlarm: async () => {},
        deleteAll: async () => {},
      },
      getWebSockets: () => [],
      acceptWebSocket: () => {},
      blockConcurrencyWhile: callback => { const promise = callback(); initialized = promise; return promise; },
    });
    await initialized;
    expect(stored.participants.host?.connected).toBe(false);
    expect(stored.participants.guest?.connected).toBe(false);
    expect(stored.capture).toBeUndefined();
    const restored = new RoomCoordinator(stored, () => 2000);
    expect(restored.connect(record.guestToken, 'replacement-device', 'Bela').role).toBe('guest');
  });
});

describe('room input boundaries', () => {
  it('rejects oversized, binary, malformed and invalid command payloads', () => {
    for (const input of [new ArrayBuffer(8), '{', JSON.stringify({ type: 'ready', ready: 'yes' }), JSON.stringify({ type: 'signal', data: { description: { type: 'offer', sdp: 'x'.repeat(70000) } } })]) {
      expect(() => parseRoomMessage(input)).toThrow();
    }
    expect(parseRoomMessage('{"type":"ready","ready":true}')).toEqual({ type: 'ready', ready: true });
    expect(() => createRoomRecord({ name: 'Ali', settings: { ...settings, scene: 'unknown' } }, 0)).toThrow();
  });

  it('allows only the production and preview sites and explicit localhost development', () => {
    expect(isAllowedOrigin('https://fotbooth.pages.dev')).toBe(true);
    expect(isAllowedOrigin('https://a13abc.fotbooth.pages.dev')).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:5173')).toBe(true);
    expect(isAllowedOrigin('http://localhost:4173')).toBe(true);
    for (const origin of [null, 'null', 'https://fotbooth.pages.dev.evil.test', 'https://evil.test', 'http://fotbooth.pages.dev', 'https://fotbooth.pages.dev:444', 'https://preview.fotbooth.pages.dev:444', 'http://127.0.0.2:5173']) {
      expect(isAllowedOrigin(origin)).toBe(false);
    }
  });

  it('clearly reports STUN-only connectivity when relay secrets are absent', async () => {
    const response = await getIceConfiguration({});
    expect(response.relayAvailable).toBe(false);
    expect(response.iceServers).toEqual([{ urls: 'stun:stun.cloudflare.com:3478' }]);
  });

  it('requires a valid invitation for ICE even without paid TURN credentials', async () => {
    const response = await worker.fetch(new Request('https://rooms.example/api/ice?roomId=11111111-1111-1111-1111-111111111111&token=invalid', { headers: { Origin: 'https://fotbooth.pages.dev' } }), {
      ROOMS: { idFromName: name => name, get: () => ({ fetch: async () => new Response('{"error":"invalid_invitation","message":"Undangan room tidak valid."}', { status: 401 }) }) },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: 'invalid_invitation' });
  });

  it('authenticates a same-origin browser ICE request forwarded by the local site proxy', async () => {
    const env = {
      ROOMS: { idFromName: (name: string) => name, get: () => ({ fetch: async () => new Response('{"valid":true}') }) },
    };
    const response = await worker.fetch(new Request('http://127.0.0.1:8787/api/ice?roomId=11111111-1111-1111-1111-111111111111&token=invited', {
      headers: { 'Sec-Fetch-Site': 'same-origin', Referer: 'http://127.0.0.1:5173/?room=invite' },
    }), env);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:5173');
    expect(await response.json()).toMatchObject({ relayAvailable: false });
  });

  it('does not bypass origin checks for cross-site, untrusted, absent or explicit-null origins', async () => {
    const env = {
      ROOMS: { idFromName: (name: string) => name, get: () => ({ fetch: async () => new Response('{"valid":true}') }) },
    };
    const url = 'http://127.0.0.1:8787/api/ice?roomId=11111111-1111-1111-1111-111111111111&token=invited';
    const headerCases: HeadersInit[] = [
      { 'Sec-Fetch-Site': 'cross-site', Referer: 'http://127.0.0.1:5173/' },
      { 'Sec-Fetch-Site': 'same-origin', Referer: 'https://evil.test/' },
      { 'Sec-Fetch-Site': 'same-origin' },
      { Referer: 'http://127.0.0.1:5173/' },
      { Origin: 'null', 'Sec-Fetch-Site': 'same-origin', Referer: 'http://127.0.0.1:5173/' },
    ];
    for (const headers of headerCases) {
      expect((await worker.fetch(new Request(url, { headers }), env)).status).toBe(403);
    }
    expect((await worker.fetch(new Request('http://127.0.0.1:8787/api/rooms', {
      method: 'POST', headers: { 'Sec-Fetch-Site': 'same-origin', Referer: 'http://127.0.0.1:5173/' }, body: '{}',
    }), env)).status).toBe(403);
  });
});
