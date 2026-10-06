import { useState } from 'react';
import { ArrowUpRight, Check, Search, SlidersHorizontal } from 'lucide-react';
import { frames } from '../frames/catalog';
import type { FrameDefinition } from '../core/types';
const categories = [
  ['semua', 'Semua frame'],
  ['floral', 'Floral'],
  ['romantic', 'Romantic'],
  ['scrapbook', 'Scrapbook'],
  ['retro', 'Retro'],
  ['cartoon', 'Cartoon'],
  ['dynamic', 'Dynamic'],
  ['playful', 'Playful'],
  ['clean', 'Clean'],
  ['futuristic', 'Futuristic'],
  ['soft', 'Soft'],
  ['party', 'Party'],
  ['nature', 'Nature'],
  ['seasonal', 'Seasonal'],
];
const collectionNames = [
  ...new Set(frames.map((f) => f.collection).filter(Boolean)),
].sort() as string[];
export function Gallery({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (frame: FrameDefinition) => void;
}) {
  const [category, setCategory] = useState('semua');
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('');
  const [format, setFormat] = useState('');
  const [photoCount, setPhotoCount] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('id');
  const visible = frames.filter(
    (f) =>
      (category === 'semua' || f.categories.includes(category)) &&
      (!collection || f.collection === collection) &&
      (!format || f.format === format) &&
      (!photoCount || f.slots.length === Number(photoCount)) &&
      (!normalizedQuery ||
        `${f.name} ${f.description} ${f.categories.join(' ')}`
          .toLocaleLowerCase('id')
          .includes(normalizedQuery)),
  );
  const filtered = category !== 'semua' || query || collection || format || photoCount;
  function resetFilters() {
    setCategory('semua');
    setQuery('');
    setCollection('');
    setFormat('');
    setPhotoCount('');
  }
  return (
    <main className="gallery-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">01 / PILIH FRAME</span>
          <h1>
            Satu momen.
            <br />
            <em>Banyak kemungkinan.</em>
          </h1>
        </div>
        <p>
          Pita, bunga, scrapbook, film retro, sampai karakter lucu.
          <br />
          Foto dan posisinya bisa diatur setelah ini.
        </p>
      </div>
      <div className="library-tools">
        <label className="library-search">
          <span>Cari frame</span>
          <div>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Coba pita, floral, teddy…"
            />
          </div>
        </label>
        <label>
          <span>Koleksi</span>
          <select value={collection} onChange={(e) => setCollection(e.target.value)}>
            <option value="">Semua koleksi</option>
            {collectionNames.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Format frame</span>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">Semua format</option>
            <option value="strip">Photostrip</option>
            <option value="card">Kartu</option>
          </select>
        </label>
        <label>
          <span>Jumlah foto</span>
          <select value={photoCount} onChange={(e) => setPhotoCount(e.target.value)}>
            <option value="">Semua jumlah</option>
            {[2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} foto
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="gallery-bar">
        <div className="filters" aria-label="Kategori frame">
          {categories.map(([id, name]) => (
            <button
              key={id}
              className={`filter ${category === id ? 'active' : ''}`}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {name}
            </button>
          ))}
        </div>
        <span className="gallery-count" aria-live="polite" aria-atomic="true">
          <SlidersHorizontal size={16} />
          {visible.length} frame
        </span>
      </div>
      <div className="library-summary">
        <span>
          {visible.length} dari {frames.length} frame
        </span>
        {filtered && (
          <button className="text-button" onClick={resetFilters}>
            Reset filter
          </button>
        )}
      </div>
      <div className="frame-grid">
        {visible.map((f, i) => (
          <button
            key={f.id}
            className={`frame-card ${activeId === f.id ? 'selected' : ''}`}
            aria-label={`Pakai frame ${f.name}`}
            onClick={() => onSelect(f)}
          >
            <div
              className={`frame-art art-${f.id}`}
              style={f.collection ? { background: `${f.palette.secondary}55` } : undefined}
            >
              <span className="frame-number">{String(frames.indexOf(f) + 1).padStart(2, '0')}</span>
              <img
                src={f.thumbnail}
                alt={`Contoh ${f.name} dengan ${f.slots.length} ilustrasi foto`}
                loading={i < 4 ? 'eager' : 'lazy'}
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden';
                }}
              />
              {activeId === f.id && (
                <span className="selected-badge">
                  <Check size={14} />
                  Dipilih
                </span>
              )}
            </div>
            <div className="frame-caption">
              <div>
                <h2>{f.name}</h2>
                <p>
                  {f.slots.length} foto <span>·</span>{' '}
                  {f.format === 'strip' ? 'Photostrip' : 'Kartu'}
                </p>
              </div>
              <span className="frame-arrow">
                <ArrowUpRight size={21} />
              </span>
            </div>
          </button>
        ))}
      </div>
      {visible.length === 0 && (
        <div className="library-empty">
          <h2>Frame belum ketemu.</h2>
          <p>Coba kata lain atau reset filter untuk melihat semua frame.</p>
        </div>
      )}
      <p className="gallery-note">
        Contoh frame memakai ilustrasi orisinal. Hasilmu akan memakai foto yang kamu pilih.
      </p>
    </main>
  );
}
