import { describe, expect, it } from 'vitest';
import type { ARMask } from '../../src/core/ar/types';
import * as composition from '../../src/core/room/composition';
import * as presets from '../../src/core/room/frames';
import { frames } from '../../src/frames/catalog';

describe('room portraits remain safe and preserve each person', () => {
  it('bounds landscape and portrait surfaces without changing the aspect ratio', () => {
    expect(composition.roomPortraitSize(3840, 2160)).toEqual({ width: 1280, height: 720 });
    expect(composition.roomPortraitSize(1080, 1920)).toEqual({ width: 720, height: 1280 });
    expect(composition.roomPortraitSize(320, 240)).toEqual({ width: 320, height: 240 });
  });

  it('rejects unknown or nonfinite camera dimensions before allocating a surface', () => {
    for (const [width, height] of [
      [0, 480],
      [640, 0],
      [NaN, 480],
      [640, Infinity],
    ]) {
      expect(() => composition.roomPortraitSize(width, height)).toThrow();
    }
  });

  it('crops landscape camera images centrally for one person without stretching', () => {
    expect(composition.roomPersonCrop(800, 600, 300, 600)).toEqual({
      x: 250,
      y: 0,
      width: 300,
      height: 600,
    });
    expect(composition.roomPersonCrop(300, 800, 300, 600)).toEqual({
      x: 0,
      y: 100,
      width: 300,
      height: 600,
    });
  });

  it('turns background confidence into transparency and preserves person edges', () => {
    const mask: ARMask = {
      width: 3,
      height: 2,
      values: new Float32Array([0, 0.25, 0.5, 0.75, 1, NaN]),
    };
    const pixels = composition.roomMaskPixels(mask);
    expect(Array.from(pixels.filter((_, index) => index % 4 === 3))).toEqual([
      0, 0, 128, 255, 255, 0,
    ]);
  });

  it('refuses truncated masks and unbounded mask dimensions', () => {
    expect(() =>
      composition.roomMaskPixels({ width: 2, height: 2, values: new Float32Array(3) }),
    ).toThrow();
    expect(() =>
      composition.roomMaskPixels({ width: 50000, height: 50000, values: new Float32Array(1) }),
    ).toThrow();
    expect(() =>
      composition.roomMaskPixels({ width: 0, height: 1, values: new Float32Array(0) }),
    ).toThrow();
  });
});

describe('online room frames keep one shared photograph', () => {
  it('offers wide single-window presets with space reserved for the printed footer', () => {
    expect(presets.roomFrames).toHaveLength(3);
    for (const frame of presets.roomFrames) {
      expect(frame.slots).toHaveLength(1);
      const slot = frame.slots[0];
      expect((slot.w * frame.designWidth) / (slot.h * frame.designHeight)).toBeGreaterThan(1.5);
      expect(slot.y + slot.h).toBeLessThanOrEqual(0.8);
      expect(frame.layers.foreground).toMatch(/^\/frames\/online-room\//);
    }
  });

  it('resolves a selected preset and safely replaces an unknown room frame', () => {
    expect(presets.getRoomFrame('online-surat-rindu').name).toBe('Surat Rindu');
    expect(presets.getRoomFrame('missing').id).toBe('online-satu-tempat');
    expect(presets.getRoomFrame(undefined).id).toBe('online-satu-tempat');
  });
});

describe('online rooms use the prepared catalog', () => {
  it('makes each prepared frame available without replacing its artwork or slot geometry', () => {
    const available = (presets as Record<string, any>).onlineRoomFrames;
    expect(available).toHaveLength(83);
    expect(new Set(available.map((frame: { id: string }) => frame.id)).size).toBe(83);
    for (const frame of frames) {
      expect(available).toContain(frame);
      expect(presets.getRoomFrame(frame.id)).toBe(frame);
    }
    for (const frame of presets.roomFrames) expect(available).toContain(frame);
  });

  it('rejects missing or extra paired snapshots before trying to decode an export', async () => {
    const exportSequence = (composition as Record<string, any>).exportRoomSequence;
    expect(exportSequence).toBeTypeOf('function');
    const pair = { host: new Blob(), guest: new Blob() };
    await expect(exportSequence([], presets.roomFrames[0], 'studio')).rejects.toThrow(
      /foto|slot|pasangan/i,
    );
    await expect(exportSequence([pair, pair], presets.roomFrames[0], 'studio')).rejects.toThrow(
      /foto|slot|pasangan/i,
    );
  });
});
