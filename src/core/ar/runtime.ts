import type { ARDetection, ARKind } from './types';
const stopped = () => new DOMException('Efek AR dihentikan.', 'AbortError');
export class ARRuntime {
  private worker?: Worker;
  private detector?: import('./detector').ARDetector;
  private sequence = 0;
  private closed = false;
  private queue = Promise.resolve();
  private pending = new Map<
    number,
    {
      resolve: (value: ARDetection) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
      canvas: HTMLCanvasElement;
      kind: ARKind;
    }
  >();
  constructor() {
    // Older Safari releases lack worker WebGL. Use the same bounded detector on the main thread.
    if (typeof OffscreenCanvas === 'undefined') return;
    const probe = new OffscreenCanvas(1, 1),
      gl = probe.getContext('webgl2');
    if (!gl) return;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'Fotbooth AR',
    });
    this.worker.onmessage = (
      event: MessageEvent<{ id: number; result?: ARDetection; error?: string }>,
    ) => {
      if (event.data.error) this.fallbackFromWorker();
      else this.settle(event.data.id, event.data.result);
    };
    this.worker.onerror = () => this.fallbackFromWorker();
  }
  infer(image: CanvasImageSource, kind: ARKind): Promise<ARDetection> {
    const task = this.queue.then(async () => {
      if (this.closed) throw stopped();
      const input = image as HTMLVideoElement & HTMLImageElement & HTMLCanvasElement;
      const w = input.videoWidth || input.naturalWidth || input.width,
        h = input.videoHeight || input.naturalHeight || input.height;
      const scale = Math.min(1, 640 / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        const bitmap = await createImageBitmap(canvas);
        if (this.closed) {
          bitmap.close();
          throw stopped();
        }
        return await new Promise<ARDetection>((resolve, reject) => {
          const id = ++this.sequence;
          const timer = setTimeout(
            () =>
              this.fail(new Error('Efek AR terlalu lama dimuat. Coba lagi atau pilih Tanpa AR.')),
            45000,
          );
          this.pending.set(id, { resolve, reject, timer, canvas, kind });
          if (this.worker) {
            try {
              this.worker.postMessage({ id, kind, image: bitmap }, [bitmap]);
            } catch {
              bitmap.close();
              this.fallbackFromWorker();
            }
          } else void this.inferLocally(id, bitmap, kind);
        });
      } finally {
        canvas.width = canvas.height = 1;
      }
    });
    this.queue = task.then(
      () => {},
      () => {},
    );
    return task;
  }
  private settle(id: number, result?: ARDetection, error?: Error) {
    const request = this.pending.get(id);
    if (!request) return;
    clearTimeout(request.timer);
    this.pending.delete(id);
    if (error) request.reject(error);
    else request.resolve(result!);
  }
  private fallbackFromWorker() {
    if (!this.worker || this.closed) return;
    const worker = this.worker;
    this.worker = undefined;
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
    for (const [id, request] of this.pending) {
      // A main-thread feature probe cannot prove worker GPU support. Retain the same
      // bounded frame until inference settles so a worker failure can retry it locally.
      void (async () => {
        try {
          const bitmap = await createImageBitmap(request.canvas);
          if (this.closed || !this.pending.has(id)) {
            bitmap.close();
            return;
          }
          await this.inferLocally(id, bitmap, request.kind);
        } catch (error) {
          this.settle(
            id,
            undefined,
            error instanceof Error ? error : new Error('Efek AR belum bisa dimuat.'),
          );
        }
      })();
    }
  }
  private async inferLocally(id: number, bitmap: ImageBitmap, kind: ARKind) {
    try {
      if (!this.detector) {
        const { ARDetector } = await import('./detector');
        if (this.closed) throw stopped();
        this.detector = new ARDetector();
      }
      const result = await this.detector.infer(bitmap, kind);
      this.settle(id, result, this.closed ? stopped() : undefined);
    } catch (error) {
      this.settle(
        id,
        undefined,
        error instanceof Error ? error : new Error('Efek AR belum bisa dimuat.'),
      );
    } finally {
      bitmap.close();
      if (this.closed) this.detector?.close();
    }
  }
  private fail(error: Error) {
    this.closed = true;
    this.worker?.terminate();
    this.detector?.close();
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    this.pending.clear();
  }
  close() {
    this.fail(stopped());
  }
}
