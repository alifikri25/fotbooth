import { expect, it } from 'vitest';
import { definitions } from '../../src/frames/definitions';
import {
  createSession,
  addPhoto,
  assignPhoto,
  swapPhotos,
  switchFrame,
  editPlacement,
  History,
} from '../../src/core/session';
const arcade = definitions[4],
  concert = definitions[3];
it('auto-fills empty slots, keeps surplus assets, and permits explicit duplicate placement', () => {
  let s = createSession(concert);
  s = addPhoto(s, 'a');
  s = addPhoto(s, 'b');
  s = addPhoto(s, 'c');
  expect(s.placements.map((p) => p.photoId)).toEqual(['a', 'b']);
  expect(s.photoIds).toEqual(['a', 'b', 'c']);
  s = assignPhoto(s, 'p2', 'a');
  expect(s.placements.map((p) => p.photoId)).toEqual(['a', 'a']);
});
it('restores crops and all surplus photos after 4→2→4 instead of copying crop into new geometry', () => {
  let s = createSession(arcade);
  for (const id of ['a', 'b', 'c', 'd']) s = addPhoto(s, id);
  s = editPlacement(s, 'p3', { zoom: 2, centerX: 0.7 });
  s = switchFrame(s, concert);
  expect(s.placements.map((p) => p.photoId)).toEqual(['a', 'b']);
  expect(s.placements[0].zoom).toBe(1);
  s = switchFrame(s, arcade);
  expect(s.placements.map((p) => p.photoId)).toEqual(['a', 'b', 'c', 'd']);
  expect(s.placements[2]).toMatchObject({ zoom: 2, centerX: 0.7 });
  expect(s.photoIds).toHaveLength(4);
});
it('retaking or swapping a slot does not change another slot crop, while swapped crops reset', () => {
  let s = createSession(arcade);
  for (const id of ['a', 'b', 'c']) s = addPhoto(s, id);
  s = editPlacement(s, 'p1', { zoom: 2 });
  s = addPhoto(s, 'd', 'p2', true);
  expect(s.placements[0].zoom).toBe(2);
  expect(s.placements[1]).toMatchObject({ photoId: 'd', mirror: true });
  expect(s.photoIds).toContain('b');
  s = swapPhotos(s, 'p1', 'p2');
  expect(s.placements[0]).toMatchObject({ photoId: 'd', zoom: 1, mirror: true });
  expect(s.placements[1]).toMatchObject({ photoId: 'a', zoom: 1 });
});
it('rotation and contain reset center, preserve explicit mirror, and support undo', () => {
  let s = addPhoto(createSession(concert), 'a');
  s = editPlacement(s, 'p1', { centerX: 0.8, zoom: 2 });
  const h = new History(s);
  h.commit((s = editPlacement(s, 'p1', { rotation: 90 })));
  expect(s.placements[0]).toMatchObject({ centerX: 0.5, centerY: 0.5, zoom: 1, rotation: 90 });
  expect(h.undo()!.placements[0].zoom).toBe(2);
});
it('caps history at 30 states, clears redo after a new edit, and retains referenced photos', () => {
  const h = new History(createSession(concert));
  for (let i = 0; i < 35; i++) h.commit({ ...h.current, caption: String(i) });
  let count = 0;
  while (h.undo()) count++;
  expect(count).toBe(30);
  expect(h.redo()).not.toBeNull();
  h.commit(addPhoto(h.current, 'photo'));
  expect(h.redo()).toBeNull();
  expect(h.referencedPhotos().has('photo')).toBe(true);
});
it('a full crop patch from pointer movement retains zoom, center, and unchanged rotation/mirror', () => {
  let s = addPhoto(createSession(concert), 'a');
  s = editPlacement(s, 'p1', { zoom: 2 });
  s = editPlacement(s, 'p1', { ...s.placements[0], centerX: 0.65, centerY: 0.7 });
  expect(s.placements[0]).toMatchObject({
    zoom: 2,
    centerX: 0.65,
    centerY: 0.7,
    rotation: 0,
    mirror: false,
  });
});
