type Stage = readonly [
  kind: 'grayscale' | 'sepia' | 'saturate' | 'brightness' | 'contrast' | 'hue-rotate',
  value: number,
];
export const photoEffects = [
  { id: 'none', name: 'Original', colors: ['#cc9c76', '#758f86'], stages: [] },
  { id: 'mono', name: 'Hitam putih', colors: ['#e8e5dd', '#424742'], stages: [['grayscale', 1]] },
  { id: 'sepia', name: 'Sepia', colors: ['#e0bb83', '#78604b'], stages: [['sepia', 1]] },
  {
    id: 'vintage',
    name: 'Vintage',
    colors: ['#d9ad89', '#8d8b6b'],
    stages: [
      ['sepia', 0.35],
      ['saturate', 0.8],
      ['contrast', 0.88],
    ],
  },
  {
    id: 'warm',
    name: 'Warm',
    colors: ['#f0b383', '#ca7964'],
    stages: [
      ['sepia', 0.24],
      ['saturate', 1.18],
      ['brightness', 1.04],
    ],
  },
  {
    id: 'cool',
    name: 'Cool',
    colors: ['#9bbddd', '#768ec1'],
    stages: [
      ['sepia', 0.22],
      ['hue-rotate', 165],
      ['saturate', 0.9],
    ],
  },
  {
    id: 'vivid',
    name: 'Vivid',
    colors: ['#fd8465', '#63b5b3'],
    stages: [
      ['saturate', 1.65],
      ['contrast', 1.12],
    ],
  },
  {
    id: 'soft',
    name: 'Soft',
    colors: ['#eed6c5', '#b5c8bf'],
    stages: [
      ['saturate', 0.85],
      ['contrast', 0.86],
      ['brightness', 1.08],
    ],
  },
  {
    id: 'noir',
    name: 'Noir',
    colors: ['#aaa8a2', '#202623'],
    stages: [
      ['grayscale', 1],
      ['contrast', 1.4],
    ],
  },
  {
    id: 'faded',
    name: 'Faded',
    colors: ['#c8b9a6', '#939c98'],
    stages: [
      ['saturate', 0.6],
      ['contrast', 0.75],
      ['brightness', 1.05],
    ],
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: ['#e9a7c0', '#bf8bba'],
    stages: [
      ['sepia', 0.28],
      ['hue-rotate', 315],
      ['brightness', 1.04],
    ],
  },
  {
    id: 'cinema',
    name: 'Cinema',
    colors: ['#d49b76', '#427979'],
    stages: [
      ['sepia', 0.18],
      ['saturate', 0.75],
      ['contrast', 1.22],
    ],
  },
] as const;
export type PhotoEffectId = (typeof photoEffects)[number]['id'];
function stagesFor(effect: PhotoEffectId = 'none', intensity = 1): Stage[] {
  const amount = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 1;
  if (amount === 0) return [];
  const preset = photoEffects.find((p) => p.id === effect);
  return (preset?.stages ?? []).map(([kind, value]) => {
    const base = ['saturate', 'brightness', 'contrast'].includes(kind) ? 1 : 0;
    return [kind, base + (value - base) * amount];
  });
}
export function getPhotoFilter(effect: PhotoEffectId = 'none', intensity = 1): string {
  return (
    stagesFor(effect, intensity)
      .map(
        ([kind, value]) =>
          `${kind}(${Number(value.toFixed(4))}${kind === 'hue-rotate' ? 'deg' : ''})`,
      )
      .join(' ') || 'none'
  );
}
const bound = (value: number) => Math.max(0, Math.min(255, value));
/** Color-only effects on an isolated photo surface, independent of canvas.filter support. */
export function applyEffectPixels(
  data: Uint8ClampedArray,
  effect: PhotoEffectId = 'none',
  intensity = 1,
) {
  const stages = stagesFor(effect, intensity);
  if (!stages.length) return;
  const matrices = stages.map(([kind, amount]) => {
    if (kind === 'sepia')
      return [
        1 - 0.607 * amount,
        0.769 * amount,
        0.189 * amount,
        0.349 * amount,
        1 - 0.314 * amount,
        0.168 * amount,
        0.272 * amount,
        0.534 * amount,
        1 - 0.869 * amount,
        0,
      ];
    if (kind === 'hue-rotate') {
      const c = Math.cos((amount * Math.PI) / 180),
        s = Math.sin((amount * Math.PI) / 180);
      return [
        0.213 + 0.787 * c - 0.213 * s,
        0.715 - 0.715 * c - 0.715 * s,
        0.072 - 0.072 * c + 0.928 * s,
        0.213 - 0.213 * c + 0.143 * s,
        0.715 + 0.285 * c + 0.14 * s,
        0.072 - 0.072 * c - 0.283 * s,
        0.213 - 0.213 * c - 0.787 * s,
        0.715 - 0.715 * c + 0.715 * s,
        0.072 + 0.928 * c + 0.072 * s,
        0,
      ];
    }
    if (kind === 'brightness' || kind === 'contrast')
      return [
        amount,
        0,
        0,
        0,
        amount,
        0,
        0,
        0,
        amount,
        kind === 'contrast' ? 127.5 * (1 - amount) : 0,
      ];
    const a = kind === 'grayscale' ? 1 - amount : amount;
    return [
      0.2126 + 0.7874 * a,
      0.7152 - 0.7152 * a,
      0.0722 - 0.0722 * a,
      0.2126 - 0.2126 * a,
      0.7152 + 0.2848 * a,
      0.0722 - 0.0722 * a,
      0.2126 - 0.2126 * a,
      0.7152 - 0.7152 * a,
      0.0722 + 0.9278 * a,
      0,
    ];
  });
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    let r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    for (const m of matrices) {
      const nr = bound(m[0] * r + m[1] * g + m[2] * b + m[9]);
      const ng = bound(m[3] * r + m[4] * g + m[5] * b + m[9]);
      b = bound(m[6] * r + m[7] * g + m[8] * b + m[9]);
      r = nr;
      g = ng;
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}
