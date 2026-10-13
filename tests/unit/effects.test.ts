import { expect, it } from 'vitest';
import { definitions } from '../../src/frames/definitions';
import {
  addPhoto,
  createSession,
  editPlacement,
  History,
  swapPhotos,
  switchFrame,
} from '../../src/core/session';

it('moves photo effects with their photos when swapping slots', () => {
  let session = addPhoto(addPhoto(createSession(definitions[0]), 'red'), 'blue');
  session = editPlacement(session, 'p1', { effect: 'mono', effectIntensity: 0.7 });
  const next = swapPhotos(session, 'p1', 'p2');
  expect(next.placements.find((p) => p.photoId === 'red')).toMatchObject({
    slotId: 'p2',
    effect: 'mono',
    effectIntensity: 0.7,
  });
  expect(next.placements.find((p) => p.photoId === 'blue')?.effect ?? 'none').toBe('none');
});

it('retains effect and intensity when changing frames, and supports undo/redo', () => {
  const history = new History(addPhoto(createSession(definitions[0]), 'red'));
  history.commit(editPlacement(history.current, 'p1', { effect: 'sepia', effectIntensity: 0.6 }));
  history.commit(switchFrame(history.current, definitions[1]));
  expect(history.current.placements[0]).toMatchObject({ effect: 'sepia', effectIntensity: 0.6 });
  history.undo();
  history.undo();
  expect(history.current.placements[0].effect ?? 'none').toBe('none');
  history.redo();
  expect(history.current.placements[0]).toMatchObject({ effect: 'sepia', effectIntensity: 0.6 });
});
