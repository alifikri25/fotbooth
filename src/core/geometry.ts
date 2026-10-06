import type { Crop } from './types';

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
function dimensions(...values: number[]) {
  if (values.some((n) => !Number.isFinite(n) || n <= 0))
    throw new Error('Invalid image dimensions');
}
export function effectiveDimensions(iw: number, ih: number, rotation: number) {
  dimensions(iw, ih);
  return Math.abs(rotation % 180) === 90 ? { width: ih, height: iw } : { width: iw, height: ih };
}
export function coverRect(
  iw: number,
  ih: number,
  sw: number,
  sh: number,
  crop: Pick<Crop, 'centerX' | 'centerY' | 'zoom'>,
) {
  dimensions(iw, ih, sw, sh);
  if (![crop.centerX, crop.centerY, crop.zoom].every(Number.isFinite))
    throw new Error('Invalid crop');
  const scale = Math.max(sw / iw, sh / ih) * clamp(crop.zoom, 1, 3);
  const width = sw / scale,
    height = sh / scale;
  const cx = clamp(crop.centerX * iw, width / 2, iw - width / 2);
  const cy = clamp(crop.centerY * ih, height / 2, ih - height / 2);
  return {
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
    centerX: cx / iw,
    centerY: cy / ih,
    scale,
  };
}
export function containRect(iw: number, ih: number, sw: number, sh: number) {
  dimensions(iw, ih, sw, sh);
  const scale = Math.min(sw / iw, sh / ih);
  const width = iw * scale,
    height = ih * scale;
  return { x: (sw - width) / 2, y: (sh - height) / 2, width, height };
}
export function clampPlacement<T extends Crop>(
  iw: number,
  ih: number,
  sw: number,
  sh: number,
  crop: T,
): T {
  const effective = effectiveDimensions(iw, ih, crop.rotation);
  if (crop.fitMode === 'contain') return { ...crop, centerX: 0.5, centerY: 0.5, zoom: 1 };
  const rect = coverRect(effective.width, effective.height, sw, sh, crop);
  return { ...crop, centerX: rect.centerX, centerY: rect.centerY, zoom: clamp(crop.zoom, 1, 3) };
}
export function toSlotLocal(
  point: { x: number; y: number },
  slot: { x: number; y: number; w: number; h: number; rotationDeg: number },
  frame: { designWidth: number; designHeight: number },
) {
  const w = slot.w * frame.designWidth,
    h = slot.h * frame.designHeight;
  const dx = point.x - (slot.x * frame.designWidth + w / 2);
  const dy = point.y - (slot.y * frame.designHeight + h / 2);
  const angle = (-slot.rotationDeg * Math.PI) / 180;
  return {
    x: Math.round((dx * Math.cos(angle) - dy * Math.sin(angle) + w / 2) * 1e9) / 1e9,
    y: Math.round((dx * Math.sin(angle) + dy * Math.cos(angle) + h / 2) * 1e9) / 1e9,
  };
}
