import { containRect, coverRect, effectiveDimensions } from './geometry';
import type { FrameDefinition, Session, PhotoResolver, SlotDefinition } from './types';
import { fitText, fontFamily } from './text';

const layers = new Map<string, Promise<HTMLImageElement>>();
export function loadLayer(url: string): Promise<HTMLImageElement> {
  if (!layers.has(url)) {
    const image = new Image();
    image.src = url;
    layers.set(
      url,
      image
        .decode()
        .then(() => image)
        .catch((error) => {
          layers.delete(url);
          throw error;
        }),
    );
  }
  return layers.get(url)!;
}
export function slotPath(slot: SlotDefinition, width: number, height: number): Path2D {
  const path = new Path2D();
  if (slot.shape === 'circle')
    path.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  else if (slot.shape === 'roundedRect')
    path.roundRect(0, 0, width, height, Math.min(slot.radius ?? 0, width / 2, height / 2));
  else if (slot.shape === 'path' && slot.pathRef === 'arch') {
    const r = width / 2;
    path.moveTo(0, height);
    path.lineTo(0, r);
    path.bezierCurveTo(0, 0, width, 0, width, r);
    path.lineTo(width, height);
    path.closePath();
  } else if (slot.shape === 'path' && slot.pathRef === 'chamfer') {
    const cut = Math.min(width, height) * 0.09;
    path.moveTo(cut, 0);
    path.lineTo(width - cut, 0);
    path.lineTo(width, cut);
    path.lineTo(width, height - cut);
    path.lineTo(width - cut, height);
    path.lineTo(cut, height);
    path.lineTo(0, height - cut);
    path.lineTo(0, cut);
    path.closePath();
  } else if (slot.shape === 'rect') path.rect(0, 0, width, height);
  else throw new Error('Unsupported slot mask');
  return path;
}
export async function renderComposition(
  canvas: HTMLCanvasElement,
  frame: FrameDefinition,
  session: Pick<Session, 'placements' | 'caption' | 'date'>,
  resolvePhoto: PhotoResolver,
  width: number,
  height: number,
) {
  const [background, foreground] = await Promise.all([
    frame.layers.background ? loadLayer(frame.layers.background) : null,
    frame.layers.foreground ? loadLayer(frame.layers.foreground) : null,
  ]);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.setTransform(width / frame.designWidth, 0, 0, height / frame.designHeight, 0, 0);
  ctx.fillStyle = frame.palette.background;
  ctx.fillRect(0, 0, frame.designWidth, frame.designHeight);
  if (background) ctx.drawImage(background, 0, 0, frame.designWidth, frame.designHeight);
  for (const slot of frame.slots) {
    const sw = slot.w * frame.designWidth,
      sh = slot.h * frame.designHeight;
    ctx.save();
    ctx.translate(slot.x * frame.designWidth + sw / 2, slot.y * frame.designHeight + sh / 2);
    ctx.rotate((slot.rotationDeg * Math.PI) / 180);
    ctx.translate(-sw / 2, -sh / 2);
    ctx.clip(slotPath(slot, sw, sh));
    ctx.fillStyle = slot.matteColor;
    ctx.fillRect(0, 0, sw, sh);
    const placement = session.placements.find((p) => p.slotId === slot.id);
    if (placement) {
      const source = await resolvePhoto(placement.photoId);
      try {
        const size = effectiveDimensions(source.width, source.height, placement.rotation);
        let scale: number;
        if (placement.fitMode === 'contain') {
          const box = containRect(size.width, size.height, sw, sh);
          scale = box.width / size.width;
          ctx.translate(box.x, box.y);
        } else {
          const box = coverRect(size.width, size.height, sw, sh, placement);
          scale = box.scale;
          ctx.translate(-box.x * scale, -box.y * scale);
        }
        ctx.scale(scale, scale);
        if (placement.mirror) {
          ctx.translate(size.width, 0);
          ctx.scale(-1, 1);
        }
        const rotation = ((placement.rotation % 360) + 360) % 360;
        if (rotation === 90) ctx.translate(source.height, 0);
        if (rotation === 180) ctx.translate(source.width, source.height);
        if (rotation === 270) ctx.translate(0, source.width);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(source.image, 0, 0, source.width, source.height);
      } finally {
        source.release?.();
      }
    }
    ctx.restore();
  }
  if (foreground) ctx.drawImage(foreground, 0, 0, frame.designWidth, frame.designHeight);
  for (const area of frame.textAreas) {
    const value =
      area.text ??
      (area.id === 'caption'
        ? session.caption
        : area.id === 'date'
          ? session.date.split('-').reverse().join('.')
          : '');
    if (!value) continue;
    const w = area.w * frame.designWidth,
      h = area.h * frame.designHeight;
    const text = fitText(value, w, h, area.fontSize, area.minFontSize, area.maxLines, (s, size) => {
      ctx.font = `500 ${size}px ${fontFamily(area.fontId)}`;
      return ctx.measureText(s).width;
    });
    if (!text) throw new Error('Teks belum muat. Pendekkan caption agar tetap terbaca.');
    ctx.fillStyle = area.color;
    ctx.font = `500 ${text.size}px ${fontFamily(area.fontId)}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerY = area.y * frame.designHeight + h / 2;
    text.lines.forEach((line, i) =>
      ctx.fillText(
        line,
        (area.x + area.w / 2) * frame.designWidth,
        centerY + (i - (text.lines.length - 1) / 2) * text.size * 1.2,
      ),
    );
  }
}
