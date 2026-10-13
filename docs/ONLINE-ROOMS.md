# Foto Bareng Online

Foto Bareng memakai room privat untuk dua orang. Pembuat room membagikan undangan berbeda dari tautan miliknya, memilih frame/latar, lalu kedua peserta menyalakan kamera dan menandai siap. Hitung mundur memakai waktu server; masing-masing perangkat membekukan foto kameranya sendiri sebelum foto asli dipertukarkan. PNG akhir dibuat sekali di perangkat pembuat room, lalu file yang sama dikirim ke peserta lainnya. Keduanya mengunduh PNG identik, termasuk ketika memakai browser berbeda.

Pembuat room bisa memilih seluruh **80 frame koleksi yang sudah tersedia**, ditambah tiga frame khusus satu foto: **Satu Tempat**, **Surat Rindu**, dan **Night Date**. Frame dengan 2–4 slot memulai rangkaian 2–4 pose bersama; setiap slot berisi foto baru dari kedua peserta. Pilihan frame dan latar berlaku sama pada keduanya. Latar Studio Hangat, Langit Senja, dan Malam Berbintang tersedia bersama. Model segmentasi orang yang sudah dibundel memisahkan latar secara lokal; mode latar asli tersedia bila pemisahan tidak cocok dengan kamera/perangkat.

Keduanya cukup menandai siap sekali. Setiap pose memiliki hitung mundur empat detik dan ID foto baru. Pose berikutnya dimulai setelah kedua perangkat menerima serta menyimpan kedua foto asli sebelumnya. Pratinjau mempertahankan pose yang sudah diambil di slotnya, sementara slot berikutnya memperlihatkan kamera langsung. Urutan slot mengikuti definisi frame; bentuk, putaran dan dekorasi asli tetap memakai renderer katalog yang sama. Hanya setelah seluruh slot terisi host membuat satu PNG akhir dan membagikannya.

## Menjalankan

Jalankan `npm run rooms:dev` dan `npm run dev` pada dua terminal. Vite meneruskan `/api` dan WebSocket ke coordinator lokal `127.0.0.1:8787`. Production memakai `https://fotbooth-rooms.aliifikriii25.workers.dev`; `VITE_ROOM_API_URL` dapat mengganti alamat saat build.

Backend memakai Cloudflare Worker dan SQLite Durable Object. Deployment: `npm run rooms:deploy`. Konfigurasi `worker/wrangler.jsonc` menentukan coordinator terpisah; deployment Pages tetap mengikuti alur pratinjau lalu produksi yang sudah ada.

## Koneksi dan privasi

- Kamera hanya diminta setelah tombol **Nyalakan kamera**. Mikrofon tidak dipakai. Keluar room atau mematikan kamera menghentikan track, peer connection dan model lokal.
- Tautan memakai token acak berbeda untuk host/guest dalam fragment URL. Room kedaluwarsa setelah satu jam. Maksimal satu browser aktif untuk setiap peran; browser yang sama dapat masuk kembali.
- WebRTC mengirim video dan foto langsung bila memungkinkan. Bila sambungan langsung gagal, WebSocket room meneruskan pratinjau JPEG kecil dan foto PNG asli. Pratinjau relay maksimal dua frame/detik; hasil tetap memakai snapshot asli.
- Server menyimpan metadata room/membership/settings selama room berlaku. Payload video/foto relay hanya diteruskan, tidak ditulis ke penyimpanan atau log aplikasi. Foto ada di memori tab peserta, dan hilang saat tab ditutup; file yang diunduh tetap ada.
- Penerima memeriksa ID capture, urutan chunk maksimal 16 KiB, struktur PNG dan batas dimensi. Foto asli dibatasi 8 MiB; PNG akhir dibatasi 20 MiB agar frame koleksi beresolusi tinggi tetap dapat dibagikan. Pengambilan yang dibatalkan, foto lama dan transfer lintas pengambilan ditolak.
- Token undangan memberikan akses kepada pemegangnya; bagikan hanya kepada orang yang dituju. Server tidak menyediakan daftar room publik.
- Kamera/foto pada mode solo tetap diproses lokal seperti sebelumnya.

TURN Cloudflare bersifat opsional melalui secret Worker `TURN_KEY_ID` dan `TURN_API_TOKEN`; kredensial jangka pendek hanya dibuat oleh server untuk room yang sah. Tidak ada layanan TURN berbayar yang diaktifkan dalam setup ini. Fallback WebSocket tetap tersedia tanpa TURN. Jangan menyimpan secrets dalam repository; gunakan Wrangler secret dan hindari mencetak nilainya.

## Batas yang perlu dipahami

Pemisahan latar bergantung pada pencahayaan, jarak tubuh dari kamera dan kemampuan perangkat. Rambut/detail tepi dapat kurang rapi. Preview/inferensi bisa lebih lambat di HP, terlebih saat relay. Hitung mundur dikoordinasikan, tetapi browser dan jaringan tidak menjamin pengambilan tepat pada milidetik yang sama. Tab harus aktif selama hitung mundur; menyembunyikan tab membatalkan pengambilan. Pilih **Foto ulang** setelah koneksi bermasalah; hasil baru hanya muncul setelah kedua snapshot tiba.

Semua 80 frame katalog tetap tersedia pada alur solo dan kini dapat dipakai di room. Jumlah katalog solo tetap 80; tiga frame room tambahan tidak mengubah hitungan tersebut. Tidak ada perekaman video, penyimpanan cloud foto, akun atau galeri publik.

Foto asli ditunggu maksimal 45 detik setelah shutter setiap pose. Setelah kedua foto pose terakhir tersimpan, penggabungan/pengiriman PNG memperoleh batas tunggu baru 60 detik. Frame besar atau relay dapat memerlukan waktu lebih lama. Rangkaian parsial dibersihkan jika dibatalkan, pengaturan diubah, pasangan keluar, kamera terputus atau tab disembunyikan; mulai kembali dengan menandai siap. Gambar yang terlambat selesai dibaca setelah pembatalan dilepas dan tidak masuk rangkaian baru.

Hasil yang sudah selesai tetap tersedia di tab bila pasangan keluar/masuk kembali, kamera terhenti, atau koneksi server terputus. **Foto ulang**, pengambilan baru, keluar room, atau menutup tab menghapus hasil di sesi tersebut. Koneksi server yang terputus menghentikan kamera dan menawarkan aktivasi kembali; room kedaluwarsa memerlukan undangan baru.

## Pemeriksaan

`npm run check` memeriksa unit tests dan build. `node worker/verify-local.mjs` memeriksa HTTP dan dua WebSocket nyata dengan backend lokal berjalan, termasuk seri 2/3/4 pose dan kompatibilitas pesan satu foto. `npx playwright test online-room room-catalog room-sequence room-composition room-lifecycle room-series-recovery room-cross-browser-result room-large-result --project=chromium --project=webkit` memeriksa pilihan 80 frame, piksel PNG setiap frame, empat pose berbeda, pembatalan/sambung ulang, transfer PNG besar dan unduhan identik. Kamera uji berasal dari canvas bergerak, bukan kamera fisik; pengujian HP/jaringan fisik tetap perlu dilakukan sebelum menyatakan kompatibilitas semua perangkat.

Tes transfer hasil menggunakan koneksi langsung dua Chromium serta relay antara Chromium dan WebKit. WebKit Windows dalam lingkungan Playwright ini tidak menyediakan `RTCPeerConnection`, `MediaStream`, atau `canvas.captureStream`; hasil relay antarbrowser diuji dengan PNG uji tanpa kamera. Tes itu tidak menggantikan koneksi kamera Chrome Android–Safari iOS pada perangkat nyata.
