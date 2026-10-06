import type { Crop, FrameDefinition, Placement, Session } from './types';
export const defaultCrop: Crop = {
  fitMode: 'cover',
  centerX: 0.5,
  centerY: 0.5,
  zoom: 1,
  rotation: 0,
  mirror: false,
};
const fresh = (slotId: string, photoId: string, mirror = false): Placement => ({
  ...defaultCrop,
  slotId,
  photoId,
  mirror,
});
const key = (id: string, version: number) => `${id}@${version}`;
export function createSession(frame: FrameDefinition): Session {
  return {
    frameId: frame.id,
    frameVersion: frame.version,
    slotIds: frame.slots.map((s) => s.id),
    photoIds: [],
    placements: [],
    caption: '',
    date: '',
    revision: 0,
    frameCache: {},
  };
}
export function assignPhoto(
  session: Session,
  slotId: string,
  photoId: string,
  mirror = false,
): Session {
  if (!session.slotIds.includes(slotId) || !session.photoIds.includes(photoId)) return session;
  const placements = session.placements
    .filter((p) => p.slotId !== slotId)
    .concat(fresh(slotId, photoId, mirror));
  placements.sort((a, b) => session.slotIds.indexOf(a.slotId) - session.slotIds.indexOf(b.slotId));
  return { ...session, placements, revision: session.revision + 1 };
}
export function addPhoto(
  session: Session,
  photoId: string,
  replaceSlot?: string,
  mirror = false,
): Session {
  if (session.photoIds.length >= 8 && !session.photoIds.includes(photoId)) return session;
  const next = {
    ...session,
    photoIds: session.photoIds.includes(photoId)
      ? session.photoIds
      : [...session.photoIds, photoId],
    revision: session.revision + 1,
  };
  const slotId =
    replaceSlot ?? session.slotIds.find((id) => !session.placements.some((p) => p.slotId === id));
  return slotId ? assignPhoto(next, slotId, photoId, mirror) : next;
}
export function swapPhotos(session: Session, first: string, second: string): Session {
  const a = session.placements.find((p) => p.slotId === first),
    b = session.placements.find((p) => p.slotId === second);
  if (first === second || !session.slotIds.includes(first) || !session.slotIds.includes(second))
    return session;
  const placements = session.placements.filter((p) => p.slotId !== first && p.slotId !== second);
  if (a) placements.push(fresh(second, a.photoId, a.mirror));
  if (b) placements.push(fresh(first, b.photoId, b.mirror));
  placements.sort((a, b) => session.slotIds.indexOf(a.slotId) - session.slotIds.indexOf(b.slotId));
  return { ...session, placements, revision: session.revision + 1 };
}
export function switchFrame(session: Session, frame: FrameDefinition): Session {
  if (session.frameId === frame.id && session.frameVersion === frame.version) return session;
  const frameCache = {
    ...session.frameCache,
    [key(session.frameId, session.frameVersion)]: session.placements,
  };
  const previous = frameCache[key(frame.id, frame.version)] ?? [];
  const placements: Placement[] = [];
  frame.slots.forEach((slot, i) => {
    const current =
      i < session.slotIds.length
        ? session.placements.find((p) => p.slotId === session.slotIds[i])
        : undefined;
    const cached = previous.find((p) => p.slotId === slot.id);
    const photoId = i < session.slotIds.length ? current?.photoId : cached?.photoId;
    if (!photoId || !session.photoIds.includes(photoId)) return;
    placements.push(
      cached?.photoId === photoId ? cached : fresh(slot.id, photoId, current?.mirror ?? false),
    );
  });
  return {
    ...session,
    frameId: frame.id,
    frameVersion: frame.version,
    slotIds: frame.slots.map((s) => s.id),
    placements,
    frameCache,
    revision: session.revision + 1,
  };
}
export function editPlacement(session: Session, slotId: string, patch: Partial<Crop>): Session {
  return {
    ...session,
    revision: session.revision + 1,
    placements: session.placements.map((p) => {
      if (p.slotId !== slotId) return p;
      let next = { ...p, ...patch };
      if (
        (patch.rotation !== undefined && patch.rotation !== p.rotation) ||
        (patch.mirror !== undefined && patch.mirror !== p.mirror)
      )
        next = { ...next, centerX: 0.5, centerY: 0.5, zoom: 1 };
      if (next.fitMode === 'contain') next = { ...next, centerX: 0.5, centerY: 0.5, zoom: 1 };
      return next;
    }),
  };
}
export class History {
  private past: Session[] = [];
  private future: Session[] = [];
  constructor(public current: Session) {}
  commit(next: Session) {
    if (next === this.current) return;
    this.past.push(this.current);
    if (this.past.length > 30) this.past.shift();
    this.current = { ...next, revision: this.current.revision + 1 };
    this.future = [];
  }
  undo(): Session | null {
    const state = this.past.pop();
    if (!state) return null;
    this.future.push(this.current);
    this.current = { ...state, revision: this.current.revision + 1 };
    return this.current;
  }
  redo(): Session | null {
    const state = this.future.pop();
    if (!state) return null;
    this.past.push(this.current);
    this.current = { ...state, revision: this.current.revision + 1 };
    return this.current;
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  referencedPhotos() {
    return new Set([this.current, ...this.past, ...this.future].flatMap((s) => s.photoIds));
  }
}
