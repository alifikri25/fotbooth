import { describe, expect, it } from 'vitest';
import { coverRect, containRect, clampPlacement, toSlotLocal } from '../../src/core/geometry';

const centered = {
  centerX: 0.5,
  centerY: 0.5,
  zoom: 1,
  rotation: 0,
  mirror: false,
  fitMode: 'cover' as const,
};

describe('geometry preserves source aspect ratio in canonical coordinates', () => {
  it('crops landscape into square without stretching', () => {
    expect(coverRect(4000, 3000, 1000, 1000, centered)).toMatchObject({
      x: 500,
      y: 0,
      width: 3000,
      height: 3000,
    });
  });
  it('centers all of a landscape image with matte above and below', () => {
    expect(containRect(4000, 3000, 1000, 1000)).toEqual({ x: 0, y: 125, width: 1000, height: 750 });
  });
  it('clamps the crop at every edge so cover never reveals a gap', () => {
    const result = coverRect(4000, 3000, 1000, 1000, {
      ...centered,
      centerX: 10,
      centerY: -2,
      zoom: 2,
    });
    expect(result).toMatchObject({
      x: 2500,
      y: 0,
      width: 1500,
      height: 1500,
      centerX: 0.8125,
      centerY: 0.25,
    });
  });
  it('changes effective dimensions before cropping a rotated portrait', () => {
    expect(
      clampPlacement(3000, 4000, 1000, 1000, { ...centered, rotation: 90, centerX: 1 }),
    ).toMatchObject({ centerX: 0.625, centerY: 0.5 });
  });
  it('keeps contain centered with no zoom', () => {
    expect(
      clampPlacement(3000, 4000, 1000, 1000, {
        ...centered,
        fitMode: 'contain',
        zoom: 3,
        centerX: 0,
      }),
    ).toMatchObject({ zoom: 1, centerX: 0.5, centerY: 0.5 });
  });
  it('inverse rotates pointer input around the slot center', () => {
    expect(
      toSlotLocal(
        { x: 150, y: 120 },
        { x: 0.1, y: 0.1, w: 0.2, h: 0.2, rotationDeg: 90 },
        { designWidth: 1000, designHeight: 1000 },
      ),
    ).toEqual({ x: 20, y: 150 });
  });
  it('rejects zero dimensions and nonfinite state instead of making black output', () => {
    expect(() => coverRect(0, 3000, 1000, 1000, centered)).toThrow();
    expect(() => coverRect(4000, 3000, 1000, 1000, { ...centered, zoom: NaN })).toThrow();
  });
});
