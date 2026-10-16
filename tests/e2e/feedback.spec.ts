import { test, expect, type Page } from '@playwright/test';

const provider = 'https://formsubmit.co/ajax/cumanvalo25@gmail.com';
const message = 'Aku ingin frame bertema kebun bunga dengan bentuk love.';

test.beforeEach(async ({ page }) => {
  // No feedback test can send real mail, even if a more specific route is missed.
  await page.route('https://formsubmit.co/**', (route) => route.abort('blockedbyclient'));
});

async function openFeedback(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  return page.getByRole('dialog', { name: 'Kirim saran' });
}

test('feedback is accessible on mobile, validates locally, and preserves a closed draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let requests = 0;
  await page.route(provider, async (route) => {
    requests++;
    await route.abort('blockedbyclient');
  });
  const dialog = await openFeedback(page);
  await expect(dialog).toContainText('Foto tidak ikut terkirim.');
  await dialog.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('10–2000');
  expect(requests).toBe(0);
  await dialog.getByLabel('Pesanmu').fill(message);
  await dialog.getByLabel('Email balasan').fill('bukan-email');
  await dialog.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('email balasan');
  expect(requests).toBe(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const trigger = page.getByRole('button', { name: 'Kirim saran', exact: true });
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByLabel('Pesanmu')).toHaveValue(message);
  await expect(dialog.getByLabel('Email balasan')).toHaveValue('bukan-email');
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('only explicit acceptance clears the draft, and no private URL or photo data is sent', async ({
  page,
}) => {
  let sent: Record<string, string> | undefined;
  let headers: Record<string, string> = {};
  await page.route(provider, async (route) => {
    sent = route.request().postDataJSON();
    headers = route.request().headers();
    await route.fulfill({
      json: { success: 'true', message: 'Thanks! Form was submitted successfully.' },
    });
  });
  const dialog = await openFeedback(page);
  await page.evaluate(() =>
    history.replaceState(null, '', '/?caption=private-caption#room=secret-invitation-token'),
  );
  await dialog.getByLabel('Tentang apa?').selectOption('Ide fitur');
  await dialog.getByLabel('Pesanmu').fill(message);
  await dialog.getByLabel('Email balasan').fill('  ari@example.com  ');
  await dialog.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Saran diterima layanan pengiriman');
  expect(sent).toEqual({
    category: 'Ide fitur',
    message,
    email: 'ari@example.com',
    _subject: '[Fotbooth] Ide fitur',
    _url: 'https://fotbooth.pages.dev/',
  });
  expect(headers.referer).toBeUndefined();
  await dialog.getByRole('button', { name: 'Tulis saran lain' }).click();
  await expect(dialog.getByLabel('Pesanmu')).toHaveValue('');
  await expect(dialog.getByLabel('Email balasan')).toHaveValue('');
});

test('provider rejection keeps the message available for retry without false success', async ({
  page,
}) => {
  let attempts = 0;
  await page.route(provider, async (route) => {
    attempts++;
    await route.fulfill({
      json: { success: attempts > 1, message: attempts > 1 ? 'Thanks!' : 'Unable to submit form.' },
    });
  });
  const dialog = await openFeedback(page);
  await dialog.getByLabel('Tentang apa?').selectOption('Lapor masalah');
  await dialog.getByLabel('Pesanmu').fill(message);
  const submit = dialog.getByRole('button', { name: 'Kirim saran', exact: true });
  await submit.click();
  await expect(dialog.getByRole('alert')).toContainText('belum diterima');
  await expect(dialog.getByLabel('Pesanmu')).toHaveValue(message);
  await expect(dialog.getByRole('status')).toHaveCount(0);
  await submit.click();
  await expect(dialog.getByRole('status')).toContainText('Saran diterima');
  expect(attempts).toBe(2);
});

test('an activation requirement explains the owner action and preserves the draft', async ({
  page,
}) => {
  await page.route(provider, (route) =>
    route.fulfill({
      json: {
        success: 'false',
        message:
          "This form needs Activation. We've sent you an email containing an 'Activate Form' link.",
      },
    }),
  );
  const dialog = await openFeedback(page);
  await dialog.getByLabel('Pesanmu').fill(message);
  await dialog.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('menunggu aktivasi');
  await expect(dialog.getByRole('alert')).toContainText('Activate Form');
  await expect(dialog.getByLabel('Pesanmu')).toHaveValue(message);
  await expect(dialog.getByRole('status')).toHaveCount(0);
});

test('an offline connection preserves the draft', async ({ page }) => {
  await page.route(provider, (route) => route.abort('internetdisconnected'));
  const dialog = await openFeedback(page);
  await dialog.getByLabel('Pesanmu').fill(message);
  await dialog.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Periksa koneksi');
  await expect(dialog.getByLabel('Pesanmu')).toHaveValue(message);
  await expect(dialog.getByRole('button', { name: 'Kirim saran', exact: true })).toBeEnabled();
});

test('a slow response times out without duplicate submissions or draft loss', async ({ page }) => {
  let requests = 0;
  let release: (() => void) | undefined;
  await page.route(provider, async (route) => {
    requests++;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({ json: { success: true, message: 'Thanks!' } }).catch(() => {});
  });
  const dialog = await openFeedback(page);
  await page.clock.install();
  await dialog.getByLabel('Pesanmu').fill(message);
  await dialog.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  await expect.poll(() => requests).toBe(1);
  await expect(dialog.getByRole('button', { name: 'Mengirim saran…' })).toBeDisabled();
  await dialog.locator('form').evaluate((form) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  expect(requests).toBe(1);
  await page.clock.fastForward(20_001);
  await expect(dialog.getByRole('alert')).toContainText('terlalu lama');
  await expect(dialog.getByLabel('Pesanmu')).toHaveValue(message);
  release?.();
});

test('closing a pending submission preserves the draft and ignores a late response', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  await page.route(provider, async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({ json: { success: true, message: 'Thanks!' } }).catch(() => {});
  });
  const dialog = await openFeedback(page);
  await dialog.getByLabel('Pesanmu').fill(message);
  await dialog.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  await expect.poll(() => !!release).toBe(true);
  await page.keyboard.press('Escape');
  release?.();
  await page.getByRole('button', { name: 'Kirim saran', exact: true }).click();
  await expect(dialog.getByLabel('Pesanmu')).toHaveValue(message);
  await expect(dialog.getByRole('status')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Kirim saran', exact: true })).toBeEnabled();
});
