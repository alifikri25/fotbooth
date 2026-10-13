import fs from 'node:fs/promises';
import { definitions } from '../src/frames/definitions.ts';
import { maximalistIds } from '../src/frames/maximalist.ts';
const rows = definitions
  .map(
    (f) =>
      '| ' +
      f.name +
      ' | ' +
      f.id +
      ' | ' +
      (f.collection ?? 'Original collection') +
      ' | ' +
      f.format +
      ' | ' +
      f.slots.length +
      ' |',
  )
  .join('\n');
const themes = definitions
  .filter((f) => maximalistIds.includes(f.id))
  .map((f) => '- **' + f.name + '**: ' + f.description)
  .join('\n');
await fs.writeFile(
  'docs/FRAME-REGISTRY.md',
  '# Registry ' +
    definitions.length +
    ' frame Fotbooth\n\nKatalog aktif: **80 frame**. Dua puluh tema Festival Editions ditambahkan pada 60 frame sebelumnya sesuai permintaan 7 Oktober 2026. Katalog memakai 20 paket baru v1, 18 desain signature v3, serta 42 edisi v2. Seluruh aset terdahulu dipertahankan untuk sesi yang sudah terbuka.\n\nSetiap paket berisi manifest, background SVG, foreground SVG dan thumbnail PNG hasil renderer aplikasi. Strip: 1200×3600; kartu: 1800×2700. Luas mask foto minimal 55%; judul, caption dan tanggal berada di luar area foto. Semua thumbnail galeri mempunyai jendela foto netral tanpa orang.\n\n## Festival Editions\n\n' +
    themes +
    '\n\nMaterial terpisah dibuat untuk setiap tema dengan tool ImageGen bawaan. File asli, JPEG web dan prompt disimpan pada artwork/originals, artwork/materials dan [provenance Festival Editions](../artwork/provenance/festival-materials-20261007.json). Komposisi foto, rim, label dan caption memakai SVG/canvas native. Bahan strip diulang pada proporsi aslinya, tanpa meregangkan objek cetak.\n\n## Paket lengkap\n\n| Frame | ID | Koleksi | Format | Foto |\n| --- | --- | --- | --- | --- |\n' +
    rows +
    '\n\n## Lisensi dan sumber\n\nKomposisi SVG orisinal untuk Fotbooth. Empat belas material signature terdahulu dan 20 material festival dibuat memakai ImageGen bawaan; tidak memakai file template atau foto pengguna. DM Sans dan Fraunces memakai SIL Open Font License 1.1, dengan salinan lisensi di public/fonts.\n\n## Bukti visual\n\n- [Dua puluh frame Festival Editions](qa/festival-design-board.png)\n- [Contact sheet seluruh katalog](qa/frame-contact-sheet.png)\n- [Daftar hasil generator](qa/library-generation.json)\n\nRegenerasi: npm run assets:build, lalu npm run qa:frames dengan dev server aktif, lalu node scripts/write-registry.mjs.\n',
);
