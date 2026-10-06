import type { FrameDefinition, Session } from './types';
import { canvasBlob } from './ingest';
import { renderComposition } from './renderer';
import { ensureFonts } from './text';
import { PhotoRegistry } from './resources';
export type ExportFormat = 'png' | 'jpg';
export type ExportSize = 'standard' | 'light';
export function exportFilename(frameId: string, date: Date, format: ExportFormat) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `photobooth-${frameId}-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.${format}`;
}
export function outputSize(frame: FrameDefinition, size: ExportSize) {
  const scale = size === 'light' ? 0.5 : 1;
  return { width: frame.designWidth * scale, height: frame.designHeight * scale };
}
export class ExportManager {
  private running = false;
  async run(
    session: Session,
    frame: FrameDefinition,
    photos: PhotoRegistry,
    format: ExportFormat,
    size: ExportSize,
  ) {
    if (this.running) throw new Error('Hasil fotomu sedang disiapkan.');
    if (frame.slots.some((s) => !session.placements.some((p) => p.slotId === s.id)))
      throw new Error('Tambahkan foto untuk bagian yang masih kosong.');
    const snapshot = structuredClone(session);
    this.running = true;
    const canvas = document.createElement('canvas');
    try {
      await ensureFonts();
      const dims = outputSize(frame, size);
      await renderComposition(canvas, frame, snapshot, photos.full, dims.width, dims.height);
      return await canvasBlob(canvas, format === 'jpg' ? 'image/jpeg' : 'image/png', 0.92);
    } finally {
      this.running = false;
      canvas.width = 1;
      canvas.height = 1;
    }
  }
}
