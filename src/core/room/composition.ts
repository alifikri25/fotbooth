import type { ARMask } from '../ar/types';
import { coverRect } from '../geometry';
import { canvasBlob, decodeSource, validateInput } from '../ingest';
import { renderComposition, slotPath } from '../renderer';
import { isSculptedMask } from '../slot-masks';
import { createSession, defaultCrop } from '../session';
import { ensureFonts } from '../text';
import type { FrameDefinition, PhotoSource, SlotDefinition } from '../types';

type RoomScene = 'studio' | 'sunset' | 'night';

export interface RoomPairSources {
  host: CanvasImageSource | null;
  guest: CanvasImageSource | null;
}

export interface RoomSnapshotPair {
  host: Blob;
  guest: Blob;
}

export function roomPortraitSize(width: number, height: number) {
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    throw new Error('Ukuran kamera belum siap.');
  const scale = Math.min(1, 1280 / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function roomPersonCrop(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number,
) {
  const {
    x,
    y,
    width: cropWidth,
    height: cropHeight,
  } = coverRect(width, height, targetWidth, targetHeight, defaultCrop);
  return { x, y, width: cropWidth, height: cropHeight };
}

export function roomMaskPixels(mask: ARMask): Uint8ClampedArray {
  const { width, height, values } = mask;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width * height > 4_194_304 ||
    values.length !== width * height
  )
    throw new Error('Pemisahan latar belum siap. Tunggu kamera mengenali tubuhmu.');
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < values.length; i++) {
    const confidence = Number.isFinite(values[i])
      ? Math.max(0, Math.min(1, (values[i] - 0.25) / 0.5))
      : 0;
    pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = 255;
    pixels[i * 4 + 3] = Math.round(confidence * confidence * (3 - 2 * confidence) * 255);
  }
  return pixels;
}

export function makeRoomPortrait(
  image: CanvasImageSource,
  width: number,
  height: number,
  mask?: ARMask,
  mirror = false,
): HTMLCanvasElement {
  const size = roomPortraitSize(width, height);
  const maskPixels = mask ? roomMaskPixels(mask) : null;
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Kamera tidak dapat digambar di perangkat ini.');
  context.save();
  if (mirror) {
    context.translate(size.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(image, 0, 0, size.width, size.height);
  if (mask && maskPixels) {
    const surface = document.createElement('canvas');
    surface.width = mask.width;
    surface.height = mask.height;
    try {
      const maskContext = surface.getContext('2d');
      if (!maskContext) throw new Error('Pemisahan latar tidak tersedia di perangkat ini.');
      const pixels = maskContext.createImageData(mask.width, mask.height);
      pixels.data.set(maskPixels);
      maskContext.putImageData(pixels, 0, 0);
      context.globalCompositeOperation = 'destination-in';
      context.drawImage(surface, 0, 0, size.width, size.height);
    } catch (error) {
      canvas.width = canvas.height = 1;
      throw error;
    } finally {
      surface.width = surface.height = 1;
    }
  }
  context.restore();
  return canvas;
}

function sourceDimensions(source: CanvasImageSource) {
  if ('videoWidth' in source) return { width: source.videoWidth, height: source.videoHeight };
  if ('naturalWidth' in source) return { width: source.naturalWidth, height: source.naturalHeight };
  if ('displayWidth' in source) return { width: source.displayWidth, height: source.displayHeight };
  if (typeof source.width === 'number' && typeof source.height === 'number')
    return { width: source.width, height: source.height };
  throw new Error('Foto belum berhasil dibaca.');
}

function drawBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: RoomScene,
) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  const colors =
    scene === 'sunset'
      ? ['#f7b6be', '#ffd9af', '#e99c88']
      : scene === 'night'
        ? ['#202143', '#4a4164', '#776784']
        : ['#f8e9e3', '#ead5cd', '#d4b9b4'];
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.72, colors[1]);
  gradient.addColorStop(1, colors[2]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  if (scene === 'sunset') {
    context.fillStyle = '#fff2d3';
    context.beginPath();
    context.arc(width * 0.5, height * 0.28, Math.min(width, height) * 0.12, 0, Math.PI * 2);
    context.fill();
  } else if (scene === 'night') {
    context.fillStyle = '#ffefd2';
    for (let i = 0; i < 22; i++) {
      const x = (((i * 137 + 41) % 997) / 997) * width;
      const y = (((i * 89 + 17) % 317) / 997) * height;
      context.beginPath();
      context.arc(x, y, Math.max(1, width * 0.0015), 0, Math.PI * 2);
      context.fill();
    }
  }
}

export function drawRoomScene(
  canvas: HTMLCanvasElement,
  host: CanvasImageSource | null,
  guest: CanvasImageSource | null,
  scene: RoomScene,
): void {
  const context = canvas.getContext('2d');
  if (!context || !canvas.width || !canvas.height) throw new Error('Kanvas foto belum siap.');
  const width = canvas.width,
    height = canvas.height;
  context.save();
  try {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, width, height);
    drawBackdrop(context, width, height, scene);
    drawRoomPeople(context, width, height, host, guest);
  } finally {
    context.restore();
  }
}

function drawRoomPeople(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  host: CanvasImageSource | null,
  guest: CanvasImageSource | null,
) {
  [host, guest].forEach((source, side) => {
    if (!source) return;
    const dimensions = sourceDimensions(source);
    if (!dimensions.width || !dimensions.height) return;
    const crop = roomPersonCrop(dimensions.width, dimensions.height, width / 2, height);
    context.drawImage(
      source,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      (side * width) / 2,
      0,
      width / 2,
      height,
    );
  });
}

function sculptedPortraitScale(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  slot: SlotDefinition,
  host: CanvasImageSource | null,
  guest: CanvasImageSource | null,
) {
  const path = slotPath(slot, width, height);
  const headPoints: { x: number; y: number }[] = [];
  [host, guest].forEach((source, side) => {
    if (!source) return;
    const dimensions = sourceDimensions(source);
    if (!dimensions.width || !dimensions.height) return;
    const crop = roomPersonCrop(dimensions.width, dimensions.height, width / 2, height);
    // A centered forehead-and-eyes envelope in each camera, projected through the real crop.
    // Narrow photo windows need more room on the outside of each person's head.
    for (const x of [0.4, 0.5, 0.6]) {
      for (const y of [0.06, 0.15, 0.26]) {
        headPoints.push({
          x: side / 2 + (x * dimensions.width - crop.x) / crop.width / 2,
          y: (y * dimensions.height - crop.y) / crop.height,
        });
      }
    }
  });
  // Choose the largest uniform portrait layer that clears this mask's actual notches.
  // Anchoring at the bottom moves heads inward/down and leaves a continuous backdrop above.
  for (let step = 0; step <= 17; step++) {
    const scale = 1 - step * 0.02;
    if (
      headPoints.every(({ x, y }) =>
        context.isPointInPath(
          path,
          (x * scale + (1 - scale) / 2) * width,
          (y * scale + 1 - scale) * height,
        ),
      )
    )
      return scale;
  }
  return 0.66;
}

function drawRoomSlotScene(
  canvas: HTMLCanvasElement,
  host: CanvasImageSource | null,
  guest: CanvasImageSource | null,
  scene: RoomScene,
  slot: SlotDefinition,
) {
  if (slot.shape !== 'path' || !isSculptedMask(slot.pathRef)) {
    drawRoomScene(canvas, host, guest, scene);
    return;
  }
  const context = canvas.getContext('2d');
  if (!context || !canvas.width || !canvas.height) throw new Error('Kanvas foto belum siap.');
  const width = canvas.width,
    height = canvas.height;
  context.save();
  try {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, width, height);
    drawBackdrop(context, width, height, scene);
    const scale = sculptedPortraitScale(context, width, height, slot, host, guest);
    context.translate((width * (1 - scale)) / 2, height * (1 - scale));
    context.scale(scale, scale);
    drawRoomPeople(context, width, height, host, guest);
  } finally {
    context.restore();
  }
}

export async function drawRoomFrame(
  canvas: HTMLCanvasElement,
  host: CanvasImageSource | null,
  guest: CanvasImageSource | null,
  frame: FrameDefinition,
  scene: RoomScene,
  completedPairs: readonly RoomPairSources[] = [],
): Promise<void> {
  if (completedPairs.length > frame.slots.length)
    throw new Error('Jumlah pasangan foto melebihi slot frame.');
  const width = canvas.width,
    height = canvas.height;
  const session = createSession(frame);
  const surfaces = new Map<string, HTMLCanvasElement>();
  try {
    const slots = [...frame.slots].sort((a, b) => a.order - b.order);
    for (const [index, slot] of slots.entries()) {
      const size = roomPortraitSize(slot.w * width, slot.h * height);
      const pair = document.createElement('canvas');
      pair.width = size.width;
      pair.height = size.height;
      surfaces.set(slot.id, pair);
      const sources = completedPairs[index] ?? { host, guest };
      drawRoomSlotScene(pair, sources.host, sources.guest, scene, slot);
      session.placements.push({ ...defaultCrop, slotId: slot.id, photoId: slot.id });
    }
    await renderComposition(
      canvas,
      frame,
      session,
      async (id) => {
        const image = surfaces.get(id)!;
        return { image, width: image.width, height: image.height };
      },
      width,
      height,
    );
  } finally {
    for (const surface of surfaces.values()) surface.width = surface.height = 1;
  }
}

export async function exportRoomSequence(
  pairs: readonly RoomSnapshotPair[],
  frame: FrameDefinition,
  scene: RoomScene,
): Promise<Blob> {
  if (pairs.length !== frame.slots.length || !pairs.length)
    throw new Error('Setiap slot frame memerlukan tepat satu pasangan foto.');
  const sources: PhotoSource[] = [];
  const completed: RoomPairSources[] = [];
  const canvas = document.createElement('canvas');
  try {
    for (const pair of pairs) {
      for (const blob of [pair.host, pair.guest])
        validateInput(new Uint8Array(await blob.arrayBuffer()), blob.size, blob.type);
      const host = await decodeSource(pair.host);
      sources.push(host);
      const guest = await decodeSource(pair.guest);
      sources.push(guest);
      completed.push({ host: host.image, guest: guest.image });
    }
    canvas.width = frame.designWidth;
    canvas.height = frame.designHeight;
    await ensureFonts();
    await drawRoomFrame(canvas, null, null, frame, scene, completed);
    return await canvasBlob(canvas, 'image/png');
  } finally {
    for (const source of sources) source.release?.();
    canvas.width = canvas.height = 1;
  }
}

export async function exportRoomFrame(
  host: Blob,
  guest: Blob,
  frame: FrameDefinition,
  scene: RoomScene,
): Promise<Blob> {
  let hostSource: PhotoSource | undefined, guestSource: PhotoSource | undefined;
  const canvas = document.createElement('canvas');
  try {
    for (const source of [host, guest])
      validateInput(new Uint8Array(await source.arrayBuffer()), source.size, source.type);
    hostSource = await decodeSource(host);
    guestSource = await decodeSource(guest);
    canvas.width = frame.designWidth;
    canvas.height = frame.designHeight;
    await ensureFonts();
    await drawRoomFrame(canvas, hostSource.image, guestSource.image, frame, scene);
    return await canvasBlob(canvas, 'image/png');
  } finally {
    hostSource?.release?.();
    guestSource?.release?.();
    canvas.width = canvas.height = 1;
  }
}
