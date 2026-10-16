import { expect, it } from 'vitest';
import fs from 'node:fs';
import { definitions } from '../../src/frames/definitions';
import { frames } from '../../src/frames/catalog';
import { validateFrame } from '../../src/frames/validator';

const expectedIds = [
  'rainy-window',
  'sakura-station',
  'matcha-ceremony',
  'koi-pavilion',
  'crane-flight',
  'capybara-onsen',
  'panda-bamboo',
  'alpine-cabin',
  'aurora-camp',
  'mushroom-almanac',
  'fairy-library',
  'potion-shelf',
  'enchanted-key',
  'dragonfly-marsh',
  'honeycomb-studio',
  'lavender-farm',
  'firefly-meadow',
  'tulip-truck',
  'quilt-cocoa',
  'yarn-social',
  'pottery-sunday',
  'glass-atelier',
  'mosaic-courtyard',
  'terrazzo-club',
  'bauhaus-play',
  'chess-society',
  'origami-lab',
  'museum-afterhours',
  'sailor-knot',
  'submarine-logbook',
  'mountain-railway',
  'aerogram-journey',
  'bicycle-bloom',
  'cinema-marquee',
  'hot-air-post',
  'tennis-sunday',
  'basketball-court',
  'roller-disco',
  'strawberry-farm',
  'paper-theatre',
];

it('adds forty distinct themes with four different silhouettes within each frame', () => {
  const additions = definitions.filter((frame) => frame.collection === 'Mixed Moments');
  expect(additions).toHaveLength(40);
  expect(additions.map((frame) => frame.id).sort()).toEqual([...expectedIds].sort());
  expect(new Set(additions.map((frame) => frame.name)).size).toBe(40);
  for (const frame of additions) {
    expect(frame.slots, frame.id).toHaveLength(4);
    expect(frame.slots.map((slot) => slot.order)).toEqual([1, 2, 3, 4]);
    const shapes = frame.slots.map((slot) => slot.pathRef ?? slot.shape);
    expect(new Set(shapes).size, frame.id).toBe(4);
    expect(shapes, frame.id).toContain('rect');
    expect(
      shapes.some((shape) => ['star', 'heart'].includes(shape)),
      frame.id,
    ).toBe(true);
    expect(validateFrame(frame), frame.id).toEqual({ valid: true, errors: [] });
    for (const slot of frame.slots)
      expect(
        (slot.w * frame.designWidth) / (slot.h * frame.designHeight),
        frame.id,
      ).toBeGreaterThanOrEqual(0.65);
  }
});

it('retains every pre-expansion frame definition and makes all 120 packages available', () => {
  const baseline = JSON.parse(
    fs.readFileSync('tests/fixtures/catalog-before-mixed.json', 'utf8'),
  ) as { id: string; version: number }[];
  expect(baseline).toHaveLength(80);
  for (const { id, version } of baseline) {
    const original = JSON.parse(
      fs.readFileSync(`public/frames/${id}/v${version}/manifest.json`, 'utf8'),
    );
    expect(
      definitions.find((frame) => frame.id === id),
      id,
    ).toEqual(original);
  }
  expect(definitions).toHaveLength(120);
  expect(frames).toHaveLength(120);
  expect(new Set(definitions.map((frame) => frame.id)).size).toBe(120);
  expect(frames.slice(0, 40).map((frame) => frame.id)).toEqual(expectedIds);
});
