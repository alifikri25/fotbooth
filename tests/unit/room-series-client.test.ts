import { afterEach, expect, it, vi } from 'vitest';
import { RoomConnection } from '../../src/core/room/client';

class TestSocket {
  static instance: TestSocket;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  constructor() { TestSocket.instance = this; queueMicrotask(() => { this.readyState = 1; this.onopen?.(); }); }
  send() {}
  close() { this.readyState = 3; this.onclose?.({ code: 1000 }); }
  receive(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
}
afterEach(() => vi.unstubAllGlobals());

it('preserves series metadata from live capture events and restored countdown state without duplicate shutters', async () => {
  vi.stubGlobal('WebSocket', TestSocket);
  vi.stubGlobal('RTCPeerConnection', undefined);
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ iceServers: [], relayAvailable: false })));
  const shots: any[] = [];
  const room = new RoomConnection({ apiBase: 'http://127.0.0.1:8787', roomId: 'room-1', token: 'private', name: 'Host',
    onState() {}, onRemoteStream() {}, onConnection() {}, onPhoto() {}, onError() {}, onCapture: (shot) => shots.push(shot) });
  const settings = { frameId: 'orbit-club', scene: 'studio', cutout: true };
  const series = { seriesId: 'series-1', index: 0, total: 3 };
  const state = { type: 'state', self: 'host', roomId: 'room-1', expiresAt: 900000, settings, phase: 'countdown',
    capture: { id: 'first', at: 5000, series },
    participants: [{ role: 'host', name: 'Host', ready: true, connected: true }, { role: 'guest', name: 'Guest', ready: true, connected: true }] };
  await room.connect({ getTracks: () => [] } as unknown as MediaStream);
  try {
    TestSocket.instance.receive(state);
    TestSocket.instance.receive({ type: 'capture', captureId: 'first', at: 5000, settings, series });
    expect(shots).toEqual([{ captureId: 'first', at: 5000, settings, series }]);
    const nextSeries = { ...series, index: 1 };
    TestSocket.instance.receive({ type: 'capture', captureId: 'second', at: 10000, settings, series: nextSeries });
    TestSocket.instance.receive({ ...state, capture: { id: 'second', at: 10000, series: nextSeries } });
    expect(shots).toEqual([{ captureId: 'first', at: 5000, settings, series }, { captureId: 'second', at: 10000, settings, series: nextSeries }]);
    TestSocket.instance.receive({ ...state, phase: 'waiting', capture: undefined });
    TestSocket.instance.receive({ type: 'capture', captureId: 'legacy', at: 15000, settings });
    expect(shots.at(-1)).toEqual({ captureId: 'legacy', at: 15000, settings });
  } finally { room.close(); }
});
