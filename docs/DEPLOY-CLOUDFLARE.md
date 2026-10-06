# Publikasi Fotbooth di Cloudflare Pages

Source public: https://github.com/alifikri25/fotbooth. Situs publik sejak **7 Oktober 2026**: https://fotbooth.pages.dev.

Project aktif menggunakan **Direct Upload**, production branch `main`. Pratinjau: https://preview.fotbooth.pages.dev. Deployment produksi pertama: `ef45b121-2b33-4102-8773-4d274875b49b`; preview pertama: `360f9f7b-8b6a-4003-8b75-91f9127976b6`. Custom domain belum dipasang.

Untuk revisi, jalankan pemeriksaan lokal, `npm run deploy:preview`, periksa preview HTTPS, lalu `npm run deploy:cloudflare`. Push GitHub hanya menjalankan CI; belum ada automatic deploy. Bukti rilis: [cloudflare-public-release.json](qa/cloudflare-public-release.json).

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
# Setelah preview diperiksa:
npm run deploy:cloudflare
```

`wrangler.jsonc` menentukan nama project, compatibility date dan direktori build. Kredensial Wrangler berada di konfigurasi pengguna; jangan masukkan ke repository. Untuk CI di kemudian hari, simpan `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` sebagai GitHub Secrets.

Git integration cocok untuk repo ini karena push berikutnya dapat dibangun otomatis. [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) adalah pilihan terpisah; project Direct Upload tidak bisa diubah menjadi project Git integration.

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

Katalog aktif memakai artwork versi 2 dengan arah cetakan kertas. Pertahankan aset versi 1 dari 60 ID aktif agar sesi pengguna yang sudah terbuka masih dapat menyelesaikan ekspor; versi lama tidak menambah pilihan frame dalam katalog.

## Pemeriksaan di URL HTTPS

- Beranda dan galeri menampilkan 60 frame; seluruh thumbnail, font lokal dan layer frame berhasil dimuat.
- Cari frame, ubah kategori/koleksi/format/jumlah foto dan reset pencarian kosong.
- Unggah JPG/PNG/WebP, atur crop, caption dan tanggal; unduh PNG/JPEG standar dan ringan.
- Uji kamera dengan izin diterima dan ditolak; pastikan indikator kamera mati setelah sesi ditutup.
- Periksa viewport 360 px dan browser HP nyata. Pengujian otomatis Chromium/WebKit di komputer belum menggantikan kamera fisik/iOS/Android.
- Pastikan header `Content-Security-Policy`, `Permissions-Policy` dan `X-Content-Type-Options` dari `public/_headers` tersedia.
- Foto, caption dan thumbnail pengguna tetap di memori browser dan tidak muncul sebagai upload jaringan.

## Rollback

Di project Pages buka **Deployments**, pilih deployment produksi sebelumnya, lalu **Rollback to this deployment**. Setelahnya ulangi alur unggah → edit → unduh dan pemeriksaan aset. Riwayat source tetap tersedia melalui commit GitHub.
