import { expect, it } from 'vitest';
import { definitions } from '../../src/frames/definitions';
import { frames } from '../../src/frames/catalog';
import { validateFrame } from '../../src/frames/validator';
import fs from 'node:fs';
import path from 'node:path';
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
it('ships eight signature revisions while retaining the previous public artwork and photo geometry', () => {
  for (const id of signatureIds) {
    const current = definitions.find((frame) => frame.id === id)!;
    expect(current.version, id).toBe(3);
    const previous = JSON.parse(fs.readFileSync(`public/frames/${id}/v2/manifest.json`, 'utf8'));
    expect(previous.slots, id).toEqual(current.slots);
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
    expect(frame.version, frame.id).toBe(signatureIds.includes(frame.id) ? 3 : 2);
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
    const previous = JSON.parse(
      fs.readFileSync(`public/frames/${frame.id}/v1/manifest.json`, 'utf8'),
    );
    expect(previous.version).toBe(1);
    expect(previous.slots).toEqual(frame.slots);
    for (const asset of [
      previous.layers.background,
      previous.layers.foreground,
      previous.thumbnail,
    ]) {
      expect(fs.statSync(path.join('public', asset)).size, asset).toBeGreaterThan(0);
    }
  }
});
it('ships 60 independently usable frame packages with unique IDs and names', () => {
  expect(definitions).toHaveLength(60);
  expect(new Set(definitions.map((f) => f.id)).size).toBe(60);
  expect(new Set(definitions.map((f) => f.name)).size).toBe(60);
  for (const frame of definitions)
    expect(validateFrame(frame), frame.name).toEqual({ valid: true, errors: [] });
});
it('makes every package selectable and leads with decorated editorial picks', () => {
  expect(frames.slice(0, 8).map((frame) => frame.id)).toEqual(signatureIds);
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
