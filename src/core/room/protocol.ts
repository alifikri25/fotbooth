export type RoomRole = 'host' | 'guest';

export interface RoomSettings {
  frameId: string;
  scene: 'studio' | 'sunset' | 'night';
  cutout: boolean;
}

export interface RoomCaptureSeries {
  seriesId: string;
  index: number;
  total: number;
}

export interface RoomCapture {
  captureId: string;
  at: number;
  settings: RoomSettings;
  series?: RoomCaptureSeries;
}

export interface RoomParticipant {
  role: RoomRole;
  name: string;
  ready: boolean;
  connected: boolean;
}

export interface RoomState {
  type: 'state';
  self: RoomRole;
  roomId: string;
  expiresAt: number;
  settings: RoomSettings;
  participants: RoomParticipant[];
  phase: 'waiting' | 'ready' | 'countdown' | 'result';
  capture?: { id: string; at: number; series?: RoomCaptureSeries };
  inviteToken?: string;
}

export interface RoomCreated {
  roomId: string;
  hostToken: string;
  guestToken: string;
  expiresAt: number;
}

export interface RoomSignal {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit | null;
}

export type RoomClientMessage =
  | { type: 'ready'; ready: boolean }
  | { type: 'settings'; settings: RoomSettings }
  | { type: 'signal'; data: RoomSignal }
  | { type: 'relay'; data: string }
  | { type: 'capture' }
  | { type: 'advance'; captureId: string }
  | { type: 'captured'; captureId: string }
  | { type: 'retake' }
  | { type: 'ping'; clientTime: number };

export type RoomServerMessage =
  | RoomState
  | { type: 'signal'; from: RoomRole; data: RoomSignal }
  | { type: 'relay'; from: RoomRole; data: string }
  | ({ type: 'capture' } & RoomCapture)
  | { type: 'pong'; clientTime: number; serverTime: number }
  | { type: 'error'; code: string; message: string };
