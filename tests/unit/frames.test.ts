import { describe, expect, it } from 'vitest';
import { validateFrame, maskArea } from '../../src/frames/validator';

const frame = {
  id: 'test',
  name: 'Test',
  version: 1,
  format: 'strip',
  categories: ['clean'],
  designWidth: 1200,
  designHeight: 3600,
  palette: { background: '#ffffff', ink: '#000000', accent: '#123456', secondary: '#f0f0f0' },
  layers: {
    background: '/frames/test/v1/background.svg',
    foreground: '/frames/test/v1/foreground.svg',
  },
  thumbnail: '/frames/test/v1/thumbnail.png',
  textAreas: [],
  licenses: ['Original'],
  description: 'test',
  slots: [
    {
      id: 'p1',
      order: 1,
      x: 0.05,
      y: 0.05,
      w: 0.9,
      h: 0.4,
      shape: 'rect',
      rotationDeg: 0,
      matteColor: '#ffffff',
    },
    {
      id: 'p2',
      order: 2,
      x: 0.05,
      y: 0.5,
      w: 0.9,
      h: 0.4,
      shape: 'rect',
      rotationDeg: 0,
      matteColor: '#ffffff',
    },
  ],
};
describe('frame release validator', () => {
  it('accepts a complete local package with enough usable photo area', () =>
    expect(validateFrame(frame).valid).toBe(true));
  it.each([
    [
      'nonfinite bounds',
      (f: any) => {
        f.slots[0].x = NaN;
      },
    ],
    [
      'duplicate slot IDs',
      (f: any) => {
        f.slots[1].id = 'p1';
      },
    ],
    [
      'overlapping photos',
      (f: any) => {
        f.slots[1].y = 0.3;
      },
    ],
    [
      'rotated bounds outside frame',
      (f: any) => {
        f.slots[0].x = 0;
        f.slots[0].rotationDeg = 3;
      },
    ],
    [
      'oval pretending to be circle',
      (f: any) => {
        f.slots[0].shape = 'circle';
      },
    ],
    [
      'unknown mask',
      (f: any) => {
        f.slots[0].shape = 'path';
        f.slots[0].pathRef = 'unknown';
      },
    ],
    [
      'unusable photo area',
      (f: any) => {
        f.slots.forEach((s: any) => {
          s.w = 0.2;
        });
      },
    ],
    [
      'remote arbitrary asset',
      (f: any) => {
        f.layers.background = 'https://example.com/image.png';
      },
    ],
    [
      'wrong canonical size',
      (f: any) => {
        f.designWidth = 600;
      },
    ],
  ])('rejects %s', (_name, mutate) => {
    const candidate = structuredClone(frame);
    mutate(candidate);
    expect(validateFrame(candidate).valid).toBe(false);
  });
  it('counts actual rounded/circle/chamfer areas rather than their bounding boxes', () => {
    expect(maskArea({ shape: 'circle' } as any, 100, 100)).toBeCloseTo(7853.9816, 3);
    expect(maskArea({ shape: 'roundedRect', radius: 50 } as any, 100, 100)).toBeCloseTo(
      7853.9816,
      3,
    );
    expect(maskArea({ shape: 'path', pathRef: 'chamfer' } as any, 100, 100)).toBe(9838);
  });
});
