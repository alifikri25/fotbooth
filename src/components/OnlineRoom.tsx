import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Copy, Heart, Link, Users, X } from 'lucide-react';
import { roomFrames, onlineRoomFrames, getRoomFrame } from '../core/room/frames';
import { ARRuntime } from '../core/ar/runtime';
import type { ARMask } from '../core/ar/types';
import { canvasBlob, decodeSource } from '../core/ingest';
import { createRoom, RoomConnection } from '../core/room/client';
import {
  drawRoomFrame,
  exportRoomSequence,
  makeRoomPortrait,
  type RoomSnapshotPair,
} from '../core/room/composition';
import type { RoomCapture, RoomSettings, RoomState } from '../core/room/protocol';
import type { PhotoSource } from '../core/types';
import { CaptureDeadline, previewSize } from '../core/room/capture-deadline';
import './online-room.css';

const defaults: RoomSettings = { frameId: roomFrames[0].id, scene: 'studio', cutout: true };
const apiBase =
  (import.meta.env.VITE_ROOM_API_URL as string | undefined) ??
  (import.meta.env.PROD ? 'https://fotbooth-rooms.aliifikriii25.workers.dev' : '');
type Identity = { roomId: string; token: string; guestToken?: string };
const catalogFrames = onlineRoomFrames.filter(
  (frame) => !roomFrames.some((preset) => preset.id === frame.id),
);
function invitation() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const roomId = hash.get('room'),
    token = hash.get('key');
  return roomId &&
    token &&
    /^[a-zA-Z0-9_-]{16,80}$/.test(roomId) &&
    /^[a-zA-Z0-9_-]{24,128}$/.test(token)
    ? { roomId, token }
    : null;
}
function roomLink(roomId: string, token: string) {
  const url = new URL(location.href);
  url.hash = new URLSearchParams({ room: roomId, key: token }).toString();
  return url.href;
}
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Room belum bisa tersambung. Coba lagi.';

export function OnlineRoom({ onBack }: { onBack: () => void }) {
  const [incoming] = useState(invitation);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [name, setName] = useState('');
  const [settings, setSettings] = useState<RoomSettings>(defaults);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [peerStatus, setPeerStatus] = useState<'connecting' | 'connected' | 'disconnected'>(
    'disconnected',
  );
  const [mode, setMode] = useState<'direct' | 'relay'>('direct');
  const [cutoutStatus, setCutoutStatus] = useState('Nyalakan kamera untuk menyiapkan latar.');
  const [count, setCount] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [pose, setPose] = useState<{ index: number; total: number } | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null),
    remoteVideo = useRef<HTMLVideoElement>(null),
    preview = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null),
    connection = useRef<RoomConnection | null>(null),
    engine = useRef<ARRuntime | null>(null);
  const alive = useRef(true),
    generation = useRef(0),
    roomRef = useRef(room),
    settingsRef = useRef(settings);
  const capture = useRef<RoomCapture | null>(null),
    ownPhoto = useRef<Blob | null>(null),
    partnerPhoto = useRef<Blob | null>(null);
  const captureTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    countTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const building = useRef(''),
    resultURL = useRef(''),
    remoteImage = useRef<HTMLImageElement | null>(null),
    remoteURL = useRef('');
  const masks = useRef<{ local?: ARMask; remote?: ARMask }>({});
  const deadline = useRef(new CaptureDeadline());
  const pendingSettings = useRef<RoomSettings | null>(null);
  const pendingRetake = useRef(false),
    roomAuthenticated = useRef(false);
  const pairs = useRef<RoomSnapshotPair[]>([]),
    pairSources = useRef<{ host: PhotoSource; guest: PhotoSource }[]>([]),
    activeSeries = useRef(''),
    savingPair = useRef(''),
    savedPair = useRef(''),
    advanceRequested = useRef('');
  const previewBusy = useRef(false),
    cutoutFailed = useRef(false),
    previewSequence = useRef(0);
  roomRef.current = room;
  settingsRef.current = settings;

  function resetShot() {
    deadline.current.cancel();
    clearTimeout(captureTimer.current);
    clearInterval(countTimer.current);
    capture.current = null;
    ownPhoto.current = partnerPhoto.current = null;
    building.current = '';
    savingPair.current = savedPair.current = advanceRequested.current = '';
    setCount(null);
    setProcessing(false);
  }
  function clearPairs() {
    pairs.current = [];
    for (const pair of pairSources.current) {
      pair.host.release?.();
      pair.guest.release?.();
    }
    pairSources.current = [];
    activeSeries.current = '';
  }
  function resetCapture() {
    resetShot();
    clearPairs();
    setPose(null);
    if (resultURL.current) URL.revokeObjectURL(resultURL.current);
    resultURL.current = '';
    setResult('');
  }
  function cancelCapture(reason: string) {
    connection.current?.send({ type: 'ready', ready: false });
    resetCapture();
    setError(reason);
  }
  function retake() {
    resetCapture();
    if (roomAuthenticated.current && connection.current)
      connection.current.send({ type: 'retake' });
    else pendingRetake.current = true;
  }
  function stopCamera() {
    generation.current++;
    roomAuthenticated.current = false;
    connection.current?.close();
    connection.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    engine.current?.close();
    engine.current = null;
    for (const video of [localVideo.current, remoteVideo.current]) {
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    }
    masks.current = {};
    setCameraOn(false);
    setPeerStatus('disconnected');
  }
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current++;
      clearTimeout(captureTimer.current);
      clearInterval(countTimer.current);
      deadline.current.cancel();
      connection.current?.close();
      stream.current?.getTracks().forEach((track) => track.stop());
      engine.current?.close();
      clearPairs();
      if (resultURL.current) URL.revokeObjectURL(resultURL.current);
      if (remoteURL.current) URL.revokeObjectURL(remoteURL.current);
    };
  }, []);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden && capture.current && !resultURL.current) {
        cancelCapture(
          'Foto dibatalkan karena tab tidak aktif. Buka kembali tab ini, lalu siap bersama lagi.',
        );
      }
    };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, []);

  function showResult(blob: Blob) {
    if (resultURL.current) URL.revokeObjectURL(resultURL.current);
    resultURL.current = URL.createObjectURL(blob);
    deadline.current.cancel();
    clearPairs();
    ownPhoto.current = partnerPhoto.current = null;
    setResult(resultURL.current);
    setProcessing(false);
  }
  function advanceOrFinish() {
    const shot = capture.current;
    if (
      !shot ||
      savedPair.current !== shot.captureId ||
      roomRef.current?.self !== 'host' ||
      roomRef.current.capture?.id !== shot.captureId ||
      roomRef.current.phase !== 'result'
    )
      return;
    if (shot.series && shot.series.index + 1 < shot.series.total) {
      if (advanceRequested.current === shot.captureId) return;
      advanceRequested.current = shot.captureId;
      connection.current?.send({ type: 'advance', captureId: shot.captureId });
    } else void buildResult();
  }
  async function savePair() {
    const shot = capture.current;
    if (
      !shot ||
      !ownPhoto.current ||
      !partnerPhoto.current ||
      savingPair.current === shot.captureId ||
      savedPair.current === shot.captureId
    )
      return;
    savingPair.current = shot.captureId;
    const pair =
      roomRef.current?.self === 'host'
        ? { host: ownPhoto.current, guest: partnerPhoto.current }
        : { host: partnerPhoto.current, guest: ownPhoto.current };
    let host: PhotoSource | undefined,
      guest: PhotoSource | undefined,
      retained = false;
    try {
      host = await decodeSource(pair.host);
      guest = await decodeSource(pair.guest);
      if (!alive.current || capture.current?.captureId !== shot.captureId) return;
      if (pairs.current.length !== (shot.series?.index ?? 0))
        throw new Error('Urutan pose belum lengkap. Foto ulang untuk mulai bersama lagi.');
      pairs.current.push(pair);
      pairSources.current.push({ host, guest });
      retained = true;
      savedPair.current = shot.captureId;
      setProcessing(true);
      if (!shot.series || shot.series.index + 1 === shot.series.total) {
        deadline.current.armResult(shot.captureId, (id) => {
          if (alive.current && capture.current?.captureId === id && !resultURL.current)
            cancelCapture('Hasil belum selesai diterima. Periksa koneksi, lalu foto ulang.');
        });
      }
      // Both originals are received and retained before this acknowledgement permits advance.
      connection.current?.send({ type: 'captured', captureId: shot.captureId });
      advanceOrFinish();
    } catch (e) {
      if (alive.current && capture.current?.captureId === shot.captureId) cancelCapture(message(e));
    } finally {
      if (!retained) {
        host?.release?.();
        guest?.release?.();
      }
    }
  }
  async function buildResult() {
    const shot = capture.current;
    if (
      !shot ||
      roomRef.current?.self !== 'host' ||
      savedPair.current !== shot.captureId ||
      building.current === shot.captureId
    )
      return;
    building.current = shot.captureId;
    setProcessing(true);
    try {
      const blob = await exportRoomSequence(
        pairs.current,
        getRoomFrame(shot.settings.frameId),
        shot.settings.scene,
      );
      if (!alive.current || capture.current?.captureId !== shot.captureId) return;
      await connection.current?.sendResult(shot.captureId, blob);
      if (!alive.current || capture.current?.captureId !== shot.captureId) return;
      showResult(blob);
    } catch (e) {
      if (alive.current && capture.current?.captureId === shot.captureId) cancelCapture(message(e));
    }
  }
  function onCapture(shot: RoomCapture) {
    if (capture.current?.captureId === shot.captureId) return;
    const total = getRoomFrame(shot.settings.frameId).slots.length;
    if (
      (shot.series?.total ?? 1) !== total ||
      (shot.series &&
        (!Number.isInteger(shot.series.index) ||
          shot.series.index < 0 ||
          shot.series.index >= total))
    ) {
      cancelCapture('Urutan pose tidak sesuai frame. Foto ulang untuk mencoba lagi.');
      return;
    }
    if (shot.series && shot.series.index > 0) {
      if (
        activeSeries.current !== shot.series.seriesId ||
        pairs.current.length !== shot.series.index ||
        capture.current?.settings.frameId !== shot.settings.frameId ||
        capture.current?.settings.scene !== shot.settings.scene ||
        capture.current?.settings.cutout !== shot.settings.cutout
      ) {
        cancelCapture('Ada pose yang belum diterima. Foto ulang untuk mulai bersama lagi.');
        return;
      }
      resetShot();
    } else {
      resetCapture();
      activeSeries.current = shot.series?.seriesId ?? shot.captureId;
    }
    capture.current = shot;
    setPose({ index: shot.series?.index ?? 0, total });
    setProcessing(false);
    const clock = () => connection.current?.serverNow() ?? Date.now();
    deadline.current.arm(shot.captureId, shot.at, clock(), (id) => {
      if (alive.current && capture.current?.captureId === id && !resultURL.current)
        cancelCapture(
          'Foto belum selesai diterima. Periksa koneksi, lalu tandai siap untuk mencoba lagi.',
        );
    });
    const tick = () => setCount(Math.max(0, Math.ceil((shot.at - clock()) / 1000)));
    tick();
    countTimer.current = setInterval(tick, 100);
    captureTimer.current = setTimeout(() => void takePhoto(shot), Math.max(0, shot.at - clock()));
  }
  async function takePhoto(shot: RoomCapture) {
    clearInterval(countTimer.current);
    setCount(null);
    setProcessing(true);
    let raw: HTMLCanvasElement | undefined, portrait: HTMLCanvasElement | undefined;
    try {
      const video = localVideo.current;
      if (
        !video?.videoWidth ||
        video.readyState < 2 ||
        !stream.current?.getVideoTracks().some((track) => track.readyState === 'live') ||
        capture.current?.captureId !== shot.captureId
      )
        throw new Error('Kamera belum siap. Tandai siap kembali sebelum foto.');
      raw = document.createElement('canvas');
      raw.width = video.videoWidth;
      raw.height = video.videoHeight;
      raw.getContext('2d')!.drawImage(video, 0, 0);
      let mask: ARMask | undefined;
      if (shot.settings.cutout) {
        engine.current ??= new ARRuntime();
        mask = (await engine.current.infer(raw, 'person')).mask;
        if (!mask)
          throw new Error('Latar belum berhasil dipisahkan. Coba lagi atau matikan latar bersama.');
      }
      portrait = makeRoomPortrait(raw, raw.width, raw.height, mask, true);
      const blob = await canvasBlob(portrait, 'image/png');
      if (!alive.current || capture.current?.captureId !== shot.captureId) return;
      ownPhoto.current = blob;
      await connection.current?.sendPhoto(shot.captureId, blob);
      if (capture.current?.captureId !== shot.captureId) return;
      await savePair();
    } catch (e) {
      if (alive.current && capture.current?.captureId === shot.captureId) {
        setError(message(e));
        connection.current?.send({ type: 'ready', ready: false });
        resetCapture();
      }
    } finally {
      if (raw) raw.width = raw.height = 1;
      if (portrait) portrait.width = portrait.height = 1;
    }
  }
  async function receivePreview(blob: Blob) {
    const sequence = ++previewSequence.current,
      token = generation.current;
    const url = URL.createObjectURL(blob),
      image = new Image();
    image.src = url;
    try {
      await image.decode();
      if (!alive.current || generation.current !== token || sequence !== previewSequence.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (remoteURL.current) URL.revokeObjectURL(remoteURL.current);
      remoteURL.current = url;
      remoteImage.current = image;
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  async function openCamera() {
    if (!identity || busy || stream.current) return;
    setBusy(true);
    setError('');
    cutoutFailed.current = false;
    const token = ++generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Kamera memerlukan HTTPS dan browser yang mendukung akses kamera.');
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (!alive.current || token !== generation.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      for (const track of media.getVideoTracks()) {
        track.addEventListener(
          'ended',
          () => {
            if (!alive.current || token !== generation.current) return;
            const reason =
              'Kamera terputus. Sambungkan kembali, lalu nyalakan kamera untuk melanjutkan.';
            if (resultURL.current) setError(reason);
            else cancelCapture(reason);
            stopCamera();
          },
          { once: true },
        );
      }
      const video = localVideo.current!;
      video.srcObject = media;
      await video.play();
      if (!alive.current || token !== generation.current) return;
      let clientId = sessionStorage.getItem('fotbooth.room.client.' + identity.roomId);
      if (!clientId) {
        clientId = crypto.randomUUID();
        sessionStorage.setItem('fotbooth.room.client.' + identity.roomId, clientId);
      }
      let firstState = true;
      const client = new RoomConnection({
        apiBase,
        roomId: identity.roomId,
        token: identity.token,
        name: name.trim(),
        clientId,
        onState(state) {
          if (!alive.current || token !== generation.current) return;
          roomAuthenticated.current = true;
          if (pendingRetake.current) {
            pendingRetake.current = false;
            client.send({ type: 'retake' });
          }
          const old = roomRef.current;
          const firstMembershipState = firstState;
          roomRef.current = state;
          if (
            firstState &&
            state.self === 'host' &&
            identity.guestToken &&
            JSON.stringify(settingsRef.current) !== JSON.stringify(state.settings)
          ) {
            pendingSettings.current = settingsRef.current;
            client.send({ type: 'settings', settings: settingsRef.current });
          }
          firstState = false;
          if (
            pendingSettings.current &&
            JSON.stringify(pendingSettings.current) === JSON.stringify(state.settings)
          )
            pendingSettings.current = null;
          const nextSettings = pendingSettings.current ?? state.settings;
          settingsRef.current = nextSettings;
          setRoom(state);
          setSettings(nextSettings);
          if (capture.current && !state.capture) {
            const partnerConnected = state.participants.some(
              (p) => p.role !== state.self && p.connected,
            );
            const partnerWasConnected = old?.participants.some(
              (p) => p.role !== state.self && p.connected,
            );
            if (
              !resultURL.current ||
              (partnerConnected && partnerWasConnected && !firstMembershipState)
            )
              resetCapture();
          }
          if (old?.settings.cutout !== state.settings.cutout) {
            masks.current = {};
            cutoutFailed.current = false;
          }
          if (!state.participants.find((p) => p.role !== state.self && p.connected)) {
            remoteImage.current = null;
            masks.current.remote = undefined;
          }
          advanceOrFinish();
        },
        onCapture,
        onPhoto(captureId, blob) {
          if (capture.current?.captureId === captureId) {
            partnerPhoto.current = blob;
            void savePair();
          }
        },
        onResult(captureId, blob) {
          if (
            alive.current &&
            token === generation.current &&
            capture.current?.captureId === captureId
          )
            showResult(blob);
        },
        onRemoteStream(media) {
          if (!alive.current || token !== generation.current) return;
          const video = remoteVideo.current;
          if (video) {
            video.srcObject = media;
            if (media) void video.play().catch(() => {});
          }
        },
        onRemotePreview: receivePreview,
        onConnection(status) {
          if (alive.current && token === generation.current) {
            setPeerStatus(status);
            if (status === 'disconnected') {
              if (capture.current && !resultURL.current) resetCapture();
              stopCamera();
            }
          }
        },
        onMode(value) {
          if (alive.current && token === generation.current) setMode(value);
        },
        onError(value) {
          if (alive.current && token === generation.current) setError(value);
        },
      });
      connection.current = client;
      setCameraOn(true);
      await client.connect(media);
    } catch (e) {
      if (alive.current && token === generation.current) {
        setError(message(e));
        stopCamera();
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  useEffect(() => {
    let closed = false,
      timer: ReturnType<typeof setTimeout>;
    async function paint() {
      if (closed || !alive.current) return;
      let local: HTMLCanvasElement | undefined, remote: HTMLCanvasElement | undefined;
      try {
        const canvas = preview.current,
          localSource = localVideo.current;
        if (!canvas) return;
        const current = settingsRef.current,
          frame = getRoomFrame(current.frameId);
        const remoteSource =
          remoteVideo.current?.videoWidth && remoteVideo.current.readyState >= 2
            ? remoteVideo.current
            : remoteImage.current;
        const hasLocal = !!localSource?.videoWidth && localSource.readyState >= 2;
        if (cameraOn && hasLocal && !capture.current && current.cutout && !cutoutFailed.current) {
          engine.current ??= new ARRuntime();
          try {
            previewBusy.current = true;
            masks.current.local = (await engine.current.infer(localSource!, 'person')).mask;
            if (remoteSource)
              masks.current.remote = (await engine.current.infer(remoteSource, 'person')).mask;
            if (!closed) setCutoutStatus('Latar bersama aktif');
          } catch (e) {
            if (!closed) {
              cutoutFailed.current = true;
              setCutoutStatus('Latar belum tersedia. Coba kamera lagi atau gunakan latar asli.');
              setError(message(e));
            }
          } finally {
            previewBusy.current = false;
          }
        } else if (!current.cutout && !closed)
          setCutoutStatus('Menggunakan latar asli masing-masing.');
        if (closed) return;
        if (hasLocal)
          local = makeRoomPortrait(
            localSource!,
            localSource!.videoWidth,
            localSource!.videoHeight,
            current.cutout ? masks.current.local : undefined,
            true,
          );
        if (remoteSource) {
          const w =
            'videoWidth' in remoteSource ? remoteSource.videoWidth : remoteSource.naturalWidth;
          const h =
            'videoHeight' in remoteSource ? remoteSource.videoHeight : remoteSource.naturalHeight;
          remote = makeRoomPortrait(
            remoteSource,
            w,
            h,
            current.cutout ? masks.current.remote : undefined,
            true,
          );
        }
        const self = roomRef.current?.self ?? (incoming ? 'guest' : 'host');
        canvas.width = 600;
        canvas.height = Math.round((600 * frame.designHeight) / frame.designWidth);
        await drawRoomFrame(
          canvas,
          self === 'host' ? (local ?? null) : (remote ?? null),
          self === 'guest' ? (local ?? null) : (remote ?? null),
          frame,
          current.scene,
          pairSources.current.map((pair) => ({ host: pair.host.image, guest: pair.guest.image })),
        );
        if (cameraOn && hasLocal) {
          const small = document.createElement('canvas');
          const dimensions = previewSize(localSource!.videoWidth, localSource!.videoHeight);
          small.width = dimensions.width;
          small.height = dimensions.height;
          small.getContext('2d')!.drawImage(localSource!, 0, 0, small.width, small.height);
          const blob = await canvasBlob(small, 'image/jpeg', 0.45);
          small.width = small.height = 1;
          connection.current?.sendPreview(blob);
        }
      } catch (e) {
        if (!closed && alive.current) setError(message(e));
      } finally {
        if (local) local.width = local.height = 1;
        if (remote) remote.width = remote.height = 1;
        if (!closed) timer = setTimeout(() => void paint(), 300);
      }
    }
    void paint();
    return () => {
      closed = true;
      clearTimeout(timer);
    };
  }, [cameraOn, identity, settings.frameId, settings.scene, settings.cutout]);

  async function create() {
    if (!name.trim()) {
      setError('Isi nama kamu dulu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await createRoom(apiBase, name.trim(), settings);
      if (!alive.current) return;
      const next = {
        roomId: created.roomId,
        token: created.hostToken,
        guestToken: created.guestToken,
      };
      history.replaceState(null, '', roomLink(next.roomId, next.token));
      setIdentity(next);
    } catch (e) {
      if (alive.current) setError(message(e));
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  function join() {
    if (!incoming) {
      setError('Undangan tidak lengkap. Minta pasangan mengirim ulang tautannya.');
      return;
    }
    if (!name.trim()) {
      setError('Isi nama kamu dulu.');
      return;
    }
    setError('');
    setIdentity(incoming);
  }
  function leave() {
    resetCapture();
    stopCamera();
    history.replaceState(null, '', location.pathname + location.search);
    onBack();
  }
  function changeSettings(patch: Partial<RoomSettings>) {
    resetCapture();
    const next = { ...settings, ...patch };
    setSettings(next);
    settingsRef.current = next;
    if (connection.current) pendingSettings.current = next;
    connection.current?.send({ type: 'settings', settings: next });
  }
  const guestToken = identity?.guestToken ?? room?.inviteToken;
  const invite = identity && guestToken ? roomLink(identity.roomId, guestToken) : '';
  const self = room?.participants.find((p) => p.role === room.self),
    partner = room?.participants.find((p) => p.role !== room.self);
  const isHost = room ? room.self === 'host' : !incoming;
  const working = count !== null || processing;
  const readyAllowed =
    cameraOn &&
    peerStatus === 'connected' &&
    !!partner?.connected &&
    !working &&
    (!settings.cutout || cutoutStatus === 'Latar bersama aktif');
  const canCapture =
    isHost &&
    room?.phase === 'ready' &&
    !!self?.ready &&
    !!partner?.ready &&
    peerStatus === 'connected' &&
    !working;

  return (
    <main className="online-room-page">
      <div className="room-heading">
        <span className="eyebrow">
          <Heart size={16} /> FOTO BARENG ONLINE
        </span>
        <button className="text-button" onClick={leave}>
          <ArrowLeft size={16} />
          {identity ? 'Keluar room' : 'Kembali'}
        </button>
      </div>
      {!identity ? (
        <section className="room-welcome">
          <div>
            <h1>{incoming ? 'Gabung foto bareng' : 'Foto bareng, dari mana saja.'}</h1>
            <p>
              Satu room, dua kamera, satu kenangan. Posisikan diri kalian berdampingan dalam latar
              dan frame yang sama.
            </p>
            <div className="room-intro-steps">
              <span>
                <Link size={20} /> Bagikan undangan
              </span>
              <span>
                <Users size={20} /> Siap bersama
              </span>
              <span>
                <Camera size={20} /> Foto & unduh
              </span>
            </div>
          </div>
          <form
            className="room-entry-card"
            onSubmit={(event) => {
              event.preventDefault();
              if (incoming) join();
              else void create();
            }}
          >
            <span className="eyebrow">
              {incoming ? 'UNDANGAN UNTUKMU' : 'ROOM PRIVAT · 2 ORANG'}
            </span>
            <label>
              Nama kamu
              <input
                aria-label="Nama kamu"
                value={name}
                maxLength={24}
                autoComplete="nickname"
                placeholder="Panggilanmu"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <p>Kamera dan foto dibagikan kepada orang yang masuk lewat undanganmu.</p>
            <p className="room-fine-print">
              Kamera menyala setelah kamu memilihnya. Tanpa mikrofon. Room berlaku satu jam; server
              room tidak menyimpan foto.
            </p>
            <button className="button primary full" disabled={busy} type="submit">
              {busy ? 'Menyiapkan room…' : incoming ? 'Masuk room' : 'Buat room'}
              <ArrowLeft className="room-arrow" size={18} />
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="room-title">
            <div>
              <h1>Room foto bareng</h1>
              <p>
                {cameraOn && partner?.connected
                  ? 'Kalian sudah di sini. Atur pose, lalu tandai siap bersama.'
                  : 'Bagikan undangan dan tunggu pasanganmu masuk.'}
              </p>
            </div>
            <span className="room-live-tag" data-testid="room-peer-status">
              {!cameraOn
                ? 'Kamera mati'
                : peerStatus === 'connected'
                  ? 'Terhubung'
                  : partner?.connected
                    ? 'Menyambungkan…'
                    : 'Menunggu pasangan'}
            </span>
          </div>
          <div className="room-workspace">
            <section className="room-studio" aria-label="Pratinjau frame foto bersama">
              <div className="room-preview-wrap">
                {result ? (
                  <img src={result} alt="Hasil foto bareng" />
                ) : (
                  <canvas ref={preview} aria-label="Pratinjau foto bareng" />
                )}
                {count !== null && (
                  <div className="room-countdown" role="status" aria-live="assertive">
                    {count || '✦'}
                  </div>
                )}
              </div>
              <div className="room-people">
                <span>
                  <i className={cameraOn ? 'online' : ''} />
                  {isHost ? name : (partner?.name ?? 'Pasangan')} · kiri
                </span>
                <Heart size={16} />
                <span>
                  <i className={partner?.connected ? 'online' : ''} />
                  {isHost ? (partner?.name ?? 'Pasangan') : name} · kanan
                </span>
              </div>
              <p className="room-pose-guide">
                Sisakan ruang di sisi dalam agar kalian bisa mendekat atau membuat pose hati
                bersama.
              </p>
            </section>
            <aside className="room-controls">
              {invite && (
                <section className="room-control-card">
                  <h2>Undang pasanganmu</h2>
                  <p>Hanya bagikan tautan ini kepada orang yang ingin kamu ajak foto.</p>
                  <div className="room-invite">
                    <input aria-label="Tautan undangan" readOnly value={invite} />
                    <button
                      className="icon-button"
                      aria-label="Salin undangan"
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(invite)
                          .then(() => setCopied(true))
                          .catch(() => setError('Salin tautan dari kolom undangan.'))
                      }
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  {copied && <span role="status">Undangan disalin.</span>}
                </section>
              )}
              <section className="room-control-card">
                <h2>Satu latar, satu frame</h2>
                <label>
                  Frame foto bareng
                  <select
                    aria-label="Frame foto bareng"
                    value={settings.frameId}
                    disabled={!isHost || working}
                    onChange={(e) => changeSettings({ frameId: e.target.value })}
                  >
                    <optgroup label={`Koleksi frame · ${catalogFrames.length} pilihan`}>
                      {catalogFrames.map((frame) => (
                        <option value={frame.id} key={frame.id}>
                          {frame.name} · {frame.slots.length} pose
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Frame khusus berdua">
                      {roomFrames.map((frame) => (
                        <option value={frame.id} key={frame.id}>
                          {frame.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                <p data-testid="room-frame-info">
                  {getRoomFrame(settings.frameId).slots.length} pose · {catalogFrames.length} frame
                  koleksi dan 3 frame khusus berdua. Kalian berdua ada di setiap foto; tiap pose
                  mengisi satu kotak frame.
                </p>
                <label>
                  Latar bersama
                  <select
                    aria-label="Latar bersama"
                    value={settings.scene}
                    disabled={!isHost || working}
                    onChange={(e) =>
                      changeSettings({ scene: e.target.value as RoomSettings['scene'] })
                    }
                  >
                    <option value="studio">Studio hangat</option>
                    <option value="sunset">Langit senja</option>
                    <option value="night">Malam berbintang</option>
                  </select>
                </label>
                <label className="room-toggle">
                  <input
                    type="checkbox"
                    checked={settings.cutout}
                    disabled={!isHost || working}
                    onChange={(e) => changeSettings({ cutout: e.target.checked })}
                  />
                  Pisahkan latar kamera
                </label>
                <p data-testid="room-cutout-status" role="status">
                  {cutoutStatus}
                </p>
                {!isHost && <p>Pasanganmu mengatur frame dan latar untuk kalian berdua.</p>}
              </section>
              <section className="room-control-card room-shutter-card">
                <h2>{result ? 'Kenangan kalian sudah jadi.' : 'Siap untuk foto?'}</h2>
                {pose && !result && (
                  <p data-testid="room-shot-progress" role="status">
                    Pose {pose.index + 1} dari {pose.total}
                  </p>
                )}
                {!cameraOn ? (
                  <button
                    className="button primary full"
                    disabled={busy}
                    onClick={() => void openCamera()}
                  >
                    <Camera size={18} />
                    {busy ? 'Membuka kamera…' : 'Nyalakan kamera'}
                  </button>
                ) : (
                  <>
                    {!result && (
                      <button
                        className="button secondary full"
                        disabled={!readyAllowed}
                        onClick={() =>
                          connection.current?.send({ type: 'ready', ready: !self?.ready })
                        }
                      >
                        {self?.ready ? 'Batalkan siap' : 'Aku siap'}
                      </button>
                    )}
                    {isHost && !result && (
                      <button
                        className="button primary full"
                        disabled={!canCapture}
                        onClick={() => connection.current?.send({ type: 'capture' })}
                      >
                        <Camera size={18} />
                        Foto bareng
                      </button>
                    )}
                    {!isHost && !result && (
                      <p>
                        {self?.ready
                          ? 'Kamu siap. Pasanganmu akan memulai hitung mundur.'
                          : 'Tandai siap setelah posisi kamu pas.'}
                      </p>
                    )}
                  </>
                )}
                {processing && (
                  <p role="status">Menggabungkan foto kalian… Tunggu kedua foto selesai dikirim.</p>
                )}
                {working && (
                  <button
                    className="button secondary full"
                    onClick={() =>
                      cancelCapture('Pengambilan dibatalkan. Tandai siap kembali untuk foto lagi.')
                    }
                  >
                    Batalkan pengambilan
                  </button>
                )}
                {result && (
                  <>
                    <a
                      className="button primary full"
                      href={result}
                      download={`fotbooth-bareng-${settings.frameId}.png`}
                    >
                      Unduh PNG
                    </a>
                    {isHost ? (
                      <button className="button secondary full" onClick={retake}>
                        Foto ulang
                      </button>
                    ) : (
                      <p>Pasanganmu bisa memulai foto ulang.</p>
                    )}
                  </>
                )}
                {cameraOn && (
                  <button
                    className="text-button"
                    onClick={() => {
                      if (!resultURL.current) {
                        connection.current?.send({ type: 'ready', ready: false });
                        resetCapture();
                      }
                      stopCamera();
                    }}
                  >
                    Matikan kamera
                  </button>
                )}
                {cameraOn && mode === 'relay' && (
                  <p className="room-fine-print">
                    Koneksi hemat aktif. Pratinjau mungkin lebih lambat; foto asli tetap dipakai
                    untuk hasil.
                  </p>
                )}
              </section>
              <p className="room-fine-print">
                Video dan foto dikirim kepada peserta room, langsung atau melalui server perantara.
                Foto tidak disimpan oleh server. Unduh hasil sebelum menutup room.
              </p>
            </aside>
          </div>
          <video
            ref={localVideo}
            className="room-video-source"
            muted
            playsInline
            aria-hidden="true"
          />
          <video
            ref={remoteVideo}
            className="room-video-source"
            muted
            playsInline
            aria-hidden="true"
          />
        </>
      )}
      {error && (
        <div className="notice room-error" role="alert">
          <span>{error}</span>
          <button
            className="icon-button"
            aria-label="Tutup pemberitahuan room"
            onClick={() => setError('')}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </main>
  );
}
