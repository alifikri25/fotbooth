import { afterEach, expect, it, vi } from 'vitest';
import { CameraController } from '../../src/core/camera';
function media() {
  const track = {
    stopped: false,
    stop() {
      this.stopped = true;
    },
  };
  return { track, stream: { getTracks: () => [track] } as unknown as MediaStream };
}
const video = () =>
  ({
    srcObject: null,
    videoWidth: 640,
    videoHeight: 480,
    readyState: 3,
    play: async () => {},
    pause: () => {},
  }) as unknown as HTMLVideoElement;
afterEach(() => vi.useRealTimers());
it('requests video without microphone and stops the old stream before reopening', async () => {
  const first = media(),
    second = media();
  let call = 0;
  const constraints: MediaStreamConstraints[] = [];
  const c = new CameraController({
    getUserMedia: async (options) => {
      constraints.push(options!);
      if (call++ === 0) return first.stream;
      expect(first.track.stopped).toBe(true);
      return second.stream;
    },
  });
  await c.open(video(), { facingMode: 'user' });
  await c.open(video(), { facingMode: 'environment' });
  expect(constraints.every((o) => o.audio === false)).toBe(true);
  c.stop();
  expect(second.track.stopped).toBe(true);
  expect(c.state).toBe('stopped');
});
it('releases a stream that arrives after the user already left', async () => {
  const late = media();
  let resolve!: (stream: MediaStream) => void;
  const c = new CameraController({
    getUserMedia: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  const opening = c.open(video(), { facingMode: 'user' });
  const outcome = opening.catch((e) => e.name);
  c.stop();
  resolve(late.stream);
  expect(await outcome).toBe('AbortError');
  expect(late.track.stopped).toBe(true);
});
it('reports permission failure and keeps upload as a separate available route', async () => {
  const c = new CameraController({
    getUserMedia: async () => {
      throw new DOMException('Denied', 'NotAllowedError');
    },
  });
  await expect(c.open(video(), {})).rejects.toThrow(/izin/i);
  expect(c.state).toBe('error');
});
it('cancels countdown before any capture and releases camera tracks immediately', async () => {
  vi.useFakeTimers();
  const m = media(),
    c = new CameraController({ getUserMedia: async () => m.stream });
  await c.open(video(), {});
  const counts: number[] = [];
  const capture = c.capture(3, (n) => counts.push(n)).catch((e) => e.name);
  await vi.advanceTimersByTimeAsync(1000);
  c.stop();
  await vi.advanceTimersByTimeAsync(5000);
  expect(await capture).toBe('AbortError');
  expect(counts).toEqual([3, 2]);
  expect(m.track.stopped).toBe(true);
});
it('times out video readiness and stops tracks instead of capturing a black frame', async () => {
  vi.useFakeTimers();
  const m = media(),
    c = new CameraController({ getUserMedia: async () => m.stream }),
    v = video();
  Object.defineProperty(v, 'videoWidth', { value: 0 });
  const opening = c.open(v, {}).catch((e) => e.message);
  await vi.advanceTimersByTimeAsync(9000);
  expect(await opening).toMatch(/siap/i);
  expect(m.track.stopped).toBe(true);
});
