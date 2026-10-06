export type FitMode = 'cover' | 'contain';
export type Shape = 'rect' | 'roundedRect' | 'circle' | 'path';
export interface Crop {
  fitMode: FitMode;
  centerX: number;
  centerY: number;
  zoom: number;
  rotation: number;
  mirror: boolean;
}
export interface Placement extends Crop {
  slotId: string;
  photoId: string;
}
export interface SlotDefinition {
  id: string;
  order: number;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: Shape;
  radius?: number;
  pathRef?: 'arch' | 'chamfer';
  rotationDeg: number;
  matteColor: string;
}
export interface TextArea {
  id: string;
  text?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontId: 'sans' | 'serif';
  fontSize: number;
  minFontSize: number;
  maxLines: number;
  color: string;
}
export interface FrameDefinition {
  id: string;
  name: string;
  version: number;
  format: 'strip' | 'card';
  categories: string[];
  designWidth: number;
  designHeight: number;
  slots: SlotDefinition[];
  textAreas: TextArea[];
  palette: { background: string; ink: string; accent: string; secondary: string };
  layers: { background: string; foreground: string };
  thumbnail: string;
  licenses: string[];
  description: string;
  collection?: string;
  artwork?: { motif: string; edition: number };
}
export interface Session {
  frameId: string;
  frameVersion: number;
  slotIds: string[];
  photoIds: string[];
  placements: Placement[];
  caption: string;
  date: string;
  revision: number;
  frameCache: Record<string, Placement[]>;
}
export interface PhotoAsset {
  id: string;
  blob: Blob;
  preview: ImageBitmap | HTMLCanvasElement;
  thumbnailUrl: string;
  width: number;
  height: number;
  sourceType: 'upload' | 'camera';
  defaultMirror: boolean;
}
export type PhotoSource = {
  image: CanvasImageSource;
  width: number;
  height: number;
  release?: () => void;
};
export type PhotoResolver = (id: string) => Promise<PhotoSource>;
