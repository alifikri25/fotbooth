import type { FrameDefinition } from '../core/types';
import { validateFrame } from './validator';
const manifests = import.meta.glob<FrameDefinition>('./manifests/*.json', {
  eager: true,
  import: 'default',
});
const sequence = [
  'ribbon-diary-trio',
  'petal-post-story',
  'cherry-kiss-film',
  'denim-daisy-polaroid',
  'heart-mail-duo',
  'botanical-journal-portrait',
  'cosmic-disco-mosaic',
  'teddy-memory-trio',
  'ocean-postcard-story',
  'midnight-film-film',
  'gingham-picnic-mini',
  'butterfly-notes-arch',
  'mochi-party',
  'kitty-club',
  'comic-dash',
  'froggy-day',
  'candy-bounce',
  'space-pals',
  'monster-moods',
  'peach-picnic',
  'orbit-club',
  'bubble-pop',
  'studio-notes',
  'concert-pass',
  'pocket-arcade',
  'sticker-rush',
  'cloud-windows',
  'gallery-issue',
];
export const frames = Object.values(manifests)
  .filter((f) => validateFrame(f).valid)
  .sort((a, b) => {
    const rank = (f: FrameDefinition) => {
      const index = sequence.indexOf(f.id);
      return index < 0 ? sequence.length + (f.artwork?.edition ?? 0) : index;
    };
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
export const getFrame = (id: string) => frames.find((f) => f.id === id) ?? frames[0];
