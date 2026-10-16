import { test, expect } from '@playwright/test';
import { startEditor } from './helpers';

test('editor selection and responsive camera guides follow the actual sculpted silhouette', async ({
  page,
}) => {
  await startEditor(page, 'Aquarium Parade', 2);
  await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
  await expect(page.locator('.slot-outline.is-sculpted svg path')).toHaveCount(2);
  const slot = await page.evaluate(async () => {
    const { getFrame } = await import('/src/frames/catalog.ts');
    const frame = getFrame('aquarium-parade');
    return { ...frame.slots[0], width: frame.designWidth, height: frame.designHeight };
  });
  const canvas = page.getByRole('img', { name: /^Preview Aquarium Parade/ });
  const box = (await canvas.boundingBox())!;
  const point = (x: number, y: number) => {
    const dx = (x - 0.5) * slot.w * slot.width;
    const dy = (y - 0.5) * slot.h * slot.height;
    const angle = (slot.rotationDeg * Math.PI) / 180;
    return {
      x:
        box.x +
        (slot.x + slot.w / 2 + (dx * Math.cos(angle) - dy * Math.sin(angle)) / slot.width) *
          box.width,
      y:
        box.y +
        (slot.y + slot.h / 2 + (dx * Math.sin(angle) + dy * Math.cos(angle)) / slot.height) *
          box.height,
    };
  };
  await page.getByRole('button', { name: 'Pilih slot 2', exact: true }).click();
  const outside = point(0.004, 0.004);
  await page.mouse.click(outside.x, outside.y);
  await expect(page.getByRole('button', { name: 'Pilih slot 2', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const inside = point(0.5, 0.5);
  await page.mouse.click(inside.x, inside.y);
  await expect(page.getByRole('button', { name: 'Pilih slot 1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Pakai kamera', exact: true }).click();
  const camera = page.locator('.camera-live');
  await expect(camera).toBeVisible();
  await expect(page.locator('.camera-clip-definitions clipPath')).toHaveAttribute(
    'clipPathUnits',
    'objectBoundingBox',
  );
  await camera.evaluate((element: HTMLElement) => {
    element.style.background = '#ff0000';
    for (const child of element.children) (child as HTMLElement).style.visibility = 'hidden';
  });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const encoded = await camera.screenshot();
    const pixels = await page.evaluate(async (bytes) => {
      const bitmap = await createImageBitmap(
        new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      return {
        corner: Array.from(context.getImageData(1, 1, 1, 1).data),
        center: Array.from(
          context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1)
            .data,
        ),
      };
    }, Array.from(encoded));
    expect(pixels.corner, `camera cut-away corner at ${width}px`).not.toEqual([255, 0, 0, 255]);
    expect(pixels.center, `camera face area at ${width}px`).toEqual([255, 0, 0, 255]);
  }
});

test('sculpted masks expose artwork in their corners while keeping faces and hit tests inside', async ({
  page,
}) => {
  await page.goto('/tests/harness.html');
  const results = await page.evaluate(async () => {
    const { renderComposition, slotPath } = await import('/src/core/renderer.ts');
    const source = document.createElement('canvas');
    source.width = source.height = 400;
    const paint = source.getContext('2d')!;
    paint.fillStyle = '#ff0000';
    paint.fillRect(0, 0, 200, 400);
    paint.fillStyle = '#0000ff';
    paint.fillRect(200, 0, 200, 400);
    const result = [];
    for (const ref of ['star', 'flower', 'cloud', 'pebble', 'wave', 'torn', 'heart', 'burst']) {
      const slot = {
        id: 'p1',
        order: 1,
        x: 0.1,
        y: 0.1,
        w: 0.8,
        h: 0.8,
        shape: 'path',
        pathRef: ref,
        rotationDeg: 0,
        matteColor: '#00ff00',
      };
      const frame = {
        id: 'proof',
        name: 'Proof',
        version: 1,
        designWidth: 1000,
        designHeight: 1000,
        palette: { background: '#ffffff' },
        layers: { background: '', foreground: '' },
        textAreas: [],
        slots: [slot],
      };
      const session = {
        caption: '',
        date: '',
        placements: [
          {
            slotId: 'p1',
            photoId: 'proof',
            fitMode: 'cover',
            centerX: 0.5,
            centerY: 0.5,
            zoom: 1,
            rotation: 0,
            mirror: false,
          },
        ],
      };
      for (const scale of [1, 0.4]) {
        const canvas = document.createElement('canvas');
        await renderComposition(
          canvas,
          frame,
          session,
          async () => ({ image: source, width: 400, height: 400 }),
          1000 * scale,
          1000 * scale,
        );
        const context = canvas.getContext('2d')!;
        const sample = (x: number, y: number) =>
          Array.from(context.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data);
        const path = slotPath(slot, 800, 800);
        // Pointer coordinates are already converted to slot-local design pixels by Preview.
        context.setTransform(1, 0, 0, 1, 0, 0);
        result.push({
          ref,
          scale,
          corner: sample(103, 103),
          leftFace: sample(400, 500),
          rightFace: sample(600, 500),
          inside: context.isPointInPath(path, 300, 400),
          outside: context.isPointInPath(path, 3, 3),
          visibleNotch:
            ref === 'star'
              ? { pixel: sample(500, 852), hit: context.isPointInPath(path, 400, 752) }
              : ref === 'torn'
                ? { pixel: sample(164, 820), hit: context.isPointInPath(path, 64, 720) }
                : undefined,
        });
      }
    }
    return result;
  });
  for (const result of results) {
    expect(result.corner, `${result.ref}: artwork remains visible`).toEqual([255, 255, 255, 255]);
    expect(result.leftFace, `${result.ref}: left face remains usable`).toEqual([255, 0, 0, 255]);
    expect(result.rightFace, `${result.ref}: right face remains usable`).toEqual([0, 0, 255, 255]);
    expect(result.inside, result.ref).toBe(true);
    expect(result.outside, result.ref).toBe(false);
    if (result.visibleNotch) {
      expect
        .soft(result.visibleNotch.pixel, `${result.ref}: visible cutaway`)
        .toEqual([255, 255, 255, 255]);
      expect.soft(result.visibleNotch.hit, `${result.ref}: cutaway is not selectable`).toBe(false);
    }
  }
});

test('shared renderer clips, mirrors only the photo, and exports decodable files at exact sizes', async ({
  page,
}) => {
  await page.goto('/tests/harness.html');
  const result = await page.evaluate(async () => {
    const { renderComposition } = await import('/src/core/renderer.ts');
    const source = document.createElement('canvas');
    source.width = 400;
    source.height = 300;
    const c = source.getContext('2d')!;
    c.fillStyle = '#ff0000';
    c.fillRect(0, 0, 200, 300);
    c.fillStyle = '#0000ff';
    c.fillRect(200, 0, 200, 300);
    const frame = {
      id: 'proof',
      version: 1,
      name: 'Proof',
      designWidth: 1000,
      designHeight: 1000,
      palette: { background: '#ffffff' },
      layers: { background: '', foreground: '' },
      textAreas: [],
      slots: [
        {
          id: 'p1',
          order: 1,
          x: 0.1,
          y: 0.1,
          w: 0.8,
          h: 0.8,
          shape: 'circle',
          rotationDeg: 0,
          matteColor: '#00ff00',
        },
      ],
    };
    const session = {
      placements: [
        {
          slotId: 'p1',
          photoId: 'test',
          fitMode: 'cover',
          centerX: 0.5,
          centerY: 0.5,
          zoom: 1,
          rotation: 0,
          mirror: false,
        },
      ],
      caption: '',
      date: '',
    };
    const canvas = document.querySelector('canvas')!;
    const resolver = async () => ({ image: source, width: 400, height: 300 });
    const pixel = (x: number, y: number) =>
      Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);
    await renderComposition(canvas, frame, session, resolver, 1000, 1000);
    const left = pixel(300, 500),
      corner = pixel(110, 110);
    session.placements[0].mirror = true;
    await renderComposition(canvas, frame, session, resolver, 1000, 1000);
    const mirrored = pixel(300, 500);
    session.placements[0].fitMode = 'contain';
    await renderComposition(canvas, frame, session, resolver, 500, 500);
    const matte = pixel(250, 70);
    const encoded: { type: string; width: number; height: number; size: number }[] = [];
    for (const type of ['image/png', 'image/jpeg']) {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), type, 0.92),
      );
      const decoded = await createImageBitmap(blob);
      encoded.push({
        type: blob.type,
        width: decoded.width,
        height: decoded.height,
        size: blob.size,
      });
      decoded.close();
    }
    return { left, corner, mirrored, matte, encoded };
  });
  expect(result.left).toEqual([255, 0, 0, 255]);
  expect(result.corner).toEqual([255, 255, 255, 255]);
  expect(result.mirrored).toEqual([0, 0, 255, 255]);
  expect(result.matte).toEqual([0, 255, 0, 255]);
  for (const image of result.encoded) {
    expect(image.width).toBe(500);
    expect(image.height).toBe(500);
    expect(image.size).toBeGreaterThan(100);
  }
});
