import type { PhotoAsset, PhotoSource } from './types';
export const MAX_FILE_BYTES = 20 * 1024 * 1024,
  MAX_PIXELS = 24_000_000,
  MAX_PHOTOS = 8;
const unreadable = () => new Error('Foto ini tidak berhasil dibaca. Pilih JPG, PNG, atau WebP.');
const unsupported = () =>
  new Error(
    'Format ini belum didukung. Pilih JPG, PNG, atau WebP. Untuk HEIC, ekspor salinan JPG dari perangkatmu.',
  );
const ascii = (bytes: Uint8Array, offset: number, count: number) =>
  String.fromCharCode(...bytes.slice(offset, offset + count));
export interface ImageInfo {
  format: 'jpeg' | 'png' | 'webp';
  width: number;
  height: number;
  animated: boolean;
  orientation: number;
}
function exifOrientation(bytes: Uint8Array, start: number, end: number): number {
  try {
    if (ascii(bytes, start, 6) !== 'Exif\0\0') return 1;
    const t = start + 6,
      d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      little = ascii(bytes, t, 2) === 'II';
    const ifd = t + d.getUint32(t + 4, little);
    if (ifd + 2 > end) return 1;
    const count = d.getUint16(ifd, little);
    for (let i = 0; i < count; i++) {
      const p = ifd + 2 + i * 12;
      if (p + 12 > end) break;
      if (d.getUint16(p, little) === 0x112) {
        const n = d.getUint16(p + 8, little);
        return n >= 1 && n <= 8 ? n : 1;
      }
    }
  } catch {
    /* Malformed optional EXIF cannot override decoder orientation. */
  }
  return 1;
}
export function inspectImage(bytes: Uint8Array): ImageInfo {
  const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0,
    height = 0,
    animated = false,
    orientation = 1;
  if (
    bytes.length >= 33 &&
    ascii(bytes, 0, 8) === '\x89PNG\r\n\x1a\n' &&
    ascii(bytes, 12, 4) === 'IHDR'
  ) {
    width = d.getUint32(16);
    height = d.getUint32(20);
    for (let p = 8; p + 12 <= bytes.length;) {
      const size = d.getUint32(p);
      if (p + 12 + size > bytes.length) throw unreadable();
      if (ascii(bytes, p + 4, 4) === 'acTL') animated = true;
      p += 12 + size;
    }
    return { format: 'png', width, height, animated, orientation };
  }
  if (bytes.length >= 20 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    for (let p = 12; p + 8 <= bytes.length;) {
      const type = ascii(bytes, p, 4),
        size = d.getUint32(p + 4, true),
        a = p + 8;
      if (a + size > bytes.length) throw unreadable();
      if (type === 'VP8X' && size >= 10) {
        animated ||= !!(bytes[a] & 2);
        width = 1 + bytes[a + 4] + (bytes[a + 5] << 8) + (bytes[a + 6] << 16);
        height = 1 + bytes[a + 7] + (bytes[a + 8] << 8) + (bytes[a + 9] << 16);
      }
      if (type === 'ANIM' || type === 'ANMF') animated = true;
      if (
        type === 'VP8 ' &&
        size >= 10 &&
        bytes[a + 3] === 157 &&
        bytes[a + 4] === 1 &&
        bytes[a + 5] === 42
      ) {
        width = d.getUint16(a + 6, true) & 0x3fff;
        height = d.getUint16(a + 8, true) & 0x3fff;
      }
      if (type === 'VP8L' && size >= 5 && bytes[a] === 47) {
        const bits = d.getUint32(a + 1, true);
        width = 1 + (bits & 0x3fff);
        height = 1 + ((bits >>> 14) & 0x3fff);
      }
      p = a + size + (size % 2);
    }
    if (!width || !height) throw unreadable();
    return { format: 'webp', width, height, animated, orientation };
  }
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    let p = 2;
    while (p + 4 <= bytes.length) {
      if (bytes[p++] !== 255) throw unreadable();
      while (bytes[p] === 255) p++;
      const marker = bytes[p++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const size = d.getUint16(p);
      if (size < 2 || p + size > bytes.length) throw unreadable();
      if (marker === 225) orientation = exifOrientation(bytes, p + 2, p + size);
      if (
        [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) &&
        size >= 8
      ) {
        height = d.getUint16(p + 3);
        width = d.getUint16(p + 5);
      }
      p += size;
    }
    if (!width || !height) throw unreadable();
    return { format: 'jpeg', width, height, animated, orientation };
  }
  throw unsupported();
}
export function validateInput(bytes: Uint8Array, size: number, mime: string): ImageInfo {
  if (size > MAX_FILE_BYTES)
    throw new Error('Foto terlalu besar. Batas per foto: 20 MB dan 24 megapiksel.');
  if (mime && !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw unsupported();
  const info = inspectImage(bytes);
  if (!info.width || !info.height || info.width * info.height > MAX_PIXELS)
    throw new Error('Foto terlalu besar. Batas per foto: 20 MB dan 24 megapiksel.');
  if (info.animated)
    throw new Error('Foto animasi belum didukung. Pilih foto JPG, PNG, atau WebP yang diam.');
  return info;
}
export async function decodeSource(blob: Blob): Promise<PhotoSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      const image = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      return { image, width: image.width, height: image.height, release: () => image.close() };
    } catch {
      /* Safari/decoder fallback remains local. */
    }
  }
  const url = URL.createObjectURL(blob),
    image = new Image();
  image.src = url;
  try {
    await image.decode();
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => {
        image.src = '';
        URL.revokeObjectURL(url);
      },
    };
  } catch {
    URL.revokeObjectURL(url);
    throw unreadable();
  }
}
export const canvasBlob = (canvas: HTMLCanvasElement, type = 'image/png', quality = 0.92) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob && blob.size
          ? resolve(blob)
          : reject(new Error('Hasil belum berhasil dibuat. Coba lagi atau pilih ukuran ringan.')),
      type,
      quality,
    ),
  );
export async function ingestPhoto(
  file: Blob,
  sourceType: 'upload' | 'camera' = 'upload',
  defaultMirror = false,
): Promise<PhotoAsset> {
  if (file.size > MAX_FILE_BYTES)
    throw new Error('Foto terlalu besar. Batas per foto: 20 MB dan 24 megapiksel.');
  const info = validateInput(new Uint8Array(await file.arrayBuffer()), file.size, file.type);
  const oriented = info.orientation >= 5;
  const iw = oriented ? info.height : info.width,
    ih = oriented ? info.width : info.height;
  const ratio = Math.min(1, 1600 / Math.max(iw, ih));
  let preview: ImageBitmap | HTMLCanvasElement,
    width = iw,
    height = ih;
  if (typeof createImageBitmap === 'function') {
    try {
      preview = await createImageBitmap(file, {
        imageOrientation: 'from-image',
        resizeWidth: Math.round(iw * ratio),
        resizeHeight: Math.round(ih * ratio),
        resizeQuality: 'high',
      });
    } catch {
      preview = await fallbackPreview();
    }
  } else preview = await fallbackPreview();
  async function fallbackPreview() {
    const source = await decodeSource(file);
    width = source.width;
    height = source.height;
    try {
      const canvas = document.createElement('canvas'),
        scale = Math.min(1, 1600 / Math.max(width, height));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.getContext('2d')!.drawImage(source.image, 0, 0, canvas.width, canvas.height);
      return canvas;
    } finally {
      source.release?.();
    }
  }
  if (!preview.width || !preview.height) throw unreadable();
  const thumb = document.createElement('canvas');
  const scale = 160 / Math.max(preview.width, preview.height);
  thumb.width = Math.round(preview.width * scale);
  thumb.height = Math.round(preview.height * scale);
  thumb.getContext('2d')!.drawImage(preview, 0, 0, thumb.width, thumb.height);
  try {
    const thumbnail = await canvasBlob(thumb);
    return {
      id: crypto.randomUUID(),
      blob: file,
      preview,
      thumbnailUrl: URL.createObjectURL(thumbnail),
      width,
      height,
      sourceType,
      defaultMirror,
    };
  } catch (error) {
    if ('close' in preview) preview.close();
    throw error;
  }
}
