import { test, expect, type Page } from '@playwright/test';

const viewports = [
  { width: 390, height: 700 },
  { width: 360, height: 560 },
  { width: 740, height: 360 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
];
const baseURL = process.env.FOTBOOTH_CAMERA_TEST_URL ?? 'http://127.0.0.1:5173';

async function enterCamera(page: Page, frame = 'Denim Daisy Polaroid') {
  await page.goto(baseURL);
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.getByRole('button', { name: `Pakai frame ${frame}`, exact: true }).click();
  await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
}

async function visibleTogether(page: Page, actionName: string, height: number) {
  const preview = await page.locator('.camera-live').boundingBox();
  const action = await page.getByRole('button', { name: actionName, exact: true }).boundingBox();
  expect(preview).not.toBeNull();
  expect(action).not.toBeNull();
  expect(preview!.y, 'face preview starts within the viewport').toBeGreaterThanOrEqual(0);
  expect(preview!.y + preview!.height, 'complete face preview fits on screen').toBeLessThanOrEqual(
    height,
  );
  expect(preview!.height, 'preview remains useful on a short phone screen').toBeGreaterThanOrEqual(
    120,
  );
  expect(action!.y, 'camera action starts within the viewport').toBeGreaterThanOrEqual(0);
  expect(
    action!.y + action!.height,
    'camera action is reachable while viewing the face',
  ).toBeLessThanOrEqual(height);
  expect(action!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  return { preview: preview!, action: action! };
}

test('mobile camera preview and reopen action fit together when permission is denied', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const deny = async () => {
      throw new DOMException('Denied', 'NotAllowedError');
    };
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = deny;
    else
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: deny, enumerateDevices: async () => [] },
      });
  });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const frame of ['Denim Daisy Polaroid', 'After Hours Ticket']) {
      await enterCamera(page, frame);
      await expect(page.getByRole('alert')).toContainText('izin');
      await visibleTogether(page, 'Buka kamera', viewport.height);
      await expect(page.getByRole('button', { name: 'Pilih foto dari perangkat' })).toBeVisible();
    }
  }
});

test('live camera lets phone users see their face while capturing and cancelling without scrolling', async ({
  browserName,
  playwright,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Native synthetic-camera capture is available in Chromium.',
  );
  const browser = await playwright.chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      try {
        await enterCamera(page);
        await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
        const { preview, action } = await visibleTogether(page, 'Ambil foto', viewport.height);
        // This slot is 756 × 909.9 design pixels. A height limit must preserve its guide ratio.
        expect(preview.width / preview.height).toBeCloseTo(756 / 909.9, 2);
        await page.screenshot({
          path: `docs/qa/camera-mobile-${viewport.width}x${viewport.height}.png`,
        });
        await page.getByLabel('Timer kamera').selectOption('3');
        const scrollBefore = await page.evaluate(() => window.scrollY);
        // Coordinate clicks deliberately avoid Playwright's automatic scroll-to-button behavior.
        await page.mouse.click(action.x + action.width / 2, action.y + action.height / 2);
        await expect(
          page.getByRole('status', { name: '', exact: true }).filter({ hasText: '3' }),
        ).toBeVisible();
        const cancelling = await visibleTogether(page, 'Hentikan', viewport.height);
        await page.mouse.click(
          cancelling.action.x + cancelling.action.width / 2,
          cancelling.action.y + cancelling.action.height / 2,
        );
        await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
        await page.getByLabel('Timer kamera').selectOption('0');
        const capture = await visibleTogether(page, 'Ambil foto', viewport.height);
        await page.mouse.click(
          capture.action.x + capture.action.width / 2,
          capture.action.y + capture.action.height / 2,
        );
        await expect(page.getByTestId('camera-progress')).toHaveText('1/4 terisi');
        await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
        await visibleTogether(page, 'Ambil foto', viewport.height);
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});
