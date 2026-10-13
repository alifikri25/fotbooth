/** Bounds the wait for both originals and the composed result after the shared shutter. */
export class CaptureDeadline {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private activeId: string | null = null;
  private generation = 0;

  arm(
    captureId: string,
    at: number,
    serverNow: number,
    onTimeout: (captureId: string) => void,
  ): void {
    this.start(captureId, Math.max(0, at - serverNow) + 45000, onTimeout);
  }

  /** A detailed catalogue PNG can take longer to encode and relay than one portrait. */
  armResult(captureId: string, onTimeout: (captureId: string) => void): void {
    this.start(captureId, 60000, onTimeout);
  }

  private start(captureId: string, wait: number, onTimeout: (captureId: string) => void): void {
    this.cancel();
    this.activeId = captureId;
    const generation = this.generation;
    this.timer = setTimeout(() => {
      if (this.activeId !== captureId || this.generation !== generation) return;
      this.timer = null;
      this.activeId = null;
      onTimeout(captureId);
    }, wait);
  }

  cancel(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.activeId = null;
    this.generation++;
  }
}

/** Keeps relay portraits in their camera aspect ratio and within a 256px long edge. */
export function previewSize(width: number, height: number): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return { width: 256, height: 192 };
  const scale = Math.min(1, 256 / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
