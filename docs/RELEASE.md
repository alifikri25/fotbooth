# Prosedur staging, rilis dan rollback

Status terbaru, **7 Oktober 2026**: katalog aktif 60 frame; source public di https://github.com/alifikri25/fotbooth. Situs sudah dipublikasikan di **https://fotbooth.pages.dev** atas permintaan pengguna. Cloudflare Pages memakai Direct Upload; custom domain belum dipasang. Baca [panduan Cloudflare](DEPLOY-CLOUDFLARE.md) untuk revisi berikutnya.

Revisi terbaru: **delapan frame unggulan** versi 3 dengan tema lengkap, bersama 52 edisi versi 2. Source 683637242d14684af8bbed325cdb9eb242db5ad8, preview 27d48ca2-c1fd-4787-ae44-70f47a0904e2, produksi 1bd7ac36-6d11-470b-ab05-29f5364bc42e. 44 unit/build, 61 browser lulus/3 skip; pemeriksaan terarah sesudah perbaikan typography 4/4 lulus. Final preview/produksi lulus 16 unduhan signature per engine, 60 thumbnail/180 URL dan kamera enam ukuran. [Bukti revisi](qa/signature-release-20261007.json).

Kandidat lokal docs/qa/fotbooth-signature-candidate-20261007.zip berisi **527 file**, SHA-256 **c21671390c32dd8791ce9a1501d46f20b002881e4f9c94c3381e703365850800**. Setiap entri cocok final dist sebelum deploy. Preview dan produksi memakai build identik; HTML/bundel, semua paket v3, sample dan delapan background v2 (46 file) cocok SHA-256 pada produksi. Seluruh aset v1/v2 dipertahankan. Deployment sebelumnya **31ec02dd-54c3-4f4d-838f-8525e7c3a41d** tetap menjadi pilihan pemulihan; latihan rollback belum dilakukan.

Revisi sebelumnya, kamera HP dan frame cetakan kertas, sudah publik. Source f2e270eddb1ddbcaabee8619a80830f070f4988f, deployment 31ec02dd-54c3-4f4d-838f-8525e7c3a41d. 43 unit/build dan 61 browser lulus, 3 skip WebKit. Preview/produksi lulus kamera enam ukuran dan smoke unggah/unduh Chromium desktop/WebKit 360 px. [Bukti revisi](qa/camera-paper-release-20261007.json).

Arsip lokal docs/qa/fotbooth-camera-paper-candidate-20261007.zip berisi **492 file**, SHA-256 **8a39363fca01eda3a0285df85b6509224ca7bf69f1777b7f691b4ef9c322c564**; semua entri cocok build. Pada rilis tersebut artwork aktif v2; aset v1 dipertahankan untuk sesi lama. Rilis pertama dan arsip berikut tetap tersedia untuk rollback; latihan rollback belum dilakukan.

Rilis pertama memakai build source `b17c302d0f6627e5d8b6c34e703a3e3077aee85b`, deployment produksi `ef45b121-2b33-4102-8773-4d274875b49b`. 41 unit test/build dan 58 browser test lulus, 2 skip WebKit. Preview HTTPS serta smoke produksi Chromium 1440 px dan WebKit 360 px lulus. [Bukti rilis](qa/cloudflare-public-release.json).

Arsip lokal `docs/qa/fotbooth-public-candidate-20261007.zip` berisi 252 file build yang diverifikasi per SHA-256, checksum arsip `fd33ae4fe3797341ca3507b869992070a5a9013cf74935639d02e4824e38985d`. Arsip rilis pertama tetap tersedia sebagai kandidat rollback; latihan rollback belum dilakukan. Pengujian HP/kamera fisik, performa perangkat referensi dan uji 10 peserta tetap belum selesai. Publikasi tidak menandai seluruh gate PRD berikut sebagai lulus.

## 1. Kandidat yang dapat direproduksi

1. Catat versi source dan tanggal; gunakan checkout/snapshot bersih beserta `package-lock.json`.
2. Jalankan `npm ci`, `npm run check`, `npm run test:e2e`.
3. Buka contact sheet dan periksa 60 frame, caption panjang, tanggal, cover/contain, portrait/landscape/grid.
4. Simpan `dist/` ke arsip kandidat terpisah serta salinan kandidat sebelumnya. Catat checksum arsip.
5. Jangan ikutkan `node_modules`, fixture QA, foto pribadi, `.env`, source maps pribadi atau log pengguna ke publik. Build statis hanya membutuhkan `dist/`.

## 2. Staging HTTPS

1. Gunakan Cloudflare Pages dan origin preview HTTPS sesuai panduan Cloudflare. Upload isi `dist/` atau hubungkan repo GitHub.
2. Pastikan seluruh aset tersedia dari origin yang sama; browser tidak meminta font/pustaka runtime pihak ketiga.
3. Pasang header dari `public/_headers`. Host tanpa dukungan file ini memerlukan konfigurasi dashboard/server yang setara. Pastikan `Permissions-Policy` mengizinkan kamera hanya pada origin sendiri dan melarang mikrofon.
4. HTML/manifest/frame/font memakai revalidasi (`no-cache`) pada awal rilis. Aset bundel dengan hash boleh immutable. Untuk perubahan frame, naikkan versi dan jalur `/frames/{id}/v{version}/`; regenerasi thumbnail, manifest sumber dan publik secara bersama. Pertahankan versi aset sebelumnya selama masih dapat dipakai sesi pengguna yang terbuka.
5. Semua tampilan aplikasi menggunakan state pada root `/`; tidak ada rute path yang perlu fallback router. Link web tidak membagikan foto/session.

## 3. Gate sebelum produksi

- Matriks Chrome Android, Safari iOS, Chrome/Edge desktop stabil dan satu versi sebelumnya: isi model, RAM, OS, browser, tanggal.
- Setiap kombinasi wajib: 20 ekspor standar PNG/JPEG dengan 4 foto, dibuka kembali; 60 frame valid; minimum viewport 360 px.
- Kamera fisik: izin ditolak/diterima, depan/belakang atau beberapa perangkat, timer/rangkaian/retake, mirror, tab background, indikator kamera berhenti.
- File HP EXIF 1–8, portrait/landscape/panorama/sangat panjang/persegi/kecil/transparan/WebP, file rusak dan batas file/piksel.
- Target p95 ekspor ≤5 detik dan drag ≤33 ms pada perangkat referensi PRD; 10 siklus penggunaan untuk melihat resource/memori.
- Uji 10 peserta: ≥8 selesai mandiri, median alur unggah ≤3 menit. Review pemilik produk atas koleksi aktif.
- Audit request produksi: foto, caption, tanggal, filename dan thumbnail pengguna tidak menjadi payload aplikasi.
- Blocker/mayor nol. Isu minor dan batas dukungan dicatat di laporan QA. Jangan mengganti bukti perangkat nyata dengan emulasi viewport.

## 4. Latihan rollback di staging

1. Deploy kandidat A yang lolos smoke test. Simpan arsip dan checksum A.
2. Deploy kandidat B. Pastikan nomor versi dan manifest benar.
3. Pulihkan A memakai arsip yang disimpan. Bersihkan/invalidate cache HTML dan manifest sesuai penyedia.
4. Ulangi unggah→edit→PNG/JPEG, kamera fallback, delapan aset dan audit jaringan. Catat hasil latihan, jangan menandai rollback terbukti sebelum langkah ini dilakukan.

## 5. Produksi

Setelah gate QA lengkap dan domain/origin dipilih, deploy arsip kandidat yang sama, aktifkan HTTPS, lalu ulangi smoke PRD §20.2 pada laptop dan HP. Aplikasi hanya bisa memastikan Blob hasil siap; jangan menganggap event ekspor sebagai bukti file benar-benar disimpan pengguna.

Pantau feedback dan error kode tanpa data foto/caption. Untuk regresi satu frame, nonaktifkan paket lewat katalog tervalidasi pada rilis berikut; untuk kerusakan engine yang luas, rollback arsip. Foto sesi yang sudah berada di tab tidak dikirim atau dipulihkan melalui server.
