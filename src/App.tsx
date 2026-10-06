import { useCallback, useEffect, useRef, useState, Component, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera as CameraIcon,
  ImagePlus,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react';
import { Gallery } from './components/Gallery';
import { Editor } from './components/Editor';
import { Result } from './components/Result';
import { Dialog } from './components/Dialog';
import { Camera } from './components/Camera';
import { frames, getFrame } from './frames/catalog';
import { PhotoRegistry } from './core/resources';
import {
  addPhoto,
  assignPhoto,
  createSession,
  defaultCrop,
  editPlacement,
  History,
  swapPhotos,
  switchFrame,
} from './core/session';
import { ingestPhoto, MAX_PHOTOS } from './core/ingest';
import { clampPlacement } from './core/geometry';
import { limitCaption } from './core/text';
import { ExportManager, exportFilename, type ExportFormat, type ExportSize } from './core/export';
import type { Crop, FrameDefinition, Session } from './core/types';
import './fonts.css';
import './styles.css';

type Screen = 'home' | 'gallery' | 'source' | 'editor' | 'camera' | 'result';
export default function App() {
  const photos = useRef(new PhotoRegistry()).current,
    history = useRef(new History(createSession(frames[0]))),
    exporter = useRef(new ExportManager()).current;
  const [session, setSession] = useState(history.current.current),
    [screen, setScreen] = useState<Screen>('home'),
    [activeSlot, setActiveSlot] = useState('p1');
  const live = useRef(session);
  live.current = session;
  const [busy, setBusy] = useState(false),
    busyRef = useRef(false),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(''),
    [previewError, setPreviewError] = useState('');
  const [help, setHelp] = useState(false),
    [confirm, setConfirm] = useState(false),
    [format, setFormat] = useState<ExportFormat>('png'),
    [size, setSize] = useState<ExportSize>('standard'),
    [outputUrl, setOutputUrl] = useState('');
  const fileInput = useRef<HTMLInputElement>(null),
    replacement = useRef<string | undefined>(undefined),
    lifecycle = useRef(0),
    outputRef = useRef('');
  const frame = getFrame(session.frameId);
  const modalTrigger = useRef<HTMLElement | null>(null);
  const onReady = useCallback((value: boolean, error?: string) => {
    setReady(value);
    setPreviewError(error ?? '');
  }, []);
  function navigate(next: Screen) {
    setNotice('');
    setPreviewError('');
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function releaseOutput() {
    if (outputRef.current) {
      URL.revokeObjectURL(outputRef.current);
      outputRef.current = '';
    }
    setOutputUrl('');
  }
  function commit(next: Session) {
    if (next === history.current.current) return;
    history.current.commit(next);
    live.current = history.current.current;
    setSession(history.current.current);
    photos.sweep(history.current.referencedPhotos());
    releaseOutput();
  }
  useEffect(() => {
    lifecycle.current++;
    return () => {
      lifecycle.current++;
      photos.clear();
      if (outputRef.current) URL.revokeObjectURL(outputRef.current);
    };
  }, [photos]);
  useEffect(() => {
    const title = document.querySelector<HTMLElement>('main h1');
    title?.setAttribute('tabindex', '-1');
    title?.focus({ preventScroll: true });
  }, [screen]);
  function selectFrame(f: FrameDefinition) {
    commit(switchFrame(live.current, f));
    setActiveSlot(f.slots[0].id);
    navigate(live.current.photoIds.length ? 'editor' : 'source');
    if (live.current.photoIds.length) setNotice('Periksa posisi fotomu setelah mengganti frame.');
  }
  function upload(replace?: string) {
    if (busyRef.current) return;
    replacement.current = replace;
    fileInput.current?.click();
  }
  async function ingest(
    files: Blob[],
    replace?: string,
    mirror = false,
    source: 'upload' | 'camera' = 'upload',
  ) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice('');
    const token = lifecycle.current,
      errors: string[] = [];
    let added = 0;
    try {
      for (const [index, file] of files.entries()) {
        if (photos.size >= MAX_PHOTOS) {
          errors.push('Sesi sudah berisi 8 foto. Hapus sesi untuk memulai kumpulan baru.');
          break;
        }
        try {
          const photo = await ingestPhoto(file, source, mirror);
          if (token !== lifecycle.current) {
            photos.dispose(photo);
            break;
          }
          photos.add(photo);
          commit(
            addPhoto(
              live.current,
              photo.id,
              added === 0 ? replace : undefined,
              photo.defaultMirror,
            ),
          );
          added++;
        } catch (error) {
          errors.push(
            `Foto ${index + 1}: ${error instanceof Error ? error.message : 'Foto belum berhasil dibaca.'}`,
          );
        }
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    if (token !== lifecycle.current) return;
    if (added && source === 'upload') navigate('editor');
    setNotice(errors.join(' '));
  }
  function crop(id: string, patch: Partial<Crop>, final: boolean) {
    const current = live.current,
      placement = current.placements.find((p) => p.slotId === id);
    if (!placement) return;
    const photo = photos.get(placement.photoId),
      slot = getFrame(current.frameId).slots.find((s) => s.id === id)!;
    const next = editPlacement(current, id, patch);
    next.placements = next.placements.map((p) =>
      p.slotId === id
        ? clampPlacement(
            photo.width,
            photo.height,
            slot.w * frame.designWidth,
            slot.h * frame.designHeight,
            p,
          )
        : p,
    );
    if (final) commit(next);
    else {
      live.current = next;
      setSession(next);
    }
  }
  function undo(redo = false) {
    const value = redo ? history.current.redo() : history.current.undo();
    if (value) {
      live.current = value;
      setSession(value);
      setActiveSlot(value.slotIds[0]);
      releaseOutput();
    }
  }
  async function download() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice('');
    const snapshot = structuredClone(live.current);
    try {
      const blob = await exporter.run(snapshot, getFrame(snapshot.frameId), photos, format, size);
      releaseOutput();
      const url = URL.createObjectURL(blob);
      outputRef.current = url;
      setOutputUrl(url);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportFilename(snapshot.frameId, new Date(), format);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Hasil belum berhasil dibuat. Coba lagi atau pilih ukuran ringan.',
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function clear() {
    lifecycle.current++;
    photos.clear();
    releaseOutput();
    const initial = createSession(frames[0]);
    history.current = new History(initial);
    live.current = initial;
    setSession(initial);
    setActiveSlot('p1');
    setConfirm(false);
    setReady(false);
    navigate('home');
  }
  const editing =
    screen === 'editor' || screen === 'camera' || screen === 'result' || screen === 'source';
  return (
    <>
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>
      <header className="site-header">
        <button
          className="brand"
          aria-label="Beranda Fotbooth"
          disabled={busy}
          onClick={() => navigate('home')}
        >
          <span className="brand-symbol">
            <i />
            <i />
          </span>
          fotbooth<span className="brand-period">●</span>
        </button>
        <nav aria-label="Navigasi utama">
          <button className="nav-link" disabled={busy} onClick={() => navigate('gallery')}>
            Koleksi frame
          </button>
          <button
            className="nav-link"
            onClick={(event) => {
              modalTrigger.current = event.currentTarget;
              setHelp(true);
            }}
          >
            Cara pakai
          </button>
        </nav>
        <div className="header-right">
          <span className="privacy-pill">
            <LockKeyhole size={14} />
            Foto tetap di perangkatmu
          </span>
          {session.photoIds.length > 0 && (
            <button
              className="icon-button delete-session"
              aria-label="Hapus sesi"
              disabled={busy}
              onClick={(event) => {
                modalTrigger.current = event.currentTarget;
                setConfirm(true);
              }}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </header>
      <div id="main-content" className={editing ? 'workspace-content' : 'site-content'}>
        {(notice || previewError) && (
          <div className="notice" role="alert">
            <span>{notice || previewError}</span>
            <button
              className="icon-button"
              aria-label="Tutup pemberitahuan"
              onClick={() => {
                setNotice('');
                setPreviewError('');
              }}
            >
              <X size={18} />
            </button>
            {previewError && (
              <button
                className="text-button"
                onClick={() => setSession((s) => ({ ...s, revision: s.revision + 1 }))}
              >
                Coba lagi
              </button>
            )}
          </div>
        )}
        {busy && screen !== 'result' && (
          <p className="processing-status" role="status">
            Menyiapkan foto di perangkatmu…
          </p>
        )}
        {screen === 'home' && (
          <main className="home-page">
            <div className="home-copy">
              <span className="eyebrow">
                <Sparkles size={15} /> RUANG KECIL UNTUK MOMEN BESAR
              </span>
              <h1>
                Cerita kecil,
                <br />
                dalam <em>satu frame.</em>
              </h1>
              <p>
                Pita manis, bunga, atau kenangan bergaya retro.
                <br />
                Pilih frame, ambil atau masukkan foto, lalu buat jadi milikmu.
              </p>
              <button className="button primary start-button" onClick={() => navigate('gallery')}>
                Mulai bikin foto <ArrowRight size={20} />
              </button>
              <div className="home-details">
                <span>{frames.length} frame orisinal</span>
                <i />
                <span>Tanpa akun</span>
                <i />
                <span>Gratis dipakai</span>
              </div>
            </div>
            <div className="home-art" aria-label="Contoh koleksi frame dengan ilustrasi orisinal">
              <span className="art-stamp">
                dibuat untuk
                <br />
                <em>momenmu.</em>
              </span>
              <img
                className="hero-strip strip-a"
                src={getFrame('cherry-kiss-film').thumbnail}
                alt="Cherry Kiss Film dengan ilustrasi foto"
              />
              <img
                className="hero-strip strip-b"
                src={frames[0].thumbnail}
                alt={`${frames[0].name} dengan ilustrasi foto`}
              />
              <div className="hero-spark">✳</div>
              <span className="hero-note">sedikit spontan. banyak kenangan.</span>
            </div>
            <div className="home-bottom">
              <div>
                <span className="step-number">01</span>
                <p>
                  Pilih frame
                  <br />
                  <span>yang terasa seperti kamu.</span>
                </p>
              </div>
              <div>
                <span className="step-number">02</span>
                <p>
                  Ambil atau pilih foto
                  <br />
                  <span>atur posisinya sampai pas.</span>
                </p>
              </div>
              <div>
                <span className="step-number">03</span>
                <p>
                  Simpan ceritamu
                  <br />
                  <span>unduh PNG atau JPEG.</span>
                </p>
              </div>
            </div>
          </main>
        )}
        {screen === 'gallery' && <Gallery activeId={session.frameId} onSelect={selectFrame} />}
        {screen === 'source' && (
          <main className="source-page">
            <div className="source-art">
              <img src={frame.thumbnail} alt={`Contoh frame ${frame.name}`} />
              <span>
                {frame.name} · {frame.slots.length} foto
              </span>
            </div>
            <section>
              <span className="eyebrow">02 / PILIH FOTOMU</span>
              <h1>
                Mulai dengan
                <br />
                <em>senyum kamu.</em>
              </h1>
              <p>
                Ambil foto baru atau pilih foto yang sudah ada.
                <br />
                Posisinya bisa kamu atur setelah ini.
              </p>
              <button className="button primary full" onClick={() => upload()}>
                <ImagePlus size={19} />
                Pilih foto
              </button>
              <button className="button secondary full" onClick={() => navigate('camera')}>
                <CameraIcon size={19} />
                Buka kamera
              </button>
              <p className="limits">
                JPG, PNG, WebP · Maks. 20 MB & 24 MP per foto.
                <br />
                Maksimal 8 foto. HEIC: pilih salinan JPG.
              </p>
              <div className="privacy-note">
                <ShieldCheck size={22} />
                <p>
                  Foto diproses di perangkatmu dan tidak diunggah oleh aplikasi. Unduh hasil sebelum
                  menutup atau memuat ulang halaman.
                </p>
              </div>
              <button className="text-button" onClick={() => navigate('gallery')}>
                <ArrowLeft size={17} />
                Ganti frame
              </button>
            </section>
          </main>
        )}
        {screen === 'editor' && (
          <Editor
            frame={frame}
            session={session}
            photos={photos}
            history={history.current}
            activeSlot={activeSlot}
            ready={ready}
            busy={busy}
            onSelect={setActiveSlot}
            onCrop={crop}
            onReady={onReady}
            onUpload={upload}
            onCamera={() => navigate('camera')}
            onAssign={(id) => {
              commit(assignPhoto(live.current, activeSlot, id, photos.get(id).defaultMirror));
            }}
            onSwap={(id) => commit(swapPhotos(live.current, activeSlot, id))}
            onFrame={() => navigate('gallery')}
            onCaption={(caption) => commit({ ...live.current, caption: limitCaption(caption) })}
            onDate={(date) => commit({ ...live.current, date })}
            onUndo={() => undo()}
            onRedo={() => undo(true)}
            onResult={() => navigate('result')}
          />
        )}
        {screen === 'camera' && (
          <Camera
            frame={frame}
            session={session}
            activeSlot={activeSlot}
            remaining={8 - photos.size}
            onSlot={setActiveSlot}
            onCapture={async (blob, slot, mirror) => {
              await ingest([blob], slot, mirror, 'camera');
            }}
            onUpload={() => {
              navigate('source');
              upload();
            }}
            onBack={() => navigate(session.photoIds.length ? 'editor' : 'source')}
          />
        )}
        {screen === 'result' && (
          <Result
            frame={frame}
            session={session}
            photos={photos}
            format={format}
            size={size}
            url={outputUrl}
            busy={busy}
            onFormat={(f) => {
              setFormat(f);
              releaseOutput();
            }}
            onSize={(s) => {
              setSize(s);
              releaseOutput();
            }}
            onDownload={download}
            onBack={() => navigate('editor')}
            onReady={onReady}
          />
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy}
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = '';
          void ingest(files, replacement.current);
          replacement.current = undefined;
        }}
      />
      <footer className="site-footer">
        <span>fotbooth · simpan yang sederhana.</span>
        <button
          className="text-button"
          onClick={(event) => {
            modalTrigger.current = event.currentTarget;
            setHelp(true);
          }}
        >
          Bantuan & privasi <ArrowUpRightIcon />
        </button>
      </footer>
      {help && (
        <Dialog
          returnFocus={modalTrigger.current}
          label="Bantuan dan privasi"
          onClose={() => setHelp(false)}
        >
          <span className="eyebrow">BANTUAN & PRIVASI</span>
          <h2>Bikin foto, sesimpel itu.</h2>
          <ol>
            <li>Pilih salah satu dari {frames.length} frame.</li>
            <li>
              Pilih foto atau buka kamera. Kamera hanya meminta izin saat dibuka dan tidak memakai
              mikrofon.
            </li>
            <li>Pilih slot, geser atau gunakan tombol arah, lalu periksa dan unduh hasil.</li>
          </ol>
          <h3>Foto tetap di perangkatmu.</h3>
          <p>
            Aplikasi memproses foto di browser dan tidak mengirim foto atau caption ke server. Sesi
            tidak disimpan otomatis. Menutup atau memuat ulang tab mengakhiri sesi.
          </p>
          <p>
            Format: JPG, PNG, WebP diam. Maksimal 20 MB, 24 megapiksel per foto dan 8 foto. Untuk
            HEIC, pilih atau ekspor JPG di perangkatmu.
          </p>
          <p>
            “Hapus sesi” membersihkan foto, history, hasil, dan kamera dari aplikasi. File yang
            sudah kamu unduh tetap ada.
          </p>
          <p>
            Jika kamera ditolak, pilih foto dari perangkat. Kamera memerlukan halaman HTTPS atau
            localhost.
          </p>
          <button className="button primary full" onClick={() => setHelp(false)}>
            Mengerti
          </button>
        </Dialog>
      )}
      {confirm && (
        <Dialog
          returnFocus={modalTrigger.current}
          label="Hapus sesi foto"
          onClose={() => setConfirm(false)}
        >
          <h2>Hapus sesi ini?</h2>
          <p>
            Semua foto dan edit di tab ini akan dihapus. Pastikan kamu sudah mengunduh hasil yang
            ingin disimpan.
          </p>
          <div className="dialog-actions">
            <button className="button secondary" onClick={() => setConfirm(false)}>
              Batal
            </button>
            <button className="button danger" onClick={clear}>
              Ya, hapus sesi
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={16} style={{ transform: 'rotate(-45deg)' }} />;
}
export class AppBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal-error">
        <h1>Aplikasi belum bisa ditampilkan.</h1>
        <p>Coba buka kembali aplikasi. Sesi foto hanya tersimpan di tab ini.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Muat ulang
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
