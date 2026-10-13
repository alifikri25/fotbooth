# Publikasi Fotbooth di Cloudflare Pages

Produksi Foto Bareng Online dengan **80 frame koleksi dan tiga frame khusus** sudah tersedia di [fotbooth.pages.dev](https://fotbooth.pages.dev) sejak **13 Oktober 2026**. Deployment produksi **b88cf128-ff60-443d-a8a0-31e919951ee5**, branch `main`, memiliki [URL deployment tetap](https://b88cf128.fotbooth.pages.dev). Setiap frame 2–4 slot memakai 2–4 pose berdua yang berbeda; host membuat satu PNG akhir untuk kedua unduhan. Pratinjau yang diuji tetap tersedia di [e2e8f932](https://e2e8f932.fotbooth.pages.dev). Coordinator **f1327cfd-a643-43ed-a5a2-29e9d94c1839** mendukung seri 2/3/4 pose dan pratinjau lama. Kamera/HP fisik belum diuji otomatis.

Kandidat `docs/qa/fotbooth-online-room-catalog-candidate-20261013.zip` memuat 730 file, checksum **8ae789fe1a3bcd46327b363ed4c5eca81c99aa7cc8aedd191dcb25a232d49c39**, dan dipakai untuk pratinjau serta produksi tanpa rebuild. Pemeriksaan ulang mencocokkan seluruh 729 file yang dilayani produksi dengan kandidat; `_headers` diterapkan Cloudflare dan kebijakan HTTP diperiksa lewat smoke. [Bukti rilis](qa/online-room-catalog-release-20261013.json) memuat transfer hasil 11,5 MB yang identik melalui koneksi langsung dan relay Chromium–WebKit; [audit kelanjutan](qa/online-room-continuation-audit-20261013.json) mencatat pemeriksaan terbaru. Rollback Pages tersedia ke produksi AR **4d1cfcae-ee85-40cf-b513-74b5b4eb1445**; coordinator sebelumnya **bf194d29-3099-44cf-ac9c-6cc2483f7627** adalah pilihan rollback backend. Perubahan Pages dan Worker memiliki nomor deployment berbeda.

Pratinjau sebelumnya dengan tiga frame khusus, **13 Oktober 2026**, tersedia di [deployment sebelumnya](https://0b4def98.fotbooth.pages.dev): **0b4def98-7f5d-4621-874f-a0244fe2c56a**. [Bukti release preview sebelumnya](qa/online-room-release-20261013.json).

127 unit/build lulus; suite lengkap 93 browser lulus/17 skip tanpa gagal/flaky. Frontend HTTPS room lulus 4 pemeriksaan/2 skip kamera sintetis WebKit. Smoke solo Chromium 1440 px/WebKit 360 px dan AR kedua engine pada 390 px lulus; perangkat/kamera fisik belum diuji. Pratinjau memakai dist kandidat 730 file tanpa rebuild, checksum arsip **d769923eddda4180cc5f8de623378471ae478b6093faf303433c34017f1aa93a**. Pratinjau ini telah digantikan oleh produksi koleksi frame di atas; arsip kandidatnya disimpan sebagai bukti historis. Nomor deployment preview berbeda dari nomor produksi.

Produksi sebelumnya, 7 Oktober 2026: **80 frame solo**, **12 pilihan efek foto** termasuk Original, serta **16 AR** dengan pelacakan wajah/latar lokal. Produksi **4d1cfcae-ee85-40cf-b513-74b5b4eb1445**, [URL deployment produksi](https://4d1cfcae.fotbooth.pages.dev), preview rilis AR **c97cc859-dab6-4334-a4d9-07a9a2f64288**. [Bukti rilis AR](qa/ar-release-20261007.json). Pada rilis tersebut, source masih berupa perubahan lokal. Deployment **29a7c0bf-41d5-4ebf-8a6c-bb0953b995c6** adalah rilis sebelumnya dan pilihan rollback AR. Produksi AR menjadi kandidat rollback Pages untuk rilis Foto Bareng Online saat ini.

Source public: https://github.com/alifikri25/fotbooth. Situs publik sejak **7 Oktober 2026**: https://fotbooth.pages.dev.

Project aktif menggunakan **Direct Upload**, production branch `main`. Pratinjau: https://preview.fotbooth.pages.dev. Deployment produksi pertama: `ef45b121-2b33-4102-8773-4d274875b49b`; preview pertama: `360f9f7b-8b6a-4003-8b75-91f9127976b6`. Custom domain belum dipasang.

Untuk revisi, jalankan pemeriksaan lokal, `npm run deploy:preview`, lalu periksa URL deployment preview HTTPS yang immutable dan checksum build. Setelah preview disetujui untuk produksi, jalankan `npm run deploy:cloudflare` dengan source kandidat yang sama dan pastikan checksum hasil cocok. Push GitHub hanya menjalankan CI; belum ada automatic deploy. Bukti rilis sebelumnya tetap disimpan, termasuk [Festival Editions](qa/festival-release-20261007.json) dan [Encore](qa/encore-release-20261007.json). Untuk AR, jalankan `scripts/smoke-ar.mjs` dengan FOTBOOTH_SMOKE_URL, FOTBOOTH_SMOKE_BROWSER dan FOTBOOTH_AR_REPORT; script memeriksa model/landmark/mask nyata, CSP, checksum aset, seluruh 16 pilihan kamera Chromium, editor dan PNG/JPEG. Jalur model Safari diperiksa melalui WebKit; kamera/HP fisik belum diuji.

## Backend Foto Bareng Online

Room menggunakan Worker terpisah di [fotbooth-rooms.aliifikriii25.workers.dev](https://fotbooth-rooms.aliifikriii25.workers.dev), dengan SQLite Durable Object `PhotoRoom` dan binding `ROOMS` sesuai `worker/wrangler.jsonc`. `npm run rooms:dev` menjalankan coordinator lokal di `127.0.0.1:8787`; Vite meneruskan `/api` dan WebSocket ke sana. `npm run rooms:deploy` menerapkan backend secara terpisah dari Pages. Catat versi Worker yang dipakai pada bukti release; jangan menganggap deployment Pages mengubah Worker.

Build Pages memakai alamat Worker tersebut secara default; `VITE_ROOM_API_URL` dapat menggantinya saat build. Header `public/_headers` mengizinkan `https://fotbooth-rooms.aliifikriii25.workers.dev` dan `wss://fotbooth-rooms.aliifikriii25.workers.dev` pada `connect-src`. Bila alamat backend diganti, perbarui alamat build dan allowlist CSP bersama. Worker membatasi origin ke situs Fotbooth, subdomain preview Pages dan localhost yang didukung.

TURN opsional memakai secret Worker **`TURN_KEY_ID`** dan **`TURN_API_TOKEN`**; kredensial sementara hanya dibuat server untuk room yang sah. Tidak ada TURN berbayar yang diaktifkan dalam setup ini; fallback WebSocket tersedia tanpa TURN. Simpan secret melalui Wrangler, jangan masukkan nilainya ke repository atau log. Server menyimpan metadata room selama masa berlaku, sedangkan foto relay hanya diteruskan tanpa penyimpanan. Tiga frame room terpisah dari 80 frame solo. [Alur, privasi dan batas dukungan](ONLINE-ROOMS.md).

## Alternatif project baru dengan Git integration

Langkah ini untuk project baru. Project `fotbooth` yang sudah aktif tetap memakai Direct Upload; Cloudflare tidak mendukung mengubah project Direct Upload menjadi Git integration.

1. Login ke Cloudflare, buka **Workers & Pages → Create application → Pages → Connect to Git**.
2. Pilih repo **alifikri25/fotbooth**. Berikan akses integrasi hanya ke repo yang dibutuhkan.
3. Isi konfigurasi:

| Pengaturan | Nilai |
| --- | --- |
| Project name | `fotbooth` |
| Production branch | `main` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Kosong / root repo |
| Node version | `24.14.1` (juga tersimpan di `.node-version`) |

4. Saat siap publikasi, pilih **Save and Deploy**. Simpan URL HTTPS yang benar-benar dikembalikan Cloudflare; nama domain belum dipesan.
5. Pasang custom domain melalui tab **Custom domains** bila sudah dipilih.

Dokumentasi resmi: [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [Vite build settings](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/).

## Publikasi manual dari komputer

Wrangler dipin di lockfile. Project Pages sudah dibuat; login kembali hanya jika sesi pengguna kedaluwarsa:

```powershell
npx wrangler login
npm run deploy:preview
# Setelah preview diperiksa dan disetujui untuk produksi:
npm run deploy:cloudflare
```

`wrangler.jsonc` menentukan nama project, compatibility date dan direktori build. Kredensial Wrangler berada di konfigurasi pengguna; jangan masukkan ke repository. Untuk CI di kemudian hari, simpan `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` sebagai GitHub Secrets.

Pada project baru dengan Git integration, push dapat memicu build otomatis. Project `fotbooth` yang aktif tetap memakai [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/); project Direct Upload tidak bisa diubah menjadi project Git integration.

Pada pembuatan project pertama dengan Wrangler 4.147.0, perintah tanpa `--force` mencoba beralih ke Workers dan gagal karena konfigurasi ini khusus Pages. Project kemudian berhasil dibuat dengan `npx wrangler pages project create fotbooth --production-branch main --force`. Flag tersebut hanya diperlukan saat membuat project pertama; deployment selanjutnya memakai script Pages biasa.

Smoke HTTPS dapat diulang pada Chromium desktop atau WebKit 360 px:

```powershell
$env:FOTBOOTH_SMOKE_URL = 'https://fotbooth.pages.dev'
$env:FOTBOOTH_SMOKE_REPORT = 'docs/qa/cloudflare-production-smoke.json'
$env:FOTBOOTH_SMOKE_BROWSER = 'webkit' # chromium atau webkit
$env:FOTBOOTH_SMOKE_WIDTH = '360'
node scripts/smoke-build.mjs
```

Perubahan tata letak kamera diuji pada enam ukuran portrait, landscape dan desktop melalui URL yang sama:

```powershell
$env:FOTBOOTH_CAMERA_TEST_URL = 'https://fotbooth.pages.dev'
npx playwright test mobile-camera --project=chromium --project=webkit --reporter=list
```

Seluruh 18 frame unggulan diperiksa satu per satu untuk PNG dan JPEG melalui origin HTTPS yang sama:

```powershell
$env:FOTBOOTH_SMOKE_URL = 'https://fotbooth.pages.dev'
$env:FOTBOOTH_SMOKE_BROWSER = 'webkit' # chromium atau webkit
$env:FOTBOOTH_SMOKE_WIDTH = '360'
$env:FOTBOOTH_SIGNATURE_REPORT = 'docs/qa/signature-production-smoke.json'
node scripts/smoke-signature.mjs
```

Katalog solo aktif berisi 80 frame: artwork versi 3 pada 18 desain unggulan, versi 2 pada 42 desain lainnya, dan versi 1 pada 20 Festival Editions. Seluruh 80 thumbnail aktif memakai thumbnail-neutral.png dengan area foto kosong netral. Pertahankan thumbnail.png lama dan semua aset v1/v2/v3 sebelumnya agar sesi yang sudah terbuka masih dapat menyelesaikan ekspor; versi lama tidak menambah pilihan katalog. Tiga frame khusus room tersedia pada alur Foto Bareng Online dan tidak masuk hitungan katalog solo. Empat belas bahan raster signature tertanam di SVG. Tiga JPEG model fiktif historis tidak dimuat galeri saat ini. Gambar asli dan prompt berada di artwork/, tidak membutuhkan panggilan imagegen saat runtime.

## Pemeriksaan di URL HTTPS

- Beranda dan galeri menampilkan 80 frame solo; seluruh thumbnail, font lokal dan layer frame berhasil dimuat.
- Cari frame, ubah kategori/koleksi/format/jumlah foto dan reset pencarian kosong.
- Unggah JPG/PNG/WebP, atur crop, caption dan tanggal; unduh PNG/JPEG standar dan ringan.
- Uji kamera dengan izin diterima dan ditolak; pastikan indikator kamera mati setelah sesi ditutup.
- Periksa viewport 360 px dan browser HP nyata. Pengujian otomatis Chromium/WebKit di komputer belum menggantikan kamera fisik/iOS/Android.
- Pastikan header `Content-Security-Policy`, `Permissions-Policy` dan `X-Content-Type-Options` dari `public/_headers` tersedia, termasuk HTTPS/WSS Worker pada `connect-src` untuk room.
- Pada alur solo, foto, caption dan thumbnail pengguna tetap di memori browser dan tidak muncul sebagai upload jaringan. Pada room, peserta sengaja berbagi kamera/pratinjau, portrait PNG dan PNG akhir secara langsung atau melalui relay sementara; foto tidak disimpan server.

### Pemeriksaan Foto Bareng Online di preview HTTPS

- Gunakan URL deployment Pages yang immutable dan Worker yang tercatat. Periksa pembuatan room, undangan sah/tidak sah, dua WebSocket serta origin/CSP sebelum memeriksa kamera.
- Masuk dari dua konteks browser melalui tautan host/guest berbeda. Kamera hanya menyala setelah dipilih; mikrofon tidak diminta. Periksa ketiga frame room dan ketiga latar, kesiapan kedua peserta, serta hitung mundur bersama.
- Ulangi capture melalui koneksi langsung dan relay paksa; PNG akhir dibuat sekali oleh host dan unduhan kedua peserta harus identik byte/SHA-256. Bandingkan pula hasil antarengine melalui relay dengan fixture PNG bila WebKit tidak menyediakan kamera/WebRTC.
- Periksa foto ulang ketika terhubung dan saat host offline, lalu reconnect dan ambil foto lagi dengan tab guest yang sama. Foto lama/transfer yang dibatalkan tidak boleh muncul sebagai hasil baru.
- Setelah hasil selesai, periksa unduhan ketika pasangan keluar/masuk kembali, track kamera berakhir dan server terputus. Untuk pengambilan belum selesai, periksa pembatalan serta aktivasi kamera kembali. Room kedaluwarsa memerlukan undangan baru.
- Periksa desktop/mobile, penghentian kamera saat keluar dan tidak adanya penyimpanan/log payload foto pada server. Jalankan kembali smoke solo dan AR pada kandidat preview yang sama.
- Alur UI otomatis dapat diarahkan melalui `FOTBOOTH_ROOM_TEST_URL` dan `npx playwright test online-room --project=chromium --reporter=list`. Catat URL yang benar-benar diuji. Hasil localhost atau frontend lokal yang memakai Worker remote tidak membuktikan frontend preview HTTPS.
- Kamera otomatis memakai canvas sintetis. WebKit Windows di lingkungan Playwright ini tidak menyediakan WebRTC/MediaStream/canvas.captureStream; fixture PNG relay antarengine tidak menggantikan pengujian kamera Chrome Android–Safari iOS pada perangkat nyata.

## Rollback

Di project Pages buka **Deployments**, pilih deployment produksi sebelumnya, lalu **Rollback to this deployment**. Setelahnya ulangi alur unggah → edit → unduh, pemeriksaan aset, AR dan room bila tersedia pada kandidat. Produksi AR **4d1cfcae-ee85-40cf-b513-74b5b4eb1445** adalah kandidat pemulihan untuk rilis Online Room saat ini; rollback rilis AR sendiri adalah Festival **29a7c0bf-41d5-4ebf-8a6c-bb0953b995c6**. Worker dideploy terpisah: catat versi backend dan periksa kompatibilitas sebelum rollback. Riwayat commit GitHub tetap tersedia, tetapi perubahan lokal yang belum dipush memerlukan arsip kandidat dan checksum tersimpan untuk pemulihan source.
