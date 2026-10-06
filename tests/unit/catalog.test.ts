import { expect, it } from 'vitest';
import { definitions } from '../../src/frames/definitions';
import { frames } from '../../src/frames/catalog';
import { validateFrame } from '../../src/frames/validator';
const newIds = [
  'mochi-party',
  'kitty-club',
  'comic-dash',
  'froggy-day',
  'candy-bounce',
  'space-pals',
  'monster-moods',
  'peach-picnic',
];
it('ships 60 independently usable frame packages with unique IDs and names', () => {
  expect(definitions).toHaveLength(60);
  expect(new Set(definitions.map((f) => f.id)).size).toBe(60);
  expect(new Set(definitions.map((f) => f.name)).size).toBe(60);
  for (const frame of definitions)
    expect(validateFrame(frame), frame.name).toEqual({ valid: true, errors: [] });
});
it('makes every package selectable and leads with decorated editorial picks', () => {
  expect(frames[0].id).toBe('ribbon-diary-trio');
  expect(frames.map((f) => f.id).sort()).toEqual(definitions.map((f) => f.id).sort());
  for (const id of newIds) {
    const frame = frames.find((f) => f.id === id);
    expect(frame, id).toBeDefined();
    expect(frame?.categories, id).toContain('cartoon');
  }
  expect(frames.filter((f) => f.categories.includes('dynamic')).map((f) => f.id)).toEqual(
    expect.arrayContaining(['comic-dash', 'candy-bounce', 'space-pals', 'monster-moods']),
  );
});
it('curates 44 decorated editions across 26 themed collections within the 60-frame limit', () => {
  const expanded = definitions.filter(
    (f) =>
      !newIds.includes(f.id) &&
      ![
        'orbit-club',
        'bubble-pop',
        'studio-notes',
        'concert-pass',
        'pocket-arcade',
        'sticker-rush',
        'cloud-windows',
        'gallery-issue',
      ].includes(f.id),
  );
  expect(expanded).toHaveLength(44);
  const collections = new Map<string, typeof definitions>();
  for (const f of expanded) {
    const key = f.collection!;
    expect(key, f.id).toBeTruthy();
    collections.set(key, [...(collections.get(key) ?? []), f]);
  }
  expect(collections.size).toBe(26);
  for (const [name, group] of collections) {
    expect(group.length, name).toBeGreaterThanOrEqual(1);
    expect(new Set(group.map((f) => JSON.stringify(f.slots))).size, name).toBe(group.length);
  }
  expect(new Set(expanded.map((f) => f.slots.length))).toEqual(new Set([2, 3, 4]));
  expect(new Set(expanded.map((f) => f.format))).toEqual(new Set(['strip', 'card']));
});
