import { useEffect, useRef, useState, type RefObject } from 'react';
import { ARRuntime } from '../core/ar/runtime';
import { arKind } from '../core/ar/effects';
import { drawAR } from '../core/ar/draw';
import type { AREffectId, ARSnapshot } from '../core/ar/types';
export function useCameraAR(
  video: RefObject<HTMLVideoElement | null>,
  preview: RefObject<HTMLCanvasElement | null>,
  effect: AREffectId,
  active: boolean,
) {
  const engine = useRef<ARRuntime | null>(null);
  const [state, setState] = useState({
    phase: 'off',
    message: 'Pilih AR untuk menambahkan aksesori atau mengganti latar.',
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (effect === 'none' || !active) {
      setState({
        phase: 'off',
        message:
          effect === 'none'
            ? 'Pilih AR untuk menambahkan aksesori atau mengganti latar.'
            : 'Buka kamera untuk mencoba AR.',
      });
      return;
    }
    let live = true,
      timer: ReturnType<typeof setTimeout> | undefined;
    const runtime = new ARRuntime(),
      frame = document.createElement('canvas');
    engine.current = runtime;
    setState({
      phase: 'loading',
      message: 'Menyiapkan AR… unduhan pertama mungkin perlu beberapa saat.',
    });
    const tick = async () => {
      if (!live) return;
      const v = video.current,
        out = preview.current;
      if (!v?.videoWidth || v.readyState < 2 || !out) {
        timer = setTimeout(() => void tick(), 100);
        return;
      }
      try {
        const started = performance.now(),
          scale = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
        frame.width = Math.round(v.videoWidth * scale);
        frame.height = Math.round(v.videoHeight * scale);
        frame.getContext('2d')!.drawImage(v, 0, 0, frame.width, frame.height);
        const detection = await runtime.infer(frame, arKind(effect));
        if (!live) return;
        out.width = frame.width;
        out.height = frame.height;
        drawAR(out, frame, { ...detection, effect, time: performance.now() });
        const message = detection.mask
          ? 'Latar siap · ikuti panduan foto.'
          : detection.faces.length
            ? `${detection.faces.length} wajah terdeteksi · AR mengikuti gerakanmu.`
            : 'Arahkan wajah ke kamera agar aksesori muncul.';
        setState((previous) =>
          previous.phase === 'ready' && previous.message === message
            ? previous
            : { phase: 'ready', message },
        );
        timer = setTimeout(() => void tick(), Math.max(0, 100 - (performance.now() - started)));
      } catch (error) {
        if (live && !(error instanceof Error && error.name === 'AbortError')) {
          runtime.close();
          engine.current = null;
          setState({
            phase: 'error',
            message:
              'Efek AR belum bisa dimuat. Coba lagi atau pilih Tanpa AR untuk tetap memotret.',
          });
        }
      }
    };
    void tick();
    return () => {
      live = false;
      clearTimeout(timer);
      runtime.close();
      if (engine.current === runtime) engine.current = null;
      frame.width = frame.height = 1;
    };
  }, [effect, active, retry, video, preview]);
  async function snapshot(frame: HTMLCanvasElement): Promise<ARSnapshot | undefined> {
    if (effect === 'none') return;
    const runtime = engine.current;
    if (!runtime) throw new Error('Efek AR belum siap. Pilih Tanpa AR atau coba lagi.');
    return { ...(await runtime.infer(frame, arKind(effect))), effect, time: performance.now() };
  }
  return {
    state,
    snapshot,
    retry: () => setRetry((n) => n + 1),
    ready: effect === 'none' || state.phase === 'ready',
    visible: effect !== 'none' && state.phase === 'ready',
  };
}
