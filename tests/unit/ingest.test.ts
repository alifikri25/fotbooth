import { describe, expect, it } from 'vitest';
import { inspectImage, validateInput } from '../../src/core/ingest';

function png(width = 100, height = 200, animated = false) {
  const bytes = new Uint8Array(animated ? 57 : 33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const d = new DataView(bytes.buffer);
  d.setUint32(8, 13);
  bytes.set([73, 72, 68, 82], 12);
  d.setUint32(16, width);
  d.setUint32(20, height);
  if (animated) {
    d.setUint32(33, 8);
    bytes.set([97, 99, 84, 76], 37);
  }
  return bytes;
}
describe('local ingest checks bytes and dimensions before decoding', () => {
  it('recognizes PNG dimensions without relying on the MIME or filename', () =>
    expect(inspectImage(png())).toMatchObject({
      format: 'png',
      width: 100,
      height: 200,
      animated: false,
    }));
  it('rejects animation instead of silently capturing its first frame', () =>
    expect(() => validateInput(png(100, 200, true), 100, 'image/png')).toThrow(/animasi/i));
  it('rejects unsupported or corrupt input', () => {
    expect(() => inspectImage(new Uint8Array([1, 2, 3]))).toThrow();
    expect(() => validateInput(new TextEncoder().encode('<svg/>'), 10, 'image/svg+xml')).toThrow();
  });
  it('rejects file size and pixel bombs before allocating their bitmaps', () => {
    expect(() => validateInput(png(), 20 * 1024 * 1024 + 1, '')).toThrow(/besar/i);
    expect(() => validateInput(png(6000, 5000), 100, 'image/png')).toThrow(/besar/i);
  });
  it('recognizes lossy WebP and JPEG headers', () => {
    const webp = new Uint8Array(30);
    const d = new DataView(webp.buffer);
    webp.set(new TextEncoder().encode('RIFF'), 0);
    d.setUint32(4, 22, true);
    webp.set(new TextEncoder().encode('WEBPVP8 '), 8);
    d.setUint32(16, 10, true);
    webp.set([0, 0, 0, 157, 1, 42, 100, 0, 200, 0], 20);
    expect(inspectImage(webp)).toMatchObject({ format: 'webp', width: 100, height: 200 });
    const jpg = new Uint8Array([
      255, 216, 255, 192, 0, 17, 8, 0, 200, 0, 100, 3, 1, 17, 0, 2, 17, 0, 3, 17, 0, 255, 217,
    ]);
    expect(inspectImage(jpg)).toMatchObject({ format: 'jpeg', width: 100, height: 200 });
  });
});
