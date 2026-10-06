import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  Camera as CameraIcon,
  ImagePlus,
  FlipHorizontal,
  Square,
  SwitchCamera,
} from 'lucide-react';
import { CameraController, type CameraState } from '../core/camera';
import type { FrameDefinition, Session } from '../core/types';
export interface CameraProps {
  frame: FrameDefinition;
  session: Session;
  activeSlot: string;
  remaining: number;
  onSlot: (id: string) => void;
  onCapture: (blob: Blob, slotId: string, mirror: boolean) => Promise<void>;
  onUpload: () => void;
  onBack: () => void;
}
export function Camera(p: CameraProps) {
  const video = useRef<HTMLVideoElement>(null),
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
    [mirror, setMirror] = useState(true),
    [facing, setFacing] = useState<'user' | 'environment'>('user'),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [deviceId, setDeviceId] = useState('');
  const live = useRef(p);
  live.current = p;
  const slot = p.frame.slots.find((s) => s.id === p.activeSlot) ?? p.frame.slots[0],
    sw = slot.w * p.frame.designWidth,
    sh = slot.h * p.frame.designHeight;
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
  async function capture() {
    if (taking || phase !== 'live') return;
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
        const blob = await controller.capture(timer, (n) => {
          if (alive.current && token === sequence.current) setCount(n);
        });
        if (token !== sequence.current || !alive.current) break;
        setPhase('capturing');
        await p.onCapture(blob, id, mirror);
        if (token !== sequence.current || !alive.current) break;
        setPhase('live');
        if (!burst) {
          const empty = live.current.frame.slots.find(
            (s) => !live.current.session.placements.some((photo) => photo.slotId === s.id),
          );
          if (empty) p.onSlot(empty.id);
        }
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
  const clip =
    slot.shape === 'circle'
      ? 'ellipse(50% 50% at 50% 50%)'
      : slot.pathRef === 'chamfer'
        ? 'polygon(9% 0,91% 0,100% 9%,100% 91%,91% 100%,9% 100%,0 91%,0 9%)'
        : slot.pathRef === 'arch'
          ? `url(#camera-arch)`
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
        <button className="button secondary" disabled={taking} onClick={p.onBack}>
          <ArrowLeft size={17} />
          Kembali
        </button>
      </div>
      <div className="camera-grid">
        <section className="camera-view-panel">
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
              <clipPath id="camera-arch" clipPathUnits="objectBoundingBox">
                <path d={`M0 1V${r}C0 0 1 0 1 ${r}V1Z`} />
              </clipPath>
            </defs>
          </svg>
          <div
            className="camera-live"
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
              style={{ transform: mirror ? 'scaleX(-1)' : 'none' }}
            />
            {!ready && !taking && (
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
          <div className="camera-shot-controls">
            {taking ? (
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
                className="button primary full"
                aria-label="Ambil foto"
                disabled={
                  !ready ||
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
          </div>
          <p className="camera-guide">
            Panduan mengikuti bentuk slot. Foto disimpan penuh agar tetap bisa diatur.
          </p>
        </section>
        <aside className="panel camera-controls">
          <h2>{p.frame.name}</h2>
          <p className="muted">Pilih foto yang ingin diisi atau diambil ulang.</p>
          <div className="slot-buttons">
            {p.frame.slots.map((s) => (
              <button
                key={s.id}
                aria-label={`Pilih foto kamera ${s.order}`}
                aria-pressed={s.id === p.activeSlot}
                className={s.id === p.activeSlot ? 'active' : ''}
                disabled={taking}
                onClick={() => p.onSlot(s.id)}
              >
                {s.order}
                {p.session.placements.some((photo) => photo.slotId === s.id) && (
                  <span className="filled-dot" />
                )}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="camera-error">
              {error}
            </p>
          )}
          <button
            className={`small-button mirror-button ${mirror ? 'active' : ''}`}
            disabled={taking}
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
                disabled={taking}
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
                disabled={taking}
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
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={burst}
              disabled={taking}
              onChange={(e) => setBurst(e.target.checked)}
            />
            Ambil rangkaian
          </label>
          <p className="control-help">
            Rangkaian mengisi slot kosong dengan timer baru pada setiap foto. Ambil ulang memakai
            satu foto per klik.
          </p>
          {p.remaining <= 0 && (
            <p className="control-help">
              Sesi sudah berisi 8 foto. Lanjut edit atau hapus sesi untuk memulai lagi.
            </p>
          )}
          <button className="button secondary full" disabled={taking} onClick={p.onUpload}>
            <ImagePlus size={17} />
            Pilih foto dari perangkat
          </button>
          <button className="button ghost full" disabled={taking} onClick={p.onBack}>
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
