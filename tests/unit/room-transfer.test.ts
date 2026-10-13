import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import { RoomCoordinator, createRoomRecord, parseRoomMessage } from '../../worker/rooms';
import type { Delivery } from '../../worker/rooms';
import type { RoomRole } from '../../src/core/room/protocol';

const clientPath = '../../src/core/room/client';
const client = await import(clientPath).catch(() => ({})) as Record<string, any>;
const transferId = 'ebf2ff33-69f9-46da-bbcd-a8a0a537911e';
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCt8AAAAASUVORK5CYII=', 'base64'));

function pngWithComment() {
  const text = new TextEncoder().encode('Comment\0' + 'a'.repeat(60000));
  const chunk = new Uint8Array(text.length + 12);
  new DataView(chunk.buffer).setUint32(0, text.length);
  chunk.set(new TextEncoder().encode('tEXt'), 4);
  chunk.set(text, 8);
  let crc = 0xffffffff;
  for (const byte of chunk.subarray(4, -4)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  new DataView(chunk.buffer).setUint32(chunk.length - 4, (crc ^ 0xffffffff) >>> 0);
  const result = new Uint8Array(png.length + chunk.length), end = png.length - 12;
  result.set(png.subarray(0, end)); result.set(chunk, end); result.set(png.subarray(end), end + chunk.length);
  return result;
}

function assembler() {
  expect(client.SnapshotAssembler, 'bounded snapshot receiver is available').toBeTypeOf('function');
  const receiver = new client.SnapshotAssembler();
  receiver.setCapture('capture-1');
  return receiver;
}

function metadata(overrides = {}) {
  return { type: 'photo-start', transferId, captureId: 'capture-1', totalBytes: png.length, mime: 'image/png', ...overrides };
}

function packet(offset: number, bytes: Uint8Array, id = transferId) {
  const result = new Uint8Array(44 + bytes.length);
  result.set(new TextEncoder().encode(`FP01${id}`));
  new DataView(result.buffer).setUint32(40, offset);
  result.set(bytes, 44);
  return result.buffer;
}

describe('room original snapshot transfer', () => {
  it('reconstructs the original PNG without converting it to a video frame', async () => {
    const receiver = assembler();
    expect(receiver.begin(metadata())).toBe(true);
    expect(receiver.push(packet(0, png.slice(0, 30)))).toBeNull();
    const result = receiver.push(packet(30, png.slice(30))) as Blob;
    expect(result.type).toBe('image/png');
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(png);
  });

  it('drops old captures and mismatched transfer identifiers after a retake', () => {
    const receiver = assembler();
    receiver.begin(metadata());
    receiver.push(packet(0, png.slice(0, 30)));
    receiver.setCapture('capture-2');
    expect(receiver.push(packet(30, png.slice(30)))).toBeNull();
    expect(receiver.begin(metadata())).toBe(false);
    receiver.begin(metadata({ captureId: 'capture-2' }));
    expect(receiver.push(packet(0, png, '00000000-0000-4000-8000-000000000000'))).toBeNull();
    expect(receiver.push(packet(0, png))).toBeInstanceOf(Blob);
  });

  it('rejects unbounded and invalid metadata before allocating the transfer', () => {
    const receiver = assembler();
    for (const overrides of [
      { totalBytes: 8 * 1024 * 1024 + 1 }, { totalBytes: -1 }, { totalBytes: 1.5 },
      { mime: 'image/jpeg' }, { transferId: 'bad-id' },
    ]) expect(() => receiver.begin(metadata(overrides))).toThrow();
    expect(receiver.push(packet(0, png))).toBeNull();
  });

  it('rejects oversized chunks and reordered bytes rather than a partial photo', () => {
    const receiver = assembler();
    receiver.begin(metadata());
    expect(() => receiver.push(packet(0, new Uint8Array(16384)))).toThrow();
    receiver.begin(metadata());
    expect(() => receiver.push(packet(1, png.slice(0, 30)))).toThrow();
  });

  it('rejects a completed payload whose content is not a PNG', () => {
    const receiver = assembler();
    receiver.begin(metadata());
    expect(() => receiver.push(packet(0, new Uint8Array(png.length)))).toThrow(/PNG/i);
  });
});

it('creates a room at the configured service with a private invitation response', async () => {
  expect(client.createRoom).toBeTypeOf('function');
  let request: { path?: string; body?: unknown } = {};
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    request = { path: req.url, body: JSON.parse(body) };
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ roomId: 'room-1', hostToken: 'host-private', guestToken: 'guest-private', expiresAt: 12345 }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address() as { port: number };
    const result = await client.createRoom(`http://127.0.0.1:${address.port}/`, 'Ari', { frameId: 'online-satu-tempat', scene: 'studio', cutout: true });
    expect(request).toEqual({ path: '/api/rooms', body: { name: 'Ari', settings: { frameId: 'online-satu-tempat', scene: 'studio', cutout: true } } });
    expect(result).toEqual({ roomId: 'room-1', hostToken: 'host-private', guestToken: 'guest-private', expiresAt: 12345 });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

class TestSocket extends EventTarget {
  static instances: TestSocket[] = [];
  static autoOpen = true;
  readonly sent: any[] = [];
  readyState = 0;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  constructor(readonly url: string) {
    super();
    TestSocket.instances.push(this);
    queueMicrotask(() => { if (TestSocket.autoOpen) { this.readyState = 1; this.onopen?.(); this.dispatchEvent(new Event('open')); } });
  }
  send(value: string) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState = 3; this.onclose?.(); }
  receive(value: unknown) { this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(value) })); }
}

class TestPeer {
  static instances: TestPeer[] = [];
  connectionState = 'new';
  signalingState = 'stable';
  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  onicecandidate: unknown;
  ontrack: unknown;
  ondatachannel: unknown;
  onconnectionstatechange: unknown;
  readonly channel = { readyState: 'connecting', close() { this.readyState = 'closed'; }, bufferedAmount: 0,
    addEventListener() { }, removeEventListener() { }, onmessage: null as ((event: MessageEvent) => void) | null };
  constructor() { TestPeer.instances.push(this); }
  addTrack() { }
  createDataChannel() { return this.channel; }
  async createOffer() { return { type: 'offer', sdp: 'offer-description' } as RTCSessionDescriptionInit; }
  async createAnswer() { return { type: 'answer', sdp: 'answer-description' } as RTCSessionDescriptionInit; }
  async setLocalDescription(value: RTCSessionDescriptionInit) { this.localDescription = Object.assign({}, value, { toJSON: () => value }); this.signalingState = value.type === 'offer' ? 'have-local-offer' : 'stable'; }
  async setRemoteDescription(value: RTCSessionDescriptionInit) { this.remoteDescription = value; this.signalingState = 'stable'; }
  async addIceCandidate() { }
  close() { this.connectionState = 'closed'; }
}

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); TestSocket.instances = []; TestSocket.autoOpen = true; TestPeer.instances = []; });

function connection(events: { modes: string[]; statuses: string[]; photos: Blob[]; previews: Blob[] }) {
  expect(client.RoomConnection).toBeTypeOf('function');
  vi.stubGlobal('WebSocket', TestSocket);
  vi.stubGlobal('RTCPeerConnection', TestPeer);
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ iceServers: [], relayAvailable: false })));
  return new client.RoomConnection({ apiBase: 'http://127.0.0.1:8787', roomId: 'room-1', token: 'private', name: 'Ari',
    onState() { }, onCapture() { }, onRemoteStream() { }, onError() { },
    onConnection: (status: string) => events.statuses.push(status), onMode: (mode: string) => events.modes.push(mode),
    onPhoto: (_id: string, photo: Blob) => events.photos.push(photo), onRemotePreview: (photo: Blob) => events.previews.push(photo),
  });
}

const state = { type: 'state', roomId: 'room-1', self: 'host', expiresAt: 999999,
  settings: { frameId: 'online-satu-tempat', scene: 'studio', cutout: true }, phase: 'ready',
  participants: [{ role: 'host', name: 'Ari', ready: false, connected: true }, { role: 'guest', name: 'Bia', ready: false, connected: true }],
};

it('falls back to the room relay when WebRTC cannot connect and transfers the original PNG', async () => {
  vi.useFakeTimers();
  const events = { modes: [] as string[], statuses: [] as string[], photos: [] as Blob[], previews: [] as Blob[] };
  const room = connection(events);
  await room.connect({ getTracks: () => [] });
  const socket = TestSocket.instances[0];
  socket.receive(state);
  await vi.advanceTimersByTimeAsync(8100);
  expect(events.modes).toContain('relay');
  expect(events.statuses.at(-1)).toBe('connected');
  socket.receive({ ...state, phase: 'countdown', capture: { id: 'capture-1', at: Date.now() } });
  const sending = room.sendPhoto('capture-1', new Blob([png], { type: 'image/png' }));
  await vi.advanceTimersByTimeAsync(100);
  await sending;
  const relayed = socket.sent.filter((message) => message.type === 'relay');
  expect(relayed.length).toBeGreaterThan(1);
  for (const message of relayed) socket.receive({ type: 'relay', from: 'guest', data: message.data });
  expect(new Uint8Array(await events.photos[0].arrayBuffer())).toEqual(png);
  room.close();
});

it('limits relay preview frequency and rejects stale original photos after retake', async () => {
  vi.useFakeTimers();
  const events = { modes: [] as string[], statuses: [] as string[], photos: [] as Blob[], previews: [] as Blob[] };
  const room = connection(events);
  await room.connect({ getTracks: () => [] });
  const socket = TestSocket.instances[0];
  socket.receive(state);
  await vi.advanceTimersByTimeAsync(8100);
  const jpeg = new Blob([new Uint8Array([255, 216, 255, 217])], { type: 'image/jpeg' });
  room.sendPreview(jpeg); room.sendPreview(jpeg); room.sendPreview(new Blob([new Uint8Array(13000)], { type: 'image/jpeg' }));
  await vi.advanceTimersByTimeAsync(50);
  expect(socket.sent.filter((message) => message.type === 'relay').length).toBe(1);
  socket.receive({ ...state, phase: 'countdown', capture: { id: 'capture-1', at: Date.now() } });
  socket.receive(state);
  await expect(room.sendPhoto('capture-1', new Blob([png], { type: 'image/png' }))).rejects.toThrow(/capture|pengambilan/i);
  expect(events.photos).toEqual([]);
  room.close();
});

it('offers once per peer arrival and retires the old peer after a partner leaves', async () => {
  const events = { modes: [] as string[], statuses: [] as string[], photos: [] as Blob[], previews: [] as Blob[] };
  const room = connection(events);
  let stopped = false;
  await room.connect({ getTracks: () => [{ stop: () => { stopped = true; } }] });
  const socket = TestSocket.instances[0];
  socket.receive(state); socket.receive(state);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(socket.sent.filter((item) => item.type === 'signal' && item.data.description?.type === 'offer')).toHaveLength(1);
  expect(TestPeer.instances).toHaveLength(1);
  socket.receive({ ...state, phase: 'waiting', participants: [state.participants[0], { ...state.participants[1], connected: false }] });
  expect(TestPeer.instances[0].connectionState).toBe('closed');
  socket.receive(state);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(socket.sent.filter((item) => item.type === 'signal' && item.data.description?.type === 'offer')).toHaveLength(2);
  room.close();
  expect(TestPeer.instances[1].connectionState).toBe('closed');
  expect(stopped).toBe(false);
});

it('cancels a room connection before websocket opens without leaving the handshake timer', async () => {
  vi.useFakeTimers();
  const events = { modes: [] as string[], statuses: [] as string[], photos: [] as Blob[], previews: [] as Blob[] };
  const room = connection(events);
  TestSocket.autoOpen = false;
  let rejected: unknown;
  const connecting = room.connect({ getTracks: () => [] }).catch((error: unknown) => { rejected = error; });
  await vi.advanceTimersByTimeAsync(0);
  room.close();
  await vi.advanceTimersByTimeAsync(0);
  try {
    expect(rejected).toBeInstanceOf(DOMException);
    expect(vi.getTimerCount()).toBe(0);
    expect(events.statuses.at(-1)).toBe('disconnected');
  } finally {
    await vi.advanceTimersByTimeAsync(15000);
    await connecting;
  }
});

it('keeps relay reconstruction intact when retired WebRTC chunks arrive after fallback metadata', async () => {
  const events = { modes: [] as string[], statuses: [] as string[], photos: [] as Blob[], previews: [] as Blob[] };
  const room = connection(events);
  await room.connect({ getTracks: () => [] });
  const socket = TestSocket.instances[0];
  socket.receive({ ...state, phase: 'countdown', capture: { id: 'capture-1', at: Date.now() } });
  const channel = TestPeer.instances[0].channel;
  channel.readyState = 'open';
  channel.onmessage!(new MessageEvent('message', { data: JSON.stringify(metadata()) }));
  channel.onmessage!(new MessageEvent('message', { data: packet(0, png.slice(0, 30)) }));
  socket.receive({ type: 'relay', from: 'guest', data: JSON.stringify({ kind: 'photo-start', ...metadata() }) });
  channel.onmessage!(new MessageEvent('message', { data: packet(30, png.slice(30)) }));
  socket.receive({ type: 'relay', from: 'guest', data: JSON.stringify({ kind: 'photo-chunk', data: Buffer.from(packet(0, png)).toString('base64') }) });
  expect(events.photos).toHaveLength(1);
  expect(new Uint8Array(await events.photos[0].arrayBuffer())).toEqual(png);
  room.close();
});

it.each([401, 404, 410])('rejects an invalid room preflight (%i) before opening a websocket', async (status) => {
  const events = { modes: [] as string[], statuses: [] as string[], photos: [] as Blob[], previews: [] as Blob[] };
  const room = connection(events);
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: 'invalid_invitation', message: 'Undangan sudah tidak berlaku.' }), { status }));
  let outcome: unknown;
  try { await room.connect({ getTracks: () => [] }); } catch (error) { outcome = error; }
  room.close();
  expect(outcome).toBeInstanceOf(Error);
  expect((outcome as Error).message).toBe('Undangan sudah tidak berlaku.');
  expect(TestSocket.instances).toHaveLength(0);
});

it('accepts the remaining original bytes after the server reports the same capture as result', async () => {
  const events = { modes: [] as string[], statuses: [] as string[], photos: [] as Blob[], previews: [] as Blob[] };
  const room = connection(events);
  await room.connect({ getTracks: () => [] });
  const socket = TestSocket.instances[0], capture = { id: 'capture-1', at: Date.now() };
  socket.receive({ ...state, phase: 'countdown', capture });
  socket.receive({ type: 'relay', from: 'guest', data: JSON.stringify({ kind: 'photo-start', ...metadata() }) });
  socket.receive({ type: 'relay', from: 'guest', data: JSON.stringify({ kind: 'photo-chunk', data: Buffer.from(packet(0, png.slice(0, 30))).toString('base64') }) });
  socket.receive({ ...state, phase: 'result', capture });
  socket.receive({ type: 'relay', from: 'guest', data: JSON.stringify({ kind: 'photo-chunk', data: Buffer.from(packet(30, png.slice(30))).toString('base64') }) });
  expect(events.photos).toHaveLength(1);
  expect(new Uint8Array(await events.photos[0].arrayBuffer())).toEqual(png);
  room.close();
});

it('exchanges originals through two real websockets and the real room coordinator when RTC is unavailable', async () => {
  const wsModule = 'ws';
  const { WebSocketServer } = await import(wsModule);
  const record = createRoomRecord({ name: 'Ari', settings: { frameId: 'online-satu-tempat', scene: 'studio', cutout: false } });
  const coordinator = new RoomCoordinator(record);
  const peers = new Map<RoomRole, { send(value: string): void; terminate(): void }>();
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url!, 'http://127.0.0.1');
      if (url.pathname !== '/api/ice') { res.writeHead(404); res.end(); return; }
      coordinator.roleForToken(url.searchParams.get('token') ?? '');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ iceServers: [], relayAvailable: false }));
    } catch { res.writeHead(401); res.end('{}'); }
  });
  const websocketServer = new WebSocketServer({ noServer: true });
  function deliver(events: Delivery[]) {
    for (const event of events) {
      const recipients = event.to === 'all' ? [...peers.values()] : [peers.get(event.to)];
      for (const socket of recipients) socket?.send(JSON.stringify(event.message));
    }
  }
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url!, 'http://127.0.0.1');
    const clientId = url.searchParams.get('client')!;
    const joined = coordinator.connect(url.searchParams.get('token')!, clientId, url.searchParams.get('name')!);
    websocketServer.handleUpgrade(req, socket, head, (connection: any) => {
      peers.set(joined.role, connection);
      connection.on('message', (data: Buffer) => deliver(coordinator.handle(joined.role, parseRoomMessage(data.toString()))));
      connection.on('close', () => { peers.delete(joined.role); deliver(coordinator.disconnect(joined.role, clientId)); });
      deliver(joined.events);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const original = pngWithComment();
  const received = [[], []] as Blob[][], previews: Blob[] = [], statuses = ['', ''];
  const captures: any[] = [], states: any[] = [], errors: string[] = [];
  const rooms = [record.hostToken, record.guestToken].map((token, index) => new client.RoomConnection({
    apiBase: `http://127.0.0.1:${address.port}`, roomId: record.roomId, token, name: index ? 'Bia' : 'Ari',
    onState: (value: unknown) => { states[index] = value; }, onCapture: (value: unknown) => { captures[index] = value; },
    onConnection: (value: string) => { statuses[index] = value; }, onRemoteStream() { },
    onPhoto: (_id: string, photo: Blob) => received[index].push(photo), onRemotePreview: (photo: Blob) => previews.push(photo),
    onError: (message: string) => errors.push(message),
  }));
  vi.stubGlobal('RTCPeerConnection', undefined);
  const waitFor = async (predicate: () => boolean, timeout = 3000) => {
    const deadline = Date.now() + timeout;
    while (!predicate()) {
      if (Date.now() >= deadline) throw new Error(`Real room transport did not progress: ${JSON.stringify(errors)}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  };
  try {
    await Promise.all(rooms.map((room) => room.connect({ getTracks: () => [] })));
    await waitFor(() => statuses.every((value) => value === 'connected'), 10000);
    rooms[0].sendPreview(new Blob([new Uint8Array([255, 216, 255, 217])], { type: 'image/jpeg' }));
    await waitFor(() => previews.length === 1);
    rooms.forEach((room) => room.send({ type: 'ready', ready: true }));
    await waitFor(() => states.every((value) => value?.phase === 'ready'));
    rooms[0].send({ type: 'capture' });
    await waitFor(() => captures.length === 2);
    expect(captures[0]).toEqual(captures[1]);
    await Promise.all(rooms.map((room, index) => room.sendPhoto(captures[index].captureId, new Blob([original], { type: 'image/png' }))));
    rooms.forEach((room, index) => room.send({ type: 'captured', captureId: captures[index].captureId }));
    await waitFor(() => states.every((value) => value?.phase === 'result') && received.every((photos) => photos.length === 1));
    expect(new Uint8Array(await received[0][0].arrayBuffer())).toEqual(original);
    expect(new Uint8Array(await received[1][0].arrayBuffer())).toEqual(original);
    rooms[0].send({ type: 'retake' });
    await waitFor(() => states.every((value) => value?.phase === 'waiting' && !value.capture));
    expect(errors).toEqual([]);
  } finally {
    rooms.forEach((room) => room.close());
    for (const socket of peers.values()) socket.terminate();
    await new Promise<void>((resolve) => websocketServer.close(() => resolve()));
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}, 20000);
