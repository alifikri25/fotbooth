import { canvasBlob } from './ingest';
export type CameraState =
  'idle' | 'requesting' | 'live' | 'counting' | 'capturing' | 'stopped' | 'error';
const aborted = () => new DOMException('Kamera dihentikan.', 'AbortError');
function cameraError(error: unknown) {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return new Error('Akses kamera belum diizinkan. Kamu tetap bisa memilih foto dari perangkat.');
  if (name === 'NotFoundError')
    return new Error(
      'Perangkat ini belum memiliki kamera yang tersedia. Pilih foto dari perangkat.',
    );
  if (name === 'NotReadableError')
    return new Error('Kamera belum bisa dibuka. Coba tutup aplikasi yang sedang memakainya.');
  return error instanceof Error
    ? error
    : new Error('Kamera belum bisa dibuka. Kamu tetap bisa memilih foto dari perangkat.');
}
export class CameraController {
  state: CameraState = 'idle';
  private generation = 0;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private timers = new Map<ReturnType<typeof setTimeout>, (error: Error) => void>();
  constructor(
    private devices: Pick<MediaDevices, 'getUserMedia'> | undefined = typeof navigator !==
    'undefined'
      ? navigator.mediaDevices
      : undefined,
  ) {}
  private sleep(ms: number, token: number) {
    return new Promise<void>((resolve, reject) => {
      if (token !== this.generation) {
        reject(aborted());
        return;
      }
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        token === this.generation ? resolve() : reject(aborted());
      }, ms);
      this.timers.set(timer, reject);
    });
  }
  private invalidate() {
    this.generation++;
    for (const [timer, reject] of this.timers) {
      clearTimeout(timer);
      reject(aborted());
    }
    this.timers.clear();
  }
  stop() {
    this.invalidate();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }
    this.state = 'stopped';
  }
  cancelCapture() {
    this.invalidate();
    this.state = this.stream ? 'live' : 'stopped';
  }
  async open(video: HTMLVideoElement, options: MediaTrackConstraints) {
    this.stop();
    const token = this.generation;
    this.state = 'requesting';
    try {
      if (!this.devices?.getUserMedia)
        throw new Error(
          'Kamera belum tersedia di browser ini. Buka melalui HTTPS atau gunakan foto dari perangkat.',
        );
      const stream = await this.devices.getUserMedia({ video: options, audio: false });
      if (token !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        throw aborted();
      }
      this.stream = stream;
      this.video = video;
      video.srcObject = stream;
      await video.play();
      const start = Date.now();
      while (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
        if (Date.now() - start >= 8000)
          throw new Error('Kamera belum siap. Coba buka kamera lagi atau pilih foto.');
        await this.sleep(50, token);
      }
      if (token !== this.generation) throw aborted();
      this.state = 'live';
    } catch (error) {
      if (token !== this.generation) throw aborted();
      this.stop();
      this.state = 'error';
      throw cameraError(error);
    }
  }
  async capture(timer: number, onCount: (remaining: number) => void): Promise<Blob> {
    if (this.state !== 'live' || !this.video?.videoWidth || !this.video.videoHeight)
      throw new Error('Kamera belum siap. Buka kamera terlebih dulu.');
    const token = this.generation,
      video = this.video;
    this.state = 'counting';
    try {
      for (let n = timer; n > 0; n--) {
        onCount(n);
        await this.sleep(1000, token);
      }
      onCount(0);
      if (token !== this.generation) throw aborted();
      this.state = 'capturing';
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      try {
        canvas.getContext('2d')!.drawImage(video, 0, 0);
        const blob = await canvasBlob(canvas, 'image/jpeg', 0.95);
        if (token !== this.generation) throw aborted();
        this.state = 'live';
        return blob;
      } finally {
        canvas.width = 1;
        canvas.height = 1;
      }
    } catch (error) {
      if (token === this.generation && this.stream) this.state = 'live';
      throw error;
    }
  }
}
