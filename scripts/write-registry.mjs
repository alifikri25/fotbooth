import fs from 'node:fs/promises';
import { definitions } from '../src/frames/definitions.ts';
const rows = definitions
  .map(
    (f) =>
      `| ${f.name} | ${f.id} | ${f.collection ?? 'Original collection'} | ${f.format} | ${f.slots.length} |`,
  )
  .join('\n');
await fs.writeFile(
  'docs/FRAME-REGISTRY.md',
  `# Registry ${definitions.length} frame Fotbooth\n\nKatalog aktif: **60 frame** — 16 frame sebelumnya dan 44 edisi dekoratif dari 26 tema baru. Beberapa tema punya lebih dari satu komposisi; ini bukan klaim 60 tema independen. Batas katalog mengikuti permintaan terakhir pengguna. Paket yang tidak dipakai diarsipkan lokal dan tidak ikut source/public build.\n\nSetiap paket versi 1 berisi manifest, background SVG, foreground SVG dan thumbnail PNG hasil renderer aplikasi. Strip: 1200×3600; card: 1800×2700. Mask foto valid dan luas foto minimal 55%. Artwork baru memiliki mask tambahan agar dekorasi tidak menutupi interior foto atau area judul/caption/tanggal.\n\n| Frame | ID | Koleksi | Format | Foto |\n| --- | --- | --- | --- | --- |\n${rows}\n\n## Lisensi dan referensi\n\nArtwork SVG dan ilustrasi contoh dibuat orisinal untuk Fotbooth, dengan deklarasi CC0-1.0 pada manifest. Font DM Sans dan Fraunces memakai SIL Open Font License 1.1; salinan lisensi ada di public/fonts.\n\nReferensi gaya yang diperiksa: [Canva photo strip](https://www.canva.com/templates/s/photo-strip/?continuation=150) dan [photo booth](https://www.canva.com/templates/s/photo-booth/?continuation=150). Referensi mencakup pita, floral denim, collage scrapbook, checker, karakter ilustratif dan film analog. Tidak ada file template atau aset Canva yang disalin ke paket.\n\n## Bukti visual\n\n- [Board 12 pilihan dekoratif](qa/decorated-design-board.png)\n- [Contact sheet seluruh 60 frame](qa/frame-contact-sheet.png)\n- [Daftar thumbnail yang dihasilkan](qa/library-generation.json)\n\nRegenerasi: npm run assets:build, kemudian npm run qa:frames dengan dev server aktif.\n`,
);
