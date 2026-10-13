import fs from 'node:fs';
import { maximalistIds, maximalistTaglines } from '../src/frames/maximalist.ts';
const cache = new Map();
const rect = (x, y, w, h, color, r = 0, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}" ${extra}/>`;
export function maximalistArt(f, outline) {
  if (!maximalistIds.includes(f.id)) return null;
  const { designWidth: w, designHeight: h, palette: p } = f;
  if (!cache.has(f.id))
    cache.set(
      f.id,
      fs
        .readFileSync(new URL(`../artwork/materials/festival-${f.id}.jpg`, import.meta.url))
        .toString('base64'),
    );
  const material = cache.get(f.id);
  // Strips repeat the same paper at its native 2:3 proportions, preserving printed object shapes.
  const defs = `<defs><pattern id="festival-material" width="${w}" height="${w * 1.5}" patternUnits="userSpaceOnUse"><image width="${w}" height="${w * 1.5}" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${material}"/></pattern>
  <pattern id="festival-check" width="48" height="48" patternUnits="userSpaceOnUse">${rect(0, 0, 48, 48, p.ink)}${rect(0, 0, 24, 24, p.background)}${rect(24, 24, 24, 24, p.background)}</pattern></defs>`;
  let background = defs + rect(0, 0, w, h, 'url(#festival-material)');
  const racing = ['pit-lane', 'pinball-fever', 'skate-zine'].includes(f.id);
  for (const s of f.slots) {
    background += outline(
      s,
      f,
      false,
      `fill="${p.background}" stroke="${p.background}" stroke-width="54"`,
    );
    background += outline(
      s,
      f,
      false,
      `fill="none" stroke="${racing ? 'url(#festival-check)' : p.accent}" stroke-width="40"`,
    );
    background += outline(s, f, false, `fill="none" stroke="${p.ink}" stroke-width="21"`);
  }
  background += rect(
    0.052 * w,
    0.015 * h,
    0.896 * w,
    0.065 * h,
    p.background,
    12,
    `stroke="${p.accent}" stroke-width="4"`,
  );
  background += `<path d="M${0.04 * w} ${0.011 * h}l${0.07 * w} ${0.012 * h}v${0.012 * h}l${-0.07 * w} ${-0.012 * h}Z M${0.96 * w} ${0.011 * h}l${-0.07 * w} ${0.012 * h}v${0.012 * h}l${0.07 * w} ${-0.012 * h}Z" fill="${p.accent}"/>`;
  background += rect(
    0.1 * w,
    0.884 * h,
    0.8 * w,
    0.073 * h,
    p.ink,
    8,
    `stroke="${p.accent}" stroke-width="5"`,
  );
  background += rect(0.18 * w, 0.961 * h, 0.64 * w, 0.024 * h, p.background, 6);
  let foreground = f.slots
    .map((s) => outline(s, f, false, `fill="none" stroke="${p.background}" stroke-width="4"`))
    .join('');
  foreground += `<text x="${w / 2}" y="${0.092 * h}" text-anchor="middle" font-family="Georgia,serif" font-size="${f.format === 'strip' ? 18 : 24}" letter-spacing="${f.format === 'strip' ? 2 : 3}" fill="${p.ink}" stroke="${p.background}" stroke-width="2" paint-order="stroke">${maximalistTaglines[f.id].replaceAll('&', '&amp;')}</text>`;
  for (const [i, s] of f.slots.entries()) {
    const cy = (s.y + s.h) * h + 18;
    foreground += rect((s.x + s.w / 2) * w - 48, cy - 12, 96, 22, p.background, 11);
    foreground += `<text x="${(s.x + s.w / 2) * w}" y="${cy + 4}" font-family="Arial,sans-serif" font-size="13" letter-spacing="2" text-anchor="middle" fill="${p.ink}">TAKE ${String(i + 1).padStart(2, '0')}</text>`;
  }
  return { background, foreground };
}
