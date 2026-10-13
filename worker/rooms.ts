import type {
  RoomCaptureSeries, RoomClientMessage, RoomRole, RoomServerMessage, RoomSettings, RoomSignal, RoomState,
} from '../src/core/room/protocol';
import { definitions } from '../src/frames/definitions';

const HOUR = 60 * 60 * 1000;
const MAX_MESSAGE_BYTES = 65536;
const MAX_RELAY_BYTES = 24576;
const encoder = new TextEncoder();
const framePoseCounts = new Map([
  ...definitions.map(frame => [frame.id, frame.slots.length] as const),
  ...['online-satu-tempat', 'online-surat-rindu', 'online-night-date'].map(id => [id, 1] as const),
]);

export class RoomError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}

interface StoredParticipant {
  role: RoomRole;
  clientId: string;
  name: string;
  ready: boolean;
  connected: boolean;
}

export interface RoomRecord {
  roomId: string;
  hostToken: string;
  guestToken: string;
  expiresAt: number;
  hostName: string;
  settings: RoomSettings;
  participants: Partial<Record<RoomRole, StoredParticipant>>;
  phase: RoomState['phase'];
  capture?: { id: string; at: number; series?: RoomCaptureSeries; acknowledged: Partial<Record<RoomRole, boolean>> };
  iceRequests?: Partial<Record<RoomRole, { at: number; count: number }>>;
}

export interface Delivery { to: RoomRole | 'all'; message: RoomServerMessage }

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new RoomError('invalid_input', 'Invalid message.');
  return value as Record<string, unknown>;
}

function boundedString(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new RoomError('invalid_input', `Invalid ${label}.`);
  return value.trim();
}

function readSettings(value: unknown): RoomSettings {
  const input = object(value);
  const frameId = boundedString(input.frameId, 100, 'frame');
  if (!framePoseCounts.has(frameId) || !['studio', 'sunset', 'night'].includes(String(input.scene)) || typeof input.cutout !== 'boolean') {
    throw new RoomError('invalid_settings', 'Invalid shared photo settings.');
  }
  return { frameId, scene: input.scene as RoomSettings['scene'], cutout: input.cutout };
}

function token(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function createRoomRecord(input: unknown, now = Date.now()): RoomRecord {
  const body = object(input);
  return {
    roomId: crypto.randomUUID(), hostToken: token(), guestToken: token(), expiresAt: now + HOUR,
    hostName: boundedString(body.name, 40, 'name'), settings: readSettings(body.settings), participants: {}, phase: 'waiting',
  };
}

function readSignal(value: unknown): RoomSignal {
  const data = object(value);
  const result: RoomSignal = {};
  if ('description' in data) {
    const description = object(data.description);
    if (!['offer', 'answer', 'pranswer', 'rollback'].includes(String(description.type))) throw new RoomError('invalid_signal', 'Invalid session description.');
    if (description.sdp !== undefined && (typeof description.sdp !== 'string' || description.sdp.length > 60000)) throw new RoomError('invalid_signal', 'Invalid session description.');
    result.description = { type: description.type as RTCSdpType, ...(description.sdp !== undefined ? { sdp: description.sdp as string } : {}) };
  }
  if ('candidate' in data) {
    if (data.candidate === null) result.candidate = null;
    else {
      const candidate = object(data.candidate);
      if (typeof candidate.candidate !== 'string' || candidate.candidate.length > 2048) throw new RoomError('invalid_signal', 'Invalid network candidate.');
      if (candidate.sdpMid != null && (typeof candidate.sdpMid !== 'string' || candidate.sdpMid.length > 64)) throw new RoomError('invalid_signal', 'Invalid network candidate.');
      if (candidate.sdpMLineIndex != null && (!Number.isInteger(candidate.sdpMLineIndex) || Number(candidate.sdpMLineIndex) < 0 || Number(candidate.sdpMLineIndex) > 64)) throw new RoomError('invalid_signal', 'Invalid network candidate.');
      if (candidate.usernameFragment != null && (typeof candidate.usernameFragment !== 'string' || candidate.usernameFragment.length > 256)) throw new RoomError('invalid_signal', 'Invalid network candidate.');
      result.candidate = {
        candidate: candidate.candidate,
        sdpMid: (candidate.sdpMid ?? null) as string | null,
        sdpMLineIndex: (candidate.sdpMLineIndex ?? null) as number | null,
        ...(candidate.usernameFragment != null ? { usernameFragment: candidate.usernameFragment as string } : {}),
      };
    }
  }
  if (!('description' in result) && !('candidate' in result)) throw new RoomError('invalid_signal', 'Empty network signal.');
  return result;
}

export function parseRoomMessage(raw: unknown): RoomClientMessage {
  if (typeof raw !== 'string' || encoder.encode(raw).length > MAX_MESSAGE_BYTES) throw new RoomError('message_too_large', 'Room messages must be bounded text.');
  let input: Record<string, unknown>;
  try { input = object(JSON.parse(raw)); } catch { throw new RoomError('invalid_message', 'Invalid room message.'); }
  switch (input.type) {
    case 'ready':
      if (typeof input.ready !== 'boolean') break;
      return { type: 'ready', ready: input.ready };
    case 'settings': return { type: 'settings', settings: readSettings(input.settings) };
    case 'signal': return { type: 'signal', data: readSignal(input.data) };
    case 'relay':
      if (typeof input.data !== 'string' || encoder.encode(input.data).length > MAX_RELAY_BYTES) throw new RoomError('relay_too_large', 'Relay chunk exceeds the size limit.');
      return { type: 'relay', data: input.data };
    case 'capture': return { type: 'capture' };
    case 'advance': return { type: 'advance', captureId: boundedString(input.captureId, 80, 'capture') };
    case 'captured': return { type: 'captured', captureId: boundedString(input.captureId, 80, 'capture') };
    case 'retake': return { type: 'retake' };
    case 'ping':
      if (typeof input.clientTime !== 'number' || !Number.isFinite(input.clientTime) || input.clientTime < 0) break;
      return { type: 'ping', clientTime: input.clientTime };
  }
  throw new RoomError('invalid_message', 'Invalid room command.');
}

export class RoomCoordinator {
  private relayRates = new Map<RoomRole, { at: number; count: number }>();

  constructor(public readonly record: RoomRecord, private readonly now: () => number = Date.now) {}

  private checkExpiry(): void {
    if (this.now() >= this.record.expiresAt) throw new RoomError('room_expired', 'This room has expired.', 410);
  }

  roleForToken(invitation: string): RoomRole {
    this.checkExpiry();
    if (invitation === this.record.hostToken) return 'host';
    if (invitation === this.record.guestToken) return 'guest';
    throw new RoomError('invalid_invitation', 'Invitation is invalid.', 401);
  }

  authorizeIce(invitation: string): RoomRole {
    const role = this.roleForToken(invitation);
    const now = this.now();
    const rates = this.record.iceRequests ??= {};
    const rate = rates[role];
    const next = rate && now - rate.at < 60000 ? rate : { at: now, count: 0 };
    if (next.count >= 20) throw new RoomError('ice_rate_limit', 'ICE request rate limit exceeded.', 429);
    next.count++;
    rates[role] = next;
    return role;
  }

  state(self: RoomRole): RoomState {
    const { roomId, expiresAt, settings, phase, capture } = this.record;
    return {
      type: 'state', self, roomId, expiresAt, settings: { ...settings }, phase,
      participants: (['host', 'guest'] as const).flatMap(role => {
        const peer = this.record.participants[role];
        return peer ? [{ role, name: peer.name, ready: peer.ready, connected: peer.connected }] : [];
      }),
      ...(capture ? { capture: { id: capture.id, at: capture.at, ...(capture.series ? { series: { ...capture.series } } : {}) } } : {}),
      ...(self === 'host' ? { inviteToken: this.record.guestToken } : {}),
    };
  }

  private states(): Delivery[] {
    return (['host', 'guest'] as const).filter(role => this.record.participants[role]?.connected).map(role => ({ to: role, message: this.state(role) }));
  }

  private reset(): void {
    delete this.record.capture;
    this.record.phase = 'waiting';
    for (const peer of Object.values(this.record.participants)) if (peer) peer.ready = false;
  }

  private beginCapture(series?: RoomCaptureSeries): Delivery[] {
    const capture: NonNullable<RoomRecord['capture']> = {
      id: crypto.randomUUID(), at: this.now() + 4000, acknowledged: {},
      ...(series ? { series: { ...series } } : {}),
    };
    this.record.capture = capture;
    this.record.phase = 'countdown';
    return [{ to: 'all', message: {
      type: 'capture', captureId: capture.id, at: capture.at, settings: { ...this.record.settings },
      ...(series ? { series: { ...series } } : {}),
    } }, ...this.states()];
  }

  connect(invitation: string, clientId: string, name: string): { role: RoomRole; replaced: boolean; events: Delivery[] } {
    const role = this.roleForToken(invitation);
    boundedString(clientId, 100, 'client identifier');
    const checkedName = boundedString(name, 40, 'name');
    const previous = this.record.participants[role];
    if (previous?.connected && previous.clientId !== clientId) throw new RoomError('room_full', 'This invitation is already occupied by another browser.', 409);
    this.reset();
    this.record.participants[role] = { role, clientId, name: checkedName, ready: false, connected: true };
    return { role, replaced: previous?.connected === true, events: this.states() };
  }

  disconnect(role: RoomRole, clientId: string): Delivery[] {
    const peer = this.record.participants[role];
    if (!peer || !peer.connected || peer.clientId !== clientId) return [];
    peer.connected = false;
    this.reset();
    return this.states();
  }

  handle(role: RoomRole, input: RoomClientMessage): Delivery[] {
    this.checkExpiry();
    if (!this.record.participants[role]?.connected) throw new RoomError('not_connected', 'Join the room first.', 401);
    const message = parseRoomMessage(JSON.stringify(input));
    const peerRole = role === 'host' ? 'guest' : 'host';
    switch (message.type) {
      case 'ping': return [{ to: role, message: { type: 'pong', clientTime: message.clientTime, serverTime: this.now() } }];
      case 'signal':
        if (!this.record.participants[peerRole]?.connected) throw new RoomError('peer_unavailable', 'The other participant is not connected.');
        if ((message.data.description?.type === 'offer' && role !== 'host') || (message.data.description?.type === 'answer' && role !== 'guest')) throw new RoomError('invalid_signal_role', 'The host starts the connection.');
        return [{ to: peerRole, message: { type: 'signal', from: role, data: message.data } }];
      case 'relay': {
        if (!this.record.participants[peerRole]?.connected) throw new RoomError('peer_unavailable', 'The other participant is not connected.');
        const now = this.now();
        const rate = this.relayRates.get(role);
        const next = rate && now - rate.at < 1000 ? rate : { at: now, count: 0 };
        if (next.count >= 100) throw new RoomError('relay_rate_limit', 'Relay rate limit exceeded.');
        next.count++;
        this.relayRates.set(role, next);
        return [{ to: peerRole, message: { type: 'relay', from: role, data: message.data } }];
      }
      case 'settings':
        if (role !== 'host') throw new RoomError('host_only', 'Only the host can change the shared settings.', 403);
        this.record.settings = message.settings;
        this.reset();
        return this.states();
      case 'ready':
        if (this.record.capture && !message.ready) { this.reset(); return this.states(); }
        if (this.record.capture) throw new RoomError('capture_in_progress', 'A capture is already in progress. Retake first.');
        this.record.participants[role]!.ready = message.ready;
        this.record.phase = (['host', 'guest'] as const).every(member => this.record.participants[member]?.connected && this.record.participants[member]?.ready) ? 'ready' : 'waiting';
        return this.states();
      case 'capture': {
        if (role !== 'host') throw new RoomError('host_only', 'Only the host can start the capture.', 403);
        if (this.record.capture) throw new RoomError('capture_in_progress', 'A capture is already in progress.');
        if (this.record.phase !== 'ready') throw new RoomError('not_ready', 'Both participants must be connected and ready.');
        const total = framePoseCounts.get(this.record.settings.frameId);
        if (!total) throw new RoomError('invalid_settings', 'Invalid shared photo settings.');
        return this.beginCapture(total > 1 ? { seriesId: crypto.randomUUID(), index: 0, total } : undefined);
      }
      case 'advance': {
        if (role !== 'host') throw new RoomError('host_only', 'Only the host can start the next pose.', 403);
        const capture = this.record.capture;
        if (!capture || capture.id !== message.captureId) throw new RoomError('stale_capture', 'This capture is no longer active.');
        if (!this.record.participants.guest?.connected) throw new RoomError('peer_unavailable', 'The other participant is not connected.');
        if (this.record.phase !== 'result' || !capture.acknowledged.host || !capture.acknowledged.guest) {
          throw new RoomError('not_captured', 'Both participants must finish saving this pose first.');
        }
        if (!capture.series || capture.series.index + 1 >= capture.series.total) throw new RoomError('series_complete', 'Every pose in this frame is complete.');
        return this.beginCapture({ ...capture.series, index: capture.series.index + 1 });
      }
      case 'captured':
        if (!this.record.capture || this.record.capture.id !== message.captureId) throw new RoomError('stale_capture', 'This capture is no longer active.');
        this.record.capture.acknowledged[role] = true;
        if (this.record.capture.acknowledged.host && this.record.capture.acknowledged.guest) this.record.phase = 'result';
        return this.states();
      case 'retake': this.reset(); return this.states();
    }
  }
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.origin !== origin) return false;
    return (url.protocol === 'https:' && !url.port && (url.hostname === 'fotbooth.pages.dev' || /^[a-z0-9-]+\.fotbooth\.pages\.dev$/.test(url.hostname)))
      || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch { return false; }
}

interface IceEnvironment { TURN_KEY_ID?: string; TURN_API_TOKEN?: string }

export async function getIceConfiguration(env: IceEnvironment): Promise<{ iceServers: RTCIceServer[]; relayAvailable: boolean }> {
  const fallback = { iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }], relayAvailable: false };
  if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN) return fallback;
  try {
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`, {
      method: 'POST', headers: { Authorization: `Bearer ${env.TURN_API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 3600 }), signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return fallback;
    const result = await response.json() as { iceServers?: RTCIceServer[] };
    if (!Array.isArray(result.iceServers) || result.iceServers.length === 0) return fallback;
    return { iceServers: result.iceServers, relayAvailable: true };
  } catch { return fallback; }
}

interface RoomSocket extends WebSocket {
  serializeAttachment(value: unknown): void;
  deserializeAttachment(): { role: RoomRole; clientId: string } | null;
}
interface RoomStorage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  setAlarm(time: number): Promise<void>;
  deleteAll(): Promise<void>;
}
interface ObjectState {
  storage: RoomStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  acceptWebSocket(socket: RoomSocket, tags?: string[]): void;
  getWebSockets(): RoomSocket[];
}
interface ObjectNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}
interface Environment extends IceEnvironment { ROOMS: ObjectNamespace }
declare const WebSocketPair: new () => { 0: RoomSocket; 1: RoomSocket };

function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...Object.fromEntries(new Headers(headers)) } });
}

function errorResponse(error: unknown): Response {
  return error instanceof RoomError
    ? json({ error: error.code, message: publicErrorMessage(error.code) }, error.status)
    : json({ error: 'server_error', message: 'Room belum bisa terhubung. Coba lagi sebentar.' }, 500);
}

function publicErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    invalid_input: 'Informasi room belum lengkap atau tidak valid.',
    invalid_settings: 'Pengaturan foto bersama tidak valid.',
    invalid_message: 'Pesan room tidak valid.',
    invalid_signal: 'Koneksi video perlu dicoba lagi.',
    invalid_signal_role: 'Koneksi video dimulai oleh pembuat room.',
    message_too_large: 'Ukuran pesan terlalu besar.',
    relay_too_large: 'Ukuran pesan foto terlalu besar.',
    relay_rate_limit: 'Koneksi sedang padat. Tunggu sebentar lalu coba lagi.',
    ice_rate_limit: 'Terlalu sering mencoba koneksi. Tunggu sebentar lalu coba lagi.',
    room_expired: 'Undangan room sudah kedaluwarsa.',
    invalid_invitation: 'Undangan room tidak valid.',
    room_full: 'Room sudah diisi dua orang.',
    not_connected: 'Masuk ke room lebih dulu.',
    host_only: 'Hanya pembuat room yang bisa mengubah pengaturan atau memulai foto.',
    peer_unavailable: 'Pasanganmu belum terhubung ke room.',
    capture_in_progress: 'Foto sedang diproses. Ambil ulang untuk memulai lagi.',
    not_ready: 'Keduanya perlu masuk dan menekan Siap dulu.',
    stale_capture: 'Foto ini sudah dibatalkan. Silakan ambil ulang.',
    not_captured: 'Tunggu sampai foto kalian berdua tersimpan sebelum pose berikutnya.',
    series_complete: 'Semua pose untuk frame ini sudah selesai.',
    already_created: 'Room ini sudah dibuat.',
    room_not_found: 'Room tidak ditemukan atau undangannya sudah kedaluwarsa.',
    upgrade_required: 'Koneksi room perlu dibuka ulang.',
    not_found: 'Halaman room tidak ditemukan.',
  };
  return messages[code] ?? 'Room belum bisa terhubung. Coba lagi sebentar.';
}

export class PhotoRoom {
  private coordinator?: RoomCoordinator;
  private sockets = new Map<RoomRole, RoomSocket>();

  constructor(private readonly context: ObjectState) {
    context.blockConcurrencyWhile(async () => {
      const record = await context.storage.get<RoomRecord>('room');
      if (record) this.coordinator = new RoomCoordinator(record);
      for (const socket of context.getWebSockets()) {
        const attachment = socket.deserializeAttachment();
        if (attachment) this.sockets.set(attachment.role, socket);
      }
      if (this.coordinator) {
        let events: Delivery[] = [];
        let changed = false;
        for (const role of ['host', 'guest'] as const) {
          const peer = this.coordinator.record.participants[role];
          const socket = this.sockets.get(role);
          const attachment = socket?.deserializeAttachment();
          if (peer?.connected && (!socket || attachment?.clientId !== peer.clientId)) {
            events = this.coordinator.disconnect(role, peer.clientId);
            changed = true;
          }
        }
        if (changed) { await this.save(); this.deliver(events); }
      }
    });
  }

  private async save(): Promise<void> {
    if (this.coordinator) await this.context.storage.put('room', this.coordinator.record);
  }

  private deliver(events: Delivery[]): void {
    for (const event of events) {
      const recipients = event.to === 'all' ? [...this.sockets.values()] : [this.sockets.get(event.to)];
      for (const socket of recipients) {
        if (!socket) continue;
        try { socket.send(JSON.stringify(event.message)); } catch { /* Close callback reconciles membership. */ }
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (request.method === 'POST' && url.pathname === '/internal/create') {
        if (this.coordinator) throw new RoomError('already_created', 'Room already exists.', 409);
        const body = await request.text();
        if (encoder.encode(body).length > 4096) throw new RoomError('invalid_input', 'Room details are too large.');
        let details: unknown;
        try { details = JSON.parse(body); } catch { throw new RoomError('invalid_input', 'Invalid room details.'); }
        const record = createRoomRecord(details);
        record.roomId = url.searchParams.get('roomId')!;
        this.coordinator = new RoomCoordinator(record);
        await this.save();
        await this.context.storage.setAlarm(record.expiresAt);
        return json({ roomId: record.roomId, hostToken: record.hostToken, guestToken: record.guestToken, expiresAt: record.expiresAt }, 201);
      }
      if (!this.coordinator) throw new RoomError('room_not_found', 'Room does not exist.', 404);
      if (url.pathname === '/internal/authorize') {
        this.coordinator.authorizeIce(url.searchParams.get('token') ?? '');
        await this.save();
        return json({ valid: true });
      }
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') throw new RoomError('upgrade_required', 'A WebSocket connection is required.', 426);
      const joined = this.coordinator.connect(url.searchParams.get('token') ?? '', url.searchParams.get('client') ?? '', url.searchParams.get('name') ?? 'Participant');
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      const previous = this.sockets.get(joined.role);
      server.serializeAttachment({ role: joined.role, clientId: url.searchParams.get('client') });
      this.context.acceptWebSocket(server, [joined.role]);
      this.sockets.set(joined.role, server);
      if (previous) previous.close(4001, 'Reconnected from the same browser.');
      await this.save();
      this.deliver(joined.events);
      return new Response(null, { status: 101, webSocket: client } as ResponseInit);
    } catch (error) { return errorResponse(error); }
  }

  async webSocketMessage(socket: RoomSocket, raw: string | ArrayBuffer): Promise<void> {
    const attachment = socket.deserializeAttachment();
    if (!attachment || this.sockets.get(attachment.role) !== socket || !this.coordinator) return;
    try {
      const message = parseRoomMessage(raw);
      const events = this.coordinator.handle(attachment.role, message);
      if (!['signal', 'relay', 'ping'].includes(message.type)) await this.save();
      this.deliver(events);
    } catch (error) {
      const response: RoomServerMessage = error instanceof RoomError
        ? { type: 'error', code: error.code, message: publicErrorMessage(error.code) }
        : { type: 'error', code: 'invalid_message', message: 'Pesan room tidak valid.' };
      try { socket.send(JSON.stringify(response)); } catch { /* Socket is already closed. */ }
      if (response.code === 'room_expired') socket.close(4004, 'Room expired.');
    }
  }

  async webSocketClose(socket: RoomSocket): Promise<void> {
    const attachment = socket.deserializeAttachment();
    if (!attachment || this.sockets.get(attachment.role) !== socket || !this.coordinator) return;
    this.sockets.delete(attachment.role);
    const events = this.coordinator.disconnect(attachment.role, attachment.clientId);
    await this.save();
    this.deliver(events);
  }

  async webSocketError(socket: RoomSocket): Promise<void> { await this.webSocketClose(socket); }

  async alarm(): Promise<void> {
    for (const socket of this.sockets.values()) socket.close(4004, 'Room expired.');
    this.sockets.clear();
    this.coordinator = undefined;
    await this.context.storage.deleteAll();
  }
}

export default {
  async fetch(request: Request, env: Environment): Promise<Response> {
    let origin = request.headers.get('Origin');
    const url = new URL(request.url);
    if (origin === null && request.method === 'GET' && url.pathname === '/api/ice' && request.headers.get('Sec-Fetch-Site') === 'same-origin') {
      try {
        const referredOrigin = new URL(request.headers.get('Referer') ?? '').origin;
        if (isAllowedOrigin(referredOrigin)) origin = referredOrigin;
      } catch { /* A trusted same-origin browser referrer is required. */ }
    }
    if (!isAllowedOrigin(origin)) return json({ error: 'origin_not_allowed', message: 'Situs ini tidak bisa membuka room foto.' }, 403);
    const cors = { 'Access-Control-Allow-Origin': origin!, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin', 'Cache-Control': 'no-store' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      let response: Response;
      if (request.method === 'POST' && url.pathname === '/api/rooms') {
        const body = await request.text();
        if (encoder.encode(body).length > 4096) throw new RoomError('invalid_input', 'Room details are too large.');
        const roomId = crypto.randomUUID();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
        response = await stub.fetch(new Request(`https://room.internal/internal/create?roomId=${roomId}`, { method: 'POST', body }));
      } else if (request.method === 'GET' && url.pathname === '/api/ice') {
        const roomId = url.searchParams.get('roomId') ?? '';
        if (!/^[a-f0-9-]{36}$/.test(roomId)) throw new RoomError('invalid_invitation', 'A valid room invitation is required.', 401);
        const stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
        const authorization = await stub.fetch(new Request(`https://room.internal/internal/authorize?token=${encodeURIComponent(url.searchParams.get('token') ?? '')}`));
        if (!authorization.ok) return json(await authorization.json(), authorization.status, cors);
        response = json(await getIceConfiguration(env));
      } else {
        const match = /^\/api\/rooms\/([a-f0-9-]{36})\/socket$/.exec(url.pathname);
        if (!match || request.method !== 'GET') throw new RoomError('not_found', 'Room endpoint not found.', 404);
        const stub = env.ROOMS.get(env.ROOMS.idFromName(match[1]));
        response = await stub.fetch(request);
      }
      const headers = new Headers(response.headers);
      for (const [name, value] of Object.entries(cors)) headers.set(name, value);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers, ...((response as Response & { webSocket?: WebSocket }).webSocket ? { webSocket: (response as Response & { webSocket: WebSocket }).webSocket } : {}) } as ResponseInit);
    } catch (error) {
      const response = errorResponse(error);
      return new Response(response.body, { status: response.status, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
  },
};
