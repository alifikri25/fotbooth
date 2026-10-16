/** Curated photo silhouettes shared by Canvas, SVG artwork, and live camera guides. */
export const sculptedMaskRefs = [
  'star',
  'flower',
  'cloud',
  'pebble',
  'wave',
  'torn',
  'heart',
  'burst',
] as const;
export type SculptedMaskRef = (typeof sculptedMaskRefs)[number];
type Point = readonly [number, number];

export function isSculptedMask(ref: unknown): ref is SculptedMaskRef {
  return typeof ref === 'string' && sculptedMaskRefs.some((mask) => mask === ref);
}

function normalize(points: Point[]): Point[] {
  const xs = points.map(([x]) => x),
    ys = points.map(([, y]) => y);
  const left = Math.min(...xs),
    top = Math.min(...ys);
  const width = Math.max(...xs) - left,
    height = Math.max(...ys) - top;
  return points.map(([x, y]) => [(x - left) / width, (y - top) / height]);
}

function smooth(points: Point[]): Point[] {
  const sampled: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i + points.length - 1) % points.length];
    const p1 = points[i],
      p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];
    for (let step = 0; step < 20; step++) {
      const t = step / 20,
        t2 = t * t,
        t3 = t2 * t;
      const coordinate = (axis: 0 | 1) =>
        0.5 *
        (2 * p1[axis] +
          (-p0[axis] + p2[axis]) * t +
          (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2 +
          (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3);
      sampled.push([coordinate(0), coordinate(1)]);
    }
  }
  return normalize(sampled);
}

function pointed(tips: number, innerRadius: number): Point[] {
  const vertices: Point[] = Array.from({ length: tips * 2 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / tips;
    const radius = i % 2 ? innerRadius : 1;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  // Gently round the tips without shrinking the broad, uninterrupted face area.
  const points: Point[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const previous = vertices[(i + vertices.length - 1) % vertices.length];
    const current = vertices[i],
      next = vertices[(i + 1) % vertices.length];
    const start: Point = [
      current[0] * 0.93 + previous[0] * 0.07,
      current[1] * 0.93 + previous[1] * 0.07,
    ];
    const end: Point = [current[0] * 0.93 + next[0] * 0.07, current[1] * 0.93 + next[1] * 0.07];
    for (let step = 0; step <= 8; step++) {
      const t = step / 8,
        u = 1 - t;
      points.push([
        u * u * start[0] + 2 * u * t * current[0] + t * t * end[0],
        u * u * start[1] + 2 * u * t * current[1] + t * t * end[1],
      ]);
    }
  }
  return normalize(points);
}

const silhouettes: Record<SculptedMaskRef, Point[]> = {
  star: pointed(5, 0.62),
  flower: normalize(
    Array.from({ length: 280 }, (_, i): Point => {
      const angle = (i * Math.PI * 2) / 280;
      const radius = 0.92 + 0.08 * Math.cos(angle * 7);
      return [Math.cos(angle) * radius, Math.sin(angle) * radius];
    }),
  ),
  cloud: smooth([
    [0.05, 0.39],
    [0.14, 0.18],
    [0.32, 0.18],
    [0.42, 0.02],
    [0.64, 0.05],
    [0.75, 0.21],
    [0.94, 0.25],
    [1, 0.46],
    [0.89, 0.66],
    [0.9, 0.84],
    [0.68, 0.98],
    [0.49, 0.94],
    [0.31, 1],
    [0.12, 0.87],
    [0.1, 0.68],
    [0, 0.57],
  ]),
  pebble: smooth([
    [0.04, 0.3],
    [0.17, 0.09],
    [0.44, 0],
    [0.73, 0.05],
    [0.94, 0.23],
    [1, 0.52],
    [0.91, 0.79],
    [0.67, 0.96],
    [0.35, 1],
    [0.11, 0.85],
    [0, 0.6],
  ]),
  wave: smooth([
    [0.02, 0.12],
    [0.27, 0],
    [0.52, 0.08],
    [0.76, 0.01],
    [0.98, 0.13],
    [0.95, 0.38],
    [1, 0.64],
    [0.93, 0.9],
    [0.72, 0.98],
    [0.48, 0.92],
    [0.22, 1],
    [0.02, 0.85],
    [0.07, 0.61],
    [0, 0.35],
  ]),
  torn: [
    [0.04, 0.1],
    [0.26, 0.08],
    [0.35, 0.015],
    [0.55, 0.06],
    [0.75, 0],
    [0.96, 0.06],
    [0.93, 0.27],
    [1, 0.38],
    [0.97, 0.58],
    [1, 0.75],
    [0.9, 0.83],
    [0.88, 1],
    [0.64, 0.96],
    [0.47, 1],
    [0.32, 0.91],
    [0.12, 0.95],
    [0.15, 0.72],
    [0.01, 0.68],
    [0.04, 0.48],
    [0, 0.3],
    [0.09, 0.23],
  ],
  heart: smooth([
    [0.5, 0.16],
    [0.65, 0.025],
    [0.84, 0.02],
    [0.98, 0.17],
    [1, 0.4],
    [0.92, 0.65],
    [0.75, 0.84],
    [0.5, 1],
    [0.25, 0.84],
    [0.08, 0.65],
    [0, 0.4],
    [0.02, 0.17],
    [0.16, 0.02],
    [0.35, 0.025],
  ]),
  burst: pointed(9, 0.82),
};

const areaFractions = Object.fromEntries(
  sculptedMaskRefs.map((ref) => {
    const points = silhouettes[ref];
    const signedDoubleArea = points.reduce((sum, [x, y], i) => {
      const next = points[(i + 1) % points.length];
      return sum + x * next[1] - next[0] * y;
    }, 0);
    return [ref, Math.abs(signedDoubleArea) / 2];
  }),
) as Record<SculptedMaskRef, number>;

export function sculptedMaskPath(ref: SculptedMaskRef, width: number, height: number): string {
  return (
    silhouettes[ref]
      .map(
        ([x, y], i) =>
          `${i ? 'L' : 'M'}${Number((x * width).toFixed(6))},${Number((y * height).toFixed(6))}`,
      )
      .join('') + 'Z'
  );
}

export function sculptedMaskArea(ref: SculptedMaskRef, width: number, height: number): number {
  return areaFractions[ref] * width * height;
}
