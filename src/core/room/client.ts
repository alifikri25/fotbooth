import type { RoomCapture, RoomCaptureSeries, RoomClientMessage, RoomCreated, RoomServerMessage, RoomSettings, RoomSignal, RoomState } from './protocol';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_RESULT_BYTES = 20 * 1024 * 1024;
const MAX_CHUNK_BYTES = 16 * 1024;
const CHUNK_HEADER_BYTES = 44;
const TRANSFER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface SnapshotMetadata {
  type: 'photo-start' | 'result-start';
  transferId: string;
  captureId: string;
  totalBytes: number;
  mime: 'image/png';
}

/** A reliable ordered data channel transfers bounded PNG originals, never video stills. */
export class SnapshotAssembler {
  private captureId: string | null = null;
  private transfer: { id: string; bytes: Uint8Array<ArrayBuffer>; offset: number } | null = null;

  constructor(private readonly purpose: 'photo' | 'result' = 'photo') {}

  setCapture(captureId: string | null): void {
    if (captureId !== this.captureId) this.transfer = null;
    this.captureId = captureId;
  }

  begin(value: unknown): boolean {
    if (!value || typeof value !== 'object') {
      this.transfer = null;
      throw new Error('Invalid photo metadata.');
    }
    const item = value as Partial<SnapshotMetadata>;
    const maximumBytes = this.purpose === 'result' ? MAX_RESULT_BYTES : MAX_PHOTO_BYTES;
    if (item.type !== (this.purpose === 'result' ? 'result-start' : 'photo-start') || typeof item.transferId !== 'string' || !TRANSFER_ID.test(item.transferId)
      || typeof item.captureId !== 'string' || item.mime !== 'image/png'
      || !Number.isInteger(item.totalBytes) || item.totalBytes! < 45 || item.totalBytes! > maximumBytes) {
      this.transfer = null;
      throw new Error('Invalid or oversized PNG photo.');
    }
    if (item.captureId !== this.captureId || !this.captureId) return false;
    this.transfer = { id: item.transferId, bytes: new Uint8Array(item.totalBytes!), offset: 0 };
    return true;
  }

  push(packet: ArrayBuffer): Blob | null {
    if (packet.byteLength > MAX_CHUNK_BYTES || packet.byteLength <= CHUNK_HEADER_BYTES) {
      this.transfer = null;
      throw new Error('Invalid photo chunk size.');
    }
    const header = decoder.decode(new Uint8Array(packet, 0, 40));
    if (!header.startsWith(transferPrefix(this.purpose))) {
      this.transfer = null;
      throw new Error('Invalid photo chunk format.');
    }
    if (!this.transfer || header.slice(4) !== this.transfer.id) return null;
    const transfer = this.transfer;
    const offset = new DataView(packet).getUint32(40);
    const bytes = new Uint8Array(packet, CHUNK_HEADER_BYTES);
    if (offset !== transfer.offset || offset + bytes.length > transfer.bytes.length) {
      this.transfer = null;
      throw new Error('Photo chunks arrived out of order.');
    }
    transfer.bytes.set(bytes, offset);
    transfer.offset += bytes.length;
    if (transfer.offset !== transfer.bytes.length) return null;
    this.transfer = null;
    validatePng(transfer.bytes);
    return new Blob([transfer.bytes], { type: 'image/png' });
  }
}

function validatePng(bytes: Uint8Array): void {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((byte, index) => bytes[index] === byte)) throw new Error('Photo is not a PNG.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let hasHeader = false;
  let hasData = false;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = decoder.decode(bytes.subarray(offset + 4, offset + 8));
    if (offset + 12 + length > bytes.length) throw new Error('Incomplete PNG photo.');
    if (!hasHeader) {
      if (type !== 'IHDR' || length !== 13) throw new Error('Missing PNG header.');
      const width = view.getUint32(offset + 8), height = view.getUint32(offset + 12);
      if (!width || !height || width > 8192 || height > 8192 || width * height > 32_000_000) {
        throw new Error('PNG dimensions exceed the photo limit.');
      }
      hasHeader = true;
    }
    if (type === 'IDAT') hasData = true;
    if (type === 'IEND') {
      if (length !== 0 || !hasData || offset + 12 !== bytes.length) throw new Error('Invalid PNG ending.');
      return;
    }
    offset += length + 12;
  }
  throw new Error('Incomplete PNG photo.');
}

function apiUrl(apiBase: string, pathname: string): URL {
  const base = apiBase.trim().replace(/\/$/, '') || globalThis.location?.origin;
  if (!base) throw new Error('Alamat layanan room belum tersedia.');
  const url = new URL(`${base}${pathname}`);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Alamat layanan room tidak valid.');
  return url;
}

export async function createRoom(apiBase: string, name: string, settings: RoomSettings): Promise<RoomCreated> {
  const url = apiUrl(apiBase, '/api/rooms');
  const signal = AbortSignal.timeout(15000);
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, settings }), signal,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Tidak dapat menjangkau layanan room. Periksa koneksi internet atau coba lewat Wi-Fi, lalu buat room lagi.', { cause: error });
    }
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('Layanan room terlalu lama merespons. Coba lagi sebentar.', { cause: error });
    }
    throw error;
  }
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? 'Room belum dapat dibuat. Coba lagi sebentar.');
  if (typeof body.roomId !== 'string' || typeof body.hostToken !== 'string' || typeof body.guestToken !== 'string'
    || typeof body.expiresAt !== 'number') throw new Error('Respons layanan room tidak valid.');
  return body;
}

export interface RoomConnectionOptions {
  apiBase: string;
  roomId: string;
  token: string;
  name: string;
  clientId?: string;
  onState(state: RoomState): void;
  onCapture(capture: RoomCapture): void;
  onPhoto(captureId: string, photo: Blob): void;
  onResult?(captureId: string, result: Blob): void;
  onRemoteStream(stream: MediaStream | null): void;
  onConnection(status: 'connecting' | 'connected' | 'disconnected', relayAvailable: boolean): void;
  onError(message: string): void;
  onMode?(mode: 'direct' | 'relay'): void;
  onRemotePreview?(photo: Blob): void;
}

class RoomAuthorizationError extends Error {}

/** Owns the room transports. The caller retains ownership of its camera tracks. */
export class RoomConnection {
  private readonly options: RoomConnectionOptions;
  private socket: WebSocket | null = null;
  private peer: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private stream: MediaStream | null = null;
  private state: RoomState | null = null;
  private iceServers: RTCIceServer[] = [];
  private relayAvailable = false;
  private mode: 'direct' | 'relay' = 'direct';
  private status: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private captureId: string | null = null;
  private announcedCapture: string | null = null;
  private readonly directAssembler = new SnapshotAssembler();
  private readonly relayAssembler = new SnapshotAssembler();
  private readonly directResultAssembler = new SnapshotAssembler('result');
  private readonly relayResultAssembler = new SnapshotAssembler('result');
  private relayCaptureId: string | null = null;
  private receivedCaptureId: string | null = null;
  private relayResultCaptureId: string | null = null;
  private receivedResultCaptureId: string | null = null;
  private queuedCandidates: (RTCIceCandidateInit | null)[] = [];
  private signalChain = Promise.resolve();
  private clockOffset = 0;
  private bestClockRtt = Infinity;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingConnect: ((error: Error) => void) | null = null;
  private closed = false;
  private generation = 0;
  private transferGeneration = 0;
  private lastPreview = -Infinity;

  constructor(options: RoomConnectionOptions) { this.options = options; }

  async connect(stream: MediaStream): Promise<void> {
    if (this.socket || this.closed) throw new Error('Room sudah tersambung atau ditutup.');
    this.stream = stream;
    this.setStatus('connecting');
    const iceUrl = apiUrl(this.options.apiBase, '/api/ice');
    iceUrl.searchParams.set('roomId', this.options.roomId);
    iceUrl.searchParams.set('token', this.options.token);
    try {
      const response = await fetch(iceUrl, { signal: AbortSignal.timeout(10000) });
      if (response.status >= 400 && response.status < 500) {
        const body = await response.json().catch(() => ({}));
        throw new RoomAuthorizationError(typeof body.message === 'string' ? body.message : 'Undangan room sudah tidak berlaku. Minta tautan baru dari pasanganmu.');
      }
      if (!response.ok) throw new Error('Layanan koneksi kamera belum tersedia.');
      const configuration = await response.json();
      if (Array.isArray(configuration.iceServers)) this.iceServers = configuration.iceServers;
      this.relayAvailable = configuration.relayAvailable === true;
    } catch (error) {
      if (error instanceof RoomAuthorizationError) throw error;
      // The room's transient relay remains usable when ICE configuration is unavailable.
      this.iceServers = [];
    }
    if (this.closed) throw new DOMException('Room ditutup.', 'AbortError');
    const url = apiUrl(this.options.apiBase, `/api/rooms/${encodeURIComponent(this.options.roomId)}/socket`);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('token', this.options.token);
    url.searchParams.set('client', this.options.clientId ?? crypto.randomUUID());
    url.searchParams.set('name', this.options.name);
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onmessage = (event) => {
      if (this.closed || typeof event.data !== 'string' || event.data.length > 32768) return;
      try { this.receive(JSON.parse(event.data) as RoomServerMessage); }
      catch (error) { this.options.onError(errorMessage(error)); }
    };
    socket.onclose = (event) => {
      const reason = event?.code === 4004
        ? 'Room sudah kedaluwarsa. Keluar room, lalu buat atau minta undangan baru.'
        : 'Koneksi room terputus. Nyalakan kamera lagi untuk menyambungkan kembali.';
      this.pendingConnect?.(this.closed ? new DOMException('Room ditutup.', 'AbortError') : new Error(reason));
      this.cancelTimers();
      this.dropPeer();
      this.setCapture(null);
      if (!this.closed) this.options.onError(reason);
      this.setStatus('disconnected');
    };
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { fail(new Error('Room tidak merespons. Coba masuk kembali.')); socket.close(); }, 15000);
      const fail = (error: Error) => {
        clearTimeout(timeout);
        this.pendingConnect = null;
        reject(error);
      };
      this.pendingConnect = fail;
      socket.onopen = () => {
        clearTimeout(timeout);
        this.pendingConnect = null;
        if (this.closed) { reject(new DOMException('Room ditutup.', 'AbortError')); return; }
        this.send({ type: 'ping', clientTime: Date.now() });
        this.pingTimer = setInterval(() => this.send({ type: 'ping', clientTime: Date.now() }), 10000);
        resolve();
      };
      socket.onerror = () => {
        fail(new Error('Room tidak dapat tersambung. Periksa koneksi internet.'));
        socket.close();
      };
    });
  }

  send(message: RoomClientMessage): void {
    if (this.socket?.readyState === 1 && !this.closed) this.socket.send(JSON.stringify(message));
  }

  serverNow(): number { return Date.now() + this.clockOffset; }

  async sendPhoto(captureId: string, blob: Blob): Promise<void> {
    return this.sendSnapshot(captureId, blob, 'photo');
  }

  async sendResult(captureId: string, blob: Blob): Promise<void> {
    if (this.state?.self !== 'host') throw new Error('Only the host can send the final room result.');
    return this.sendSnapshot(captureId, blob, 'result');
  }

  private async sendSnapshot(captureId: string, blob: Blob, purpose: 'photo' | 'result'): Promise<void> {
    if (!this.canTransfer(captureId)) throw new Error('Pengambilan foto ini sudah berakhir (capture).');
    const generation = this.transferGeneration;
    const maximumBytes = purpose === 'result' ? MAX_RESULT_BYTES : MAX_PHOTO_BYTES;
    if (blob.type !== 'image/png' || blob.size > maximumBytes || blob.size < 45) throw new Error('Ukuran atau format PNG tidak valid.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    validatePng(bytes);
    this.checkTransfer(captureId, generation);
    const metadata: SnapshotMetadata = { type: purpose === 'result' ? 'result-start' : 'photo-start', transferId: crypto.randomUUID(), captureId, totalBytes: bytes.length, mime: 'image/png' };
    const channel = this.channel?.readyState === 'open' ? this.channel : null;
    if (channel) {
      try {
        channel.send(JSON.stringify(metadata));
        for (let offset = 0; offset < bytes.length; offset += MAX_CHUNK_BYTES - CHUNK_HEADER_BYTES) {
          this.checkTransfer(captureId, generation);
          await this.waitForBuffer(channel, captureId, generation);
          channel.send(encodeChunk(metadata.transferId, offset, bytes.subarray(offset, offset + MAX_CHUNK_BYTES - CHUNK_HEADER_BYTES), purpose));
        }
        return;
      } catch (error) {
        if (!this.canTransfer(captureId) || generation !== this.transferGeneration) throw error;
        this.setMode('relay');
      }
    }
    this.checkTransfer(captureId, generation);
    this.relay(JSON.stringify({ kind: metadata.type, ...metadata }));
    for (let offset = 0; offset < bytes.length; offset += MAX_CHUNK_BYTES - CHUNK_HEADER_BYTES) {
      await delay(25);
      this.checkTransfer(captureId, generation);
      const packet = encodeChunk(metadata.transferId, offset, bytes.subarray(offset, offset + MAX_CHUNK_BYTES - CHUNK_HEADER_BYTES), purpose);
      this.relay(JSON.stringify({ kind: purpose === 'result' ? 'result-chunk' : 'photo-chunk', data: toBase64(new Uint8Array(packet)) }));
    }
  }

  sendPreview(blob: Blob): void {
    if (this.mode !== 'relay' || !this.bothPresent() || blob.type !== 'image/jpeg' || blob.size < 4 || blob.size > 12000
      || Date.now() - this.lastPreview < 500 || this.socket?.readyState !== 1) return;
    this.lastPreview = Date.now();
    const generation = this.generation;
    void blob.arrayBuffer().then((buffer) => {
      if (this.closed || generation !== this.generation || this.mode !== 'relay') return;
      const bytes = new Uint8Array(buffer);
      if (!isJpeg(bytes)) return;
      this.relay(JSON.stringify({ kind: 'preview', mime: 'image/jpeg', data: toBase64(bytes) }));
    }).catch((error) => this.options.onError(errorMessage(error)));
  }

  close(): void {
    this.closed = true;
    this.cancelTimers();
    this.setCapture(null);
    this.dropPeer();
    this.pendingConnect?.(new DOMException('Room ditutup.', 'AbortError'));
    this.socket?.close();
    this.socket = null;
    this.stream = null;
    this.setStatus('disconnected');
  }

  private receive(message: RoomServerMessage): void {
    if (message.type === 'state') {
      const wasPresent = this.bothPresent();
      this.state = message;
      this.setCapture(message.capture?.id ?? null);
      this.options.onState(message);
      if (message.phase === 'countdown' && message.capture) {
        this.announceCapture(message.capture.id, message.capture.at, message.settings, message.capture.series);
      }
      if (!this.bothPresent()) {
        if (wasPresent || this.peer) this.dropPeer();
        if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
        this.fallbackTimer = null;
        this.setStatus('connecting');
      } else if (!wasPresent) {
        this.setStatus('connecting');
        this.scheduleFallback();
        this.startPeer();
      }
    } else if (message.type === 'signal') {
      if (!this.bothPresent() || message.from === this.state?.self) return;
      const generation = this.generation;
      this.signalChain = this.signalChain.then(() => this.applySignal(message.data, generation))
        .catch((error) => { if (!this.closed && generation === this.generation) this.options.onError(errorMessage(error)); });
    } else if (message.type === 'capture') {
      this.setCapture(message.captureId);
      this.announceCapture(message.captureId, message.at, message.settings, message.series);
    } else if (message.type === 'pong') {
      const rtt = Date.now() - message.clientTime;
      if (rtt >= 0 && rtt <= 5000 && rtt <= this.bestClockRtt) {
        this.bestClockRtt = rtt;
        this.clockOffset = message.serverTime + rtt / 2 - Date.now();
      }
    } else if (message.type === 'error') this.options.onError(message.message);
    else if (message.type === 'relay') this.receiveRelay(message.data, message.from);
  }

  private announceCapture(id: string, at: number, settings: RoomSettings, series?: RoomCaptureSeries): void {
    if (this.announcedCapture === id) return;
    this.announcedCapture = id;
    this.options.onCapture({ captureId: id, at, settings, ...(series ? { series: { ...series } } : {}) });
  }

  private setCapture(id: string | null): void {
    if (id !== this.captureId) {
      this.transferGeneration++;
      this.captureId = id;
      this.directAssembler.setCapture(id);
      this.relayAssembler.setCapture(id);
      this.directResultAssembler.setCapture(id);
      this.relayResultAssembler.setCapture(id);
      this.relayCaptureId = null;
      this.receivedCaptureId = null;
      this.relayResultCaptureId = null;
      this.receivedResultCaptureId = null;
      this.announcedCapture = null;
    }
  }

  private bothPresent(): boolean {
    return !!this.state && this.state.participants.length === 2 && this.state.participants.every((participant) => participant.connected);
  }

  private startPeer(): void {
    if (this.peer || !this.stream || !this.bothPresent()) return;
    if (typeof RTCPeerConnection === 'undefined') return;
    let peer: RTCPeerConnection;
    try { peer = new RTCPeerConnection({ iceServers: this.iceServers }); }
    catch { return; }
    this.peer = peer;
    const generation = this.generation;
    for (const track of this.stream.getTracks()) peer.addTrack(track, this.stream);
    peer.onicecandidate = (event) => {
      if (peer !== this.peer || this.closed) return;
      this.send({ type: 'signal', data: { candidate: event.candidate?.toJSON() ?? null } });
    };
    peer.ontrack = (event) => {
      if (peer !== this.peer || this.closed) return;
      this.options.onRemoteStream(event.streams[0] ?? new MediaStream([event.track]));
    };
    peer.ondatachannel = (event) => { if (peer === this.peer) this.bindChannel(event.channel); };
    peer.onconnectionstatechange = () => {
      if (peer !== this.peer || this.closed) return;
      if (peer.connectionState === 'connected') {
        this.clearFallback();
        this.setMode('direct');
        this.setStatus('connected');
      } else if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        this.options.onRemoteStream(null);
        this.setMode('relay');
        this.setStatus(this.bothPresent() ? 'connected' : 'disconnected');
      }
    };
    if (this.state?.self === 'host') {
      this.bindChannel(peer.createDataChannel('fotbooth-originals', { ordered: true }));
      void (async () => {
        const description = await peer.createOffer();
        if (this.peer !== peer || generation !== this.generation || this.closed) return;
        await peer.setLocalDescription(description);
        if (this.peer !== peer || generation !== this.generation || this.closed) return;
        this.send({ type: 'signal', data: { description: peer.localDescription?.toJSON() ?? description } });
      })().catch(() => { if (this.peer === peer) this.scheduleFallback(); });
    }
  }

  private async applySignal(signal: RoomSignal, generation: number): Promise<void> {
    if (this.closed || generation !== this.generation || !this.bothPresent()) return;
    this.startPeer();
    const peer = this.peer;
    if (!peer) return;
    if (signal.description) {
      if (signal.description.type === 'offer' && this.state?.self !== 'guest') return;
      if (signal.description.type === 'answer' && (this.state?.self !== 'host' || peer.signalingState !== 'have-local-offer')) return;
      if (signal.description.type === 'offer' && peer.remoteDescription?.sdp === signal.description.sdp) return;
      await peer.setRemoteDescription(signal.description);
      if (peer !== this.peer || generation !== this.generation || this.closed) return;
      for (const candidate of this.queuedCandidates.splice(0)) await peer.addIceCandidate(candidate ?? undefined);
      if (signal.description.type === 'offer') {
        const answer = await peer.createAnswer();
        if (peer !== this.peer || generation !== this.generation || this.closed) return;
        await peer.setLocalDescription(answer);
        if (peer !== this.peer || generation !== this.generation || this.closed) return;
        this.send({ type: 'signal', data: { description: peer.localDescription?.toJSON() ?? answer } });
      }
    }
    if ('candidate' in signal) {
      if (!peer.remoteDescription) {
        if (this.queuedCandidates.length < 64) this.queuedCandidates.push(signal.candidate ?? null);
      } else await peer.addIceCandidate(signal.candidate ?? undefined);
    }
  }

  private bindChannel(channel: RTCDataChannel): void {
    this.channel?.close();
    this.channel = channel;
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = 65536;
    channel.onopen = () => {
      if (channel !== this.channel || this.closed) return;
      this.clearFallback(); this.setMode('direct'); this.setStatus('connected');
    };
    channel.onclose = () => {
      if (channel !== this.channel || this.closed || !this.bothPresent()) return;
      this.setMode('relay'); this.setStatus('connected');
    };
    channel.onmessage = (event) => {
      if (channel !== this.channel || this.closed) return;
      try {
        if (typeof event.data === 'string') {
          if (event.data.length > 2048) throw new Error('Photo metadata exceeds the limit.');
          const metadata = JSON.parse(event.data);
          this.beginTransfer(metadata, 'direct', metadata.type === 'result-start' ? 'result' : 'photo');
        } else if (event.data instanceof ArrayBuffer) this.receiveChunk(event.data, 'direct');
        else throw new Error('Photo chunk has an unsupported format.');
      } catch (error) { this.options.onError(errorMessage(error)); }
    };
  }

  private beginTransfer(metadata: unknown, source: 'direct' | 'relay', purpose: 'photo' | 'result'): void {
    const expectedType = purpose === 'result' ? 'result-start' : 'photo-start';
    if (!metadata || typeof metadata !== 'object' || (metadata as SnapshotMetadata).type !== expectedType)
      throw new Error('Invalid photo transfer purpose.');
    if (purpose === 'result' && this.state?.self !== 'guest') throw new Error('Only guests can receive the host result.');
    const received = purpose === 'result' ? this.receivedResultCaptureId : this.receivedCaptureId;
    const relayed = purpose === 'result' ? this.relayResultCaptureId : this.relayCaptureId;
    if (this.captureId && (received === this.captureId || (source === 'direct' && relayed === this.captureId))) return;
    const direct = purpose === 'result' ? this.directResultAssembler : this.directAssembler;
    const assembler = source === 'direct' ? direct : purpose === 'result' ? this.relayResultAssembler : this.relayAssembler;
    if (assembler.begin(metadata) && source === 'relay') {
      // Carriers have independent ordering; retire only this purpose's old direct carrier.
      if (purpose === 'result') this.relayResultCaptureId = this.captureId;
      else this.relayCaptureId = this.captureId;
      direct.setCapture(null);
    }
  }

  private receiveChunk(packet: ArrayBuffer, source: 'direct' | 'relay', kind?: 'photo' | 'result'): void {
    const prefix = decoder.decode(new Uint8Array(packet, 0, Math.min(4, packet.byteLength)));
    const purpose = prefix === 'FR01' ? 'result' : 'photo';
    if (prefix !== transferPrefix(purpose) || (kind && kind !== purpose)) throw new Error('Invalid photo chunk purpose.');
    if (purpose === 'result' && this.state?.self !== 'guest') throw new Error('Only guests can receive the host result.');
    const received = purpose === 'result' ? this.receivedResultCaptureId : this.receivedCaptureId;
    const relayed = purpose === 'result' ? this.relayResultCaptureId : this.relayCaptureId;
    if (this.captureId && (received === this.captureId || (source === 'direct' && relayed === this.captureId))) return;
    const assembler = purpose === 'result'
      ? source === 'direct' ? this.directResultAssembler : this.relayResultAssembler
      : source === 'direct' ? this.directAssembler : this.relayAssembler;
    const blob = assembler.push(packet);
    if (blob && this.captureId) {
      if (purpose === 'result') {
        this.receivedResultCaptureId = this.captureId;
        this.options.onResult?.(this.captureId, blob);
      } else {
        this.receivedCaptureId = this.captureId;
        this.options.onPhoto(this.captureId, blob);
      }
    }
  }

  private receiveRelay(value: string, from: RoomState['self']): void {
    if (!this.bothPresent() || typeof value !== 'string' || value.length > 24576) return;
    if (from !== (this.state?.self === 'host' ? 'guest' : 'host')) throw new Error('Invalid photo sender.');
    const message = JSON.parse(value);
    if (message.kind === 'photo-start' || message.kind === 'result-start') {
      this.beginTransfer(message, 'relay', message.kind === 'result-start' ? 'result' : 'photo');
    }
    else if (message.kind === 'photo-chunk' || message.kind === 'result-chunk') {
      const bytes = fromBase64(message.data, MAX_CHUNK_BYTES);
      this.receiveChunk(bytes.buffer, 'relay', message.kind === 'result-chunk' ? 'result' : 'photo');
    } else if (message.kind === 'preview' && message.mime === 'image/jpeg') {
      const bytes = fromBase64(message.data, 12000);
      if (!isJpeg(bytes)) throw new Error('Invalid JPEG preview.');
      this.options.onRemotePreview?.(new Blob([bytes], { type: 'image/jpeg' }));
    }
  }

  private relay(data: string): void {
    if (data.length > 24576 || !this.bothPresent() || this.socket?.readyState !== 1 || this.closed) throw new Error('Room tidak dapat mengirim foto.');
    this.send({ type: 'relay', data });
  }

  private canTransfer(id: string): boolean { return !this.closed && id === this.captureId && this.bothPresent() && this.socket?.readyState === 1; }

  private checkTransfer(id: string, generation: number): void {
    if (!this.canTransfer(id) || generation !== this.transferGeneration) throw new DOMException('Pengambilan foto dibatalkan (capture).', 'AbortError');
  }

  private async waitForBuffer(channel: RTCDataChannel, id: string, generation: number): Promise<void> {
    const deadline = Date.now() + 10000;
    while (channel.bufferedAmount > 262144) {
      this.checkTransfer(id, generation);
      if (channel.readyState !== 'open' || Date.now() >= deadline) throw new Error('Photo channel is unavailable.');
      await delay(25);
    }
    if (channel.readyState !== 'open') throw new Error('Photo channel is unavailable.');
  }

  private scheduleFallback(): void {
    if (this.fallbackTimer || !this.bothPresent()) return;
    this.fallbackTimer = setTimeout(() => {
      this.fallbackTimer = null;
      if (!this.closed && this.bothPresent() && this.peer?.connectionState !== 'connected') {
        this.setMode('relay'); this.setStatus('connected');
      }
    }, 8000);
  }

  private clearFallback(): void { if (this.fallbackTimer) clearTimeout(this.fallbackTimer); this.fallbackTimer = null; }
  private cancelTimers(): void { this.clearFallback(); if (this.pingTimer) clearInterval(this.pingTimer); this.pingTimer = null; }
  private setMode(mode: 'direct' | 'relay'): void { if (mode !== this.mode) { this.mode = mode; this.options.onMode?.(mode); } }
  private setStatus(status: 'connecting' | 'connected' | 'disconnected'): void {
    this.status = status;
    this.options.onConnection(status, this.relayAvailable);
  }
  private dropPeer(): void {
    this.generation++;
    this.transferGeneration++;
    this.directAssembler.setCapture(null);
    this.directAssembler.setCapture(this.captureId);
    this.relayAssembler.setCapture(null);
    this.relayAssembler.setCapture(this.captureId);
    this.directResultAssembler.setCapture(null);
    this.directResultAssembler.setCapture(this.captureId);
    this.relayResultAssembler.setCapture(null);
    this.relayResultAssembler.setCapture(this.captureId);
    this.relayCaptureId = null;
    this.receivedCaptureId = null;
    this.relayResultCaptureId = null;
    this.receivedResultCaptureId = null;
    this.queuedCandidates = [];
    const peer = this.peer, channel = this.channel;
    this.peer = null; this.channel = null;
    channel?.close(); peer?.close();
    this.options.onRemoteStream(null);
  }
}

function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Koneksi room mengalami masalah.'; }
function delay(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }
function transferPrefix(purpose: 'photo' | 'result'): string { return purpose === 'result' ? 'FR01' : 'FP01'; }
function encodeChunk(transferId: string, offset: number, bytes: Uint8Array, purpose: 'photo' | 'result' = 'photo'): ArrayBuffer {
  const packet = new Uint8Array(CHUNK_HEADER_BYTES + bytes.length);
  packet.set(encoder.encode(transferPrefix(purpose) + transferId));
  new DataView(packet.buffer).setUint32(40, offset);
  packet.set(bytes, CHUNK_HEADER_BYTES);
  return packet.buffer;
}
function toBase64(bytes: Uint8Array): string {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}
function fromBase64(value: unknown, maximum: number): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || value.length > Math.ceil(maximum / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error('Invalid photo relay encoding.');
  }
  const decoded = atob(value);
  if (decoded.length > maximum) throw new Error('Photo relay exceeds the limit.');
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}
function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes.at(-2) === 255 && bytes.at(-1) === 217;
}
