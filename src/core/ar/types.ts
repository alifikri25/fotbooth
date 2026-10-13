export type AREffectId =
  | 'none'
  | 'cat'
  | 'bunny'
  | 'bear'
  | 'glasses'
  | 'crown'
  | 'ribbon'
  | 'party'
  | 'blush'
  | 'hearts'
  | 'butterflies'
  | 'confetti'
  | 'comic'
  | 'studio'
  | 'aquarium'
  | 'neon'
  | 'outline';
export type ARKind = 'face' | 'person';
export interface ARPoint {
  x: number;
  y: number;
}
export interface ARFace {
  points: ARPoint[];
  expressions: Record<string, number>;
}
export interface ARMask {
  width: number;
  height: number;
  values: Float32Array;
}
export interface ARDetection {
  faces: ARFace[];
  mask?: ARMask;
}
export interface ARSnapshot extends ARDetection {
  effect: AREffectId;
  time: number;
}
