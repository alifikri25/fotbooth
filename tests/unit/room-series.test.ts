import { expect, it } from 'vitest';
import { RoomCoordinator, RoomError, createRoomRecord, parseRoomMessage } from '../../worker/rooms';
import { definitions } from '../../src/frames/definitions';

const settings = { frameId: 'orbit-club', scene: 'studio', cutout: true } as const;
function pair(frameId = settings.frameId as string) {
  let now = 1000;
  const record = createRoomRecord({ name: 'Host', settings: { ...settings, frameId } }, now);
  const coordinator = new RoomCoordinator(record, () => now);
  coordinator.connect(record.hostToken, 'host-browser', 'Host');
  coordinator.connect(record.guestToken, 'guest-browser', 'Guest');
  coordinator.handle('host', { type: 'ready', ready: true });
  coordinator.handle('guest', { type: 'ready', ready: true });
  return { coordinator, record, setTime: (value: number) => { now = value; } };
}
function errorCode(action: () => unknown) {
  try { action(); } catch (error) { expect(error).toBeInstanceOf(RoomError); return (error as RoomError).code; }
  return undefined;
}
function advance(coordinator: RoomCoordinator, role: 'host' | 'guest', captureId: string) {
  return coordinator.handle(role, { type: 'advance', captureId } as any);
}
function acknowledge(coordinator: RoomCoordinator, captureId: string) {
  coordinator.handle('host', { type: 'captured', captureId });
  coordinator.handle('guest', { type: 'captured', captureId });
}

it('accepts all 80 prepared frames and the three dedicated frames, while rejecting arbitrary IDs', () => {
  for (const frameId of [...definitions.map((frame) => frame.id), 'online-satu-tempat', 'online-surat-rindu', 'online-night-date'])
    expect(createRoomRecord({ name: 'Host', settings: { ...settings, frameId } }).settings.frameId).toBe(frameId);
  for (const frameId of ['frame-1', 'classic-strip', 'unknown-valid-looking'])
    expect(errorCode(() => createRoomRecord({ name: 'Host', settings: { ...settings, frameId } }))).toBe('invalid_settings');
});

it.each([['concert-pass', 2], ['orbit-club', 3], ['pocket-arcade', 4]] as const)('derives the %s frame sequence with %i distinct poses', (frameId, total) => {
  const { coordinator } = pair(frameId);
  const events = coordinator.handle('host', { type: 'capture' });
  const capture = coordinator.state('host').capture as any;
  expect(capture.series).toEqual({ seriesId: expect.any(String), index: 0, total });
  expect(capture.series.seriesId).toBeTruthy();
  expect(events[0]).toMatchObject({ to: 'all', message: { type: 'capture', captureId: capture.id, at: 5000, series: capture.series } });
  expect(coordinator.state('guest').capture).toEqual(capture);
});

it('advances only the current both-acknowledged shot and gives each slot a fresh countdown/ID', () => {
  const { coordinator, setTime } = pair();
  coordinator.handle('host', { type: 'capture' });
  const first = coordinator.state('host').capture as any;
  expect(errorCode(() => advance(coordinator, 'guest', first.id))).toBe('host_only');
  expect(errorCode(() => advance(coordinator, 'host', 'old-id'))).toBe('stale_capture');
  expect(errorCode(() => advance(coordinator, 'host', first.id))).toBe('not_captured');
  coordinator.handle('host', { type: 'captured', captureId: first.id });
  expect(errorCode(() => advance(coordinator, 'host', first.id))).toBe('not_captured');
  coordinator.handle('guest', { type: 'captured', captureId: first.id });
  setTime(6000);
  const events = advance(coordinator, 'host', first.id);
  const second = coordinator.state('host').capture as any;
  expect(second).toEqual({ id: expect.any(String), at: 10000, series: { seriesId: first.series.seriesId, index: 1, total: 3 } });
  expect(second.id).not.toBe(first.id);
  expect(coordinator.state('host').phase).toBe('countdown');
  expect(events[0]).toMatchObject({ to: 'all', message: { type: 'capture', captureId: second.id, at: 10000, settings, series: second.series } });
  expect(errorCode(() => coordinator.handle('guest', { type: 'captured', captureId: first.id }))).toBe('stale_capture');
  acknowledge(coordinator, second.id);
  setTime(11000);
  advance(coordinator, 'host', second.id);
  const third = coordinator.state('host').capture as any;
  expect(third.series).toEqual({ seriesId: first.series.seriesId, index: 2, total: 3 });
  expect(third.at).toBe(15000);
  expect(new Set([first.id, second.id, third.id]).size).toBe(3);
  acknowledge(coordinator, third.id);
  expect(errorCode(() => advance(coordinator, 'host', third.id))).toBe('series_complete');
  expect(coordinator.state('host').capture).toEqual(third);
});

it.each(['retake', 'settings', 'not-ready', 'disconnect'] as const)('%s aborts the sequence and a restart receives a new series ID', (abort) => {
  const { coordinator, record } = pair();
  coordinator.handle('host', { type: 'capture' });
  const first = coordinator.state('host').capture as any;
  acknowledge(coordinator, first.id);
  advance(coordinator, 'host', first.id);
  const current = coordinator.state('host').capture!.id;
  if (abort === 'retake') coordinator.handle('guest', { type: 'retake' });
  if (abort === 'settings') coordinator.handle('host', { type: 'settings', settings: { ...settings, scene: 'night' } });
  if (abort === 'not-ready') coordinator.handle('guest', { type: 'ready', ready: false });
  if (abort === 'disconnect') coordinator.disconnect('guest', 'guest-browser');
  expect(coordinator.state('host').capture).toBeUndefined();
  expect(coordinator.state('host').phase).toBe('waiting');
  expect(errorCode(() => advance(coordinator, 'host', current))).toBe('stale_capture');
  if (abort === 'disconnect') coordinator.connect(record.guestToken, 'guest-browser', 'Guest');
  coordinator.handle('host', { type: 'ready', ready: true });
  coordinator.handle('guest', { type: 'ready', ready: true });
  coordinator.handle('host', { type: 'capture' });
  const restarted = coordinator.state('host').capture as any;
  expect(restarted.series.index).toBe(0);
  expect(restarted.series.seriesId).not.toBe(first.series.seriesId);
});

it('restores sequence position and acknowledgements after Durable Object hibernation', () => {
  const { coordinator } = pair('pocket-arcade');
  coordinator.handle('host', { type: 'capture' });
  const first = coordinator.state('host').capture as any;
  acknowledge(coordinator, first.id);
  advance(coordinator, 'host', first.id);
  const second = coordinator.state('host').capture as any;
  coordinator.handle('host', { type: 'captured', captureId: second.id });
  const restored = new RoomCoordinator(JSON.parse(JSON.stringify(coordinator.record)), () => 9000);
  expect(restored.state('guest').capture).toEqual(second);
  expect(errorCode(() => advance(restored, 'host', second.id))).toBe('not_captured');
  restored.handle('guest', { type: 'captured', captureId: second.id });
  advance(restored, 'host', second.id);
  expect((restored.state('guest').capture as any).series).toEqual({ seriesId: first.series.seriesId, index: 2, total: 4 });
});

it('keeps dedicated and legacy single-shot wire shapes without series metadata', () => {
  const { coordinator } = pair('online-satu-tempat');
  const events = coordinator.handle('host', { type: 'capture' });
  const capture = coordinator.state('host').capture!;
  expect(capture).toEqual({ id: expect.any(String), at: 5000 });
  expect(events[0]).toEqual({ to: 'all', message: { type: 'capture', captureId: capture.id, at: 5000, settings: { ...settings, frameId: 'online-satu-tempat' } } });
  acknowledge(coordinator, capture.id);
  const restored = new RoomCoordinator(JSON.parse(JSON.stringify(coordinator.record)), () => 9000);
  expect(restored.state('host').capture).toEqual(capture);
  expect(errorCode(() => advance(restored, 'host', capture.id))).toBe('series_complete');
});

it('parses only bounded advance commands and leaves image relay payloads out of stored series metadata', () => {
  expect(parseRoomMessage('{"type":"advance","captureId":"current-id"}')).toEqual({ type: 'advance', captureId: 'current-id' });
  for (const captureId of ['', 'x'.repeat(81), 23])
    expect(() => parseRoomMessage(JSON.stringify({ type: 'advance', captureId }))).toThrow();
  const { coordinator } = pair();
  coordinator.handle('host', { type: 'capture' });
  const before = JSON.stringify(coordinator.record);
  coordinator.handle('host', { type: 'relay', data: 'transient-original-or-result-payload' });
  expect(JSON.stringify(coordinator.record)).toBe(before);
});
