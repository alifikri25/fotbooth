import type { PhotoAsset, PhotoSource } from './types';
import { decodeSource } from './ingest';
export class PhotoRegistry {
  private photos = new Map<string, PhotoAsset>();
  add(photo: PhotoAsset) {
    this.photos.set(photo.id, photo);
  }
  get(id: string) {
    const photo = this.photos.get(id);
    if (!photo) throw new Error('Foto belum siap. Pilih ulang foto dari perangkat.');
    return photo;
  }
  preview = async (id: string): Promise<PhotoSource> => {
    const p = this.get(id);
    return { image: p.preview, width: p.width, height: p.height };
  };
  full = async (id: string): Promise<PhotoSource> => decodeSource(this.get(id).blob);
  dispose(photo: PhotoAsset) {
    URL.revokeObjectURL(photo.thumbnailUrl);
    if ('close' in photo.preview) photo.preview.close();
    else {
      photo.preview.width = 1;
      photo.preview.height = 1;
    }
  }
  clear() {
    for (const photo of this.photos.values()) this.dispose(photo);
    this.photos.clear();
  }
  sweep(referenced: Set<string>) {
    for (const [id, photo] of this.photos)
      if (!referenced.has(id)) {
        this.dispose(photo);
        this.photos.delete(id);
      }
  }
  get size() {
    return this.photos.size;
  }
}
