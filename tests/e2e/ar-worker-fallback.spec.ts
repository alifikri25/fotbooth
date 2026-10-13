import { test, expect } from '@playwright/test';

async function brokenWorker(page: import('@playwright/test').Page, automatic = true) {
  await page.addInitScript(
    ({ automatic }) => {
      const stats = { created: 0, requests: 0, terminated: 0 };
      Object.assign(window, { workerFallbackStats: stats });
      class BrokenARWorker {
        onmessage?: (event: { data: { id: number; error: string } }) => void;
        onerror?: () => void;
        constructor() {
          stats.created++;
        }
        postMessage(message: { id: number; image: ImageBitmap }) {
          stats.requests++;
          message.image.close();
          const fail = () =>
            this.onmessage?.({
              data: {
                id: message.id,
                error: "undefined is not an object (evaluating 'GLctx.activeTexture')",
              },
            });
          Object.assign(window, { failARWorker: fail });
          if (automatic) queueMicrotask(fail);
        }
        terminate() {
          stats.terminated++;
        }
      }
      Object.defineProperty(window, 'Worker', { value: BrokenARWorker, configurable: true });
    },
    { automatic },
  );
  await page.goto('/tests/harness.html');
}

test('a failed AR worker falls back to real local face and person models', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'The injected worker fixture requires offscreen WebGL; the original real-model test covers WebKit.',
  );
  test.setTimeout(90000);
  await brokenWorker(page);
  const result = await page.evaluate(async () => {
    const { ARRuntime } = await import('/src/core/ar/runtime.ts');
    const image = new Image();
    image.src = '/artwork/materials/portrait-a.jpg';
    await image.decode();
    const engine = new ARRuntime();
    try {
      const face = await engine.infer(image, 'face');
      const person = await engine.infer(image, 'person');
      return {
        faces: face.faces.length,
        landmarks: face.faces[0]?.points.length,
        mask: person.mask!.values.reduce((max, value) => Math.max(max, value), 0),
        stats: (window as any).workerFallbackStats,
      };
    } finally {
      engine.close();
    }
  });
  expect(result.faces).toBe(1);
  expect(result.landmarks).toBe(478);
  expect(result.mask).toBeGreaterThan(0.9);
  expect(result.stats).toEqual({ created: 1, requests: 1, terminated: 1 });
});

test('closing AR during worker fallback cancels inference before models load', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'The worker fixture requires offscreen WebGL.');
  const modelRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/ar/')) modelRequests.push(request.url());
  });
  await brokenWorker(page, false);
  const result = await page.evaluate(async () => {
    const { ARRuntime } = await import('/src/core/ar/runtime.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const engine = new ARRuntime();
    const pending = engine.infer(canvas, 'face').then(
      () => 'resolved',
      (error) => error.name,
    );
    while (!(window as any).failARWorker) await new Promise((resolve) => setTimeout(resolve, 10));
    (window as any).failARWorker();
    engine.close();
    const outcome = await pending;
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { outcome, stats: (window as any).workerFallbackStats };
  });
  expect(result.outcome).toBe('AbortError');
  expect(result.stats.terminated).toBe(1);
  expect(modelRequests).toEqual([]);
});
