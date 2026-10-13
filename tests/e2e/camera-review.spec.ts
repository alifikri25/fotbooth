import { test, expect, type Locator, type Page } from '@playwright/test';

const baseURL = process.env.FOTBOOTH_CAMERA_TEST_URL ?? 'http://127.0.0.1:5173';

async function enterCamera(page: Page) {
  await page.goto(baseURL);
  await page.getByRole('button', { name: 'Mulai bikin foto' }).click();
  await page.getByRole('button', { name: 'Pakai frame Denim Daisy Polaroid', exact: true }).click();
  await page.getByRole('button', { name: 'Buka kamera', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
  await page.getByLabel('Timer kamera').selectOption('0');
}

async function capture(page: Page) {
  await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
  await expect(page.getByTestId('camera-capture-review')).toBeVisible();
}

async function thumbnailPixels(thumbnail: Locator) {
  await expect
    .poll(() =>
      thumbnail.evaluate((canvas: HTMLCanvasElement) => {
        const pixels = canvas
          .getContext('2d')!
          .getImageData(0, 0, canvas.width, canvas.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0);
      }),
    )
    .toBe(true);
  return thumbnail.evaluate(async (canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    const digest = await crypto.subtle.digest('SHA-256', pixels);
    return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join(
      '',
    );
  });
}

test('single capture stays in its slot until the user accepts the preview', async ({
  browserName,
  playwright,
}, testInfo) => {
  test.skip(
    browserName !== 'chromium',
    'Native synthetic-camera capture is available in Chromium.',
  );
  const browser = await playwright.chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  try {
    const page = await browser.newPage();
    await enterCamera(page);
    await page.getByRole('button', { name: 'Ambil foto', exact: true }).click();
    await expect(page.getByTestId('camera-capture-review')).toBeVisible();
    await expect(page.getByTestId('camera-progress')).toHaveText('0/4 terisi');
    await expect(
      page.getByRole('button', { name: 'Pilih foto kamera 1', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    const preview = page
      .getByTestId('camera-capture-review')
      .getByRole('img', { name: 'Hasil foto 1' });
    await expect(preview).toBeVisible();
    await expect
      .poll(() =>
        preview.evaluate((image: HTMLCanvasElement | HTMLImageElement) => {
          if (image instanceof HTMLImageElement) return image.naturalWidth > 0;
          const pixels = image.getContext('2d')!.getImageData(0, 0, image.width, image.height).data;
          return pixels.some((value, index) => index % 4 === 3 && value > 0);
        }),
      )
      .toBe(true);
    await expect(
      page.getByRole('button', { name: 'Kembali ke frame', exact: true }),
    ).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath('capture-review-desktop.png') });
    const accept = page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true });
    await accept.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('camera-progress')).toHaveText('1/4 terisi');
    await expect(
      page.getByRole('button', { name: 'Pilih foto kamera 2', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page
        .getByRole('button', { name: 'Pilih foto kamera 1', exact: true })
        .getByRole('img', { name: 'Thumbnail foto 1' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath('accepted-photo-thumbnail.png') });
  } finally {
    await browser.close();
  }
});

test('retaking an unaccepted capture returns to the same live slot without saving a photo', async ({
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
    const page = await browser.newPage();
    await enterCamera(page);
    for (let attempt = 0; attempt < 3; attempt++) {
      await capture(page);
      await page.getByRole('button', { name: 'Ambil ulang', exact: true }).click();
      await expect(page.getByTestId('camera-capture-review')).toBeHidden();
      await expect(page.getByTestId('camera-progress')).toHaveText('0/4 terisi');
      await expect(
        page.getByRole('button', { name: 'Pilih foto kamera 1', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    }
    await capture(page);
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    await page.getByRole('button', { name: 'Lanjut edit', exact: true }).click();
    await expect(page.getByTestId('photo-count')).toHaveText('1/8 foto');
  } finally {
    await browser.close();
  }
});

test('a captured preview survives camera suspension and retake reopens the live stream', async ({
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
    const page = await browser.newPage();
    await enterCamera(page);
    const stream = await page
      .locator('video')
      .evaluateHandle((video: HTMLVideoElement) => video.srcObject);
    await capture(page);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    expect(
      await stream.evaluate((current: MediaStream) =>
        current.getTracks().every((track) => track.readyState === 'ended'),
      ),
    ).toBe(true);
    await expect(page.getByTestId('camera-capture-review')).toBeVisible();
    await expect(page.getByTestId('camera-progress')).toHaveText('0/4 terisi');
    await page.getByRole('button', { name: 'Ambil ulang', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeEnabled();
    await expect(page.getByTestId('camera-capture-review')).toBeHidden();
    expect(
      await page
        .locator('video')
        .evaluate((video: HTMLVideoElement) =>
          (video.srcObject as MediaStream)
            .getVideoTracks()
            .some((track) => track.readyState === 'live'),
        ),
    ).toBe(true);
    await capture(page);
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toHaveText('1/4 terisi');
  } finally {
    await browser.close();
  }
});

test('accepting the final captured photo opens the editor with every accepted slot', async ({
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
    const page = await browser.newPage();
    await enterCamera(page);
    for (let slot = 1; slot <= 4; slot++) {
      await capture(page);
      await expect(page.getByTestId('camera-progress')).toHaveText(`${slot - 1}/4 terisi`);
      await expect(
        page.getByRole('button', { name: `Pilih foto kamera ${slot}`, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    }
    await expect(page.getByRole('heading', { name: 'Atur fotomu' })).toBeVisible();
    await expect(page.getByTestId('photo-count')).toHaveText('4/8 foto');
    await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeEnabled();
  } finally {
    await browser.close();
  }
});

test('clearing a session during review stops the camera and discards the pending photo', async ({
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
    const page = await browser.newPage();
    await enterCamera(page);
    await capture(page);
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    const stream = await page
      .locator('video')
      .evaluateHandle((video: HTMLVideoElement) => video.srcObject);
    await capture(page);
    await expect(page.getByTestId('camera-progress')).toHaveText('1/4 terisi');
    await page.getByRole('button', { name: 'Hapus sesi', exact: true }).click();
    await page.getByRole('button', { name: 'Ya, hapus sesi', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Mulai bikin foto' })).toBeVisible();
    expect(
      await stream.evaluate((current: MediaStream) =>
        current.getTracks().every((track) => track.readyState === 'ended'),
      ),
    ).toBe(true);
    await enterCamera(page);
    await expect(page.getByTestId('camera-progress')).toHaveText('0/4 terisi');
    await expect(page.getByTestId('camera-capture-review')).toBeHidden();
    await capture(page);
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    await page.getByRole('button', { name: 'Lanjut edit', exact: true }).click();
    await expect(page.getByTestId('photo-count')).toHaveText('1/8 foto');
  } finally {
    await browser.close();
  }
});

test('accepted thumbnails open the result and a replacement preserves the other accepted slots', async ({
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
    const page = await browser.newPage();
    await enterCamera(page);
    await capture(page);
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toHaveText('1/4 terisi');
    const firstSlot = page.getByRole('button', { name: 'Pilih foto kamera 1', exact: true });
    await expect(firstSlot.getByRole('img', { name: 'Thumbnail foto 1' })).not.toHaveAttribute(
      'data-photo-id',
      'draft',
    );
    const originalPhoto = await firstSlot
      .getByRole('img', { name: 'Thumbnail foto 1' })
      .getAttribute('data-photo-id');
    expect(originalPhoto).toBeTruthy();
    await capture(page);
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toHaveText('2/4 terisi');
    const secondSlot = page.getByRole('button', { name: 'Pilih foto kamera 2', exact: true });
    const secondThumbnail = secondSlot.getByRole('img', { name: 'Thumbnail foto 2' });
    await expect(secondThumbnail).not.toHaveAttribute('data-photo-id', 'draft');
    const secondPhoto = await secondThumbnail.getAttribute('data-photo-id');
    expect(secondPhoto).toBeTruthy();
    const secondPixels = await thumbnailPixels(secondThumbnail);
    await firstSlot.click();
    await expect(
      page.getByTestId('camera-capture-review').getByRole('img', { name: 'Hasil foto 1' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ambil ulang', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toHaveText('2/4 terisi');
    await capture(page);
    await expect(page.getByTestId('camera-progress')).toHaveText('2/4 terisi');
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toHaveText('2/4 terisi');
    await expect(firstSlot.getByRole('img', { name: 'Thumbnail foto 1' })).not.toHaveAttribute(
      'data-photo-id',
      originalPhoto!,
    );
    await expect(secondThumbnail).toHaveAttribute('data-photo-id', secondPhoto!);
    expect(await thumbnailPixels(secondThumbnail)).toBe(secondPixels);
  } finally {
    await browser.close();
  }
});

test('mobile users can inspect an accepted thumbnail without scrolling back to the review', async ({
  browserName,
  playwright,
}, testInfo) => {
  test.skip(
    browserName !== 'chromium',
    'Native synthetic-camera capture is available in Chromium.',
  );
  const viewport = { width: 390, height: 700 };
  const browser = await playwright.chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  try {
    const page = await browser.newPage({ viewport });
    await enterCamera(page);
    await capture(page);
    await page.getByRole('button', { name: 'Pakai foto & lanjut', exact: true }).click();
    await expect(page.getByTestId('camera-progress')).toHaveText('1/4 terisi');
    await expect(
      page.getByRole('button', { name: 'Pilih foto kamera 2', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    // The accepted thumbnails live below the camera panel on a phone.
    // Playwright scrolls to the thumbnail; the app must bring the opened result back into view.
    await page.getByRole('button', { name: 'Pilih foto kamera 1', exact: true }).click();
    const review = page.getByTestId('camera-capture-review');
    await expect(review).toBeVisible();
    const continueButton = page.getByRole('button', {
      name: 'Lanjut ke foto berikutnya',
      exact: true,
    });
    const retakeButton = page.getByRole('button', { name: 'Ambil ulang', exact: true });
    await page.screenshot({ path: testInfo.outputPath('accepted-review-mobile.png') });
    for (const [description, element] of [
      ['accepted photo', review],
      ['continue action', continueButton],
      ['retake action', retakeButton],
    ] as const) {
      const bounds = await element.boundingBox();
      expect(bounds, `${description} is rendered`).not.toBeNull();
      expect(bounds!.y, `${description} starts within the phone viewport`).toBeGreaterThanOrEqual(
        0,
      );
      expect(
        bounds!.y + bounds!.height,
        `${description} fits completely in the phone viewport`,
      ).toBeLessThanOrEqual(viewport.height);
    }
  } finally {
    await browser.close();
  }
});
