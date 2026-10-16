import type { FrameDefinition, SlotDefinition } from '../core/types';
import type { SculptedMaskRef } from '../core/slot-masks';

// Only the nine layouts with two long, narrow portrait columns are redesigned.
// Normal square, landscape, strip and mixed-photo layouts retain their original packages.
const recipes: [string, SculptedMaskRef[]][] = [
  ['aquarium-parade', ['wave', 'star']],
  ['stellar-atlas', ['star', 'wave']],
  ['desert-bazaar', ['flower', 'pebble']],
  ['dragon-lantern', ['wave', 'flower']],
  ['froggy-day', ['pebble', 'cloud']],
  ['ribbon-diary-portrait', ['heart', 'cloud']],
  ['denim-daisy-portrait', ['flower', 'torn']],
  ['botanical-journal-portrait', ['pebble', 'flower']],
  ['wedding-bloom-portrait', ['heart', 'flower']],
];

export const sculptedFrameIds = recipes.map(([id]) => id);

const shapeNames: Record<SculptedMaskRef, string> = {
  star: 'bintang',
  flower: 'kelopak bunga',
  cloud: 'awan',
  pebble: 'batu organik',
  wave: 'ombak',
  torn: 'kertas sobek',
  heart: 'hati',
  burst: 'letupan komik',
};
const refreshedDescriptions: Record<string, string> = {
  'aquarium-parade':
    'Dua foto berlekuk ombak dan bintang laut, tersusun berselang di antara koral dan gelembung.',
};

function recomposePortraitColumns(frame: FrameDefinition): SlotDefinition[] {
  const narrowColumns =
    frame.format === 'card' &&
    frame.slots.length === 2 &&
    frame.slots.every((s) => (s.w * frame.designWidth) / (s.h * frame.designHeight) < 0.65);
  if (!narrowColumns) return frame.slots;
  const top = Math.min(...frame.slots.map((s) => s.y));
  const bottom = Math.max(...frame.slots.map((s) => s.y + s.h));
  const height = (bottom - top - 0.036) / 2;
  return frame.slots.map((s, i) => ({
    ...s,
    x: i === 0 ? 0.045 : 0.085,
    y: top + i * (height + 0.036),
    w: 0.87,
    h: height,
    rotationDeg: i === 0 ? -1.2 : 1.2,
  }));
}

export function refineSculpted(frame: FrameDefinition): FrameDefinition {
  const recipe = recipes.find(([id]) => frame.id === id)?.[1];
  if (!recipe) return frame;
  const slots = recomposePortraitColumns(frame).map((s, i): SlotDefinition => {
    if (s.shape === 'circle') return { ...s };
    const { radius: _radius, pathRef: _pathRef, ...rest } = s;
    return {
      ...rest,
      shape: 'path',
      pathRef: recipe[i % recipe.length],
    };
  });
  const version = frame.version + 1;
  const base = `/frames/${frame.id}/v${version}`;
  return {
    ...frame,
    version,
    slots,
    layers: { background: `${base}/background.svg`, foreground: `${base}/foreground.svg` },
    thumbnail: `${base}/thumbnail-neutral.png`,
    description:
      refreshedDescriptions[frame.id] ??
      `${frame.description} Potongan foto ${[...new Set(recipe)].map((shape) => shapeNames[shape]).join(', ')}.`,
  };
}
