export interface FeedbackDraft {
  category: string;
  message: string;
  email: string;
}

export const feedbackCategories = ['Usul frame', 'Ide fitur', 'Lapor masalah', 'Lainnya'] as const;

export function validateFeedback(draft: FeedbackDraft): string {
  if (!feedbackCategories.some((category) => category === draft.category))
    return 'Pilih kategori saran.';
  const message = draft.message.trim();
  if (message.length < 10 || message.length > 2000)
    return 'Tulis pesan sepanjang 10–2000 karakter.';
  const email = draft.email.trim();
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return 'Periksa alamat email balasan, atau kosongkan jika tidak ingin dibalas.';
  }
  return '';
}

class FeedbackServiceError extends Error {}

export async function sendFeedback(draft: FeedbackDraft, signal?: AbortSignal): Promise<void> {
  const validation = validateFeedback(draft);
  if (validation) throw new Error(validation);
  if (signal?.aborted) throw new DOMException('Dibatalkan', 'AbortError');
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 20_000);
  try {
    const response = await fetch('https://formsubmit.co/ajax/cumanvalo25@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
      body: JSON.stringify({
        category: draft.category,
        message: draft.message.trim(),
        ...(draft.email.trim() ? { email: draft.email.trim() } : {}),
        _subject: `[Fotbooth] ${draft.category}`,
        // A fixed public page keeps invitation tokens and editing data out of feedback.
        _url: 'https://fotbooth.pages.dev/',
      }),
    });
    const result: unknown = await response.json().catch(() => null);
    if (
      !response.ok ||
      !result ||
      typeof result !== 'object' ||
      !('success' in result) ||
      (result.success !== true && result.success !== 'true')
    ) {
      const reason =
        result &&
        typeof result === 'object' &&
        'message' in result &&
        typeof result.message === 'string'
          ? result.message.replace(/\s+/g, ' ').trim().slice(0, 350)
          : '';
      if (
        response.ok &&
        /(?:form.{0,60}(?:activation|activated|actived)|activate.{0,60}form)/i.test(reason)
      ) {
        throw new FeedbackServiceError(
          'Form saran menunggu aktivasi. Buka email pengelola dan klik “Activate Form” dari FormSubmit, lalu kirim lagi. Drafmu tetap ada.',
        );
      }
      throw new FeedbackServiceError(
        'Saran belum diterima layanan pengiriman. Drafmu tetap ada; coba lagi nanti.' +
          (reason ? ` Alasan layanan: ${reason}` : ` (HTTP ${response.status})`),
      );
    }
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Dibatalkan', 'AbortError');
    if (timedOut) throw new Error('Pengiriman terlalu lama. Drafmu tetap ada; coba lagi nanti.');
    if (error instanceof FeedbackServiceError) throw error;
    throw new Error('Koneksi ke layanan saran belum berhasil. Periksa koneksi lalu coba lagi.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
