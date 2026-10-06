import type { FrameDefinition, SlotDefinition } from '../core/types';
import validateSchema from './compiled-schema.js';
export function maskArea(slot: SlotDefinition, w: number, h: number) {
  if (slot.shape === 'circle') return (Math.PI * w * h) / 4;
  if (slot.shape === 'roundedRect')
    return w * h - (4 - Math.PI) * Math.min(slot.radius ?? 0, w / 2, h / 2) ** 2;
  if (slot.shape === 'path' && slot.pathRef === 'arch') return w * h - 0.2 * w * w;
  if (slot.shape === 'path' && slot.pathRef === 'chamfer')
    return w * h - 2 * (Math.min(w, h) * 0.09) ** 2;
  return w * h;
}
export function validateFrame(input: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!validateSchema(input))
    return {
      valid: false,
      errors: (validateSchema.errors ?? []).map((e) => `${e.instancePath}: ${e.message}`),
    };
  const f = input as FrameDefinition;
  if (
    (f.format === 'strip' && (f.designWidth !== 1200 || f.designHeight !== 3600)) ||
    (f.format === 'card' && (f.designWidth !== 1800 || f.designHeight !== 2700))
  )
    errors.push('Canonical dimensions');
  const ids = new Set<string>(),
    orders = new Set<number>();
  let area = 0;
  const bounds: { left: number; top: number; right: number; bottom: number }[] = [];
  for (const s of f.slots) {
    if (ids.has(s.id) || orders.has(s.order)) errors.push('Duplicate slot');
    ids.add(s.id);
    orders.add(s.order);
    const w = s.w * f.designWidth,
      h = s.h * f.designHeight;
    if (![s.x, s.y, s.w, s.h, s.rotationDeg].every(Number.isFinite))
      errors.push('Nonfinite geometry');
    if (Math.abs(s.rotationDeg) > 3) errors.push('Excessive rotation');
    if (s.shape === 'circle' && Math.abs(w - h) > 0.001)
      errors.push('Circle must be square in design pixels');
    if (
      s.shape === 'roundedRect' &&
      (s.radius === undefined || s.radius < 0 || s.radius > Math.min(w, h) / 2)
    )
      errors.push('Invalid radius');
    if (s.shape === 'path' && !['arch', 'chamfer'].includes(s.pathRef ?? ''))
      errors.push('Unknown path');
    if (s.pathRef === 'arch' && h < w / 2) errors.push('Invalid arch viewport');
    const angle = (s.rotationDeg * Math.PI) / 180,
      bw = Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle));
    const bh = Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle));
    const cx = s.x * f.designWidth + w / 2,
      cy = s.y * f.designHeight + h / 2;
    const box = { left: cx - bw / 2, top: cy - bh / 2, right: cx + bw / 2, bottom: cy + bh / 2 };
    if (
      box.left < -0.001 ||
      box.top < -0.001 ||
      box.right > f.designWidth + 0.001 ||
      box.bottom > f.designHeight + 0.001
    )
      errors.push('Slot outside frame');
    if (
      bounds.some(
        (b) =>
          box.left < b.right - 0.001 &&
          box.right > b.left + 0.001 &&
          box.top < b.bottom - 0.001 &&
          box.bottom > b.top + 0.001,
      )
    )
      errors.push('Overlapping slots');
    bounds.push(box);
    area += maskArea(s, w, h);
  }
  if (area / (f.designWidth * f.designHeight) < 0.55) errors.push('Photo mask area below 55%');
  for (const path of [f.layers.background, f.layers.foreground, f.thumbnail]) {
    if (
      !path.startsWith(`/frames/${f.id}/v${f.version}/`) ||
      path.includes('..') ||
      path.includes('?') ||
      path.includes('#')
    )
      errors.push('Asset path is not version-bound');
  }
  for (const t of f.textAreas) {
    if (t.x + t.w > 1 || t.y + t.h > 1 || t.minFontSize > t.fontSize)
      errors.push('Invalid text bounds');
    if (
      bounds.some(
        (b) =>
          t.x * f.designWidth < b.right &&
          (t.x + t.w) * f.designWidth > b.left &&
          t.y * f.designHeight < b.bottom &&
          (t.y + t.h) * f.designHeight > b.top,
      )
    )
      errors.push('Text overlaps photo');
  }
  return { valid: errors.length === 0, errors };
}
