import fs from 'node:fs/promises';
import { definitions } from '../src/frames/definitions.ts';
import { maximalistIds } from '../src/frames/maximalist.ts';
import { mixedIds } from '../src/frames/mixed.ts';
const versions = Object.entries(
  definitions.reduce((counts, frame) => {
    counts[frame.version] = (counts[frame.version] ?? 0) + 1;
    return counts;
  }, {}),
)
  .map(([version, count]) => `${count} paket v${version}`)
  .join(', ');
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
const mixedThemes = definitions
  .filter((f) => mixedIds.includes(f.id))
  .map((f) => '- **' + f.name + '**: ' + f.description)
  .join('\n');
await fs.writeFile(
  'docs/FRAME-REGISTRY.md',
  '# Registry ' +
    definitions.length +
    ' frame Fotbooth\n\nKatalog aktif: **120 frame**. Tambahan lokal 16 Oktober 2026 berisi 40 tema Mixed Moments dengan empat foto dan empat bentuk berbeda dalam satu frame. Delapan puluh definisi sebelum penambahan tetap dipertahankan. Revisi sebelumnya hanya mengganti 9 layout dengan dua kolom foto yang panjang sempit ke bawah, seperti Aquarium Parade. Kolom tersebut disusun ulang menjadi potongan lebar berselang. 71 frame lama dengan jendela persegi, landscape dan layout campuran, serta tiga preset room, tetap sama seperti semula. Katalog memakai ' +
    versions +
    '. Seluruh aset terdahulu dipertahankan untuk sesi yang sudah terbuka.\n\nSetiap paket berisi manifest, background SVG, foreground SVG dan thumbnail PNG hasil renderer aplikasi. Strip: 1200×3600; kartu: 1800×2700. Kontur yang sama dipakai di kamera, editor dan hasil unduhan. Luas mask foto aktual minimal 40% untuk 49 paket yang memakai potongan bebas; 71 paket lama tetap memakai batas 55%. Judul, caption dan tanggal berada di luar area foto. Semua thumbnail galeri mempunyai jendela foto netral tanpa orang.\n\n## Mixed Moments\n\nEmpat bentuk berbeda per frame; 27 kartu dan 13 strip. Setiap tema memiliki ilustrasi SVG orisinal yang terpisah. [Lihat 40 desain](qa/mixed-moments-board.png).\n\n' +
    mixedThemes +
    '\n\n## Festival Editions\n\n' +
    themes +
    '\n\nMaterial terpisah dibuat untuk setiap tema dengan tool ImageGen bawaan. File asli, JPEG web dan prompt disimpan pada artwork/originals, artwork/materials dan [provenance Festival Editions](../artwork/provenance/festival-materials-20261007.json). Komposisi foto, rim, label dan caption memakai SVG/canvas native. Bahan strip diulang pada proporsi aslinya, tanpa meregangkan objek cetak.\n\n## Paket lengkap\n\n| Frame | ID | Koleksi | Format | Foto |\n| --- | --- | --- | --- | --- |\n' +
    rows +
    '\n\n## Lisensi dan sumber\n\nKomposisi SVG orisinal untuk Fotbooth. Empat belas material signature terdahulu dan 20 material festival dibuat memakai ImageGen bawaan; tidak memakai file template atau foto pengguna. DM Sans dan Fraunces memakai SIL Open Font License 1.1, dengan salinan lisensi di public/fonts.\n\n## Bukti visual\n\n- [Dua puluh frame Festival Editions](qa/festival-design-board.png)\n- [Contact sheet seluruh katalog](qa/frame-contact-sheet.png)\n- [Daftar hasil generator](qa/library-generation.json)\n\nRegenerasi: npm run assets:build, lalu npm run qa:frames dengan dev server aktif, lalu node scripts/write-registry.mjs.\n',
);
