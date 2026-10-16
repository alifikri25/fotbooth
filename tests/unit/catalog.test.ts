import { expect, it } from 'vitest';
import { definitions as allDefinitions } from '../../src/frames/definitions';
import { frames } from '../../src/frames/catalog';
import { validateFrame } from '../../src/frames/validator';
import { onlineRoomFrames, roomFrames } from '../../src/core/room/frames';
import fs from 'node:fs';
import path from 'node:path';
// These regressions protect the original 80; mixed-catalog.test.ts covers the expansion.
const definitions = allDefinitions.filter((frame) => frame.collection !== 'Mixed Moments');
const originalFrames = frames.filter((frame) => frame.collection !== 'Mixed Moments');
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
const signatureIds = [
  'midnight-film-polaroid',
  'birthday-confetti-story',
  'concert-pass',
  'lace-story-arch',
  'wedding-bloom-portrait',
  'kpop-starlight-wander',
  'heart-mail-story',
  'cosmic-disco-mosaic',
];
const encoreIds = [
  'ribbon-diary-trio',
  'ocean-postcard-story',
  'denim-daisy-portrait',
  'butterfly-notes-arch',
  'cherry-kiss-story',
  'citrus-club-mini',
  'coffee-date-polaroid',
  'botanical-journal-portrait',
  'festive-wishes-offset',
  'garden-paint-story',
];
const maximalistIds = [
  'night-market',
  'aquarium-parade',
  'pit-lane',
  'circus-cabinet',
  'street-scramble',
  'ramen-social',
  'stellar-atlas',
  'safari-stamps',
  'sugar-arcade',
  'pinball-fever',
  'mixtape-motel',
  'skate-zine',
  'comic-bureau',
  'desert-bazaar',
  'jungle-jam',
  'snow-globe',
  'pirate-radio',
  'bakery-confetti',
  'dragon-lantern',
  'neon-district',
];
const previousVersion = (id: string) =>
  maximalistIds.includes(id) ? 1 : [...signatureIds, ...encoreIds].includes(id) ? 3 : 2;
const affectedIds = [
  'froggy-day',
  'ribbon-diary-portrait',
  'denim-daisy-portrait',
  'botanical-journal-portrait',
  'wedding-bloom-portrait',
  'aquarium-parade',
  'stellar-atlas',
  'desert-bazaar',
  'dragon-lantern',
];
const archivedFrame = (id: string, version: number) =>
  JSON.parse(fs.readFileSync(`public/frames/${id}/v${version}/manifest.json`, 'utf8'));
it('keeps all 71 normal square and wide frame packages completely unchanged', () => {
  const unchanged = definitions.filter((frame) => !affectedIds.includes(frame.id));
  expect(unchanged).toHaveLength(71);
  for (const frame of unchanged)
    expect(frame, frame.id).toEqual(archivedFrame(frame.id, previousVersion(frame.id)));
});
it('replaces only the nine tall narrow frame layouts with expressive silhouettes', () => {
  const silhouettes = new Set([
    'star',
    'flower',
    'cloud',
    'pebble',
    'wave',
    'torn',
    'heart',
    'burst',
  ]);
  const revised = definitions.filter((frame) => affectedIds.includes(frame.id));
  expect(revised.map(({ id }) => id).sort()).toEqual([...affectedIds].sort());
  for (const frame of revised) {
    for (const slot of frame.slots)
      expect(
        slot.shape === 'circle' || (slot.shape === 'path' && silhouettes.has(slot.pathRef ?? '')),
        `${frame.id}/${slot.id} must have a sculpted photo mask`,
      ).toBe(true);
  }
});
it('opens Aquarium Parade photos into generous bubbles instead of narrow columns', () => {
  const frame = definitions.find((frame) => frame.id === 'aquarium-parade')!;
  expect(frame.slots).toHaveLength(2);
  for (const slot of frame.slots) {
    const ratio = (slot.w * frame.designWidth) / (slot.h * frame.designHeight);
    expect(ratio, slot.id).toBeGreaterThanOrEqual(0.65);
    expect(ratio, slot.id).toBeLessThanOrEqual(1.8);
  }
});
it('keeps all three standalone online room presets completely unchanged', () => {
  expect(onlineRoomFrames).toHaveLength(123);
  expect(roomFrames.map(({ id }) => id)).toEqual([
    'online-satu-tempat',
    'online-surat-rindu',
    'online-night-date',
  ]);
  const originalPresets = [
    {
      id: 'online-satu-tempat',
      name: 'Satu Tempat',
      palette: { background: '#fff8ed', ink: '#653e38', accent: '#b95657', secondary: '#efe4d6' },
      description: 'Satu foto lebar untuk berdua, dibingkai kertas hangat dan cap hati.',
    },
    {
      id: 'online-surat-rindu',
      name: 'Surat Rindu',
      palette: { background: '#fff4e7', ink: '#724a43', accent: '#bf5d58', secondary: '#f1dfce' },
      description: 'Kartu pos lembut dengan tulisan rindu dan perangko untuk momen kalian.',
    },
    {
      id: 'online-night-date',
      name: 'Night Date',
      palette: { background: '#27263d', ink: '#f7e8d4', accent: '#e3c091', secondary: '#454157' },
      description: 'Bingkai malam bernuansa plum, bintang kecil, dan aksen emas.',
    },
  ];
  for (const [index, original] of originalPresets.entries()) {
    const frame = roomFrames[index];
    expect(frame, original.id).toEqual({
      ...original,
      version: 1,
      format: 'card',
      categories: ['couple'],
      designWidth: 1800,
      designHeight: 1350,
      slots: [
        {
          id: 'p1',
          order: 1,
          x: 0.045,
          y: 0.06,
          w: 0.91,
          h: 0.72,
          shape: 'roundedRect',
          radius: 16,
          rotationDeg: 0,
          matteColor: original.palette.secondary,
        },
      ],
      textAreas: [],
      layers: {
        background: `/frames/online-room/${original.id}/background.svg`,
        foreground: `/frames/online-room/${original.id}/foreground.svg`,
      },
      thumbnail: `/frames/online-room/${original.id}/background.svg`,
      licenses: ['Original artwork by fotbooth'],
      collection: 'Foto Bareng',
    });
    for (const asset of ['background.svg', 'foreground.svg'])
      expect(
        fs.statSync(`public/frames/online-room/${frame.id}/${asset}`).size,
        frame.id,
      ).toBeGreaterThan(0);
  }
});
it('preserves archived encore geometry while publishing the new silhouettes separately', () => {
  for (const id of encoreIds) {
    const current = definitions.find((frame) => frame.id === id)!;
    expect(current.version, id).toBe(affectedIds.includes(id) ? 4 : 3);
    const previous = archivedFrame(id, 3);
    expect(previous.slots, id).toEqual(archivedFrame(id, 2).slots);
    expect([current.format, current.designWidth, current.designHeight], id).toEqual([
      previous.format,
      previous.designWidth,
      previous.designHeight,
    ]);
    for (const asset of [
      previous.layers.background,
      previous.layers.foreground,
      previous.thumbnail,
    ])
      expect(fs.statSync(path.join('public', asset)).size, asset).toBeGreaterThan(0);
  }
});
it('selects new neutral thumbnail URLs while keeping previously displayed examples reachable', () => {
  for (const frame of definitions) {
    expect(frame.thumbnail, frame.id).toBe(
      `/frames/${frame.id}/v${frame.version}/thumbnail-neutral.png`,
    );
    const previous = archivedFrame(frame.id, previousVersion(frame.id));
    expect(fs.statSync(path.join('public', previous.thumbnail)).size, frame.id).toBeGreaterThan(0);
  }
});
it('preserves the eight archived signature packages alongside revised photo silhouettes', () => {
  for (const id of signatureIds) {
    const current = definitions.find((frame) => frame.id === id)!;
    expect(current.version, id).toBe(affectedIds.includes(id) ? 4 : 3);
    const previous = archivedFrame(id, 3);
    expect(previous.slots, id).toEqual(archivedFrame(id, 2).slots);
    expect(previous.format, id).toBe(current.format);
    for (const frame of [previous, current]) {
      const manifest = JSON.parse(
        fs.readFileSync(`public/frames/${id}/v${frame.version}/manifest.json`, 'utf8'),
      );
      expect(manifest, id).toEqual(frame);
      for (const asset of [frame.layers.background, frame.layers.foreground, frame.thumbnail])
        expect(fs.statSync(path.join('public', asset)).size, asset).toBeGreaterThan(0);
    }
  }
});
it('serves the revised artwork under cache-safe URLs matching its selected manifests', () => {
  for (const frame of definitions) {
    expect(frame.version, frame.id).toBe(
      previousVersion(frame.id) + Number(affectedIds.includes(frame.id)),
    );
    for (const asset of [frame.layers.background, frame.layers.foreground, frame.thumbnail]) {
      expect(asset, frame.id).toContain(`/frames/${frame.id}/v${frame.version}/`);
      expect(fs.statSync(path.join('public', asset)).size, asset).toBeGreaterThan(0);
    }
    const manifest = JSON.parse(fs.readFileSync(`src/frames/manifests/${frame.id}.json`, 'utf8'));
    expect(manifest, frame.id).toEqual(frame);
  }
});
it('keeps the previous public artwork reachable for already open photo sessions', () => {
  for (const frame of definitions) {
    const original = archivedFrame(frame.id, 1);
    const previous = archivedFrame(frame.id, previousVersion(frame.id));
    expect(original.version).toBe(1);
    expect(previous.slots, frame.id).toEqual(original.slots);
    expect(
      frame.slots.map(({ id, order }) => ({ id, order })),
      frame.id,
    ).toEqual(
      previous.slots.map(({ id, order }: { id: string; order: number }) => ({ id, order })),
    );
    for (const archived of [original, previous])
      for (const asset of [
        archived.layers.background,
        archived.layers.foreground,
        archived.thumbnail,
      ])
        expect(fs.statSync(path.join('public', asset)).size, asset).toBeGreaterThan(0);
  }
});
it('ships 80 independently usable frame packages with unique IDs and names', () => {
  expect(definitions).toHaveLength(80);
  expect(new Set(definitions.map((f) => f.id)).size).toBe(80);
  expect(new Set(definitions.map((f) => f.name)).size).toBe(80);
  for (const frame of definitions)
    expect(validateFrame(frame), frame.name).toEqual({ valid: true, errors: [] });
  const previousIds = fs
    .readdirSync('public/frames')
    .filter((id) => fs.existsSync(`public/frames/${id}/v1/manifest.json`));
  expect(definitions.map(({ id }) => id).sort()).toEqual(
    previousIds.filter((id) => definitions.some((frame) => frame.id === id)).sort(),
  );
  expect(definitions.reduce((count, frame) => count + frame.slots.length, 0)).toBe(250);
});
it('makes every package selectable and leads with decorated editorial picks', () => {
  expect(originalFrames.slice(0, 38).map((frame) => frame.id)).toEqual([
    ...maximalistIds,
    ...signatureIds,
    ...encoreIds,
  ]);
  expect(originalFrames.map((f) => f.id).sort()).toEqual(definitions.map((f) => f.id).sort());
  for (const id of newIds) {
    const frame = frames.find((f) => f.id === id);
    expect(frame, id).toBeDefined();
    expect(frame?.categories, id).toContain('cartoon');
  }
  expect(frames.filter((f) => f.categories.includes('dynamic')).map((f) => f.id)).toEqual(
    expect.arrayContaining(['comic-dash', 'candy-bounce', 'space-pals', 'monster-moods']),
  );
});
it('retains the existing 44 decorated editions across 26 themed collections', () => {
  const expanded = definitions.filter(
    (f) =>
      !newIds.includes(f.id) &&
      !maximalistIds.includes(f.id) &&
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
