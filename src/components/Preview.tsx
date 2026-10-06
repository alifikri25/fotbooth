import { useEffect, useRef, useState } from 'react';
import type { FrameDefinition, Session, Crop } from '../core/types';
import { clampPlacement, toSlotLocal, coverRect, effectiveDimensions } from '../core/geometry';
import { renderComposition, slotPath } from '../core/renderer';
import { ensureFonts } from '../core/text';
import type { PhotoRegistry } from '../core/resources';
export function Preview({
  frame,
  session,
  photos,
  activeSlot,
  onSelect,
  onCrop,
  onReady,
  interactive = true,
}: {
  frame: FrameDefinition;
  session: Session;
  photos: PhotoRegistry;
  activeSlot: string;
  onSelect: (id: string) => void;
  onCrop: (id: string, patch: Partial<Crop>, commit: boolean) => void;
  onReady: (ready: boolean, error?: string) => void;
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null),
    wrap = useRef<HTMLDivElement>(null),
    generation = useRef(0);
  const [width, setWidth] = useState(250);
  const drag = useRef<{
    slotId: string;
    start: { x: number; y: number };
    crop: Crop;
    scale: number;
    effective: { width: number; height: number };
    latest: Crop;
  } | null>(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    if (wrap.current) observer.observe(wrap.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const token = ++generation.current;
    onReady(false);
    const pending = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2),
      w = Math.round(Math.min(width * dpr, (1600 * frame.designWidth) / frame.designHeight)),
      h = Math.round((w * frame.designHeight) / frame.designWidth);
    ensureFonts()
      .then(() => renderComposition(pending, frame, session, photos.preview, w, h))
      .then(() => {
        if (token !== generation.current) return;
        const target = canvasRef.current;
        if (!target) return;
        target.width = w;
        target.height = h;
        target.getContext('2d')!.drawImage(pending, 0, 0);
        onReady(true);
      })
      .catch((error: Error) => {
        if (token === generation.current)
          onReady(
            false,
            error.message.includes('Teks')
              ? error.message
              : 'Frame belum bisa dimuat. Coba lagi atau pilih frame lain.',
          );
      })
      .finally(() => {
        pending.width = 1;
        pending.height = 1;
      });
    return () => {
      generation.current++;
    };
  }, [frame, session, width, photos, onReady]);
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * frame.designWidth,
      y: ((event.clientY - rect.top) / rect.height) * frame.designHeight,
    };
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!interactive) return;
    const p = point(event),
      ctx = event.currentTarget.getContext('2d')!;
    for (const slot of [...frame.slots].reverse()) {
      const local = toSlotLocal(p, slot, frame),
        sw = slot.w * frame.designWidth,
        sh = slot.h * frame.designHeight;
      // hit testing uses identity transform and the same curated path as rendering.
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const hit = ctx.isPointInPath(slotPath(slot, sw, sh), local.x, local.y);
      ctx.restore();
      if (!hit) continue;
      onSelect(slot.id);
      const placement = session.placements.find((p) => p.slotId === slot.id);
      if (!placement || placement.fitMode === 'contain') return;
      const photo = photos.get(placement.photoId),
        effective = effectiveDimensions(photo.width, photo.height, placement.rotation);
      const crop = clampPlacement(photo.width, photo.height, sw, sh, placement),
        rect = coverRect(effective.width, effective.height, sw, sh, crop);
      drag.current = {
        slotId: slot.id,
        start: local,
        crop,
        scale: rect.scale,
        effective,
        latest: crop,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
  }
  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current;
    if (!d) return;
    const slot = frame.slots.find((s) => s.id === d.slotId)!,
      local = toSlotLocal(point(event), slot, frame),
      photo = photos.get(session.placements.find((p) => p.slotId === d.slotId)!.photoId);
    const crop = clampPlacement(
      photo.width,
      photo.height,
      slot.w * frame.designWidth,
      slot.h * frame.designHeight,
      {
        ...d.crop,
        centerX: d.crop.centerX - (local.x - d.start.x) / d.scale / d.effective.width,
        centerY: d.crop.centerY - (local.y - d.start.y) / d.scale / d.effective.height,
      },
    );
    d.latest = crop;
    onCrop(d.slotId, crop, false);
  }
  function end() {
    const d = drag.current;
    if (d) {
      drag.current = null;
      onCrop(d.slotId, d.latest, true);
    }
  }
  const slot = frame.slots.find((s) => s.id === activeSlot);
  return (
    <div
      className={`composition ${frame.format}`}
      ref={wrap}
      style={{ aspectRatio: `${frame.designWidth}/${frame.designHeight}` }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Preview ${frame.name}, ${session.placements.length} dari ${frame.slots.length} foto. Pilih slot dan gunakan kontrol untuk mengatur posisi.`}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      {interactive &&
        frame.slots.map(
          (s, i) =>
            !session.placements.some((p) => p.slotId === s.id) && (
              <button
                key={s.id}
                className="empty-slot"
                style={{ left: `${(s.x + s.w / 2) * 100}%`, top: `${(s.y + s.h / 2) * 100}%` }}
                aria-label={`Tambahkan foto ke slot ${i + 1}`}
                onClick={() => onSelect(s.id)}
              >
                <span>+</span>Foto {i + 1}
              </button>
            ),
        )}
      {interactive && slot && (
        <div
          className="slot-outline"
          style={{
            left: `${slot.x * 100}%`,
            top: `${slot.y * 100}%`,
            width: `${slot.w * 100}%`,
            height: `${slot.h * 100}%`,
            transform: `rotate(${slot.rotationDeg}deg)`,
            borderRadius: slot.shape === 'circle' ? '50%' : '10px',
          }}
        >
          <span>FOTO {slot.order}</span>
        </div>
      )}
    </div>
  );
}
