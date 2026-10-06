import { Download, ArrowLeft, Check, ExternalLink } from 'lucide-react';
import { Preview } from './Preview';
import { outputSize, type ExportFormat, type ExportSize } from '../core/export';
import type { FrameDefinition, Session } from '../core/types';
import type { PhotoRegistry } from '../core/resources';
export function Result({
  frame,
  session,
  photos,
  format,
  size,
  url,
  busy,
  onFormat,
  onSize,
  onDownload,
  onBack,
  onReady,
}: {
  frame: FrameDefinition;
  session: Session;
  photos: PhotoRegistry;
  format: ExportFormat;
  size: ExportSize;
  url: string;
  busy: boolean;
  onFormat: (f: ExportFormat) => void;
  onSize: (s: ExportSize) => void;
  onDownload: () => void;
  onBack: () => void;
  onReady: (ready: boolean, error?: string) => void;
}) {
  const dims = outputSize(frame, size);
  return (
    <main className="result-page">
      <div className="result-preview">
        <Preview
          frame={frame}
          session={session}
          photos={photos}
          activeSlot=""
          onSelect={() => {}}
          onCrop={() => {}}
          onReady={onReady}
          interactive={false}
        />
      </div>
      <section className="result-details">
        <span className="eyebrow">03 / SIMPAN MOMEN</span>
        <h1>
          Foto selesai.
          <br />
          <em>Ceritanya milikmu.</em>
        </h1>
        <p>Periksa hasilnya, lalu pilih ukuran yang cocok untukmu.</p>
        <label htmlFor="export-format">Format hasil</label>
        <select
          id="export-format"
          disabled={busy}
          value={format}
          onChange={(e) => onFormat(e.target.value as ExportFormat)}
        >
          <option value="png">PNG · Detail terbaik</option>
          <option value="jpg">JPEG · Mudah dibagikan</option>
        </select>
        <label htmlFor="export-size">Ukuran hasil</label>
        <select
          id="export-size"
          disabled={busy}
          value={size}
          onChange={(e) => onSize(e.target.value as ExportSize)}
        >
          <option value="standard">
            Standar · {frame.designWidth} × {frame.designHeight} px
          </option>
          <option value="light">
            Ringan · {frame.designWidth / 2} × {frame.designHeight / 2} px
          </option>
        </select>
        <p className="export-meta">
          {dims.width} × {dims.height} px · {format.toUpperCase()}
        </p>
        <button className="button primary full" disabled={busy} onClick={onDownload}>
          <Download size={18} />
          {busy ? 'Menyiapkan hasil fotomu…' : 'Siapkan dan unduh'}
        </button>
        {url && (
          <div className="export-success">
            <p>
              <Check size={17} />
              File hasil sudah siap.
            </p>
            <a className="text-button" href={url} target="_blank" rel="noopener">
              Buka gambar hasil <ExternalLink size={16} />
            </a>
            <p>
              Jika unduh tidak terbuka, buka gambar lalu tekan lama atau klik kanan untuk
              menyimpannya.
            </p>
          </div>
        )}
        <button className="button ghost full" disabled={busy} onClick={onBack}>
          <ArrowLeft size={17} />
          Kembali edit
        </button>
        <p className="retention-note">
          Unduh hasil sebelum menutup atau memuat ulang halaman. Sesi ini hanya ada di tab ini.
        </p>
      </section>
    </main>
  );
}
