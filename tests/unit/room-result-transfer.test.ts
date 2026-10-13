import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomConnection, SnapshotAssembler } from '../../src/core/room/client';
import { createHash } from 'node:crypto';

const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCt8AAAAASUVORK5CYII=', 'base64'));
const resultTransfer = '17f2ff33-69f9-46da-bbcd-a8a0a537911e';
const portraitTransfer = 'ebf2ff33-69f9-46da-bbcd-a8a0a537911e';
const captureId = 'capture-1';
const meta = (overrides = {}) => ({ type: 'result-start', transferId: resultTransfer, captureId, totalBytes: png.length, mime: 'image/png', ...overrides });
function packet(bytes = png, offset = 0, transferId = resultTransfer, prefix = 'FR01') {
  const value = new Uint8Array(44 + bytes.length);
  value.set(new TextEncoder().encode(prefix + transferId));
  new DataView(value.buffer).setUint32(40, offset);
  value.set(bytes, 44);
  return value.buffer;
}
function resultAssembler() {
  const receiver = new (SnapshotAssembler as any)('result');
  receiver.setCapture(captureId);
  return receiver;
}

function commentedPng(totalBytes: number) {
  const chunkLength = totalBytes - png.length - 12;
  const chunk = new Uint8Array(chunkLength + 12);
  new DataView(chunk.buffer).setUint32(0, chunkLength);
  chunk.set(new TextEncoder().encode('tEXt'), 4);
  chunk.fill(97, 8, chunk.length - 4);
  chunk.set(new TextEncoder().encode('Comment\0'), 8);
  let crc = 0xffffffff;
  for (const byte of chunk.subarray(4, -4)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  new DataView(chunk.buffer).setUint32(chunk.length - 4, (crc ^ 0xffffffff) >>> 0);
  const result = new Uint8Array(totalBytes), end = png.length - 12;
  result.set(png.subarray(0, end)); result.set(chunk, end); result.set(png.subarray(end), end + chunk.length);
  return result;
}

describe('bounded final room result', () => {
  it('preserves the host-authored result PNG bytes', async () => {
    const receiver = resultAssembler();
    expect(receiver.begin(meta())).toBe(true);
    expect(receiver.push(packet(png.slice(0, 30)))).toBeNull();
    const blob = receiver.push(packet(png.slice(30), 30));
    expect(blob?.type).toBe('image/png');
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(png);
  });

  it('keeps result metadata and packets separate from an in-progress portrait', () => {
    const portrait = new SnapshotAssembler();
    portrait.setCapture(captureId);
    portrait.begin(meta({ type: 'photo-start', transferId: portraitTransfer }));
    portrait.push(packet(png.slice(0, 30), 0, portraitTransfer, 'FP01'));
    expect(() => portrait.begin(meta())).toThrow();
    // The connection routes purpose before begin; a result packet must never be accepted as a portrait.
    portrait.begin(meta({ type: 'photo-start', transferId: portraitTransfer }));
    expect(() => portrait.push(packet(png, 0, portraitTransfer))).toThrow();
    const result = resultAssembler();
    expect(() => result.begin(meta({ type: 'photo-start' }))).toThrow();
    result.begin(meta());
    expect(() => result.push(packet(png, 0, resultTransfer, 'FP01'))).toThrow();
  });

  it('rejects oversized, reordered and non-PNG final results', () => {
    const receiver = resultAssembler();
    for (const overrides of [{ totalBytes: 20 * 1024 * 1024 + 1 }, { totalBytes: 1.5 }, { mime: 'image/jpeg' }])
      expect(() => receiver.begin(meta(overrides))).toThrow();
    receiver.begin(meta());
    expect(() => receiver.push(packet(new Uint8Array(16384)))).toThrow();
    receiver.begin(meta());
    expect(() => receiver.push(packet(png, 1))).toThrow();
    receiver.begin(meta());
    expect(() => receiver.push(packet(new Uint8Array(png.length)))).toThrow(/PNG/i);
  });

  it('allows a final PNG up to 20 MiB while originals stay bounded at 8 MiB', () => {
    const result = resultAssembler(), original = new SnapshotAssembler();
    original.setCapture(captureId);
    expect(result.begin(meta({ totalBytes: 20 * 1024 * 1024 }))).toBe(true);
    expect(() => result.begin(meta({ totalBytes: 20 * 1024 * 1024 + 1 }))).toThrow();
    expect(original.begin(meta({ type: 'photo-start', totalBytes: 8 * 1024 * 1024 }))).toBe(true);
    expect(() => original.begin(meta({ type: 'photo-start', totalBytes: 8 * 1024 * 1024 + 1 }))).toThrow();
  });

  it('discards a partial final result when a newer capture begins', () => {
    const receiver = resultAssembler();
    receiver.begin(meta());
    receiver.push(packet(png.slice(0, 30)));
    receiver.setCapture('capture-2');
    expect(receiver.push(packet(png.slice(30), 30))).toBeNull();
    expect(receiver.begin(meta())).toBe(false);
  });

  it.each(['photo', 'result'] as const)('a stale %s begin cannot interrupt the current partial PNG', async (purpose) => {
    const receiver = new (SnapshotAssembler as any)(purpose);
    receiver.setCapture('capture-2');
    const type = purpose === 'result' ? 'result-start' : 'photo-start';
    const prefix = purpose === 'result' ? 'FR01' : 'FP01';
    receiver.begin(meta({ type, captureId: 'capture-2' }));
    receiver.push(packet(png.slice(0, 30), 0, resultTransfer, prefix));
    expect(receiver.begin(meta({ type, captureId: 'capture-1' }))).toBe(false);
    const blob = receiver.push(packet(png.slice(30), 30, resultTransfer, prefix));
    expect(blob).toBeInstanceOf(Blob);
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(png);
  });
});

class TestSocket extends EventTarget {
  static instances: TestSocket[] = [];
  readyState = 0;
  sent: any[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onopen: (() => void) | null = null;
  constructor(readonly url: string) {
    super();
    TestSocket.instances.push(this);
    queueMicrotask(() => { this.readyState = 1; this.onopen?.(); this.dispatchEvent(new Event('open')); });
  }
  send(value: string) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState = 3; this.onclose?.({ code: 1000 } as CloseEvent); }
  receive(value: unknown) { this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(value) })); }
}

class TestPeer {
  static instances: TestPeer[] = [];
  connectionState = 'new';
  ondatachannel: ((event: { channel: any }) => void) | null = null;
  constructor() { TestPeer.instances.push(this); }
  addTrack() {}
  close() { this.connectionState = 'closed'; }
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); TestSocket.instances = []; TestPeer.instances = []; });

async function room(self: 'host' | 'guest', rtc = false) {
  vi.stubGlobal('WebSocket', TestSocket);
  vi.stubGlobal('RTCPeerConnection', rtc ? TestPeer : undefined);
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ iceServers: [], relayAvailable: true })));
  const events = { photos: [] as Blob[], results: [] as Blob[], errors: [] as string[] };
  const connection = new RoomConnection({ apiBase: 'http://127.0.0.1:8787', roomId: 'room-1', token: 'private', name: self,
    onState() {}, onCapture() {}, onRemoteStream() {}, onConnection() {},
    onPhoto: (_id: string, blob: Blob) => events.photos.push(blob),
    onResult: (_id: string, blob: Blob) => events.results.push(blob),
    onError: (message: string) => events.errors.push(message),
  } as any);
  await connection.connect({ getTracks: () => [] } as unknown as MediaStream);
  const socket = TestSocket.instances.at(-1)!;
  const state = { type: 'state', roomId: 'room-1', self, expiresAt: Date.now() + 60000,
    settings: { frameId: 'online-satu-tempat', scene: 'studio', cutout: true }, phase: 'countdown', capture: { id: captureId, at: Date.now() },
    participants: [{ role: 'host', name: 'Host', ready: true, connected: true }, { role: 'guest', name: 'Guest', ready: true, connected: true }],
  };
  socket.receive(state);
  return { connection: connection as any, socket, events, state };
}
function relay(socket: TestSocket, kind: string, value: any, from = 'host') {
  socket.receive({ type: 'relay', from, data: JSON.stringify({ kind, ...value }) });
}

it('delivers the final result exactly once without consuming the pending portrait', async () => {
  const { connection, socket, events } = await room('guest');
  try {
    relay(socket, 'photo-start', meta({ type: 'photo-start', transferId: portraitTransfer }));
    relay(socket, 'photo-chunk', { data: Buffer.from(packet(png.slice(0, 30), 0, portraitTransfer, 'FP01')).toString('base64') });
    for (let repeat = 0; repeat < 2; repeat++) {
      relay(socket, 'result-start', meta());
      relay(socket, 'result-chunk', { data: Buffer.from(packet()).toString('base64') });
    }
    relay(socket, 'photo-chunk', { data: Buffer.from(packet(png.slice(30), 30, portraitTransfer, 'FP01')).toString('base64') });
    expect(events.results).toHaveLength(1);
    expect(events.photos).toHaveLength(1);
    expect(new Uint8Array(await events.results[0].arrayBuffer())).toEqual(png);
    expect(events.errors).toEqual([]);
  } finally { connection.close(); }
});

it('deduplicates direct-to-relay final-result fallback independently of an active direct portrait', async () => {
  const { connection, socket, events } = await room('guest', true);
  const channel = { readyState: 'open', onmessage: null as ((event: { data: string | ArrayBuffer }) => void) | null, close() {},
    binaryType: '', bufferedAmountLowThreshold: 0 };
  TestPeer.instances.at(-1)!.ondatachannel!({ channel });
  const receive = (data: string | ArrayBuffer) => channel.onmessage!({ data });
  try {
    receive(JSON.stringify(meta({ type: 'photo-start', transferId: portraitTransfer })));
    receive(packet(png.slice(0, 30), 0, portraitTransfer, 'FP01'));
    receive(JSON.stringify(meta()));
    receive(packet(png.slice(0, 30)));
    relay(socket, 'result-start', meta());
    relay(socket, 'result-chunk', { data: Buffer.from(packet()).toString('base64') });
    // A fallback retires only its result carrier; queued direct bytes cannot redeliver it.
    receive(packet(png.slice(30), 30));
    receive(JSON.stringify(meta()));
    receive(packet());
    receive(packet(png.slice(30), 30, portraitTransfer, 'FP01'));
    expect(events.results).toHaveLength(1);
    expect(events.photos).toHaveLength(1);
    expect(new Uint8Array(await events.results[0].arrayBuffer())).toEqual(png);
    expect(events.errors).toEqual([]);
  } finally { connection.close(); }
});

it('rejects final results at the host and relay messages claiming the wrong sender', async () => {
  const host = await room('host'), guest = await room('guest');
  try {
    relay(host.socket, 'result-start', meta(), 'guest');
    relay(host.socket, 'result-chunk', { data: Buffer.from(packet()).toString('base64') }, 'guest');
    relay(guest.socket, 'result-start', meta(), 'guest');
    relay(guest.socket, 'result-chunk', { data: Buffer.from(packet()).toString('base64') }, 'guest');
    expect(host.events.results).toHaveLength(0);
    expect(guest.events.results).toHaveLength(0);
    expect(host.events.errors.length + guest.events.errors.length).toBeGreaterThan(0);
  } finally { host.connection.close(); guest.connection.close(); }
});

it('accepts only current, valid PNG final results from the host', async () => {
  const host = await room('host'), guest = await room('guest');
  try {
    expect(host.connection.sendResult).toBeTypeOf('function');
    expect(guest.connection.sendResult).toBeTypeOf('function');
    await expect(guest.connection.sendResult(captureId, new Blob([png], { type: 'image/png' }))).rejects.toThrow(/host/i);
    await expect(host.connection.sendResult('stale', new Blob([png], { type: 'image/png' }))).rejects.toThrow(/capture/i);
    await expect(host.connection.sendResult(captureId, new Blob([png], { type: 'image/jpeg' }))).rejects.toThrow(/PNG/i);
    await expect(host.connection.sendResult(captureId, new Blob([new Uint8Array(20 * 1024 * 1024 + 1)], { type: 'image/png' }))).rejects.toThrow(/PNG/i);
    await host.connection.sendResult(captureId, new Blob([png], { type: 'image/png' }));
    for (const message of host.socket.sent.filter((value) => value.type === 'relay'))
      guest.socket.receive({ type: 'relay', from: 'host', data: message.data });
    expect(guest.events.results).toHaveLength(1);
    expect(guest.events.photos).toHaveLength(0);
    expect(new Uint8Array(await guest.events.results[0].arrayBuffer())).toEqual(png);
  } finally { host.connection.close(); guest.connection.close(); }
});

it('sends and receives a valid large final PNG without increasing the portrait or chunk limit', async () => {
  const host = await room('host'), guest = await room('guest');
  const largePng = commentedPng(9 * 1024 * 1024);
  const blob = new Blob([largePng], { type: 'image/png' });
  try {
    await expect(host.connection.sendPhoto(captureId, blob)).rejects.toThrow(/PNG/i);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const sending = host.connection.sendResult(captureId, blob).then(() => null, (error: unknown) => error);
    await vi.advanceTimersByTimeAsync(20000);
    expect(await sending).toBeNull();
    for (const message of host.socket.sent.filter((value: any) => value.type === 'relay')) {
      const payload = JSON.parse(message.data);
      if (payload.kind === 'result-chunk') expect(Buffer.from(payload.data, 'base64').byteLength).toBeLessThanOrEqual(16384);
      guest.socket.receive({ type: 'relay', from: 'host', data: message.data });
    }
    expect(guest.events.results).toHaveLength(1);
    expect(guest.events.photos).toHaveLength(0);
    expect(guest.events.results[0].size).toBe(9 * 1024 * 1024);
    expect(createHash('sha256').update(Buffer.from(await guest.events.results[0].arrayBuffer())).digest('hex'))
      .toBe(createHash('sha256').update(largePng).digest('hex'));
    expect(guest.events.errors).toEqual([]);
  } finally { host.connection.close(); guest.connection.close(); }
}, 30000);

it('ignores stale and reordered final results without producing a download', async () => {
  const { connection, socket, events, state } = await room('guest');
  try {
    relay(socket, 'result-start', meta());
    relay(socket, 'result-chunk', { data: Buffer.from(packet(png.slice(0, 30))).toString('base64') });
    socket.receive({ ...state, capture: { id: 'capture-2', at: Date.now() } });
    relay(socket, 'result-chunk', { data: Buffer.from(packet(png.slice(30), 30)).toString('base64') });
    relay(socket, 'result-start', meta());
    relay(socket, 'result-chunk', { data: Buffer.from(packet()).toString('base64') });
    expect(events.results).toHaveLength(0);
    relay(socket, 'result-start', meta({ captureId: 'capture-2' }));
    relay(socket, 'result-chunk', { data: Buffer.from(packet(png, 1)).toString('base64') });
    expect(events.results).toHaveLength(0);
    expect(events.errors).toHaveLength(1);
  } finally { connection.close(); }
});
