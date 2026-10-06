# Handoff Web Photobooth — 6 Oktober 2026

## Status aktif: 60 frame dan repository public

Pengguna membatasi katalog menjadi **maksimal 60 frame total**, menggantikan permintaan 302. Hasilnya 16 frame sebelumnya ditambah 44 edisi dekoratif dari 26 tema baru. Semua 60 paket aktif ada di `public/frames` dan `src/frames/manifests`; 242 paket berlebih diarsipkan lokal ke `.frame-archive`, tidak ikut repository atau build.

Dekorasi SVG orisinal meliputi pita, floral, scrapbook, denim, film analog, kerang, botanical, teddy, disko, piknik dan acara. Referensi galeri Canva telah diperiksa secara visual; tidak ada aset Canva yang disalin. Pencarian nama/deskripsi serta filter kategori, koleksi, format dan jumlah foto tersedia. Board pilihan, lima halaman contact sheet dan screenshot desktop/mobile telah diperiksa; caption gelap serta bayangan dekorasi diperbaiki.

Repository public: https://github.com/alifikri25/fotbooth, branch `main`. Publikasi Cloudflare diminta **nanti**. Konfigurasi Pages, script deploy, Node version dan CI sudah disiapkan; belum ada deployment atau domain produksi. Panduan: `docs/DEPLOY-CLOUDFLARE.md`.

Source dan artwork telah dipush: initial commit `3c0e4f2` cocok dengan remote `main`. Halaman GitHub menampilkan repository public, source dan README 60 frame; screenshot bukti `docs/qa/github-repository.jpg`. Commit dokumentasi berikutnya menutup checklist ini.

Pemeriksaan terbaru: **41 unit test dan build lulus; 58 browser test lulus, 2 skip kamera sintetis WebKit, 0 gagal, durasi 3,2 menit**. Runtime lokal Cloudflare memuat seluruh 60 thumbnail dan 180 URL aset; pencarian, upload, caption serta unduh PNG/JPEG ringan berhasil dan file hasil dibuka ulang pada 600×1800. Lihat `docs/qa/cloudflare-local-smoke.json` dan `docs/QA.md`.

Uji paket produksi menemukan Ajv runtime melakukan code generation yang ditolak CSP. Validator sekarang dibuat saat build melalui `scripts/build-schema.mjs`; hasil standalone disertakan di source. Header keamanan tetap ketat. Regresi `production-csp.spec.ts` memuat paket `dist` memakai header sebenarnya dan lulus pada Chromium/WebKit.

Rencana aktif: `docs/superpowers/plans/2026-10-06-60-decorated-frames.md`. Dev server localhost:5173 tetap tersedia untuk review. Pengujian HP, kamera fisik, pengguna dan HTTPS produksi masih belum terverifikasi; hasil otomatis lokal tidak menggantikannya.

## Catatan historis: koleksi 16 frame sebelum perluasan

Permintaan terbaru: **tambah frame lucu, modern, kartun/dynamic dan cek referensi Canva**. Sudah ditambahkan delapan desain orisinal: Mochi Party, Kitty Club, Comic Dash, Froggy Day, Candy Bounce, Space Pals, Monster Moods, Peach Picnic. Total 16; koleksi baru tampil pertama, filter Cartoon (8) dan Dynamic (4) tersedia. Referensi Canva diperiksa lewat pencarian dan tampilan template pop ilustratif; tidak mengimpor aset Canva.

`scripts/cartoon-art.mjs` menghasilkan karakter/stiker SVG; generator menambahkan bingkai berlapis dan mask dekorasi untuk menjaga seluruh interior foto. `src/frames/schema.json` menerima kategori baru. Delapan definisi lama tetap di awal `definitions`, sementara urutan katalog baru disetel terpisah. Contact sheet kini mengikuti jumlah frame; bukti khusus di `docs/qa/cartoon-contact-sheet.png`.

Verifikasi terbaru setelah penambahan: **40 unit test + build lulus; 52 browser test lulus, 2 skip WebKit, 0 gagal/flaky**, mulai 15:46:24 Asia/Bangkok, 92,7 detik. Semua 16 paket diperiksa untuk thumbnail/aset, interior foto dan dimensi PNG/JPEG standar/ringan. Landmark horizontal/vertikal memakai fixture batas warna terpisah dari grid, menghindari scan yang hampir sejajar dengan seam; 20–48 sampel per frame, selisih maksimal 1 px. Sumber grid tetap menguji interior stabil. Lihat rencana `docs/superpowers/plans/2026-10-06-cartoon-frame-expansion.md`.

Kandidat terbaru: `docs/qa/fotbooth-cartoon-candidate-20261006.zip`, 76 entri diverifikasi terhadap build, checksum `cartoon-candidate.json`, SHA-256 `fdc7e40bd1b24d97e224859f126cdb1ecb02213e66f1cc5284ba0dd13cef94fa`. Kandidat 44 file/delapan frame di bawah tetap bukti historis. Audit resource/performa lama tidak diulang untuk perluasan koleksi; batas perangkat nyata/HTTPS tetap berlaku.

Pengguna meminta **“lanjutkan”** pada 6 Oktober 2026. Permintaan berhenti sebelumnya sudah dicabut. Verifikasi lokal dan dokumentasi QA telah dilanjutkan; tidak ada deployment publik.

- Workspace: `C:\fotbooth`, Windows/PowerShell; belum menjadi repository Git, belum ada commit/remote/PR.
- Dev server tersedia di `http://127.0.0.1:5173/` untuk review lokal. Server memakai sesi terminal Codex yang dapat dihentikan; jangan hentikan hanya karena membaca handoff.
- Tidak ada automation, subagent, atau browser sintetis tes yang sengaja ditinggalkan berjalan. Setiap browser audit ditutup dalam `finally`.
- **40 unit test, TypeScript dan build lulus. Suite lengkap Chromium/WebKit terbaru: 52 lulus, 2 skip kamera sintetis WebKit, 0 gagal/flaky.**
- **Rilis PRD belum selesai:** perangkat/browser wajib, kamera fisik, uji manusia, staging HTTPS/produksi dan rollback belum terverifikasi.

Permintaan awal: kerjakan `PRD-Web-Photobooth.md` secara bertahap, jangan terburu-buru, dan cek/test setiap task selesai. Pertahankan pendekatan satu tahap dengan pemeriksaan sebelum lanjut.

## Baca terlebih dahulu

1. File ini dan `docs/QA.md` untuk status serta matriks AC aktual.
2. `PRD-Web-Photobooth.md` sebagai sumber kebutuhan; checklist Definition of Done belum dicentang untuk produksi.
3. `docs/superpowers/plans/2026-10-06-photobooth.md`; checklist tugas lokal telah disinkronkan, bukan bukti M7–M8 selesai.
4. `README.md`, `docs/FRAME-REGISTRY.md`, `docs/RELEASE.md`.

Instruksi pengguna `AGENTS.md` merujuk `@RTK.md`. Tidak ada RTK lokal; instruksi global berada di `C:\Users\aliif\.claude\RTK.md` dan sudah dibaca. RTK 0.42.3 tersedia. Skill kelanjutan: systematic-debugging, test-driven-development, verification-before-completion. Writing-plans juga dipakai pada sesi implementasi awal.

## Pekerjaan kelanjutan yang selesai

### Diagnosis tes kamera

Kegagalan lama `Expected 2/8 foto; Received 1/8 foto` direproduksi: satu dari tiga pengulangan gagal. Tes menunggu `1/3 terisi` sesudah retake, tetapi hitungan slot tidak berubah pada retake. Assertion langsung lolos saat encoding belum selesai; `pagehide` kemudian membatalkan capture sebelum foto baru masuk, sesuai lifecycle produk.

Memperlambat callback encoder asli 250 ms mereproduksi kegagalan. Tes diperbaiki dengan menunggu tombol “Lanjut edit” aktif setelah encoding/ingest selesai sebelum `pagehide`. Lima pengulangan lalu lulus, termasuk callback lambat; suite penuh terbaru juga lulus. Timeout tidak dinaikkan. Browser tes kini ditutup dalam `finally`.

Diagnosis kamera tidak memerlukan perubahan controller/ingest. Jangan memaksakan foto capture yang sudah dibatalkan agar masuk sesi. Perubahan produk berikutnya terbatas pada ukuran kontrol di `src/styles.css`, sesuai hasil tes aksesibilitas.

### Coverage dan bukti tambahan

- `tests/e2e/camera.spec.ts`: penolakan izin → unggah seluruh slot → unduh; rangkaian kamera penuh → ambil ulang slot kedua → PNG/JPEG standar. Hash piksel/crop/mirror slot lain tetap dan foto lama masih tersedia.
- `tests/e2e/flow.spec.ts`: alur Tab/keyboard dari beranda sampai unduh pada 360 dan 1440 px, termasuk slot/foto, zoom/pan dan caption.
- `tests/e2e/accessibility.spec.ts`: target kontrol minimal 44 px dan kontras teks UI pada latar datar minimal 4,5:1, di 360/1440 px pada dua engine. Lima ukuran CSS lama di bawah batas telah diperbaiki setelah tes gagal; kontras minimum terukur 5,216:1. Kamera ditolak dan dialog termasuk audit; teks dekoratif di atas gambar/gradien, kontrol nonaktif dan pembaca layar tidak tercakup.
- `tests/e2e/geometry-parity.spec.ts`: sampel batas warna broad di ruang desain dibandingkan dua arah antara original 4031 × 3023 dan bitmap 1600 × 1200. 16 frame, 20–48 sampel per frame, selisih maksimum 1 px desain; data `docs/qa/geometry-{chromium,webkit}.json`. Garis grid tipis/occluded dikecualikan, jadi ini bukan klaim semua piksel antialias sama.
- `scripts/measure-resources.mjs`: 10 siklus per engine dalam dokumen yang sama, empat PNG 2400 × 3200, ganti frame 4→2→4, edit, ekspor PNG standar, decode file, dan clear. Setiap clear: Object URL 0, ImageBitmap 0. Ini bukan profiling heap/GPU/perangkat HP.
- `scripts/render-catalog.mjs`: PNG/contact sheet standar, ringan, serta detail caption 40 karakter/tanggal/contain/rotasi/mirror. Ketiga contact sheet dan screenshot UI terbaru sudah diperiksa. 16 thumbnail katalog identik dengan hasil build.
- `docs/QA.md` dibuat, berisi AC-01–AC-24, hasil terbaru, diagnosis kamera, resource/performa, dan gate yang tertunda. README dan rencana diperbarui.
- `docs/qa/fotbooth-local-candidate-20261006.zip`: arsip build lokal, 44 file diverifikasi terhadap build; SHA-256 arsip/file di `candidate.json`. Belum dideploy.
- Clear sesi saat kamera sintetis aktif kini diuji; seluruh track berakhir setelah konfirmasi clear.

## Fitur produk yang sudah tersedia

- Beranda → galeri 16 frame → sumber foto → kamera/editor → hasil/unduh; bantuan/privasi, konfirmasi clear, fokus dialog dan error boundary.
- Input JPEG/PNG/WebP berdasarkan isi file, 20 MB/24 MP per file, 8 foto, decode serial dan EXIF 1–8. Original Blob dipertahankan; preview ≤1600 px dan thumbnail terpisah.
- Slot auto-fill/reuse/swap; cover/contain, pan/zoom 1–3, rotasi 90°, mirror, reset, caption 40 grapheme, tanggal kalender dan history 30 langkah.
- Cache per versi frame/slot; 4→2→4 memulihkan crop jika mapping foto sama dan menjaga foto surplus.
- Satu renderer canvas: background → foto clipped → foreground → teks/tanggal; preview/ekspor menggunakan geometri original ternormalisasi.
- Ekspor immutable snapshot, satu job, PNG/JPEG quality 0.92, standar/ringan tanpa DPR, original decode sequential dan cleanup.
- Kamera video saja setelah klik; timer 0/3/5/10, single/burst/cancel/retake, mirror/perangkat; stop saat exit/pagehide/hidden/switch/late response.
- Delapan frame awal (ditambah delapan kartun pada status terbaru di atas): Orbit Club, Bubble Pop, Studio Notes, Concert Pass, Pocket Arcade, Sticker Rush, Cloud Windows, Gallery Issue. Schema dan validator memeriksa geometri/bounds/luas/path/version; font/aset lokal berlisensi.
- Foto/caption tidak dikirim atau disimpan otomatis. Clear melepas foto/history/output; sumber hanya di memori tab.

## Bukti terbaru

| Pemeriksaan | Hasil / lokasi |
|---|---|
| `npm run check` | 40/40 unit test dalam 9 file; TypeScript/build lulus |
| Full Chromium/WebKit | 54 dijadwalkan, 52 lulus, 2 skip; `docs/qa/browser-results.json` dan `playwright-report/index.html` |
| Firefox ulang | Tes renderer tidak mulai karena `browserType.launch: spawn UNKNOWN`; `docs/qa/firefox-results.json` |
| Resource | 10/10 siklus per engine, 20 output 1800 × 2700 valid, clear 0 URL/bitmap; `docs/qa/resource-cycles.json` |
| Visual | Contact sheet standar/ringan/detail, 16 PNG tiap variasi, screenshot desktop/mobile terbaru |
| Performa dari sesi sebelumnya | `docs/qa/performance.json`: 20/20 PNG dan 20/20 JPEG per engine, empat foto 12.185.713 px; PNG/JPEG p95 Chromium 125/131 ms, WebKit 632/597 ms |

Browser otomatis: Chromium 153.0.8010.12, WebKit 26.6; Node 24.14.1/npm 11.11.0, Windows 11 Pro 10.0.26200/RAM 15,6 GB. Host bukan perangkat referensi PRD. Performa lama tidak diulang; pipeline decode/renderer/ekspor tetap sama, perbaikan produk hanya CSS. Preview render terisolasi bukan frame time gesture.

Tes capture sintetis hanya Chromium; penolakan izin/unggah/unduh juga lulus di WebKit. Jangan mengklaim kamera fisik, Chrome/Edge stabil, Safari iOS, atau Firefox lulus.

## Peta file penting

| Lokasi | Peran |
|---|---|
| `src/App.tsx` | Navigasi, sesi/history, ingest, dialog, URL hasil |
| `src/components/Camera.tsx`, `src/core/camera.ts` | Timer/burst/retake dan lifecycle kamera |
| `src/components/Editor.tsx`, `Preview.tsx` | Kontrol crop, gesture/hit-testing, preview asynchronous |
| `src/core/session.ts`, `geometry.ts`, `renderer.ts` | State immutable, geometri dan renderer bersama |
| `src/core/ingest.ts`, `resources.ts`, `export.ts`, `text.ts` | Decode/resource, ekspor, teks/font |
| `src/frames` dan `public/frames` | Schema, definisi, validasi dan manifest/aset terversi |
| `scripts` | Build aset, render katalog, screenshot, pengukuran performa/resource |
| `tests/unit`, `tests/e2e` | Perilaku dan regresi yang dapat dijalankan ulang |
| `public/_headers` | Header untuk host yang mendukung formatnya; origin publik belum diverifikasi |

## Perbaikan penting yang harus dipertahankan

- Geometri preview memakai dimensi original ternormalisasi, bukan dimensi bitmap kecil yang dibulatkan.
- Patch gesture tidak mereset zoom bila rotasi/mirror tidak berubah; pan kanan telah diverifikasi melalui piksel.
- Fokus dialog kembali ke trigger eksplisit untuk WebKit.
- `pagehide` menghentikan kamera tanpa bergantung pada visibility state; membuka lagi membutuhkan interaksi.
- Microtask permintaan kamera dapat dibatalkan pada StrictMode; Vite memakai polling 200 ms untuk Windows.
- Manifest bundler berada di `src/frames/manifests`; original sequential dilepas pada `finally` setelah ekspor.
- Tes retake harus menunggu completion; progres slot tetap sama sebelum/sesudah retake.

## Cara menjalankan

```powershell
npm run dev
npm run check
npm run test:e2e
npx playwright test camera --project=chromium --grep 'real browser' --repeat-each=5
npm run test:e2e:firefox
npm run assets:build
npm run qa:frames
npm run qa:ui
node scripts/measure-resources.mjs
node scripts/measure-performance.mjs
```

Skrip QA membutuhkan server 5173. `npm ci` hanya jika dependency perlu dipasang ulang. Versi terkunci dalam `package-lock.json`; engine Node `^22.12.0 || ^24.0.0 || >=26.0.0`. Jangan menjalankan `assets:build` tanpa `qa:frames` setelahnya karena thumbnail katalog perlu dirender kembali.

## Urutan berikutnya

1. Pemeriksaan lokal target kontrol/kontras datar, sampel geometri ≤1 px dan visual caption/tanggal/contain sudah tersedia. Review kontras dekorasi di atas gambar/gradien dan pembaca layar pada perangkat target belum dilakukan.
2. Uji matriks browser/perangkat nyata: Android RAM 4 GB, iPhone 13/setara, Windows RAM 8 GB; kamera fisik, file HP, switching/background, clear kamera aktif, download/save fallback, performa dan profil memori. Isi model/OS/browser/tanggal nyata di QA.
3. Review pemilik desain dan uji 10 peserta sesuai PRD. Bukti ilustrasi/screenshot tidak menggantikan persetujuan maupun usability manusia.
4. Pilih staging HTTPS/hosting jika diminta, lalu verifikasi headers/cache/aset dan latihan rollback. Arsip/checksum kandidat lokal sudah tersedia; belum ada domain atau hosting yang dipilih, sehingga jangan mengklaim deployment.
5. Setelah seluruh gate M7–M8 terpenuhi, lakukan smoke produksi laptop dan HP. P1/P2 tetap ditunda: filter, draft, share/cetak, akun/cloud dan frame builder.

Catatan berhenti sebelumnya sudah digantikan oleh status ini. Jangan kembali mendiagnosis kegagalan kamera lama sebagai isu terbuka tanpa reproduksi baru; lihat diagnosis dan bukti terbaru di QA.
