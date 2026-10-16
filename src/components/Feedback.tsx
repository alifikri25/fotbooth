import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Dialog } from './Dialog';
import {
  feedbackCategories,
  sendFeedback,
  validateFeedback,
  type FeedbackDraft,
} from '../core/feedback';

const emptyDraft = (): FeedbackDraft => ({ category: 'Usul frame', message: '', email: '' });

export function Feedback({
  open,
  onClose,
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const request = useRef<AbortController | null>(null);
  const prefix = useId();
  useEffect(() => {
    if (!open) {
      request.current?.abort();
      request.current = null;
      setSending(false);
    }
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [open]);

  function close() {
    request.current?.abort();
    request.current = null;
    setSending(false);
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    const invalid = validateFeedback(draft);
    setError(invalid);
    if (invalid) return;
    const controller = new AbortController();
    request.current = controller;
    setSending(true);
    try {
      await sendFeedback(draft, controller.signal);
      if (request.current !== controller || controller.signal.aborted) return;
      setAccepted(true);
      setDraft(emptyDraft());
    } catch (failure) {
      if (request.current === controller && !controller.signal.aborted) {
        setError(
          failure instanceof Error ? failure.message : 'Saran belum berhasil dikirim. Coba lagi.',
        );
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setSending(false);
      }
    }
  }

  if (!open) return null;
  return (
    <Dialog label="Kirim saran" returnFocus={returnFocus} onClose={close}>
      <div className="feedback-dialog">
        <span className="eyebrow">RUANG UNTUK IDEMU</span>
        <h2>Ada yang ingin ditambah?</h2>
        {accepted ? (
          <>
            <p className="feedback-success" role="status">
              Saran diterima layanan pengiriman. Terima kasih! Pengiriman ke email pengelola bisa
              memerlukan waktu.
            </p>
            <div className="dialog-actions">
              <button className="button secondary" onClick={() => setAccepted(false)}>
                Tulis saran lain
              </button>
              <button className="button primary" onClick={close}>
                Selesai
              </button>
            </div>
          </>
        ) : (
          <form className="feedback-form" onSubmit={(event) => void submit(event)} noValidate>
            <p id={`${prefix}-privacy`} className="feedback-privacy">
              Pesan diteruskan ke email pengelola melalui FormSubmit, tidak ditampilkan di situs.
              Foto tidak ikut terkirim.
            </p>
            <label htmlFor={`${prefix}-category`}>Tentang apa?</label>
            <select
              id={`${prefix}-category`}
              value={draft.category}
              disabled={sending}
              onChange={(event) => setDraft({ ...draft, category: event.currentTarget.value })}
            >
              {feedbackCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <label htmlFor={`${prefix}-message`}>Pesanmu</label>
            <textarea
              id={`${prefix}-message`}
              value={draft.message}
              minLength={10}
              maxLength={2000}
              required
              disabled={sending}
              aria-describedby={`${prefix}-length ${prefix}-privacy`}
              placeholder="Tema frame yang kamu inginkan, ide fitur, atau kendala yang kamu temui…"
              onChange={(event) => setDraft({ ...draft, message: event.currentTarget.value })}
            />
            <span id={`${prefix}-length`} className="feedback-count">
              10–2000 karakter · {draft.message.length}/2000
            </span>
            <label htmlFor={`${prefix}-email`}>
              Email balasan <span>(opsional)</span>
            </label>
            <input
              id={`${prefix}-email`}
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={draft.email}
              disabled={sending}
              placeholder="Kalau kamu ingin dihubungi kembali"
              onChange={(event) => setDraft({ ...draft, email: event.currentTarget.value })}
            />
            {error && (
              <p className="feedback-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" type="submit" disabled={sending}>
              {sending ? 'Mengirim saran…' : 'Kirim saran'} <Send size={17} />
            </button>
            {sending && (
              <span className="feedback-count" role="status">
                Menunggu layanan pengiriman…
              </span>
            )}
          </form>
        )}
      </div>
    </Dialog>
  );
}
