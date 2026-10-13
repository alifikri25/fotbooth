import { useEffect, useRef } from 'react';
import { decodeSource } from '../core/ingest';
import { renderComposition } from '../core/renderer';
import type { Crop, FrameDefinition, PhotoAsset, SlotDefinition } from '../core/types';
import type { ARSnapshot } from '../core/ar/types';

export function CameraPhoto(p: {
  frame: FrameDefinition;
  slot: SlotDefinition;
  crop: Crop;
  photo?: PhotoAsset;
  blob?: Blob;
  ar?: ARSnapshot;
  label: string;
  maxEdge?: number;
  onReady?: (ready: boolean) => void;
  onError?: (message: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { frame, slot, crop, photo, blob, ar, maxEdge = 720, onReady, onError } = p;
  useEffect(() => {
    let active = true;
    const surface = document.createElement('canvas');
    onReady?.(false);
    void (async () => {
      const source = photo
        ? { image: photo.preview, width: photo.width, height: photo.height, ar: photo.ar }
        : { ...(await decodeSource(blob!)), ar };
      // renderComposition owns release once invoked; an early unmount still releases the decode.
      if (!active) {
        if ('release' in source) source.release?.();
        return;
      }
      const sw = slot.w * frame.designWidth,
        sh = slot.h * frame.designHeight;
      const scale = Math.min(1, maxEdge / Math.max(sw, sh));
      const previewFrame: FrameDefinition = {
        ...frame,
        designWidth: sw,
        designHeight: sh,
        slots: [{ ...slot, x: 0, y: 0, w: 1, h: 1, rotationDeg: 0 }],
        layers: { background: '', foreground: '' },
        textAreas: [],
      };
      await renderComposition(
        surface,
        previewFrame,
        {
          placements: [{ ...crop, slotId: slot.id, photoId: 'review' }],
          caption: '',
          date: '',
        },
        async () => source,
        Math.max(1, Math.round(sw * scale)),
        Math.max(1, Math.round(sh * scale)),
      );
      if (!active || !canvas.current) return;
      canvas.current.width = surface.width;
      canvas.current.height = surface.height;
      canvas.current.getContext('2d')!.drawImage(surface, 0, 0);
      onReady?.(true);
    })()
      .catch(() => {
        if (active) onError?.('Foto belum bisa ditampilkan. Coba ambil ulang.');
      })
      .finally(() => {
        surface.width = surface.height = 1;
      });
    return () => {
      active = false;
    };
  }, [frame, slot, crop, photo, blob, ar, maxEdge, onReady, onError]);
  return (
    <canvas ref={canvas} role="img" aria-label={p.label} data-photo-id={photo?.id ?? 'draft'} />
  );
}
