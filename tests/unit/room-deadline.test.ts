import { afterEach, expect, it, vi } from 'vitest';

const helperPath = '../../src/core/room/capture-deadline';
const helpers = (await import(helperPath).catch(() => ({}))) as Record<string, any>;
afterEach(() => vi.useRealTimers());

function deadline() {
  expect(helpers.CaptureDeadline).toBeTypeOf('function');
  return new helpers.CaptureDeadline();
}

it('gives the final PNG a fresh bounded minute after both originals arrive', async () => {
  vi.useFakeTimers();
  const timer = deadline(),
    expired: string[] = [];
  timer.arm('shot-4', 0, 0, (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(44000);
  expect(timer.armResult).toBeTypeOf('function');
  timer.armResult('shot-4', (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(59999);
  expect(expired).toEqual([]);
  await vi.advanceTimersByTimeAsync(1);
  expect(expired).toEqual(['shot-4']);
  expect(vi.getTimerCount()).toBe(0);
});

it('retaking cancels a pending final PNG deadline', async () => {
  vi.useFakeTimers();
  const timer = deadline(),
    expired: string[] = [];
  expect(timer.armResult).toBeTypeOf('function');
  timer.armResult('old-result', (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(30000);
  timer.arm('new-shot', 0, 0, (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(30000);
  expect(expired).toEqual([]);
  await vi.advanceTimersByTimeAsync(15000);
  expect(expired).toEqual(['new-shot']);
});

it('times out a stalled capture 45 seconds after its synchronized shutter time', async () => {
  vi.useFakeTimers();
  const timer = deadline(),
    expired: string[] = [];
  timer.arm('shot-1', 14000, 10000, (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(48999);
  expect(expired).toEqual([]);
  await vi.advanceTimersByTimeAsync(1);
  expect(expired).toEqual(['shot-1']);
  expect(vi.getTimerCount()).toBe(0);
});

it('starts the timeout now when the synchronized shutter time already passed', async () => {
  vi.useFakeTimers();
  const timer = deadline(),
    expired: string[] = [];
  timer.arm('past-shot', 10000, 12000, (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(44999);
  expect(expired).toEqual([]);
  await vi.advanceTimersByTimeAsync(1);
  expect(expired).toEqual(['past-shot']);
});

it('suppresses timeout after completed capture or leaving the room cancels it', async () => {
  vi.useFakeTimers();
  const timer = deadline(),
    expired: string[] = [];
  timer.arm('shot-1', 14000, 10000, (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(15000);
  timer.cancel();
  await vi.advanceTimersByTimeAsync(60000);
  expect(expired).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it('replaces the old capture deadline when the couple retakes the photo', async () => {
  vi.useFakeTimers();
  const timer = deadline(),
    expired: string[] = [];
  timer.arm('shot-1', 14000, 10000, (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(20000);
  timer.arm('shot-2', 34000, 30000, (id: string) => expired.push(id));
  await vi.advanceTimersByTimeAsync(29000);
  expect(expired).toEqual([]);
  await vi.advanceTimersByTimeAsync(20000);
  expect(expired).toEqual(['shot-2']);
});

it('clears the expired capture before a timeout callback arms another capture', async () => {
  vi.useFakeTimers();
  const timer = deadline(),
    expired: string[] = [];
  timer.arm('shot-1', 0, 0, (id: string) => {
    expired.push(id);
    timer.arm('shot-2', 0, 0, (next: string) => expired.push(next));
  });
  await vi.advanceTimersByTimeAsync(45000);
  expect(vi.getTimerCount()).toBe(1);
  await vi.advanceTimersByTimeAsync(45000);
  expect(expired).toEqual(['shot-1', 'shot-2']);
});

it.each([
  [1280, 720, { width: 256, height: 144 }],
  [720, 1280, { width: 144, height: 256 }],
  [1024, 768, { width: 256, height: 192 }],
  [120, 80, { width: 120, height: 80 }],
  [0, 720, { width: 256, height: 192 }],
  [1280, -1, { width: 256, height: 192 }],
  [Infinity, 720, { width: 256, height: 192 }],
  [NaN, NaN, { width: 256, height: 192 }],
])(
  'preserves bounded preview geometry for camera dimensions %s × %s',
  (width, height, expected) => {
    expect(helpers.previewSize).toBeTypeOf('function');
    expect(helpers.previewSize(width, height)).toEqual(expected);
  },
);
