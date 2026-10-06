# Publikasi Fotbooth di Cloudflare Pages

Source public: https://github.com/alifikri25/fotbooth. Hosting disiapkan untuk publikasi berikutnya; belum ada URL produksi.

## Hubungkan repo GitHub

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

Wrangler dipin di lockfile. Setelah project Pages dibuat:

```powershell
npx wrangler login
npm run deploy:preview
# Setelah preview diperiksa:
npm run deploy:cloudflare
```

`wrangler.jsonc` menentukan nama project, compatibility date dan direktori build. Kredensial Wrangler berada di konfigurasi pengguna; jangan masukkan ke repository. Untuk CI di kemudian hari, simpan `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` sebagai GitHub Secrets.

Git integration cocok untuk repo ini karena push berikutnya dapat dibangun otomatis. [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) adalah pilihan terpisah; project Direct Upload tidak bisa diubah menjadi project Git integration.

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
