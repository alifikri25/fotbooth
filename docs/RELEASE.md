# Prosedur staging, rilis dan rollback

## Produksi terbaru: kamera dengan pemeriksaan tiap foto

Rilis **13 Oktober 2026**, dikonfirmasi kembali **14 Oktober 2026**: [fotbooth.pages.dev](https://fotbooth.pages.dev), deployment **723ce602-57dd-4f35-b7ef-538207044e82**, [URL tetap](https://723ce602.fotbooth.pages.dev). Buka kamera menjadi pilihan utama. Foto biasa ditampilkan sebagai draft sebelum diterima; ambil ulang tidak mengisi sesi, thumbnail foto tersimpan dapat diperiksa kembali, dan foto terakhir yang diterima membuka editor. Rangkaian otomatis tetap pilihan eksplisit.

146 unit test dan build lulus. Tes terfokus dan integrasi lokal berasal dari dua run: **11 lulus/7 skip** dan **22 lulus/8 skip**. Preview **5b09357d-58e6-4bdd-b00e-9be322a1acc8** dan produksi HTTPS masing-masing **11 lulus/7 skip**, tanpa gagal/flaky. Empat smoke AR memeriksa model wajah/orang, 16 efek Chromium, review/accept, editor dan PNG/JPEG. HTML dan seluruh lima bundel JS/CSS cocok kandidat. Kamera fisik dan latihan rollback belum diuji.

Kandidat 730 file memiliki SHA-256 arsip **6016b05b6f0acf432eeacd4b0bd77c3673bcecd03b4f92558f29f60f3d8716d7**; seluruh entri arsip diverifikasi dan kedua deployment memakai dist yang sama tanpa rebuild. [Bukti rilis](qa/camera-review-release-20261013.json), [pemeriksaan ulang 14 Oktober](qa/camera-review-resume-integrity-20261014.json). Rollback Pages ke **b88cf128-ff60-443d-a8a0-31e919951ee5**; Worker room tetap **f1327cfd-a643-43ed-a5a2-29e9d94c1839**, tidak dideploy ulang.

## Rilis sebelumnya: Foto Bareng Online

Produksi Foto Bareng Online, **13 Oktober 2026**, sudah diterbitkan di [fotbooth.pages.dev](https://fotbooth.pages.dev) atas persetujuan eksplisit pengguna untuk menguji pada HP fisik. Deployment **b88cf128-ff60-443d-a8a0-31e919951ee5**, branch `main`, [URL deployment produksi](https://b88cf128.fotbooth.pages.dev). Room memakai seluruh **80 frame koleksi dan tiga frame khusus**; setiap slot mengambil pose berdua yang baru, dengan satu PNG akhir identik untuk kedua peserta. [Bukti rilis dan pemeriksaan](qa/online-room-catalog-release-20261013.json).

Produksi memakai dist kandidat 730 file yang sama dengan pratinjau **e2e8f932**, tanpa rebuild, dengan SHA-256 arsip **8ae789fe1a3bcd46327b363ed4c5eca81c99aa7cc8aedd191dcb25a232d49c39**. Pemeriksaan UI pada origin produksi **4 lulus, 2 skip kamera sintetis WebKit, 0 gagal/flaky**: empat pose berbeda, unduhan identik lewat koneksi langsung dan relay, foto ulang, reconnect, serta hasil selesai tetap tersedia setelah gangguan kamera/koneksi. Empat smoke HTTPS produksi solo/AR lulus: HTML dan 240 aset frame cocok dist, PNG/JPEG solo terbaca, model wajah/orang nyata bekerja pada kedua engine, dan 16 efek kamera AR beserta editor/ekspor diperiksa di Chromium. Smoke menggunakan Chromium 1440 px, WebKit 360 px dan AR 390 px; kamera/HP fisik belum diuji otomatis, dan pengguna kini akan mengujinya langsung. Angka pratinjau dan lokal berikut tetap dicatat sebagai run terpisah.

Coordinator tetap **f1327cfd-a643-43ed-a5a2-29e9d94c1839**. Kandidat rollback Pages adalah produksi AR sebelumnya **4d1cfcae-ee85-40cf-b513-74b5b4eb1445**; versi Worker sebelumnya **bf194d29-3099-44cf-ac9c-6cc2483f7627** tersedia untuk rollback backend terpisah. Latihan rollback belum dilakukan.

Audit kelanjutan **13 Oktober 2026** mengonfirmasi deployment produksi tersebut dan mencocokkan seluruh **729 file yang dilayani situs** dengan kandidat; build ulang cocok seluruh 730 file. Pemeriksaan terbaru: **146 unit test, TypeScript dan build lulus**, UI room produksi **16 lulus, 12 skip, 0 gagal/flaky**, serta empat smoke solo/AR Chromium/WebKit lulus. Bukti: [audit kelanjutan](qa/online-room-continuation-audit-20261013.json). Source rilis mencakup Festival Editions, efek foto, AR dan room; konfigurasi Playwright juga diperbaiki agar coordinator lokal berjalan selama tes di CI. Tidak ada perubahan runtime produksi dari perbaikan konfigurasi tes ini.

Suite lokal lengkap setelah perbaikan CI **120 lulus, 24 skip, 0 gagal/flaky** pada Chromium/WebKit; 146 unit test dan build tetap lulus. Kedua server pengujian berhenti otomatis, 32 file QA historis dipulihkan identik dan 21 bukti baru disimpan terpisah. [Laporan suite lengkap](qa/online-room-continuation-local-20261013.json). Kamera/HP fisik dan latihan rollback tetap belum diuji.

Pratinjau koleksi frame, **13 Oktober 2026**: [Foto Bareng Online](https://e2e8f932.fotbooth.pages.dev), deployment **e2e8f932-d52a-4071-9cc8-1fcc0d16333f**. Room kini memakai seluruh **80 frame koleksi**, ditambah tiga frame khusus berdua. Frame 2–4 slot mengambil 2–4 pose baru secara berurutan; kedua peserta ada di setiap foto. Pratinjau mempertahankan pose sebelumnya, dan host membagikan satu PNG akhir identik. Hasil tetap tersedia setelah kamera dimatikan; pembatalan, sambung ulang dan gambar yang terlambat selesai dibaca sudah diperiksa. [Bukti rilis koleksi frame](qa/online-room-catalog-release-20261013.json).

146 unit test/build lulus; suite room/katalog final **42 lulus, 16 skip, 0 gagal/flaky**, termasuk ekspor PNG seluruh 80 frame di Chromium dan WebKit. Frontend HTTPS final **11 lulus, 7 skip, 0 gagal/flaky**; empat smoke HTTPS solo/AR lulus. Skip terkait kamera/WebRTC sintetis WebKit dan project ganda. PNG asli tetap dibatasi 8 MiB; hasil maksimal 20 MiB, dengan waktu tunggu PNG akhir baru 60 detik setelah foto pose terakhir diterima. Pengujian hasil besar melalui coordinator online **2 lulus, 2 skip duplikat**: PNG 11.498.468 byte identik, transfer akhir 1,26 detik langsung dan 22,79 detik relay Chromium–WebKit. Kemacetan WebKit pada pengujian sebelumnya tersimpan sebagai riwayat yang penyebabnya belum terbukti; dua pengujian berikutnya lulus tanpa perubahan produksi. HP/kamera fisik belum diuji.

Kandidat `docs/qa/fotbooth-online-room-catalog-candidate-20261013.zip` berisi **730 file**, SHA-256 **8ae789fe1a3bcd46327b363ed4c5eca81c99aa7cc8aedd191dcb25a232d49c39**; setiap entri cocok dist final. Coordinator **f1327cfd-a643-43ed-a5a2-29e9d94c1839** sudah diterapkan dan lulus verifier HTTP/dua WebSocket untuk seri 2/3/4 pose. Pratinjau lama masih lulus 3/3 tes terhadap coordinator baru. Saat pemeriksaan pratinjau ini, produksi Pages masih **4d1cfcae-ee85-40cf-b513-74b5b4eb1445**; publikasi kandidat yang sama dan pemeriksaan produksi tercatat di atas. Rollback backend tersedia ke **bf194d29-3099-44cf-ac9c-6cc2483f7627**.

Pratinjau sebelumnya, **13 Oktober 2026**: [Foto Bareng Online dengan tiga frame khusus](https://0b4def98.fotbooth.pages.dev), deployment **0b4def98-7f5d-4621-874f-a0244fe2c56a**. Dua peserta memakai undangan privat, tiga frame room dan tiga latar bersama. Host membuat satu PNG yang dikirim identik melalui koneksi langsung atau relay; hasil selesai tetap dapat diunduh setelah peserta keluar, kamera terhenti atau koneksi putus. Reconnect dan foto ulang saat offline sudah diperiksa. [Bukti pratinjau sebelumnya](qa/online-room-release-20261013.json).

127 unit test dan build lulus; suite browser lengkap **93 lulus, 17 skip, 0 gagal/flaky**. Pada frontend HTTPS yang sudah dibangun, pemeriksaan room **4 lulus, 2 skip** mencakup unduhan identik, retake, reconnect dan penyimpanan hasil di tab. Smoke Chromium 1440 px/WebKit 360 px memeriksa 80 thumbnail, 240 aset cocok build dan PNG/JPEG solo; smoke AR 390 px memeriksa model nyata pada kedua engine serta 16 efek dan ekspor Chromium. Skip terkait kamera sintetis/WebRTC WebKit dan pengulangan project tes lintas engine. Kamera/HP fisik belum diuji.

Kandidat `docs/qa/fotbooth-online-room-candidate-20261013.zip` berisi **730 file**, SHA-256 **d769923eddda4180cc5f8de623378471ae478b6093faf303433c34017f1aa93a**. Semua entri cocok build final, dan dist diperiksa ulang sesudah smoke. Worker room tetap memakai versi **bf194d29-3099-44cf-ac9c-6cc2483f7627**; tidak ada deployment backend atau publikasi produksi pada kelanjutan ini. Kandidat rollback produksi room adalah rilis AR **4d1cfcae-ee85-40cf-b513-74b5b4eb1445**.

Produksi sebelumnya, **7 Oktober 2026**: katalog aktif **80 frame solo**, **12 pilihan efek foto** termasuk Original, serta **16 AR** dengan pelacakan wajah/latar lokal. Situs publik: [fotbooth.pages.dev](https://fotbooth.pages.dev). Produksi **4d1cfcae-ee85-40cf-b513-74b5b4eb1445**, [URL deployment produksi](https://4d1cfcae.fotbooth.pages.dev), preview rilis AR **c97cc859-dab6-4334-a4d9-07a9a2f64288**. Source masih berupa perubahan lokal di atas 1fd82596fcffe5e91b74b30241b5d29eb087e9f1. [Bukti rilis AR](qa/ar-release-20261007.json).

Rilis AR memiliki 53 unit test, TypeScript dan build lulus. Suite penuh sebelum perbaikan perpindahan slot: 77 lulus, 7 skip, 0 gagal/flaky. Pemeriksaan final kamera/AR/efek/CSP setelah perbaikan: 24 lulus, 8 skip, 0 gagal/flaky; kedua angka berasal dari run terpisah. Smoke HTTPS preview/produksi Chromium dan WebKit memeriksa model nyata, aset, editor serta PNG/JPEG. Kamera sintetis diuji di Chromium; HP/kamera fisik dan performa perangkat belum diuji. Rollback rilis AR: **29a7c0bf-41d5-4ebf-8a6c-bb0953b995c6**. Produksi AR ini menjadi kandidat rollback untuk rilis Foto Bareng Online saat ini.

## Riwayat rilis

Revisi sebelumnya, **20 Festival Editions dan efek foto**: katalog aktif 80 frame, dengan 12 pilihan efek termasuk Original. Produksi **29a7c0bf-41d5-4ebf-8a6c-bb0953b995c6**, preview **3c400bbd-0552-4591-a732-20b4b833836a**, dengan build identik. Source masih berupa perubahan lokal di atas 1fd82596fcffe5e91b74b30241b5d29eb087e9f1. [Bukti revisi](qa/festival-release-20261007.json).

50 unit test/build lulus. Dari 72 browser checks, 66 lulus dan 4 skip; dua langkah tes memakai nilai intensitas .55 yang tidak valid, dikoreksi menjadi 0.55 dan keduanya lulus saat diulang. Cakupan akhir: 68 lulus, 4 skip kamera sintetis WebKit, tanpa kegagalan tersisa. Preview/produksi Chromium desktop dan WebKit 360 px memeriksa 80 thumbnail, byte equality/SHA-256 240 aset frame dan hasil PNG/JPEG dengan efek. Seluruh 20 frame baru di produksi menghasilkan 40 unduhan PNG/JPEG per engine dengan Vintage 55%. Semua aset frame lama yang terlacak tidak berubah. HP/kamera fisik belum diuji. Rollback rilis Festival: **16d4bffa-5e83-48dc-893a-94e38782559e**.

Revisi sebelumnya: **sepuluh edisi unggulan tambahan dan galeri tanpa orang**. Total tetap 60 ID (18 versi 3, 42 versi 2), seluruh area foto thumbnail netral. Source 0260be14c41d1090c0b128f5eb8317300d8b2432, preview 4c1d776e-79d2-4425-bbc9-9b3fe00e0f39, produksi 16d4bffa-5e83-48dc-893a-94e38782559e. 46 unit/build, 63 browser lulus/3 skip; katalog/render ulang setelah perbaikan kontras 6/6 lulus. Preview/produksi lulus 36 unduhan signature per engine, 60 thumbnail/180 URL dan kamera enam ukuran. Galeri produksi Chromium/WebKit lulus piksel interior 60 thumbnail dan tidak meminta foto contoh model. CI source kandidat selesai sukses. [Bukti revisi](qa/encore-release-20261007.json).

Kandidat lokal docs/qa/fotbooth-encore-neutral-candidate-20261007.zip berisi **617 file**, SHA-256 **e2106e84b97aff099e190e2ab53c64cdc644e79bb82c90c5efd7af8868a052d3**. Semua entri cocok final dist; preview/produksi memakai build identik. SHA-256 produksi cocok 127 file: seluruh thumbnail netral, 18 paket v3, sepuluh background v2 lama dan HTML/bundel. Semua 384 file background/foreground/thumbnail kandidat sebelumnya byte-identik; thumbnail.png lama tetap tersedia. Deployment sebelumnya **1bd7ac36-6d11-470b-ab05-29f5364bc42e** dan arsip 527 file di bawah tersedia untuk pemulihan. Latihan rollback dan HP/kamera fisik belum dilakukan.

Revisi sebelumnya: **delapan frame unggulan** versi 3 dengan tema lengkap, bersama 52 edisi versi 2. Source 683637242d14684af8bbed325cdb9eb242db5ad8, preview 27d48ca2-c1fd-4787-ae44-70f47a0904e2, produksi 1bd7ac36-6d11-470b-ab05-29f5364bc42e. 44 unit/build, 61 browser lulus/3 skip; pemeriksaan terarah sesudah perbaikan typography 4/4 lulus. Final preview/produksi lulus 16 unduhan signature per engine, 60 thumbnail/180 URL dan kamera enam ukuran. [Bukti revisi](qa/signature-release-20261007.json).

Kandidat lokal docs/qa/fotbooth-signature-candidate-20261007.zip berisi **527 file**, SHA-256 **c21671390c32dd8791ce9a1501d46f20b002881e4f9c94c3381e703365850800**. Setiap entri cocok final dist sebelum deploy. Preview dan produksi memakai build identik; HTML/bundel, semua paket v3, sample dan delapan background v2 (46 file) cocok SHA-256 pada produksi. Seluruh aset v1/v2 dipertahankan. Deployment sebelumnya **31ec02dd-54c3-4f4d-838f-8525e7c3a41d** tetap menjadi pilihan pemulihan; latihan rollback belum dilakukan.

Revisi sebelumnya, kamera HP dan frame cetakan kertas, sudah publik. Source f2e270eddb1ddbcaabee8619a80830f070f4988f, deployment 31ec02dd-54c3-4f4d-838f-8525e7c3a41d. 43 unit/build dan 61 browser lulus, 3 skip WebKit. Preview/produksi lulus kamera enam ukuran dan smoke unggah/unduh Chromium desktop/WebKit 360 px. [Bukti revisi](qa/camera-paper-release-20261007.json).

Arsip lokal docs/qa/fotbooth-camera-paper-candidate-20261007.zip berisi **492 file**, SHA-256 **8a39363fca01eda3a0285df85b6509224ca7bf69f1777b7f691b4ef9c322c564**; semua entri cocok build. Pada rilis tersebut artwork aktif v2; aset v1 dipertahankan untuk sesi lama. Rilis pertama dan arsip berikut tetap tersedia untuk rollback; latihan rollback belum dilakukan.

Rilis pertama memakai build source `b17c302d0f6627e5d8b6c34e703a3e3077aee85b`, deployment produksi `ef45b121-2b33-4102-8773-4d274875b49b`. 41 unit test/build dan 58 browser test lulus, 2 skip WebKit. Preview HTTPS serta smoke produksi Chromium 1440 px dan WebKit 360 px lulus. [Bukti rilis](qa/cloudflare-public-release.json).

Arsip lokal `docs/qa/fotbooth-public-candidate-20261007.zip` berisi 252 file build yang diverifikasi per SHA-256, checksum arsip `fd33ae4fe3797341ca3507b869992070a5a9013cf74935639d02e4824e38985d`. Arsip rilis pertama tetap tersedia sebagai kandidat rollback; latihan rollback belum dilakukan. Pengujian HP/kamera fisik, performa perangkat referensi dan uji 10 peserta tetap belum selesai. Publikasi tidak menandai seluruh gate PRD berikut sebagai lulus.

## 1. Kandidat yang dapat direproduksi

1. Catat versi source dan tanggal; gunakan checkout/snapshot bersih beserta `package-lock.json`.
2. Jalankan `npm ci`, `npm run check`, `npm run test:e2e`.
3. Buka contact sheet dan periksa 80 frame solo, caption panjang, tanggal, cover/contain, portrait/landscape/grid. Periksa pula tiga frame khusus room pada alur Foto Bareng Online; frame room tidak menambah jumlah katalog solo.
4. Simpan `dist/` ke arsip kandidat terpisah serta salinan kandidat sebelumnya. Catat checksum arsip.
5. Jangan ikutkan `node_modules`, fixture QA, foto pribadi, `.env`, source maps pribadi atau log pengguna ke publik. Build statis hanya membutuhkan `dist/`.

## 2. Staging HTTPS

1. Gunakan Cloudflare Pages dan origin preview HTTPS sesuai panduan Cloudflare. Upload isi `dist/` atau hubungkan repo GitHub.
2. Pastikan seluruh aset tersedia dari origin yang sama; browser tidak meminta font/pustaka runtime pihak ketiga.
3. Pasang header dari `public/_headers`. Host tanpa dukungan file ini memerlukan konfigurasi dashboard/server yang setara. Pastikan `Permissions-Policy` mengizinkan kamera hanya pada origin sendiri dan melarang mikrofon. Untuk room, `connect-src` mengizinkan HTTPS dan WSS ke `fotbooth-rooms.aliifikriii25.workers.dev`.
4. HTML/manifest/frame/font memakai revalidasi (`no-cache`) pada awal rilis. Aset bundel dengan hash boleh immutable. Untuk perubahan frame, naikkan versi dan jalur `/frames/{id}/v{version}/`; regenerasi thumbnail, manifest sumber dan publik secara bersama. Pertahankan versi aset sebelumnya selama masih dapat dipakai sesi pengguna yang terbuka.
5. Semua tampilan aplikasi menggunakan state pada root `/`; tidak ada rute path yang perlu fallback router. Tautan solo tidak membagikan foto/session. Fragment undangan room memuat token akses; setelah kamera dinyalakan, peserta room berbagi pratinjau dan foto kepada pemegang undangan tersebut.
6. Backend room memakai Worker terpisah sesuai `worker/wrangler.jsonc`; periksa HTTP dan dua WebSocket nyata, origin preview yang diizinkan, serta koneksi langsung/fallback relay. Alamat build `VITE_ROOM_API_URL` dan allowlist CSP harus sesuai dengan Worker yang diuji. Catat versi Worker, URL deployment Pages yang immutable, checksum kandidat, dan bukti HTTPS. Lihat [panduan deployment](DEPLOY-CLOUDFLARE.md) dan [Foto Bareng Online](ONLINE-ROOMS.md).

## 3. Gate sebelum produksi

- Matriks Chrome Android, Safari iOS, Chrome/Edge desktop stabil dan satu versi sebelumnya: isi model, RAM, OS, browser, tanggal.
- Setiap kombinasi wajib: 20 ekspor standar PNG/JPEG dengan 4 foto, dibuka kembali; 80 frame solo valid; minimum viewport 360 px.
- Room: dua peserta masuk melalui undangan berbeda, memilih tiga frame/latar, siap bersama, mengambil foto dan mengunduh PNG dengan byte identik melalui koneksi langsung maupun relay. Periksa foto ulang, kamera terhenti, server terputus/kedaluwarsa, hasil tetap dapat diunduh setelah pasangan keluar, serta foto ulang saat offline dan pengambilan kembali setelah reconnect. Catat engine dan apakah kamera berasal dari perangkat nyata atau fixture sintetis.
- Kamera fisik: izin ditolak/diterima, depan/belakang atau beberapa perangkat, timer/rangkaian/retake, mirror, tab background, indikator kamera berhenti.
- File HP EXIF 1–8, portrait/landscape/panorama/sangat panjang/persegi/kecil/transparan/WebP, file rusak dan batas file/piksel.
- Target p95 ekspor ≤5 detik dan drag ≤33 ms pada perangkat referensi PRD; 10 siklus penggunaan untuk melihat resource/memori.
- Uji 10 peserta: ≥8 selesai mandiri, median alur unggah ≤3 menit. Review pemilik produk atas koleksi aktif.
- Audit request: pada alur solo, foto, caption, tanggal, filename dan thumbnail pengguna tidak menjadi payload jaringan aplikasi. Pada room, kamera/pratinjau, portrait PNG dan PNG akhir hanya dikirim kepada peserta lain secara langsung atau melalui relay sementara; payload foto tidak ditulis ke penyimpanan atau log server.
- Blocker/mayor nol. Isu minor dan batas dukungan dicatat di laporan QA. Jangan mengganti bukti perangkat nyata dengan emulasi viewport.

## 4. Latihan rollback di staging

1. Deploy kandidat A yang lolos smoke test. Simpan arsip dan checksum A.
2. Deploy kandidat B. Pastikan nomor versi dan manifest benar.
3. Pulihkan A memakai arsip yang disimpan. Bersihkan/invalidate cache HTML dan manifest sesuai penyedia.
4. Ulangi unggah→edit→PNG/JPEG, kamera fallback, delapan aset dan audit jaringan. Catat hasil latihan, jangan menandai rollback terbukti sebelum langkah ini dilakukan.

## 5. Produksi

Setelah gate QA lengkap, domain/origin dipilih dan preview disetujui untuk produksi, deploy arsip kandidat yang sama, aktifkan HTTPS, lalu ulangi smoke PRD §20.2 pada laptop dan HP serta alur room di atas. Aplikasi hanya bisa memastikan Blob hasil siap; jangan menganggap event ekspor sebagai bukti file benar-benar disimpan pengguna.

Pantau feedback dan error kode tanpa data foto/caption. Untuk regresi satu frame, nonaktifkan paket lewat katalog tervalidasi pada rilis berikut; untuk kerusakan engine yang luas, rollback arsip. Foto solo tetap berada di tab. Foto room sengaja dipertukarkan kepada peserta lain, tetapi server tidak menyimpan atau memulihkan foto sesi; hasil yang belum diunduh hilang saat tab ditutup. Rollback Pages dan deployment Worker adalah tindakan terpisah: catat kedua versi dan periksa kompatibilitasnya sebelum pemulihan.
