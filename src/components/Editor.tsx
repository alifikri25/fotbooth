import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Camera,
  Check,
  FlipHorizontal,
  ImagePlus,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  RefreshCw,
} from 'lucide-react';
import type { Crop, FrameDefinition, Session } from '../core/types';
import type { PhotoRegistry } from '../core/resources';
import type { History } from '../core/session';
import { graphemes } from '../core/text';
import { Preview } from './Preview';
export interface EditorProps {
  frame: FrameDefinition;
  session: Session;
  photos: PhotoRegistry;
  history: History;
  activeSlot: string;
  ready: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onCrop: (id: string, patch: Partial<Crop>, commit: boolean) => void;
  onReady: (ready: boolean, error?: string) => void;
  onUpload: (replace?: string) => void;
  onCamera: () => void;
  onAssign: (id: string) => void;
  onSwap: (id: string) => void;
  onFrame: () => void;
  onCaption: (value: string) => void;
  onDate: (value: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onResult: () => void;
}
export function Editor(p: EditorProps) {
  const placement = p.session.placements.find((s) => s.slotId === p.activeSlot),
    slot = p.frame.slots.find((s) => s.id === p.activeSlot)!;
  const complete = p.frame.slots.every((s) => p.session.placements.some((p) => p.slotId === s.id));
  function crop(patch: Partial<Crop>) {
    p.onCrop(p.activeSlot, patch, true);
  }
  function pan(x: number, y: number) {
    if (placement) crop({ centerX: placement.centerX - x, centerY: placement.centerY - y });
  }
  return (
    <main className="studio-page">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">02 / BIKIN FOTOMU</span>
          <h1>
            Atur fotomu<span className="heading-dot">.</span>
          </h1>
        </div>
        <div className="history-buttons">
          <button
            className="icon-button"
            aria-label="Urungkan"
            disabled={!p.history.canUndo || p.busy}
            onClick={p.onUndo}
          >
            <Undo2 size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="Ulangi perubahan"
            disabled={!p.history.canRedo || p.busy}
            onClick={p.onRedo}
          >
            <Redo2 size={20} />
          </button>
        </div>
      </div>
      <div className="studio-grid">
        <aside className="photo-panel panel">
          <div className="panel-heading">
            <h2>Foto kamu</h2>
            <span data-testid="photo-count">{p.session.photoIds.length}/8 foto</span>
          </div>
          <p className="muted">Pilih slot, lalu pilih fotonya.</p>
          <div className="photo-library">
            {p.session.photoIds.map((id, i) => (
              <button
                key={id}
                className={`photo-thumb ${placement?.photoId === id ? 'active' : ''}`}
                aria-label={`Gunakan foto ${i + 1} pada slot ${slot.order}`}
                disabled={p.busy}
                onClick={() => p.onAssign(id)}
              >
                <img src={p.photos.get(id).thumbnailUrl} alt={`Foto ${i + 1}`} />
                <span>{String(i + 1).padStart(2, '0')}</span>
                {placement?.photoId === id && <Check size={16} />}
              </button>
            ))}
          </div>
          <button className="button secondary full" disabled={p.busy} onClick={() => p.onUpload()}>
            <ImagePlus size={18} />
            Tambah foto
          </button>
          <button className="button ghost full" disabled={p.busy} onClick={p.onCamera}>
            <Camera size={18} />
            Pakai kamera
          </button>
          <div className="limits">
            JPG, PNG, WebP · Maks. 20 MB & 24 MP
            <br />
            Maksimal 8 foto per sesi.
          </div>
          <div className="current-frame">
            <span className="eyebrow">FRAME TERPILIH</span>
            <h3>{p.frame.name}</h3>
            <p>
              {p.frame.slots.length} foto · {p.frame.format === 'strip' ? 'Photostrip' : 'Kartu'}
            </p>
            <button className="text-button" disabled={p.busy} onClick={p.onFrame}>
              Ganti frame <ArrowUpRight size={16} />
            </button>
          </div>
        </aside>
        <section className="preview-panel" aria-label="Komposisi fotomu">
          <div className="preview-meta">
            <span>{p.frame.name}</span>
            <span>
              {p.session.placements.length}/{p.frame.slots.length} foto
            </span>
          </div>
          <Preview
            frame={p.frame}
            session={p.session}
            photos={p.photos}
            activeSlot={p.activeSlot}
            onSelect={p.onSelect}
            onCrop={p.onCrop}
            onReady={p.onReady}
            interactive={!p.busy}
          />
          <p className="preview-hint">
            {placement ? 'Geser foto agar posisinya pas.' : 'Tambahkan foto ke sini.'}
          </p>
        </section>
        <aside className="controls-panel panel">
          <h2>Posisi & detail</h2>
          <div className="slot-buttons" aria-label="Pilih slot">
            {p.frame.slots.map((s) => (
              <button
                key={s.id}
                aria-label={`Pilih slot ${s.order}`}
                aria-pressed={s.id === p.activeSlot}
                disabled={p.busy}
                className={s.id === p.activeSlot ? 'active' : ''}
                onClick={() => p.onSelect(s.id)}
              >
                {s.order}
                {p.session.placements.some((p) => p.slotId === s.id) && (
                  <span className="filled-dot" />
                )}
              </button>
            ))}
          </div>
          <div className="control-label">
            <span>Foto {slot.order}</span>
            <button
              className="text-button"
              disabled={p.busy}
              onClick={() => p.onUpload(p.activeSlot)}
            >
              Ganti foto <RefreshCw size={14} />
            </button>
          </div>
          <fieldset disabled={!placement || p.busy}>
            <legend className="sr-only">Penyesuaian foto</legend>
            <div className="segmented">
              <button
                className={placement?.fitMode === 'cover' ? 'active' : ''}
                aria-pressed={placement?.fitMode === 'cover'}
                onClick={() => crop({ fitMode: 'cover' })}
              >
                Isi frame
              </button>
              <button
                className={placement?.fitMode === 'contain' ? 'active' : ''}
                aria-pressed={placement?.fitMode === 'contain'}
                onClick={() => crop({ fitMode: 'contain' })}
              >
                Tampilkan utuh
              </button>
            </div>
            <label className="range-label" htmlFor="zoom">
              Perbesar foto <span>{(placement?.zoom ?? 1).toFixed(1)}×</span>
            </label>
            <input
              id="zoom"
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={placement?.zoom ?? 1}
              disabled={!placement || placement.fitMode === 'contain'}
              onChange={(e) => crop({ zoom: Number(e.target.value) })}
            />
            {placement?.fitMode === 'contain' && (
              <p className="control-help">
                Seluruh foto tampil di tengah. Pilih “Isi frame” untuk menggeser dan memperbesar.
              </p>
            )}
            <div className="direction-pad">
              <button
                className="icon-button"
                aria-label="Geser kiri"
                disabled={placement?.fitMode === 'contain'}
                onClick={() => pan(-0.05, 0)}
              >
                <ArrowLeft size={20} />
              </button>
              <button
                className="icon-button"
                aria-label="Geser atas"
                disabled={placement?.fitMode === 'contain'}
                onClick={() => pan(0, -0.05)}
              >
                <ArrowUp size={20} />
              </button>
              <button
                className="icon-button"
                aria-label="Geser bawah"
                disabled={placement?.fitMode === 'contain'}
                onClick={() => pan(0, 0.05)}
              >
                <ArrowDown size={20} />
              </button>
              <button
                className="icon-button"
                aria-label="Geser kanan"
                disabled={placement?.fitMode === 'contain'}
                onClick={() => pan(0.05, 0)}
              >
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="transform-buttons">
              <button
                className="small-button"
                aria-label="Putar 90°"
                onClick={() => crop({ rotation: ((placement?.rotation ?? 0) + 90) % 360 })}
              >
                <RotateCw size={17} />
                Putar
              </button>
              <button
                className={`small-button ${placement?.mirror ? 'active' : ''}`}
                aria-label="Balik horizontal"
                aria-pressed={placement?.mirror ?? false}
                onClick={() => crop({ mirror: !placement?.mirror })}
              >
                <FlipHorizontal size={17} />
                Balik
              </button>
              <button
                className="small-button"
                aria-label="Reset posisi"
                onClick={() =>
                  crop({
                    fitMode: 'cover',
                    centerX: 0.5,
                    centerY: 0.5,
                    zoom: 1,
                    rotation: 0,
                    mirror: false,
                  })
                }
              >
                <RotateCcw size={17} />
                Reset
              </button>
            </div>
            <label className="control-label" htmlFor="swap">
              Tukar dengan foto
            </label>
            <select
              id="swap"
              value=""
              aria-label="Tukar foto dengan slot"
              onChange={(e) => {
                if (e.target.value) p.onSwap(e.target.value);
              }}
            >
              <option value="">Pilih slot lain</option>
              {p.frame.slots
                .filter((s) => s.id !== p.activeSlot)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    Foto {s.order}
                  </option>
                ))}
            </select>
          </fieldset>
          <div className="personalization">
            <label className="control-label" htmlFor="caption">
              Caption <span>{graphemes(p.session.caption).length}/40</span>
            </label>
            <input
              id="caption"
              placeholder="Tulis cerita kecilmu…"
              value={p.session.caption}
              disabled={p.busy}
              onChange={(e) => p.onCaption(e.target.value)}
            />
            <p className="control-help">
              Emoji belum dijamin. Gunakan huruf dan tanda baca agar hasilnya konsisten.
            </p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!p.session.date}
                disabled={p.busy}
                onChange={(e) => {
                  const d = new Date();
                  p.onDate(
                    e.target.checked
                      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                      : '',
                  );
                }}
              />
              Tampilkan tanggal
            </label>
            {p.session.date && (
              <input
                type="date"
                aria-label="Tanggal foto"
                value={p.session.date}
                disabled={p.busy}
                onChange={(e) => p.onDate(e.target.value)}
              />
            )}
          </div>
          <button
            className="button primary full result-cta"
            disabled={!complete || !p.ready || p.busy}
            onClick={p.onResult}
          >
            Lihat hasil <ArrowRight size={18} />
          </button>
          {!complete && (
            <p className="control-help">
              Isi semua {p.frame.slots.length} slot untuk menyiapkan hasil.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
