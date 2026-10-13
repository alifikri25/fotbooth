import type { AREffectId, ARPoint, ARKind } from './types';
export const arEffects: {
  id: AREffectId;
  name: string;
  icon: string;
  group: 'Wajah' | 'Reaksi' | 'Latar';
}[] = [
  { id: 'none', name: 'Tanpa AR', icon: '○', group: 'Wajah' },
  { id: 'cat', name: 'Kitty Club', icon: '🐱', group: 'Wajah' },
  { id: 'bunny', name: 'Bunny Pop', icon: '🐰', group: 'Wajah' },
  { id: 'bear', name: 'Teddy Mood', icon: '🐻', group: 'Wajah' },
  { id: 'glasses', name: 'Disco Glasses', icon: '🕶️', group: 'Wajah' },
  { id: 'crown', name: 'Golden Crown', icon: '👑', group: 'Wajah' },
  { id: 'ribbon', name: 'Ribbon Crush', icon: '🎀', group: 'Wajah' },
  { id: 'party', name: 'Party Time', icon: '🎉', group: 'Wajah' },
  { id: 'blush', name: 'Peach Freckles', icon: '🌸', group: 'Wajah' },
  { id: 'hearts', name: 'Heart Orbit', icon: '💕', group: 'Wajah' },
  { id: 'butterflies', name: 'Butterfly Halo', icon: '🦋', group: 'Wajah' },
  { id: 'confetti', name: 'Smile Confetti', icon: '✨', group: 'Reaksi' },
  { id: 'comic', name: 'Comic Boom', icon: '💥', group: 'Reaksi' },
  { id: 'studio', name: 'Peach Studio', icon: '🌅', group: 'Latar' },
  { id: 'aquarium', name: 'Aqua World', icon: '🫧', group: 'Latar' },
  { id: 'neon', name: 'Neon City', icon: '🌃', group: 'Latar' },
  { id: 'outline', name: 'Neon Silhouette', icon: '⚡', group: 'Latar' },
];
export function arKind(effect: AREffectId): ARKind {
  return ['studio', 'aquarium', 'neon', 'outline'].includes(effect) ? 'person' : 'face';
}
export function facePose(points: ARPoint[], width: number, height: number) {
  const a = points[33],
    b = points[263];
  if (!a || !b) return null;
  const dx = (b.x - a.x) * width,
    dy = (b.y - a.y) * height,
    distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < 2) return null;
  return {
    x: ((a.x + b.x) * width) / 2,
    y: ((a.y + b.y) * height) / 2,
    width: distance * 1.75,
    angle: Math.atan2(dy, dx),
  };
}
export function reactionActive(effect: AREffectId, scores: Record<string, number>) {
  const smile = ((scores.mouthSmileLeft ?? 0) + (scores.mouthSmileRight ?? 0)) / 2;
  return effect === 'confetti'
    ? smile > 0.45
    : effect === 'comic'
      ? smile > 0.45 || (scores.jawOpen ?? 0) > 0.45
      : true;
}
