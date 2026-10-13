import { expect, it } from 'vitest';
import { applyEffectPixels, getPhotoFilter } from '../../src/core/effects';

it('converts real RGB to grayscale while preserving transparency', () => {
  const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 120]);
  applyEffectPixels(pixels, 'mono', 1);
  expect(Array.from(pixels)).toEqual([54, 54, 54, 255, 18, 18, 18, 120]);
});
it('leaves originals untouched at zero intensity and falls back safely for invalid settings', () => {
  const pixels = new Uint8ClampedArray([220, 80, 30, 255]);
  applyEffectPixels(pixels, 'sepia', 0);
  expect(Array.from(pixels)).toEqual([220, 80, 30, 255]);
  expect(getPhotoFilter('mono', -4)).toBe('none');
  expect(getPhotoFilter('mono', NaN)).toBe('grayscale(1)');
  expect(getPhotoFilter('unknown' as never, 1)).toBe('none');
});
