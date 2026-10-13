import { FaceLandmarker, FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';
import type { ARDetection, ARKind } from './types';
async function files() {
  const resolved = await FilesetResolver.forVisionTasks('/ar/mediapipe-1.1.0', true);
  const url = new URL(resolved.wasmLoaderPath, self.location.origin).href;
  const loader = await import(/* @vite-ignore */ url);
  (globalThis as unknown as { ModuleFactory: unknown }).ModuleFactory = loader.default;
  return { ...resolved, wasmLoaderPath: '' };
}
const modelCanvas = () =>
  typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(1, 1);
// The SDK's loader uses a global factory. Serial creation also protects rapid Safari effect switches.
let initialization = Promise.resolve();
function initialize<T>(create: () => Promise<T>): Promise<T> {
  const task = initialization.then(create);
  initialization = task.then(
    () => {},
    () => {},
  );
  return task;
}
export class ARDetector {
  private face?: FaceLandmarker;
  private person?: ImageSegmenter;
  private lastTime = 0;
  private closed = false;
  private ensureOpen() {
    if (this.closed) throw new DOMException('Efek AR dihentikan.', 'AbortError');
  }
  async infer(image: ImageBitmap, kind: ARKind): Promise<ARDetection> {
    this.ensureOpen();
    const time = (this.lastTime = Math.max(this.lastTime + 1, performance.now()));
    if (kind === 'face') {
      this.face ??= await initialize(async () => {
        this.ensureOpen();
        return FaceLandmarker.createFromOptions(await files(), {
          baseOptions: { modelAssetPath: '/ar/face_landmarker-v1.task', delegate: 'CPU' },
          runningMode: 'VIDEO',
          numFaces: 2,
          outputFaceBlendshapes: true,
          canvas: modelCanvas(),
        });
      });
      if (this.closed) {
        this.close();
        this.ensureOpen();
      }
      const result = this.face.detectForVideo(image, time);
      return {
        faces: result.faceLandmarks.map((points, i) => ({
          points: points.map(({ x, y }) => ({ x, y })),
          expressions: Object.fromEntries(
            (result.faceBlendshapes[i]?.categories ?? []).map((c) => [c.categoryName, c.score]),
          ),
        })),
      };
    }
    this.person ??= await initialize(async () => {
      this.ensureOpen();
      return ImageSegmenter.createFromOptions(await files(), {
        baseOptions: { modelAssetPath: '/ar/selfie_segmenter-v1.tflite', delegate: 'CPU' },
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
        canvas: modelCanvas(),
      });
    });
    if (this.closed) {
      this.close();
      this.ensureOpen();
    }
    const result = this.person.segmentForVideo(image, time);
    try {
      const masks = result.confidenceMasks!,
        mask = masks[masks.length === 1 ? 0 : 1];
      return {
        faces: [],
        mask: { width: mask.width, height: mask.height, values: mask.getAsFloat32Array().slice() },
      };
    } finally {
      result.close();
    }
  }
  close() {
    this.closed = true;
    this.face?.close();
    this.person?.close();
    this.face = undefined;
    this.person = undefined;
  }
}
