import { expect, it } from 'vitest';
import { facePose, reactionActive } from '../../src/core/ar/effects';

// Wrong axis, ignored aspect ratio or fixed screen-position accessories break these poses.
it('anchors an accessory to tilted eyes in source pixels rather than screen coordinates', () => {
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  points[33] = { x: 0.3, y: 0.4 };
  points[263] = { x: 0.7, y: 0.6 };
  const pose = facePose(points, 1000, 500)!;
  expect(pose.x).toBe(500);
  expect(pose.y).toBe(250);
  expect(pose.width).toBeCloseTo(Math.hypot(400, 100) * 1.75);
  expect(pose.angle).toBeCloseTo(Math.atan2(100, 400));
});
it('suppresses face accessories for absent or degenerate detections', () => {
  expect(facePose([], 640, 480)).toBeNull();
  expect(
    facePose(
      Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 })),
      640,
      480,
    ),
  ).toBeNull();
});
// Confetti must react to a smile, and the comic burst must also react to an open mouth.
it('uses measured smile and mouth scores to trigger reactions', () => {
  expect(reactionActive('confetti', {})).toBe(false);
  expect(reactionActive('confetti', { mouthSmileLeft: 0.7, mouthSmileRight: 0.6 })).toBe(true);
  expect(reactionActive('confetti', { jawOpen: 0.9 })).toBe(false);
  expect(reactionActive('comic', { jawOpen: 0.7 })).toBe(true);
  expect(reactionActive('comic', { mouthSmileLeft: 0.2, mouthSmileRight: 0.3, jawOpen: 0.1 })).toBe(
    false,
  );
});
