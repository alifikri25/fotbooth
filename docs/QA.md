# QA Web Photobooth — 7 Oktober 2026

## Publikasi dan verifikasi HTTPS

Atas permintaan pengguna pada 7 Oktober 2026, situs sudah dipublikasikan di **https://fotbooth.pages.dev** melalui Cloudflare Pages Direct Upload. [Bukti rilis](qa/cloudflare-public-release.json).

- Pemeriksaan ulang: 41 unit test dan build produksi lulus; browser 58 lulus, 2 skip kamera sintetis WebKit, 0 gagal/flaky, durasi 189,7 detik.
- Preview `360f9f7b.fotbooth.pages.dev` lulus: 60 thumbnail, 180 URL layer/thumbnail, header keamanan, search, unggah 3 foto, caption, result dan unduhan PNG/JPEG ringan yang dibuka kembali pada 600×1800.
- Produksi `fotbooth.pages.dev` lulus dengan cakupan sama pada Chromium 1440 px dan WebKit 360 px; galeri/editor tidak melebar di luar viewport. HTTPS merespons 200, CSP/Permissions-Policy/nosniff dan cache HTML aktif; origin produksi tidak memiliki header noindex preview.
- Deployment produksi `ef45b121-2b33-4102-8773-4d274875b49b` memakai build yang sama dengan preview dan arsip kandidat 252 file; SHA-256 arsip/per-file diverifikasi lokal.
- SSL preview sempat belum siap segera setelah deployment pertama; pemeriksaan TLS kemudian merespons 200 dan smoke lengkap lulus tanpa mengabaikan validasi sertifikat.

Kamera fisik, HP nyata, pembaca layar, performa perangkat referensi, uji manusia dan latihan rollback tetap belum diuji. WebKit 360 px adalah browser otomatis pada Windows, bukan Safari iPhone nyata. Bagian di bawah menyimpan hasil historis sebelum publikasi.

## Verifikasi aktif: katalog 60 frame

Scope terbaru: **60 frame total** (16 sebelumnya + 44 edisi dekoratif dari 26 tema), sesuai batas pengguna. Repository public `alifikri25/fotbooth`; konfigurasi Cloudflare Pages tersedia, belum ada deployment remote.

| Pemeriksaan | Hasil / bukti |
|---|---|
| Unit dan build | 41 unit test lulus, TypeScript dan build produksi lulus |
| Katalog | Tepat 60 ID/nama unik, schema/geometri valid, seluruh frame selectable; 44 edisi dari 26 tema |
| Browser | 60 dijadwalkan: 58 lulus, 2 skip kamera sintetis WebKit, 0 gagal; durasi 3,2 menit |
| PNG/JPEG | Seluruh 60 paket diuji dengan ukuran standar/ringan pada Chromium dan WebKit |
| Foto dan geometri | Foreground tidak menutup interior foto; sampel geometri preview/original maksimal bergeser 1 px desain |
| Library | Search, kategori, koleksi, format, jumlah foto dan reset diuji; Ribbon Diary menampilkan empat edisi |
| Visual | Seluruh 60 frame pada lima contact sheet diperiksa; bayangan, motif, tekstur, caption dan area foto ditinjau |
| Paket Cloudflare lokal | 60 thumbnail dan 180 URL aset berhasil; header CSP/izin kamera, upload, caption dan unduh PNG/JPEG 600×1800 lulus; [bukti](qa/cloudflare-local-smoke.json) |
| CSP produksi | Build `dist` memakai header sebenarnya pada kedua engine; home/library/search/frame dapat dipakai tanpa page error |

Validator schema sebelumnya memakai code generation Ajv di browser, menyebabkan halaman produksi kosong di bawah CSP. `scripts/build-schema.mjs` kini menghasilkan modul validator standalone sebelum test/build; CSP tidak dilonggarkan. Tes regresi terlebih dahulu mereproduksi kegagalan, lalu lulus setelah perbaikan.

[Board pilihan](qa/decorated-design-board.png), [seluruh 60 frame](qa/frame-contact-sheet.png), [galeri desktop](qa/gallery-desktop.png), [galeri mobile](qa/library-mobile.png) dan [registry](FRAME-REGISTRY.md) tersedia. Thumbnail memakai ilustrasi contoh orisinal, bukan foto pribadi.

Kamera fisik, perangkat HP, pembaca layar, keyboard virtual, uji manusia dan HTTPS produksi belum diperiksa. Cloudflare baru diuji melalui runtime lokal. Resource/performa di bawah adalah bukti historis; tidak diulang sebagai profiling seluruh koleksi 60 frame.

## Bukti historis: koleksi 16 frame

Status: pemeriksaan otomatis lokal lulus. **Gate rilis PRD belum selesai** karena matriks perangkat/browser wajib, kamera fisik, uji pengguna, dan staging/produksi HTTPS belum diperiksa. Chromium dan WebKit otomatis pada Windows tidak menggantikan Chrome Android atau Safari iOS.

## Lingkungan dan hasil terbaru

Host: Windows 11 Pro 10.0.26200, RAM 15,6 GB; Node 24.14.1, npm 11.11.0, Playwright 1.63.0. Workspace belum memakai Git; tidak ada commit, remote, atau deployment.

| Pemeriksaan | Hasil | Bukti |
|---|---|---|
| `npm run check` | 40/40 unit test dalam 9 file; TypeScript dan build produksi lulus | `tests/unit`, output build `dist/` |
| Suite Chromium 153.0.8010.12 | 27/27 lulus | [Laporan browser](qa/browser-results.json) |
| Suite WebKit 26.6 | 25 lulus, 2 skip kamera sintetis | [Laporan browser](qa/browser-results.json) |
| Total suite terbaru | 54 dijadwalkan: 52 lulus, 2 skip, 0 gagal, 0 flaky | Mulai 15:46:24 Asia/Bangkok; durasi 92,7 detik |
| Regresi ambil ulang/lifecycle | 5/5 pengulangan lulus dengan callback encoding diperlambat 250 ms | [Tes kamera](../tests/e2e/camera.spec.ts) |
| Firefox | Tes renderer tidak bisa mulai: `browserType.launch: spawn UNKNOWN` | [Laporan Firefox](qa/firefox-results.json); bukan pengujian produk yang lulus |
| Siklus resource | 10/10 per engine; 20 ekspor PNG standar berhasil dibuka ulang | [Audit resource](qa/resource-cycles.json) |
| Geometri | 16 frame per engine, sampel batas warna bergeser maksimal 1 px desain | [Chromium](qa/geometry-chromium.json), [WebKit](qa/geometry-webkit.json) |
| Target/kontras UI | Target kontrol ≥44 px; kontras teks yang diperiksa minimum 5,216:1 pada 360/1440 px | `qa/accessibility-{chromium,webkit}-{360,1440}.json` |
| Visual | 16 frame standar/ringan dan variasi caption 40 karakter/tanggal/contain diperiksa; screenshot UI terbaru | [Standar](qa/frame-contact-sheet.png), [ringan](qa/frame-contact-sheet-light.png), [detail](qa/frame-contact-sheet-details.png), [editor HP](qa/editor-mobile.png) |
| Kandidat lokal | Arsip build dan SHA-256 tiap file tersedia, isi arsip diverifikasi | [Arsip](qa/fotbooth-cartoon-candidate-20261006.zip), [checksum](qa/cartoon-candidate.json) |

Pengujian penuh selesai setelah perubahan ukuran kontrol, tes aksesibilitas/geometri, kamera dan keyboard. Dua skip WebKit adalah skenario capture memakai perangkat sintetis Chromium. Simulasi penolakan izin sampai unggah dan unduh tetap berjalan dan lulus pada kedua engine. Kamera nyata belum diuji.

Pada tahap verifikasi sebelumnya, CSS lama memberi bantuan 20 px, ganti foto 32 px, pilihan crop 42 px, slider 30 px dan hapus sesi 40 px. Tes target sentuh memperlihatkan kegagalan sebelum perbaikan; ukuran kini minimal 44 px dan empat kasus viewport/engine lulus. Coverage tes, audit resource, keluaran visual dan dokumentasi juga dilengkapi. Tidak ada kegagalan pada skenario otomatis akhir; ini belum membuktikan blocker/mayor nol pada matriks rilis wajib.

## Penambahan koleksi kartun

Penambahan koleksi atas permintaan pengguna: delapan desain kartun baru, 16 frame total, filter Cartoon/Dynamic dan urutan galeri baru. Katalog dites sebelum implementasi (dua kegagalan yang diharapkan), lalu lolos setelah seluruh manifest/aset tersedia. Semua 16 frame mengekspor PNG/JPEG standar/ringan dengan ukuran tepat pada kedua engine. Ilustrasi karakter dibuat orisinal setelah memeriksa referensi Canva; lihat [registry](FRAME-REGISTRY.md) dan [koleksi baru](qa/cartoon-contact-sheet.png).

Pengecekan landmark kini memakai sumber batas warna tanpa garis grid, scan horizontal dan vertikal, serta posisi 25/40/60/75%. Scan 50% yang hampir sejajar dengan seam pada panel miring menghasilkan boundary hilang karena lebar antialiasing, meskipun interior stabil identik. Sumber grid tetap menguji interior preview/ekspor secara terpisah. Seluruh frame memiliki 20–48 sampel boundary, tanpa pasangan hilang, maksimum 1 px desain. Batas selisih 1 px tetap dipertahankan.

Arsip terbaru memiliki 76 file yang diverifikasi terhadap `dist/`; checksum ada di `cartoon-candidate.json`. Arsip `fotbooth-local-candidate-20261006.zip` dan `candidate.json` tetap menjadi snapshot historis koleksi delapan frame.

## Diagnosis kegagalan kamera sebelumnya

Kegagalan `Expected 2/8 foto; Received 1/8 foto` muncul lagi dalam 1 dari 3 pengulangan tes lama. Ambil ulang mengganti foto pada slot yang sudah terisi, sehingga teks `1/3 terisi` tidak berubah. Assertion tersebut langsung lolos saat foto pengganti masih di-encode. Event `pagehide` kemudian membatalkan capture yang belum selesai, sesuai lifecycle kamera, sebelum foto kedua masuk sesi.

Callback encoder asli yang diperlambat 250 ms mereproduksi kegagalan yang sama. Tes kini menunggu tombol “Lanjut edit” aktif, yaitu setelah encoding dan ingest selesai, sebelum memicu `pagehide`. Kelima pengulangan dan suite penuh kemudian lulus. Browser sintetis ditutup dalam `finally` termasuk ketika assertion gagal; timeout tidak dinaikkan.

Coverage tambahan: rangkaian mengisi seluruh slot; ambil ulang slot kedua menghasilkan foto baru dan mempertahankan piksel/crop slot pertama dan ketiga; mirror hanya berubah pada foto pengganti; hasil kamera PNG/JPEG standar dibuka ulang dengan ukuran 1200 × 3600. Tes keyboard memakai Tab dan tombol keyboard dari beranda sampai unduh, termasuk slot/foto, zoom, pan, dan caption pada lebar 360 dan 1440 px.

Audit geometri membandingkan sampel batas wilayah merah/hijau/biru pada ukuran desain yang sama, memakai sumber original 4031 × 3023 versus bitmap 1600 × 1200 dengan dimensi logis original. Jarak diukur dua arah; 20–48 sampel per frame, maksimum 1 px. Garis grid tipis yang kehilangan ketajaman saat resampling dan batas yang tertutup garis grid tidak dipakai sebagai landmark. Pemeriksaan ini mengukur sampel geometri, tidak menyatakan seluruh piksel antialias identik.

Audit aksesibilitas memeriksa beranda, galeri, sumber, kamera ditolak, editor, hasil, dan dialog clear pada 360/1440 px. Checkbox dinilai lewat target label. Kontras dihitung untuk teks UI pada latar datar yang dapat ditentukan dari CSS; kontrol nonaktif dan teks dekoratif di atas gambar/gradien dikecualikan. Pembaca layar, sentuh dan keyboard virtual pada perangkat nyata tetap pending.

## Matriks acceptance criteria PRD

**Lokal** berarti skenario terkait lulus pada automation host, dengan batas di kolom terakhir. Semua AC tetap memerlukan matriks perangkat/browser wajib sebelum gate rilis dicentang. **Parsial** menunjukkan batas tambahan pada bukti lokal.

| ID | Bukti lokal yang tersedia | Status / batas |
|---|---|---|
| AC-01 | `catalog`, `frames` unit; `catalog.spec`; thumbnail dan contact sheet 16 frame | Lokal; review pemilik atas variasi/finalisasi desain belum dilakukan |
| AC-02 | `geometry` unit: cover, clamp dan rasio; grid asimetris pada seluruh frame; editor pan | Lokal; fixture HP dan matriks perangkat wajib pending |
| AC-03 | `geometry` unit: contain/matte; pixel assertion `renderer.spec`; tombol contain/zoom pada alur keyboard | Lokal |
| AC-04 | Pixel circle/clip; seluruh path pada `geometry-parity.spec`; interior foreground pada `catalog.spec` | Lokal; pemeriksaan tepi visual tidak mengukur setiap piksel mask |
| AC-05 | Drag/resize `editor.spec`; viewport 360/768/1024/1440 pada `reliability.spec` | Lokal; rotasi perangkat fisik pending |
| AC-06 | DPR 1/2/3 pada `geometry-parity.spec`; ukuran standar/ringan kanonis | Lokal |
| AC-07 | `session` unit dan alur 4→2→4 pada `flow.spec`, crop dan foto surplus pulih | Lokal |
| AC-08 | Izin ditolak → unggah 3 foto → hasil → unduh PNG tanpa reload pada `camera.spec` | Lokal pada kedua engine; izin browser fisik pending |
| AC-09 | Countdown/rangkaian dibatalkan; tidak ada capture setelah timer berlalu; foto pertama tetap tersedia | Lokal, capture sintetis Chromium |
| AC-10 | Ambil ulang slot kedua; hash piksel slot lain, zoom/contain dan mirror tetap; foto lama di daftar | Lokal, capture sintetis Chromium; unit session juga lulus |
| AC-11 | JPEG EXIF 1–8 dengan pemeriksaan orientasi pada jalur bitmap dan HTML fallback; mirror camera/editor | Parsial: fixture sintetis, foto asli HP/perangkat wajib pending |
| AC-12 | `renderer.spec`, grid asimetris seluruh frame, retake mirror dan kontrol editor | Lokal |
| AC-13 | Mixed batch, batas kapasitas, input rusak; ingest baru diterapkan sesudah decode | Lokal; penggantian gagal dan edit dipertahankan juga diperiksa lewat kode/unit |
| AC-14 | Slot belum lengkap menonaktifkan hasil; panduan slot kosong tersedia | Lokal |
| AC-15 | PNG/JPEG standar/ringan untuk 16 frame didecode; dimensi diperiksa pada alur unduh, DPR dan performance | Lokal; 20 percobaan per kombinasi perangkat wajib pending |
| AC-16 | Renderer bersama; grid preview/ekspor dan jarak sampel batas warna ≤1 px desain di 16 frame dengan rotasi/mirror/contain | Lokal; sampel geometri dan interior stabil, bukan seluruh raster antialias |
| AC-17 | Batas 40 grapheme, plain text; unit fitting menolak overflow; caption panjang/tanggal pada katalog | Lokal; glyph emoji tidak dijamin sesuai batas produk |
| AC-18 | History metadata, 30 langkah, drag satu langkah, frame switch dan undo pada unit/editor/flow | Lokal |
| AC-19 | `editor.spec`: render frame lama yang terlambat tidak menimpa pilihan terbaru | Lokal |
| AC-20 | Countdown cancel dan late stream pada unit; pagehide/visibility hidden/exit melepas track sintetis | Lokal; background/switch kamera nyata Android/iOS pending |
| AC-21 | Clear menghapus sesi/history/output; URL/ImageBitmap kembali 0; clear saat kamera sintetis aktif melepas track | Lokal; kamera fisik tetap pending |
| AC-22 | Alur lokal mengirim GET saja, tanpa payload foto/caption; aset/font lokal | Lokal; audit request dan header origin produksi pending |
| AC-23 | Beranda → frame → file chooser → slot/foto → crop/zoom/caption → unduh memakai keyboard saja, 360/1440 px | Lokal; sentuh, pembaca layar dan keyboard virtual pada HP nyata pending |
| AC-24 | Encoding gagal → caption/edit tetap → pilih ukuran ringan → unduh ulang berhasil | Lokal |

Tes berada di [unit](../tests/unit) dan [browser](../tests/e2e). Matriks ini mencatat cakupan, bukan klaim semua AC sudah diterima untuk produksi.

## Frame, input dan visual

| Frame | Slot / bentuk | Format | Bukti PNG |
|---|---|---|---|
| Orbit Club | 3: capsule, circle | Strip | [Standar](qa/orbit-club.png) / [ringan](qa/orbit-club-light.png) |
| Bubble Pop | 3: rounded | Strip | [Standar](qa/bubble-pop.png) / [ringan](qa/bubble-pop-light.png) |
| Studio Notes | 3: hero + 2 asimetris, rotasi | Kartu | [Standar](qa/studio-notes.png) / [ringan](qa/studio-notes-light.png) |
| Concert Pass | 2: portrait + pendek | Strip | [Standar](qa/concert-pass.png) / [ringan](qa/concert-pass-light.png) |
| Pocket Arcade | 4: chamfer | Strip | [Standar](qa/pocket-arcade.png) / [ringan](qa/pocket-arcade-light.png) |
| Sticker Rush | 3: rounded bergeser | Strip | [Standar](qa/sticker-rush.png) / [ringan](qa/sticker-rush-light.png) |
| Cloud Windows | 3: arch + rounded | Strip | [Standar](qa/cloud-windows.png) / [ringan](qa/cloud-windows-light.png) |
| Gallery Issue | 4: hero + 3 tile | Kartu | [Standar](qa/gallery-issue.png) / [ringan](qa/gallery-issue-light.png) |
| Mochi Party | 3: rounded, radius berbeda | Strip | [Standar](qa/mochi-party.png) / [ringan](qa/mochi-party-light.png) |
| Kitty Club | 3: rounded, +2°/−2° | Strip | [Standar](qa/kitty-club.png) / [ringan](qa/kitty-club-light.png) |
| Comic Dash | 3: hero + 2 portrait, rotasi | Kartu | [Standar](qa/comic-dash.png) / [ringan](qa/comic-dash-light.png) |
| Froggy Day | 2: arch + rounded tinggi | Kartu | [Standar](qa/froggy-day.png) / [ringan](qa/froggy-day-light.png) |
| Candy Bounce | 4: rounded bertingkat, rotasi | Strip | [Standar](qa/candy-bounce.png) / [ringan](qa/candy-bounce-light.png) |
| Space Pals | 3: chamfer + rounded + chamfer | Strip | [Standar](qa/space-pals.png) / [ringan](qa/space-pals-light.png) |
| Monster Moods | 4: grid asimetris, mask berbeda | Kartu | [Standar](qa/monster-moods.png) / [ringan](qa/monster-moods-light.png) |
| Peach Picnic | 3: hero + rounded/arch kecil | Kartu | [Standar](qa/peach-picnic.png) / [ringan](qa/peach-picnic-light.png) |

Semua paket melewati validator geometri/luas mask, pemuatan thumbnail/aset/font, sampel alpha interior foreground, serta render/decode PNG/JPEG standar dan ringan. Contact sheet detail memuat caption 40 karakter, tanggal aktif, contain/cover, rotasi dan mirror pada semua frame dan sudah diperiksa. Persetujuan pemilik desain masih pending. Lisensi dan review variasi internal ada di [registry](FRAME-REGISTRY.md).

Input yang diuji: JPEG/PNG/WebP, MIME kosong, EXIF 1–8 pada dua decoder, persegi, panorama, portrait panjang, sangat kecil dan transparan; unit menolak format/animasi, header rusak dan batas file/piksel. Batas produk: 20 MB, 24 MP per file, 8 foto per sesi, preview ≤1600 px. Fixture berasal dari canvas/ilustrasi proyek, tidak memakai foto pribadi.

## Resource dan performa

Audit baru mempertahankan dokumen browser yang sama selama 10 siklus per engine. Setiap siklus memakai empat PNG 2400 × 3200, zoom, ganti frame 4→2→4, ekspor PNG standar 1800 × 2700, decode file unduhan, dan hapus sesi. Setelah ekspor ada 5 Object URL dan 4 ImageBitmap aktif; setiap clear mengembalikan keduanya ke 0. Skrip membungkus API asli untuk menghitung resource; ini bukan profiling heap/GPU atau bukti memori HP 4 GB.

Pengukuran performa berikut disimpan dari sesi implementasi sebelumnya pada host yang sama, **tidak dijalankan ulang**. Pipeline decode/renderer/ekspor tidak berubah; perbaikan kelanjutan menyentuh ukuran kontrol CSS. Empat foto masing-masing 12.185.713 piksel; output Gallery Issue 1800 × 2700. [Data performa](qa/performance.json).

| Engine | PNG valid / p95 | JPEG valid / p95 | Preview render terisolasi p95 |
|---|---|---|---|
| Chromium | 20/20 / 125 ms | 20/20 / 131 ms | 0,2 ms |
| WebKit | 20/20 / 632 ms | 20/20 / 597 ms | 1 ms |

Angka preview bukan frame time seluruh gesture. Target p95 ekspor ≤5 detik dan drag ≤33 ms pada perangkat referensi PRD belum terbukti. Gallery/decode/render/encode perlu pengukuran terpisah pada perangkat tersebut.

## Gate berikutnya

- Matriks nyata: Android RAM 4 GB, iPhone 13/setara, laptop Windows RAM 8 GB; Chrome Android, Safari iOS, Chrome/Edge stabil dan satu mayor sebelumnya. Isi model, OS, browser, tanggal, jaringan dan hasil, jangan memakai engine otomatis sebagai versi browser wajib.
- Kamera nyata: izin diterima/ditolak, depan/belakang/perangkat, timer 0/3/5/10, burst/retake, mirror, pindah tab, switching dan clear sesi saat kamera aktif.
- File asli HP, download/save fallback iOS, orientasi layar, sentuh, pembaca layar, fokus/kontras/44 px dan keyboard virtual.
- Semua AC pada matriks wajib; ulangi pengukuran geometri dan performa referensi, 20 PNG/JPEG standar per kombinasi, dan profiling memori berulang.
- Persetujuan pemilik atas 16 desain; uji 10 peserta: ≥8 selesai mandiri, median alur unggah ≤3 menit.
- Staging HTTPS, validasi header/cache/aset, latihan rollback kandidat, lalu domain/produksi dan smoke test laptop + HP. Arsip lokal/checksum sudah tersedia; belum dideploy. Lihat [panduan rilis](RELEASE.md).

Firefox tambahan tetap pending pada lingkungan ini. P1/P2 belum menjadi bagian kelanjutan: filter, draft lokal, share/cetak, frame builder, akun/cloud.

## Reproduksi

```powershell
npm run check
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'docs/qa/browser-results.json'
npm run test:e2e -- --reporter=list,html,json
npx playwright test camera --project=chromium --grep 'real browser' --repeat-each=5
```

Jalankan server `npm run dev` pada terminal lain sebelum:

```powershell
npm run qa:frames
npm run qa:ui
node scripts/measure-resources.mjs
node scripts/measure-performance.mjs
```

Laporan HTML terbaru dari suite penuh ada di `playwright-report/index.html`; laporan JSON di atas menyimpan hasil yang selesai walaupun tes terfokus berikutnya mengganti direktori output sementara.
