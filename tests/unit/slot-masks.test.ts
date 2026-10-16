import { describe, expect, it } from 'vitest';
import { maskArea, validateFrame } from '../../src/frames/validator';
import type { FrameDefinition } from '../../src/core/types';
import {
  isSculptedMask,
  sculptedMaskArea,
  sculptedMaskPath,
  sculptedMaskRefs,
} from '../../src/core/slot-masks';

const cutoutFrame = (pathRef?: string): FrameDefinition => ({
  id: 'cutout-proof',
  name: 'Cutout proof',
  version: 1,
  format: 'card',
  categories: ['playful'],
  designWidth: 1800,
  designHeight: 2700,
  palette: { background: '#ffffff', ink: '#000000', accent: '#123456', secondary: '#eeeeee' },
  layers: {
    background: '/frames/cutout-proof/v1/background.svg',
    foreground: '/frames/cutout-proof/v1/foreground.svg',
  },
  thumbnail: '/frames/cutout-proof/v1/thumbnail-neutral.png',
  licenses: ['Original'],
  description: 'A pair of broad photo cutouts.',
  textAreas: [],
  slots: [0.04, 0.52].map((x, i) => ({
    id: `p${i + 1}`,
    order: i + 1,
    x,
    y: 0.12,
    w: 0.44,
    h: 0.74,
    shape: pathRef ? 'path' : 'rect',
    ...(pathRef ? { pathRef: pathRef as FrameDefinition['slots'][number]['pathRef'] } : {}),
    rotationDeg: 0,
    matteColor: '#eeeeee',
  })),
});

describe('sculpted photo cutouts', () => {
  it('only accepts curated mask references', () => {
    for (const ref of sculptedMaskRefs) expect(isSculptedMask(ref)).toBe(true);
    for (const ref of [undefined, null, '', 'arch', 'triangle', {}, 1])
      expect(isSculptedMask(ref)).toBe(false);
  });

  it.each(['star', 'flower', 'cloud', 'pebble', 'wave', 'torn', 'heart', 'burst'] as const)(
    '%s stays in its viewport and measures the actual closed photo silhouette',
    (ref) => {
      const d = sculptedMaskPath(ref, 600, 900);
      expect(d.startsWith('M')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
      const numbers = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      const points = Array.from({ length: numbers.length / 2 }, (_, i) => [
        numbers[i * 2],
        numbers[i * 2 + 1],
      ]);
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(600);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(900);
      }
      // Shoelace is an independent measurement of the exact polygon consumed by SVG/Canvas.
      const polygonArea =
        Math.abs(
          points.reduce((sum, [x, y], i) => {
            const next = points[(i + 1) % points.length];
            return sum + x * next[1] - next[0] * y;
          }, 0),
        ) / 2;
      expect(sculptedMaskArea(ref, 600, 900)).toBeCloseTo(polygonArea, 1);
      const areaFraction = polygonArea / (600 * 900);
      expect(areaFraction).toBeGreaterThan(ref === 'star' ? 0.5 : 0.6);
      expect(areaFraction).toBeLessThan(0.96);
      if (ref === 'torn') expect(areaFraction).toBeLessThan(0.84);
      expect(sculptedMaskArea(ref, 1200, 1800)).toBeCloseTo(polygonArea * 4, 0);
    },
  );

  it('accepts a broad star and wave layout while counting cut-away corners as artwork', () => {
    const frame = cutoutFrame('star');
    frame.slots[1].pathRef = 'wave';
    const photoArea = frame.slots.reduce(
      (area, slot) => area + maskArea(slot, slot.w * 1800, slot.h * 2700),
      0,
    );
    expect(validateFrame(frame)).toEqual({ valid: true, errors: [] });
    expect(photoArea / (1800 * 2700)).toBeGreaterThanOrEqual(0.4);
    expect(photoArea / (1800 * 2700)).toBeLessThan(0.55);
  });

  it('still rejects a sculpted frame with too little actual photo area', () => {
    const frame = cutoutFrame('star');
    frame.slots.forEach((slot) => (slot.h = 0.3));
    expect(validateFrame(frame).valid).toBe(false);
  });

  it('keeps the legacy 55 percent photo-area requirement for rectangular frames', () => {
    const frame = cutoutFrame();
    frame.slots.forEach((slot) => (slot.h = 0.55));
    expect(validateFrame(frame).valid).toBe(false);
  });
});
