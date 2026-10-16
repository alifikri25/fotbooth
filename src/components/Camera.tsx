import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  Camera as CameraIcon,
  ImagePlus,
  FlipHorizontal,
  Square,
  SwitchCamera,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CameraController, type CameraState } from '../core/camera';
import type { Crop, FrameDefinition, Session } from '../core/types';
import type { PhotoRegistry } from '../core/resources';
import { defaultCrop } from '../core/session';
import { CameraPhoto } from './CameraPhoto';
import { getPhotoFilter, type PhotoEffectId } from '../core/effects';
import { PhotoEffects } from './PhotoEffects';
import { AREffects } from './AREffects';
import { useCameraAR } from './useCameraAR';
import type { AREffectId, ARSnapshot } from '../core/ar/types';
import { isSculptedMask, sculptedMaskPath } from '../core/slot-masks';
export interface CameraProps {
  frame: FrameDefinition;
  session: Session;
  photos: PhotoRegistry;
  activeSlot: string;
  remaining: number;
  onSlot: (id: string) => void;
  onCapture: (
    blob: Blob,
    slotId: string,
    mirror: boolean,
    effect: PhotoEffectId,
    intensity: number,
    ar?: ARSnapshot,
  ) => Promise<boolean>;
  onUpload: () => void;
  onBack: () => void;
}
interface CaptureDraft {
  blob: Blob;
  slotId: string;
  crop: Crop;
  ar?: ARSnapshot;
}
export function Camera(p: CameraProps) {
  const cameraClipId = `camera-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const video = useRef<HTMLVideoElement>(null),
    arPreview = useRef<HTMLCanvasElement>(null),
    reviewAction = useRef<HTMLButtonElement>(null),
    shotAction = useRef<HTMLButtonElement>(null),
    viewPanel = useRef<HTMLElement>(null),
    controller = useRef(new CameraController()).current,
    alive = useRef(false),
    sequence = useRef(0),
    opening = useRef(0);
  const [phase, setPhase] = useState<CameraState>('idle'),
    [error, setError] = useState(''),
    [timer, setTimer] = useState(3),
    [count, setCount] = useState(0),
    [burst, setBurst] = useState(false),
    [taking, setTaking] = useState(false),
    [accepting, setAccepting] = useState(false),
    [draft, setDraft] = useState<CaptureDraft | null>(null),
    [reviewSlot, setReviewSlot] = useState<string | null>(null),
    [previewReady, setPreviewReady] = useState(false),
    [mirror, setMirror] = useState(true),
    [facing, setFacing] = useState<'user' | 'environment'>('user'),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [deviceId, setDeviceId] = useState(''),
    [effect, setEffect] = useState<PhotoEffectId>('none'),
    [intensity, setIntensity] = useState(1),
    [arEffect, setArEffect] = useState<AREffectId>('none');
  const reviewedPlacement = p.session.placements.find((photo) => photo.slotId === reviewSlot);
  const reviewing = !!draft || !!reviewedPlacement,
    blocked = taking || accepting;
  const ar = useCameraAR(
    video,
    arPreview,
    arEffect,
    !reviewing && ['live', 'counting', 'capturing'].includes(phase),
  );
  const live = useRef(p);
  live.current = p;
  const slot = p.frame.slots.find((s) => s.id === p.activeSlot) ?? p.frame.slots[0],
    sw = slot.w * p.frame.designWidth,
    sh = slot.h * p.frame.designHeight;
  useEffect(() => {
    if (reviewing && previewReady) reviewAction.current?.focus({ preventScroll: true });
  }, [reviewing, previewReady]);
  async function open(nextFacing = facing, nextDevice = deviceId) {
    const token = ++opening.current;
    setPhase('requesting');
    setError('');
    try {
      await controller.open(
        video.current!,
        nextDevice
          ? { deviceId: { exact: nextDevice }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: nextFacing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      );
      if (!alive.current || token !== opening.current) return;
      setPhase('live');
      const inputs = await navigator.mediaDevices.enumerateDevices();
      if (alive.current && token === opening.current)
        setDevices(inputs.filter((d) => d.kind === 'videoinput'));
    } catch (err) {
      if (!alive.current || token !== opening.current) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Kamera belum bisa dibuka.');
    }
  }
  useEffect(() => {
    alive.current = true;
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) void open();
    });
    const stop = (event: Event) => {
      if (event.type === 'pagehide' || document.visibilityState === 'hidden') {
        sequence.current++;
        opening.current++;
        controller.stop();
        if (alive.current) {
          setPhase('stopped');
          setTaking(false);
          setCount(0);
        }
      }
    };
    document.addEventListener('visibilitychange', stop);
    window.addEventListener('pagehide', stop);
    return () => {
      mounted = false;
      alive.current = false;
      sequence.current++;
      opening.current++;
      controller.stop();
      document.removeEventListener('visibilitychange', stop);
      window.removeEventListener('pagehide', stop);
    };
  }, [controller]);
  function cancel() {
    sequence.current++;
    controller.cancelCapture();
    setCount(0);
    setTaking(false);
    setPhase(controller.state);
  }
  function nextPhoto(id: string) {
    const empty = live.current.frame.slots.find(
      (s) => s.id !== id && !live.current.session.placements.some((photo) => photo.slotId === s.id),
    );
    setReviewSlot(null);
    if (empty) p.onSlot(empty.id);
    else p.onBack();
  }
  async function acceptPhoto() {
    if (!draft || blocked || !previewReady) return;
    const shot = draft,
      token = ++sequence.current;
    setAccepting(true);
    setError('');
    try {
      const saved = await p.onCapture(
        shot.blob,
        shot.slotId,
        shot.crop.mirror,
        shot.crop.effect ?? 'none',
        shot.crop.effectIntensity ?? 1,
        shot.ar,
      );
      if (!alive.current || !saved) return;
      setDraft(null);
      if (token === sequence.current) nextPhoto(shot.slotId);
      else setReviewSlot(shot.slotId);
    } catch (err) {
      if (alive.current)
        setError(err instanceof Error ? err.message : 'Foto belum berhasil disimpan. Coba lagi.');
    } finally {
      if (alive.current) setAccepting(false);
    }
  }
  function retake() {
    setDraft(null);
    setReviewSlot(null);
    setError('');
    if (controller.state !== 'live') void open();
    queueMicrotask(() => shotAction.current?.focus({ preventScroll: true }));
  }
  function selectSlot(id: string) {
    if (blocked || draft) return;
    p.onSlot(id);
    setPreviewReady(false);
    const filled = p.session.placements.some((photo) => photo.slotId === id);
    setReviewSlot(filled ? id : null);
    if (filled)
      requestAnimationFrame(() =>
        viewPanel.current?.scrollIntoView({ block: 'start', behavior: 'instant' }),
      );
  }
  async function capture() {
    if (blocked || reviewing || phase !== 'live' || !ar.ready) return;
    const token = ++sequence.current;
    setTaking(true);
    setError('');
    const targets = burst
      ? p.frame.slots
          .filter((s) => !p.session.placements.some((photo) => photo.slotId === s.id))
          .map((s) => s.id)
      : [p.activeSlot];
    try {
      for (const id of targets) {
        if (token !== sequence.current || !alive.current || live.current.remaining <= 0) break;
        p.onSlot(id);
        setPhase('counting');
        let snapshot: ARSnapshot | undefined;
        const blob = await controller.capture(
          timer,
          (n) => {
            if (alive.current && token === sequence.current) setCount(n);
          },
          async (frame) => {
            snapshot = await ar.snapshot(frame);
          },
        );
        if (token !== sequence.current || !alive.current) break;
        setPhase('capturing');
        if (!burst) {
          setPreviewReady(false);
          setDraft({
            blob,
            slotId: id,
            crop: { ...defaultCrop, mirror, effect, effectIntensity: intensity },
            ar: snapshot,
          });
          break;
        }
        if (!(await p.onCapture(blob, id, mirror, effect, intensity, snapshot))) break;
        if (token !== sequence.current || !alive.current) break;
        setPhase('live');
      }
    } catch (err) {
      if (
        alive.current &&
        token === sequence.current &&
        !(err instanceof Error && err.name === 'AbortError')
      )
        setError(err instanceof Error ? err.message : 'Foto belum berhasil diambil.');
    } finally {
      if (alive.current && token === sequence.current) {
        setTaking(false);
        setCount(0);
        setPhase(controller.state);
      }
    }
  }
  const ready = phase === 'live',
    r = sw / 2 / sh;
  const sculptedRef =
    slot.shape === 'path' && isSculptedMask(slot.pathRef) ? slot.pathRef : undefined;
  const cameraMaskPath = sculptedRef
    ? sculptedMaskPath(sculptedRef, 1, 1)
    : `M0 1V${r}C0 0 1 0 1 ${r}V1Z`;
  const clip =
    slot.shape === 'circle'
      ? 'ellipse(50% 50% at 50% 50%)'
      : slot.pathRef === 'chamfer'
        ? 'polygon(9% 0,91% 0,100% 9%,100% 91%,91% 100%,9% 100%,0 91%,0 9%)'
        : slot.pathRef === 'arch' || sculptedRef
          ? `url(#${cameraClipId})`
          : 'none';
  return (
    <main className="camera-page">
      <div className="camera-heading">
        <div>
          <span className="eyebrow">02 / AMBIL FOTOMU</span>
          <h1>
            Senyum dulu<span className="heading-dot">.</span>
          </h1>
        </div>
        <button className="button secondary" disabled={blocked} onClick={p.onBack}>
          <ArrowLeft size={17} />
          Kembali
        </button>
      </div>
      <div className="camera-grid">
        <section ref={viewPanel} className="camera-view-panel">
          <div className="camera-meta">
            <span>
              Foto {slot.order} dari {p.frame.slots.length}
            </span>
            <span data-testid="camera-progress">
              {p.session.placements.length}/{p.frame.slots.length} terisi
            </span>
          </div>
          <svg className="camera-clip-definitions" width="0" height="0" aria-hidden="true">
            <defs>
              <clipPath id={cameraClipId} clipPathUnits="objectBoundingBox">
                <path d={cameraMaskPath} />
              </clipPath>
            </defs>
          </svg>
          <div
            className={`camera-live ${reviewing ? 'camera-review' : ''}`}
            data-testid={reviewing ? 'camera-capture-review' : undefined}
            style={
              {
                '--camera-ratio': sw / sh,
                aspectRatio: `${sw}/${sh}`,
                clipPath: clip,
                borderRadius:
                  slot.shape === 'roundedRect'
                    ? `${((slot.radius ?? 0) / sw) * 100}% / ${((slot.radius ?? 0) / sh) * 100}%`
                    : 0,
              } as CSSProperties
            }
          >
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              style={{
                visibility: reviewing ? 'hidden' : 'visible',
                transform: mirror ? 'scaleX(-1)' : 'none',
                filter: getPhotoFilter(effect, intensity),
                opacity: ar.visible ? 0 : 1,
              }}
            />
            <canvas
              ref={arPreview}
              className="camera-ar-preview"
              aria-label="Pratinjau kamera dengan AR"
              style={{
                visibility: !reviewing && ar.visible ? 'visible' : 'hidden',
                transform: mirror ? 'scaleX(-1)' : 'none',
                filter: getPhotoFilter(effect, intensity),
              }}
            />
            {reviewing && (
              <CameraPhoto
                frame={p.frame}
                slot={slot}
                crop={draft?.crop ?? reviewedPlacement!}
                blob={draft?.blob}
                ar={draft?.ar}
                photo={
                  reviewedPlacement && !draft ? p.photos.get(reviewedPlacement.photoId) : undefined
                }
                label={`Hasil foto ${slot.order}`}
                onReady={setPreviewReady}
                onError={setError}
              />
            )}
            {!reviewing && !ready && !taking && (
              <div className="camera-placeholder">
                <CameraIcon size={38} />
                <span>{phase === 'requesting' ? 'Menyiapkan kamera…' : 'Kamera berhenti'}</span>
              </div>
            )}
            {count > 0 && (
              <div className="countdown" role="status" aria-live="assertive">
                {count}
              </div>
            )}
          </div>
          <div className={`camera-shot-controls ${reviewing ? 'camera-review-controls' : ''}`}>
            {reviewing ? (
              <>
                <button
                  ref={reviewAction}
                  className="button primary full"
                  disabled={blocked || !previewReady}
                  onClick={() => (draft ? void acceptPhoto() : nextPhoto(slot.id))}
                >
                  <Check size={18} />
                  {draft ? 'Pakai foto & lanjut' : 'Lanjut ke foto berikutnya'}
                </button>
                <button
                  className="button secondary full"
                  disabled={blocked || p.remaining <= 0}
                  onClick={retake}
                >
                  <RotateCcw size={18} />
                  Ambil ulang
                </button>
              </>
            ) : taking ? (
              <button className="button danger full" onClick={cancel}>
                <Square size={17} />
                Hentikan
              </button>
            ) : phase === 'stopped' || phase === 'error' || phase === 'idle' ? (
              <button className="button primary full" onClick={() => void open()}>
                <CameraIcon size={18} />
                Buka kamera
              </button>
            ) : (
              <button
                ref={shotAction}
                className="button primary full"
                aria-label="Ambil foto"
                disabled={
                  !ready ||
                  !ar.ready ||
                  p.remaining <= 0 ||
                  (burst && p.session.placements.length === p.frame.slots.length)
                }
                onClick={() => void capture()}
              >
                <CameraIcon size={18} />
                {p.session.placements.some((photo) => photo.slotId === p.activeSlot) && !burst
                  ? 'Ambil ulang'
                  : burst
                    ? 'Ambil rangkaian'
                    : 'Ambil foto'}
              </button>
            )}
            {!reviewing && (
              <>
                <label className="sr-only" htmlFor="camera-timer">
                  Timer kamera
                </label>
                <select
                  id="camera-timer"
                  value={timer}
                  disabled={taking}
                  onChange={(e) => setTimer(Number(e.target.value))}
                >
                  {[0, 3, 5, 10].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'Tanpa timer' : `${n} detik`}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <p className="camera-guide">
            {reviewing ? (
              'Cek hasilnya dulu. Suka? Pakai foto ini. Belum pas? Ambil ulang.'
            ) : (
              <>
                Panduan mengikuti bentuk slot. Foto disimpan penuh agar tetap bisa diatur.
                {arEffect !== 'none' && ' Sisakan ruang di atas kepala untuk aksesori AR.'}
              </>
            )}
          </p>
        </section>
        <aside className="panel camera-controls">
          <h2>{p.frame.name}</h2>
          <p className="muted">Pilih foto yang ingin diisi atau diambil ulang.</p>
          <div className="slot-buttons camera-slot-thumbnails">
            {p.frame.slots.map((s) => {
              const placement = p.session.placements.find((photo) => photo.slotId === s.id);
              const pending = draft?.slotId === s.id ? draft : null;
              return (
                <button
                  key={s.id}
                  aria-label={`Pilih foto kamera ${s.order}`}
                  aria-pressed={s.id === p.activeSlot}
                  className={s.id === p.activeSlot ? 'active' : ''}
                  disabled={blocked || !!draft}
                  onClick={() => selectSlot(s.id)}
                >
                  {pending || placement ? (
                    <CameraPhoto
                      frame={p.frame}
                      slot={s}
                      crop={pending?.crop ?? placement!}
                      blob={pending?.blob}
                      ar={pending?.ar}
                      photo={placement && !pending ? p.photos.get(placement.photoId) : undefined}
                      label={`Thumbnail foto ${s.order}`}
                      maxEdge={160}
                    />
                  ) : (
                    <CameraIcon size={20} />
                  )}
                  <span className="camera-slot-number">
                    {s.order}
                    {placement && !pending && <Check size={12} />}
                  </span>
                </button>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="camera-error">
              {error}
            </p>
          )}
          <button
            className={`small-button mirror-button ${mirror ? 'active' : ''}`}
            disabled={blocked || reviewing}
            aria-pressed={mirror}
            onClick={() => setMirror(!mirror)}
          >
            <FlipHorizontal size={17} />
            Mirror {mirror ? 'aktif' : 'nonaktif'}
          </button>
          {devices.length > 1 && (
            <>
              <label className="control-label" htmlFor="camera-device">
                Pilih kamera
              </label>
              <select
                id="camera-device"
                value={deviceId}
                disabled={blocked || reviewing}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  void open(facing, e.target.value);
                }}
              >
                <option value="">Kamera otomatis</option>
                {devices.map((device, i) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Kamera ${i + 1}`}
                  </option>
                ))}
              </select>
              <button
                className="button ghost full"
                disabled={blocked || reviewing}
                onClick={() => {
                  const next = facing === 'user' ? 'environment' : 'user';
                  setFacing(next);
                  setDeviceId('');
                  setMirror(next === 'user');
                  void open(next, '');
                }}
              >
                <SwitchCamera size={18} />
                Kamera {facing === 'user' ? 'belakang' : 'depan'}
              </button>
            </>
          )}
          <AREffects
            effect={arEffect}
            disabled={blocked || reviewing}
            state={ar.state}
            onChange={setArEffect}
            onRetry={ar.retry}
          />
          <PhotoEffects
            effect={effect}
            intensity={intensity}
            disabled={blocked || reviewing}
            onChange={(next, amount) => {
              setEffect(next);
              setIntensity(amount);
            }}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={burst}
              disabled={blocked || reviewing}
              onChange={(e) => setBurst(e.target.checked)}
            />
            Ambil rangkaian
          </label>
          <p className="control-help">
            Foto biasa bisa dicek dan diambil ulang sebelum lanjut. Rangkaian otomatis mengisi semua
            slot kosong tanpa pemeriksaan per foto.
          </p>
          {p.remaining <= 0 && (
            <p className="control-help">
              Sesi sudah berisi 8 foto. Lanjut edit atau hapus sesi untuk memulai lagi.
            </p>
          )}
          <button className="button secondary full" disabled={blocked} onClick={p.onUpload}>
            <ImagePlus size={17} />
            Pilih foto dari perangkat
          </button>
          <button className="button ghost full" disabled={blocked || !!draft} onClick={p.onBack}>
            {p.session.photoIds.length ? 'Lanjut edit' : 'Kembali ke frame'}
          </button>
          <p className="limits">
            Kamera berhenti saat kamu keluar dari layar ini atau berpindah tab. Buka kembali melalui
            tombol kamera.
          </p>
        </aside>
      </div>
    </main>
  );
}
