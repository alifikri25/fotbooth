import { ARDetector } from './detector';
import type { ARKind } from './types';
const detector = new ARDetector();
self.onmessage = async (event: MessageEvent<{ id: number; kind: ARKind; image: ImageBitmap }>) => {
  const { id, kind, image } = event.data;
  try {
    const result = await detector.infer(image, kind);
    self.postMessage(
      { id, result },
      { transfer: result.mask ? [result.mask.values.buffer as ArrayBuffer] : [] },
    );
  } catch (error) {
    console.error('AR inference unavailable', error instanceof Error ? error.message : error);
    self.postMessage({
      id,
      error: 'Efek AR belum bisa dimuat. Pilih Tanpa AR untuk tetap mengambil foto.',
    });
  } finally {
    image.close();
  }
};
