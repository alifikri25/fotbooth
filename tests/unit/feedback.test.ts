import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendFeedback, validateFeedback } from '../../src/core/feedback';

const draft = { category: 'Usul frame', message: 'Boleh tambah tema taman bunga?', email: '' };
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('private email feedback', () => {
  it('requires an allowed category, 10–2000 message characters, and a valid optional reply email', () => {
    expect(validateFeedback(draft)).toBe('');
    expect(validateFeedback({ ...draft, message: '   pendek ' })).toMatch(/10/);
    expect(validateFeedback({ ...draft, message: 'a'.repeat(2001) })).toMatch(/2000/);
    expect(validateFeedback({ ...draft, message: 'a'.repeat(10) })).toBe('');
    expect(validateFeedback({ ...draft, message: 'a'.repeat(2000) })).toBe('');
    expect(validateFeedback({ ...draft, category: 'unknown' })).toMatch(/kategori/i);
    expect(validateFeedback({ ...draft, email: 'bukan-email' })).toMatch(/email/i);
    expect(validateFeedback({ ...draft, email: ' ari@example.com ' })).toBe('');
  });

  it.each([true, 'true'])(
    'accepts only an explicit provider acknowledgement (%s)',
    async (success) => {
      vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
        expect(url).toBe('https://formsubmit.co/ajax/cumanvalo25@gmail.com');
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('omit');
        expect(init.referrerPolicy).toBe('no-referrer');
        expect(JSON.parse(init.body as string)).toEqual({
          category: 'Usul frame',
          message: 'Boleh tambah tema taman bunga?',
          email: 'ari@example.com',
          _subject: '[Fotbooth] Usul frame',
          _url: 'https://fotbooth.pages.dev/',
        });
        return new Response(
          JSON.stringify({ success, message: 'Thanks! Form was submitted successfully.' }),
        );
      });
      await expect(sendFeedback({ ...draft, email: ' ari@example.com ' })).resolves.toBeUndefined();
    },
  );

  it.each([
    { status: 200, body: { success: false } },
    { status: 200, body: { success: 'false' } },
    { status: 200, body: {} },
    { status: 200, body: { success: 'yes' } },
    { status: 500, body: { success: true } },
  ])('rejects unconfirmed or failed provider responses: %j', async ({ status, body }) => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify(body), { status }));
    await expect(sendFeedback(draft)).rejects.toThrow(/belum.*diterima/i);
  });

  it('rejects non-JSON responses without claiming the message was sent', async () => {
    vi.stubGlobal('fetch', async () => new Response('<html>Activate your form</html>'));
    await expect(sendFeedback(draft)).rejects.toThrow(/belum.*diterima/i);
  });

  it('explains a provider activation response without claiming delivery', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            success: 'false',
            message:
              "This form needs Activation. We've sent you an email containing an 'Activate Form' link.",
          }),
        ),
    );
    await expect(sendFeedback(draft)).rejects.toThrow(/aktivasi.*email pengelola.*draf/i);
  });

  it('keeps a bounded plain-text provider reason when it refuses a valid submission', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            success: 'false',
            message: 'Unable to submit form. Make sure you open this page through a web server.',
          }),
        ),
    );
    await expect(sendFeedback(draft)).rejects.toThrow(/Alasan layanan: Unable to submit form/);
  });

  it('does not send invalid input to the provider', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await expect(sendFeedback({ ...draft, message: '' })).rejects.toThrow(/10/);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('sends no reply address when the visitor leaves it empty', async () => {
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      expect(JSON.parse(init.body as string)).not.toHaveProperty('email');
      return new Response(JSON.stringify({ success: true }));
    });
    await expect(sendFeedback(draft)).resolves.toBeUndefined();
  });

  it('gives a retryable error on connection failure without leaking provider errors', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(sendFeedback(draft)).rejects.toThrow(/koneksi.*coba lagi/i);
  });

  it('aborts after 20 seconds and removes its timer', async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      requestSignal = init.signal as AbortSignal;
      return new Promise((_resolve, reject) =>
        requestSignal!.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        ),
      );
    });
    const result = expect(sendFeedback(draft)).rejects.toThrow(/terlalu lama/i);
    await vi.advanceTimersByTimeAsync(20_000);
    await result;
    expect(requestSignal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels an in-flight request when its dialog closes', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      async (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal!.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          ),
        ),
    );
    const result = expect(sendFeedback(draft, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    controller.abort();
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
});
