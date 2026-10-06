# PRD — Web Photobooth dengan Frame Orisinal

Versi 1.0 · 6 Oktober 2026 · Bahasa produk: Indonesia

**Status:** spesifikasi produk untuk pembangunan sampai peluncuran. Website dan aset frame final belum dibuat. Nama merek, domain, serta hosting belum ditetapkan.

**Tujuan dokumen:** menjadi pegangan pemilik produk, desainer, dan pengembang untuk membuat web photobooth yang berfungsi penuh, memiliki frame dengan karakter berbeda, dan menempatkan foto secara konsisten pada preview serta hasil unduhan.

## 1. Ringkasan produk

Pengguna memilih frame, mengambil foto melalui kamera atau memasukkan foto dari perangkat, menyesuaikan posisi setiap foto, lalu mengunduh hasilnya. Pengalaman utama berjalan di browser HP dan laptop tanpa membuat akun.

Keunggulan produk adalah koleksi frame yang berbeda konsep dan komposisi, kemudahan pemakaian, serta hasil foto yang pas. Warna alternatif boleh ditambahkan, tetapi tidak dihitung sebagai desain frame baru.

Screenshot yang diberikan pengguna menjadi referensi untuk format photostrip, pemakaian dekorasi, dan variasi komposisi. Identitas visual produk diarahkan ke gaya kontemporer yang playful, bukan koleksi yang didominasi efek vintage. Desain pada screenshot tidak dijiplak dan tidak dipakai langsung sebagai aset produksi.

**Janji produk:** “Pilih frame, ambil atau masukkan foto, atur posisinya, lalu simpan hasilnya.”

## 2. Kebutuhan yang sudah diketahui dan asumsi awal

### 2.1 Kebutuhan dari pengguna

- Membuat website photobooth dengan variasi frame yang unik.
- Perbedaan frame harus lebih dari pergantian warna.
- Foto harus dapat dimasukkan ke area frame dan disesuaikan dengan benar.
- Memiliki PRD lengkap sebagai panduan pembangunan sampai website siap dipakai.

### 2.2 Keputusan awal yang diusulkan

| Keputusan | Default versi pertama | Alasan |
|---|---|---|
| Pengguna | Individu, pasangan, dan kelompok kecil | Sesuai penggunaan photobooth pribadi |
| Sumber foto | Kamera dan unggah dari perangkat | Tetap bisa dipakai ketika kamera tidak tersedia |
| Perangkat | HP dan laptop | Alur yang sama dengan kontrol responsif |
| Bahasa | Indonesia | Mengikuti bahasa pengguna |
| Akun | Tidak diperlukan | Mengurangi langkah sebelum membuat foto |
| Pemrosesan | Di perangkat pengguna | Foto tidak perlu dikirim ke server |
| Koleksi awal | 8 konsep frame orisinal | Cukup beragam tanpa mengorbankan kualitas |
| Hasil | PNG dan JPEG | Mudah disimpan serta dibagikan |
| Branding | Tidak ada watermark wajib | Hasil tetap dapat dipakai secara pribadi |
| Penyimpanan sesi | Memori tab; simpan lokal hanya melalui pilihan pengguna | Retensi foto jelas dan terkendali |

Keputusan ini merupakan spesifikasi default yang bisa direvisi. Tidak ada asumsi tentang pembayaran, akun, galeri publik, atau penjualan frame.

## 3. Mengapa foto sering tidak masuk atau tidak pas

Belum ada kode atau website bermasalah yang diperiksa. Tabel berikut berisi kemungkinan penyebab dan aturan pencegahannya, bukan diagnosis terhadap screenshot.

| Gejala | Kemungkinan penyebab | Aturan untuk produk ini |
|---|---|---|
| Foto seperti tertutup frame | Overlay memiliki kotak putih/warna solid di area foto | Foreground harus transparan di jendela foto; slot dan dekorasi dibuat terpisah |
| Foto terlihat di luar bingkai | Foto tidak dipotong mengikuti bentuk slot | Semua foto digambar dengan clipping mask slot |
| Foto bergeser ketika layar berubah | Koordinat mengikuti ukuran tampilan CSS | Simpan geometri dalam koordinat frame, lalu konversikan ke preview/ekspor |
| Wajah melebar atau gepeng | Lebar dan tinggi foto dipaksa mengikuti slot | Pertahankan rasio; gunakan cover atau contain |
| Kepala terpotong | Rasio foto dan slot berbeda; crop tengah tidak sesuai subjek | Sediakan geser, zoom, serta mode “Tampilkan utuh” |
| Foto tidak muncul pada percobaan pertama | Gambar/video belum siap, sumber rusak, atau dimensinya nol | Tunggu decode/readiness sebelum menggambar dan tampilkan kegagalan yang jelas |
| Foto hilang setelah resize | Ukuran internal canvas diubah tanpa render ulang | Render ulang seluruh komposisi dari state setelah resize |
| Preview benar tetapi hasil berbeda | Preview dan ekspor memakai perhitungan crop yang berbeda | Pakai renderer dan model data yang sama |
| Hasil unduhan gagal walau foto terlihat | Canvas berisi aset lintas domain tanpa izin CORS | Gunakan aset same-origin; validasi jalur ekspor |
| Foto HP miring/terbalik | Orientasi gambar atau mirroring kamera diterapkan dua kali/tidak konsisten | Normalisasi orientasi sekali; simpan keputusan mirror secara eksplisit |
| Hasil buram | Screenshot area HTML atau ekspor dari bitmap preview kecil | Render ulang pada ukuran ekspor final |
| Foto tertentu gagal | Format tidak didukung atau memori perangkat tidak cukup | Validasi format/dimensi, decode bertahap, dan berikan jalan keluar |

Perbedaan penting: CORS biasanya memblokir pembacaan atau ekspor canvas setelah gambar lintas domain digambar; tidak otomatis berarti gambar tidak bisa terlihat. [Referensi: MDN tentang canvas dan CORS](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image).

`drawImage` perlu sumber gambar yang valid dan ukuran asli gambar/video untuk perhitungan crop. [Referensi: MDN drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage).

Mengubah `canvas.width` atau `canvas.height` membersihkan bitmap dan mengembalikan state context ke default, sehingga komposisi perlu dirender ulang. [Referensi: MDN canvas width](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/width).

## 4. Tujuan dan ukuran keberhasilan

### 4.1 Tujuan produk

1. Pengguna baru bisa menghasilkan satu komposisi tanpa bantuan.
2. Semua frame memiliki area foto yang berfungsi dan dapat diedit.
3. Preview dan unduhan memiliki komposisi, crop, teks, dan mirror yang sama.
4. Kegagalan kamera tidak memutus alur karena unggah foto selalu tersedia.
5. Koleksi frame terasa beragam secara visual.

### 4.2 Target validasi awal

Angka berikut adalah target proyek, bukan hasil pengujian yang sudah dilakukan.

| Ukuran | Target | Cara mengukur |
|---|---|---|
| Keberhasilan penggunaan pertama | Minimal 8 dari 10 peserta menyelesaikan tanpa arahan | Uji pengguna sebelum rilis |
| Waktu alur unggah | Median ≤ 3 menit dari memilih frame sampai hasil tersedia | Foto sudah ada di perangkat; tidak menghitung pencarian file |
| Integritas frame | 8 dari 8 lolos validasi slot, aset, dan ekspor | Matriks QA per frame |
| Ekspor standar | 20 dari 20 percobaan per kombinasi browser/perangkat wajib berhasil | PNG serta JPEG, empat foto, pada perangkat referensi |
| Waktu ekspor standar | Persentil 95 ≤ 5 detik | Setelah foto dan aset selesai dimuat; perangkat referensi |
| Kesesuaian preview–ekspor | Tidak ada perbedaan posisi/crop yang bermakna | Geometri ≤ 1 px dalam ruang desain; bandingkan gambar pada ukuran sama |
| Variasi desain | Setiap pasangan konsep berbeda pada ≥ 3 dimensi desain | Review katalog, lihat bagian 8 |

Perangkat referensi awal: Android dengan RAM 4 GB, iPhone 13 atau setara, dan laptop Windows dengan RAM 8 GB. Catat model, OS, versi browser, jaringan, serta tanggal pengujian sebenarnya dalam laporan QA.

## 5. Lingkup dan prioritas

**P0** wajib sebelum rilis. **P1** peningkatan setelah alur utama stabil. **P2** pengembangan lanjutan.

| ID | Prioritas | Fitur | Hasil yang diharapkan |
|---|---|---|---|
| FR-01 | P0 | Galeri 8 frame | Thumbnail jujur, nama, jumlah foto, format, dan pemilihan frame |
| FR-02 | P0 | Kamera | Izin, preview, pilih kamera bila tersedia, timer, ambil ulang |
| FR-03 | P0 | Unggah foto | JPEG, PNG, WebP; validasi dan kegagalan per file |
| FR-04 | P0 | Penempatan foto | Auto-fill, pilih slot, ganti foto, tukar urutan |
| FR-05 | P0 | Penyesuaian crop | Geser, zoom, rotasi 90°, flip horizontal, cover/contain, reset |
| FR-06 | P0 | Ganti frame | Foto tetap ada; crop disesuaikan secara terkontrol |
| FR-07 | P0 | Personalisasi | Teks pendek dan tanggal pada area yang disediakan frame |
| FR-08 | P0 | Undo/redo | Membatalkan dan mengulang perubahan editor |
| FR-09 | P0 | Preview hasil | Menggunakan renderer yang sama dengan ekspor |
| FR-10 | P0 | Unduh | PNG/JPEG dalam ukuran standar dan ukuran ringan |
| FR-11 | P0 | Responsif dan aksesibel | Alur dapat diselesaikan dengan sentuh dan keyboard |
| FR-12 | P0 | Privasi dan pemulihan | Hapus sesi, penjelasan retensi, kegagalan tanpa kehilangan edit |
| FR-13 | P0 | Validasi paket frame | Frame rusak tidak muncul sebagai pilihan siap pakai |
| FR-14 | P1 | Filter foto | Original, monochrome, warm, cool; konsisten di ekspor |
| FR-15 | P1 | Simpan draft lokal | Opt-in melalui IndexedDB; tersedia hapus dan kedaluwarsa |
| FR-16 | P1 | Berbagi file | Native share jika didukung; fallback unduh |
| FR-17 | P1 | Preset cetak | Ukuran fisik, safe area, bleed, dan proof terpisah |
| FR-18 | P2 | Frame builder | Membuat slot dan komposisi baru dengan validator |
| FR-19 | P2 | Akun/cloud | Sinkronisasi hanya setelah kebutuhan dan retensi ditetapkan |

Versi pertama tidak mencakup video/GIF, edit foto berbasis AI, deteksi wajah otomatis, galeri publik, pembayaran, integrasi printer, atau generator frame otomatis saat runtime. Fitur tersebut bukan syarat menyelesaikan web pertama.

## 6. Pengguna dan skenario utama

| Skenario | Kebutuhan | Syarat penerimaan |
|---|---|---|
| Dua teman memakai laptop | Mengambil tiga foto bertimer | Semua foto terisi berurutan; satu foto dapat diambil ulang |
| Pengguna HP punya foto lama | Mengunggah dan menyusun beberapa foto | Foto portrait/landscape tidak berubah rasio |
| Pengguna mencari desain unik | Melihat pilihan tanpa mencoba satu per satu | Thumbnail menunjukkan struktur, bukan swatch warna |
| Pengguna ingin wajah tidak terpotong | Menggeser crop atau menampilkan seluruh foto | Crop dapat diedit per slot tanpa mengubah foto lain |
| Kamera ditolak | Melanjutkan dari file perangkat | Ada tombol unggah yang langsung berfungsi |
| Pengguna mencoba beberapa frame | Mengganti desain setelah memasukkan foto | Koleksi foto tetap tersedia dan tidak tertimpa |

## 7. Alur produk dan struktur layar

### 7.1 Alur utama

Beranda → pilih frame → pilih kamera/unggah → isi foto → atur posisi dan teks → periksa hasil → unduh.

Pengguna boleh kembali memilih frame dari editor. Tidak ada kewajiban kembali ke beranda untuk mengganti desain.

### 7.2 Layar dan komponen

| Layar | Isi utama | Tindakan utama |
|---|---|---|
| Beranda | Contoh hasil, penjelasan singkat, informasi pemrosesan lokal | “Mulai bikin foto” |
| Galeri | Delapan thumbnail, kategori, jumlah slot, strip/kartu | “Pakai frame” |
| Sumber foto | Preview frame terpilih, kamera atau file | “Buka kamera” / “Pilih foto” |
| Kamera | Live view, panduan crop slot aktif, timer, progres foto | “Ambil foto”, “Ambil ulang”, “Lanjut edit” |
| Editor | Canvas, daftar foto, slot aktif, crop, teks, undo/redo | “Lihat hasil” |
| Hasil | Komposisi final, format, resolusi, kembali edit | “Unduh PNG” / “Unduh JPG” |
| Bantuan/privasi | Format file, izin kamera, penyimpanan foto, cara hapus | Kembali ke alur |

### 7.3 Layout responsif

- **Desktop ≥ 1024 px:** daftar frame/foto di kiri, preview di tengah, kontrol slot di kanan. Lebar panel dikendalikan agar preview tetap mendapat ruang.
- **Tablet 768–1023 px:** preview dan satu panel kontrol; galeri lewat drawer.
- **HP < 768 px:** preview di atas, kontrol melalui panel bawah, CTA mengikuti safe area. Tidak ada tiga kolom diperkecil.
- Pada layar pendek, preview boleh mengecil atau halaman bergulir. Tombol penting tidak boleh menutupi slot.
- Minimum lebar yang diuji 360 px. Perubahan orientasi layar tidak mengubah posisi foto dalam frame.

### 7.4 Bahasa antarmuka

Gunakan istilah “frame”, “foto”, “geser”, “perbesar”, “tampilkan utuh”, dan “unduh”. Jangan menampilkan istilah mask, CORS, schema, atau koordinat pada alur pengguna.

Contoh microcopy:

- Slot kosong: “Tambahkan foto ke sini.”
- Crop: “Geser foto agar posisinya pas.”
- Kamera ditolak: “Akses kamera belum diizinkan. Kamu tetap bisa memilih foto dari perangkat.”
- Unggah: “Foto diproses di perangkatmu dan tidak diunggah oleh aplikasi.”
- Ekspor: “Menyiapkan hasil fotomu…”
- Sesi memori: “Unduh hasil sebelum menutup atau memuat ulang halaman.”

## 8. Sistem desain dan koleksi frame

### 8.1 Prinsip visual

Foto menjadi fokus utama; dekorasi mendukung komposisi. Desain web menggunakan permukaan netral, tipografi yang mudah dibaca, dan satu warna aksen sementara agar tidak bersaing dengan frame.

Identitas frame boleh ekspresif. Perbedaan dihitung dari bentuk slot, susunan foto, ukuran relatif slot, tipografi, motif ilustrasi, dan sistem dekorasi. Untuk setiap pasangan konsep, minimal tiga dimensi tersebut harus berbeda secara jelas. Dua palet untuk bentuk dan susunan sama tetap dihitung satu konsep.

### 8.2 Delapan konsep untuk rilis

| ID | Konsep | Format/slot | Komposisi dan bentuk | Karakter visual |
|---|---|---|---|---|
| F-01 | Orbit Club | Strip, 3 | Dua kapsul horizontal + satu lingkaran; lingkaran memiliki bounding box persegi dalam piksel desain | Garis orbit, bintang geometris, judul mengikuti area melingkar; clean dan futuristik |
| F-02 | Bubble Pop | Strip, 3 | Jendela rounded dengan ukuran berbeda dan dekorasi gelembung besar | Ilustrasi glossy, bubble lettering, volume lembut; ceria tanpa efek vintage |
| F-03 | Studio Notes | Kartu, 3 | Satu foto besar dan dua foto kecil asimetris; kemiringan slot maksimal ±3° | Grid catatan modern, anotasi tipis, label kecil, whitespace |
| F-04 | Concert Pass | Strip, 2 | Satu foto portrait dominan + satu foto pendek, diselingi detail tiket | Tipografi condensed, nomor sesi dekoratif, motif perforasi; tiket konser kontemporer |
| F-05 | Pocket Arcade | Strip, 4 | Empat layar kecil dengan sudut terpotong | UI permainan orisinal, indikator level dekoratif, bentuk tombol geometris |
| F-06 | Sticker Rush | Strip, 3 | Tiga jendela rounded yang bergeser kiri/kanan; overlap hanya dekorasi | Stiker vektor orisinal, doodle tebal, label playful, irama diagonal |
| F-07 | Cloud Windows | Strip, 3 | Dua jendela lengkung dan satu jendela rounded lebih lebar | Awan ilustratif, garis mengalir, gradien ringan, lettering kecil; tenang dan modern |
| F-08 | Gallery Issue | Kartu, 4 | Satu foto hero dan tiga tile; slot persegi panjang tegas | Komposisi majalah modern, nomor edisi, editorial serif/sans, hampir tanpa stiker |

Nama di atas adalah nama konsep sementara, bukan merek produk atau janji aset sudah tersedia. Screenshot pengguna menjadi inspirasi variasi; seluruh detail visual dibuat baru.

### 8.3 Aturan area foto

- Setiap frame memiliki 2–4 slot dengan rasio dan geometri eksplisit.
- Total luas mask foto ditargetkan minimal 55% luas frame. Validator memakai luas bentuk sebenarnya, bukan hanya bounding box.
- Slot tidak saling menutupi pada rilis pertama. Kemiringan hanya pada frame yang dirancang untuk itu.
- Stiker foreground hanya boleh masuk zona tepi slot, maksimal 8% lebar/tinggi slot dari masing-masing sisi; bagian tengah tetap bersih.
- Guide pusat dipakai saat review desain. Tidak ada klaim bahwa sistem otomatis melindungi wajah; pengguna tetap mengendalikan crop.
- Teks personalisasi tidak menutupi foto. Label dekoratif yang menyerupai nomor tiket/barcode tidak memiliki fungsi transaksi.
- Background dan foreground terpisah. Background boleh solid; foreground tidak boleh memblokir jendela foto.
- Thumbnail dihasilkan dari paket frame final dan foto contoh yang berizin.

### 8.4 Format desain

| Format | Rasio | Ruang desain kanonis | Ekspor standar | Ekspor ringan |
|---|---|---|---|---|
| Strip | 1:3 | 1200 × 3600 | 1200 × 3600 px | 600 × 1800 px |
| Kartu | 2:3 | 1800 × 2700 | 1800 × 2700 px | 900 × 1350 px |

Ukuran ini adalah spesifikasi digital. Belum menjamin hasil cetak pada ukuran fisik tertentu; preset cetak dan bleed ditetapkan di P1.

### 8.5 Paket aset frame

Setiap paket berisi manifest JSON tervalidasi, background, foreground/dekorasi, definisi slot/mask, area teks, thumbnail, versi, dan catatan sumber/lisensi.

Elemen geometris, teks, dan mask sebaiknya dibuat sebagai vektor/data. Jika ilustrasi dibuat dengan AI, hasilnya dipakai sebagai aset dekorasi setelah ditinjau; lubang foto, koordinat slot, serta teks penting tetap dibuat secara deterministik. Gambar AI tunggal tidak dianggap sebagai frame siap pakai hanya karena tampak memiliki kotak kosong.

**Syarat paket siap produksi:** delapan preview dengan fixture portrait/landscape lulus, tidak ada placeholder, seluruh aset tersedia dari origin aplikasi, semua font siap, dan ekspor bisa dibuka ulang. Palet alternatif tidak menggantikan delapan konsep.

## 9. Persyaratan fungsional terperinci

### 9.1 Galeri dan pemilihan frame — FR-01

- Tampilkan nama, thumbnail hasil, jumlah slot, dan format setiap frame.
- Kategori awal: playful, clean, futuristic, dan soft; satu frame dapat memiliki beberapa tag.
- Pemilihan membuka alur foto dengan frame aktif. UI harus jelas membedakan dipilih dan belum dipilih.
- Frame gagal validasi tidak disajikan sebagai frame aktif. Aset thumbnail gagal memakai placeholder kartu bernama, bukan mengosongkan seluruh galeri.

### 9.2 Kamera — FR-02

- Minta akses hanya ketika pengguna menekan “Buka kamera”; hanya video, tanpa mikrofon.
- Gunakan HTTPS pada produksi. Kamera browser membutuhkan secure context dan izin pengguna. [Referensi: MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- Live view memakai `playsinline`; tunggu ukuran video nonzero dan frame siap sebelum capture.
- Timer tersedia 0, 3, 5, dan 10 detik; default 3 detik. Tampilkan progres “Foto 1 dari 3”.
- Default ambil satu foto per klik. Mode rangkaian mengambil sesuai jumlah slot dengan countdown baru pada setiap foto; tersedia “Hentikan”.
- Kamera depan menampilkan mirror aktif secara default dan label yang bisa diubah. Capture, editor, dan ekspor menerapkan status mirror yang sama terhadap foto saja.
- Simpan capture dari frame video penuh. Guide slot memakai perhitungan crop yang sama, bukan memotong capture dua kali.
- Tombol kamera depan/belakang muncul bila kemampuan tersedia. Di desktop, pilihan perangkat muncul setelah daftar perangkat dapat dibaca.
- Hentikan stream lama sebelum berpindah kamera; jika perpindahan gagal, sediakan coba kembali atau unggah. [Referensi: MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- Ambil ulang satu slot mengganti penempatannya; foto lama tetap berada di daftar foto selama kapasitas memungkinkan.
- Keluar layar kamera, menutup sesi, atau tab masuk background menghentikan capture/countdown dan track kamera. Kembali ke kamera memerlukan tindakan pengguna untuk membuka lagi.
- Audio countdown tidak wajib; rilis pertama cukup indikator visual dan pengumuman aksesibel.

### 9.3 Unggah — FR-03

- Format wajib: JPEG, PNG, WebP yang dapat didecode browser. Foto animasi, SVG, serta URL gambar bebas tidak diterima pada MVP.
- Maksimal 20 MB dan 24 megapiksel per file, maksimal 8 foto dalam sesi. Batas ditampilkan sebelum memilih file.
- Periksa file, hasil decode, dan ukuran piksel; ekstensi saja tidak cukup. Jika MIME kosong, coba decoder format yang didukung, lalu validasi hasilnya.
- HEIC/HEIF belum dijamin: bila format tidak didukung, jelaskan cara memilih/mengekspor JPG tanpa mengirim foto ke layanan lain.
- File diproses berurutan agar penggunaan memori terkendali. File yang gagal tidak membatalkan file lain.
- Normalisasi EXIF sekali saat decode, sebelum crop. `createImageBitmap` menyediakan orientasi dari metadata; jangan menambah rotasi EXIF lagi pada bitmap yang sudah dinormalisasi. Uji jalur fallback terpisah. [Referensi: MDN createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap).
- Hasil decode baru menggantikan slot setelah berhasil; slot lama tidak dibuang lebih dulu.

### 9.4 Penempatan foto dan pergantian frame — FR-04, FR-06

- Isi slot kosong sesuai urutan file berhasil diproses. Foto tambahan masuk daftar foto.
- Pengguna dapat memilih slot lalu menekan thumbnail foto; drag-and-drop hanya kontrol tambahan.
- Ada tombol tukar foto antara dua slot dan pilih ulang foto. Foto yang sama boleh dipakai di beberapa slot melalui tindakan eksplisit.
- Berpindah frame mempertahankan daftar foto. Isi slot berdasarkan urutan penempatan sebelumnya.
- Jika jumlah slot berkurang, foto surplus tetap di daftar; jika bertambah, slot baru kosong.
- Crop disimpan per pasangan versi frame dan slot. Kembali ke frame yang sama memulihkan crop jika foto slot masih sama.
- Pada frame baru, gunakan cover tengah dan zoom 1, lalu beri petunjuk “Periksa posisi fotomu”. Jangan membawa nilai crop dari geometri lama secara buta.
- Tidak ada crop permanen pada sumber foto; semua penyesuaian bersifat non-destruktif.

### 9.5 Editor crop — FR-05

- Cover adalah default: slot terisi penuh, kelebihan foto terpotong, rasio tetap.
- Contain berlabel “Tampilkan utuh”: seluruh foto terlihat dengan latar matte slot yang telah ditetapkan frame.
- Cover mendukung zoom 1–3× dan geser yang dibatasi agar tidak muncul celah kosong.
- Contain menggunakan zoom 1 dan posisi tengah; kontrol geser/zoom nonaktif dengan penjelasan. Beralih ke cover mengaktifkan kembali crop.
- Sediakan rotasi 90° berulang, flip horizontal, reset posisi, slider zoom, serta tombol arah/keyboard sebagai alternatif drag.
- Rotasi foto diterapkan sebelum crop. Setelah rotasi/flip, pusat disetel ulang dan pengguna diberi perubahan yang terlihat; undo memulihkan crop sebelumnya.
- Dekorasi/teks frame tidak ikut mirror atau berputar ketika foto diedit.
- Slot aktif memiliki outline dan label di UI, tetapi outline tidak ikut ekspor.

### 9.6 Teks dan tanggal — FR-07

- Frame menyediakan area judul/caption dan tanggal, bukan posisi teks bebas di seluruh canvas.
- Caption maksimal 40 grapheme, satu atau dua baris sesuai manifest. Tampilkan penghitung dan cegah karakter tambahan.
- Dukung huruf Indonesia, angka, tanda baca umum. Emoji tidak dijamin pada MVP; tampilkan pemberitahuan jika glyph tidak tersedia.
- Ukur teks dengan font yang dipakai renderer. Perkecil sampai ukuran minimum dalam manifest; jika masih tidak muat, minta teks dipendekkan. Jangan memotong diam-diam.
- Tanggal default nonaktif. Pengguna dapat memilih tanggal; simpan sebagai tanggal kalender `YYYY-MM-DD`, bukan waktu UTC yang dapat bergeser hari.
- Font disertakan dari origin aplikasi. Tunggu font terpilih dimuat dan verifikasi statusnya sebelum ekspor; `document.fonts.ready` membantu menunggu loading font selesai. [Referensi: MDN FontFaceSet.ready](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready).

### 9.7 Undo/redo — FR-08

- Simpan maksimal 30 langkah perubahan crop, penempatan, frame, teks, dan tanggal.
- Satu gerakan drag dihitung satu langkah, bukan setiap pointermove.
- History menyimpan referensi foto dan parameter, bukan salinan bitmap setiap langkah.
- Foto yang masih direferensikan undo tidak dilepas sampai langkah tersebut keluar dari history.
- Reset seluruh sesi membutuhkan konfirmasi karena menghapus pekerjaan; reset satu crop tidak membutuhkan konfirmasi.

### 9.8 Hasil dan unduhan — FR-09, FR-10

- Ekspor hanya aktif jika seluruh slot wajib terisi, foto/aset/font siap, dan tidak ada operasi decode tertunda.
- Gunakan snapshot state saat ekspor dimulai. Perubahan berikutnya tidak mengubah file yang sedang dibuat.
- PNG default, JPEG sebagai alternatif dengan quality 0,92 dan latar solid dari frame. Transparansi hasil penuh tidak ditawarkan pada MVP.
- Ekspor standar/ringan mengikuti tabel ukuran. Tidak mengalikan ukuran ekspor dengan devicePixelRatio.
- Render langsung ke canvas ekspor, bukan screenshot HTML atau bitmap preview.
- Buat Blob dan pastikan hasil bukan null/kosong. Sediakan indikator proses dan cegah double-click menghasilkan pekerjaan paralel.
- Nama file: `photobooth-{frameId}-{YYYYMMDD}-{HHmmss}.{png|jpg}` berdasarkan waktu lokal perangkat pengguna.
- Jika unduh langsung tidak berfungsi, sediakan tampilan gambar hasil dan petunjuk menyimpan. Jangan menyebut file sudah disimpan sebelum browser memprosesnya; aplikasi hanya dapat memastikan file berhasil disiapkan.
- Jika ekspor standar kehabisan memori, tawarkan “Coba ukuran ringan” secara eksplisit. Jangan menurunkan resolusi tanpa memberi tahu.
- Kegagalan ekspor mempertahankan seluruh edit dan memungkinkan retry.
- Native share pada P1 memerlukan pemeriksaan kemampuan berbagi file dan aksi klik baru setelah Blob siap. [Referensi: MDN canShare](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare).

## 10. Kontrak penempatan foto dan renderer

Bagian ini adalah kontrak implementasi untuk mencegah foto meleset. Pilihan framework boleh berubah selama kontrak dan acceptance criteria tetap dipenuhi.

### 10.1 Satu ruang koordinat

Setiap frame mempunyai `designWidth` dan `designHeight`. Slot memakai koordinat ternormalisasi 0–1 terhadap ruang desain:

`x = slot.x × designWidth`, `y = slot.y × designHeight`, `w = slot.w × designWidth`, `h = slot.h × designHeight`.

Slot lingkaran harus menghasilkan `w = h` dalam piksel desain. Jangan menyamakan nilai `slot.w` dan `slot.h` tanpa mempertimbangkan rasio frame.

Preview hanya menskalakan ruang desain. Data crop tidak disimpan dalam piksel layar. Ukuran ekspor merupakan parameter renderer yang terpisah.

### 10.2 Perhitungan cover

Setelah normalisasi orientasi serta rotasi/flip pengguna, anggap sumber efektif berukuran `Iw × Ih` dan slot lokal `Sw × Sh`.

```text
baseScale = max(Sw / Iw, Sh / Ih)
scale = baseScale × zoom
cropW = Sw / scale
cropH = Sh / scale
cx = clamp(centerX × Iw, cropW / 2, Iw - cropW / 2)
cy = clamp(centerY × Ih, cropH / 2, Ih - cropH / 2)
sourceX = cx - cropW / 2
sourceY = cy - cropH / 2
```

Gambar source rectangle `(sourceX, sourceY, cropW, cropH)` ke rectangle slot lokal `(0, 0, Sw, Sh)`, lalu clip dengan mask. Simpan kembali pusat hasil clamp sebagai nilai ternormalisasi agar state dan tampilan tidak berbeda.

Contoh: foto 4000 × 3000 ke slot 1000 × 1000 pada zoom 1 menggunakan crop 3000 × 3000. Crop tengah dimulai dari x=500, y=0. Rasio wajah tetap sama.

### 10.3 Perhitungan contain

```text
scale = min(Sw / Iw, Sh / Ih)
drawW = Iw × scale
drawH = Ih × scale
offsetX = (Sw - drawW) / 2
offsetY = (Sh - drawH) / 2
```

Isi matte slot, lalu gambar seluruh foto pada offset tersebut, tetap di dalam clip. Tidak ada stretch.

### 10.4 Urutan render

1. Pastikan semua sumber siap dan ambil snapshot state.
2. Tetapkan ukuran internal canvas sebelum menggambar.
3. Bersihkan canvas dan tetapkan transform awal secara eksplisit.
4. Gambar background.
5. Untuk setiap slot: save context → transform ke slot → bangun path mask → clip → isi matte → gambar foto → restore context.
6. Gambar foreground/dekorasi.
7. Gambar teks personalisasi/tanggal sesuai manifest.
8. Tampilkan overlay interaksi secara terpisah; jangan sertakan dalam ekspor.

Slot dengan rotasi menggunakan transform terhadap pusat slot. Mask, foto, dan hit-testing harus mengikuti transform yang sama. Dekorasi menggunakan geometri frame.

### 10.5 Preview, DPR, dan input

- Preview backing buffer mengikuti ukuran tampil × DPR yang dibatasi maksimal 2 untuk mengurangi beban; ini tidak mengubah model geometri.
- Ekspor memakai ukuran output yang diminta, tanpa ketergantungan DPR perangkat. [Referensi DPR canvas: MDN devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio).
- Posisi pointer dari client coordinates dikonversi melalui bounding rectangle canvas ke ruang desain.
- Untuk slot berputar, inverse-transform pointer ke koordinat lokal slot sebelum menghitung drag/crop.
- Letterboxing/padding container tidak ikut dianggap area canvas aktif. Hindari ukuran CSS yang mengubah rasio frame.
- Setiap resize memicu render penuh dari state; jangan mengandalkan bitmap yang sebelumnya tergambar.
- Gunakan pasangan save/restore di setiap slot supaya clip dan transform tidak bocor ke slot berikutnya.

### 10.6 Loading dan race condition

- Gambar memiliki status pending/ready/error; tunggu `decode()` atau jalur onload sebelum dipakai. [Referensi: MDN decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode).
- Render asynchronous menyertakan revision token. Hasil loading frame lama tidak boleh menimpa frame yang lebih baru.
- Reference counting mengendalikan kapan Object URL boleh dilepas; jangan revoke ketika foto masih dipakai canvas/history/ekspor.
- Mengganti foto, frame, atau font menonaktifkan ekspor hingga sumber yang diperlukan siap.

### 10.7 Validator geometri dan aset

- Semua angka finite; lebar/tinggi positif; bounds yang sudah ditransformasi berada dalam frame.
- Semua ID slot unik, urutan jelas, dan jumlah slot 2–4.
- Bentuk yang didukung MVP: rect, roundedRect, circle, dan path vektor kurasi. Path tak dikenal atau gagal parse menolak frame tersebut.
- Path kurasi punya viewport lokal eksplisit yang dipetakan ke ukuran slot. RoundedRect menggunakan radius piksel ruang desain, dibatasi setengah sisi terpendek.
- Foreground tidak boleh memiliki area opaque di interior mask yang dilindungi; uji alpha dengan pengecualian dekorasi tepi yang dicatat.
- Tidak ada overlap antar mask foto pada katalog MVP; overlap dekorasi diperbolehkan sesuai aturan.
- Referensi aset harus tersedia, ukuran sesuai, font valid, dan tidak merujuk ke URL arbitrary.
- Versi manifest diikat ke versi aset agar koordinat baru tidak memakai gambar lama dari cache.

## 11. Model data dan kontrak paket

### 11.1 Entitas

| Entitas | Field inti | Aturan |
|---|---|---|
| FrameDefinition | id, version, designWidth/Height, slots, layers, textAreas, palette, thumbnail, licenses | Data immutable dan tervalidasi |
| SlotDefinition | id, order, x/y/w/h, shape, radius/pathRef, rotationDeg, matteColor | Koordinat normalisasi; rotation default 0 |
| PhotoAsset | id, blobRef, normalizedWidth/Height, sourceType, decodeStatus | Sumber dinormalisasi sekali; tanpa upload aplikasi |
| Placement | slotId, photoId, fitMode, centerX/Y, zoom, rotation, mirror | Crop per slot; nilai finite dan dibatasi |
| Session | frameId/version, photos, placements, caption, date, revision | State utama editor |
| HistoryEntry | before/after state references | Maksimal 30 langkah, tanpa duplikasi bitmap |
| ExportJob | sessionRevision, format, dimensions, status, blobRef/errorCode | Satu pekerjaan aktif; input immutable |

### 11.2 Contoh manifest geometri

Contoh ini khusus untuk menunjukkan kontrak tiga slot rounded sederhana. Ini bukan salah satu dari delapan frame final, bukan aset yang sudah dibuat, dan tidak menggantikan review desain.

```json
{
  "id": "geometry-demo",
  "version": 1,
  "designWidth": 1200,
  "designHeight": 3600,
  "layers": {
    "background": "/frames/geometry-demo/v1/background.png",
    "foreground": "/frames/geometry-demo/v1/foreground.png"
  },
  "slots": [
    {"id":"p1","order":1,"x":0.1,"y":0.08,"w":0.8,"h":0.23,"shape":"roundedRect","radius":48,"rotationDeg":0,"matteColor":"#F5F1EB"},
    {"id":"p2","order":2,"x":0.1,"y":0.335,"w":0.8,"h":0.23,"shape":"roundedRect","radius":48,"rotationDeg":0,"matteColor":"#F5F1EB"},
    {"id":"p3","order":3,"x":0.1,"y":0.59,"w":0.8,"h":0.23,"shape":"roundedRect","radius":48,"rotationDeg":0,"matteColor":"#F5F1EB"}
  ],
  "textAreas": [
    {"id":"caption","x":0.1,"y":0.85,"w":0.8,"h":0.08,"fontId":"caption-sans","fontSize":72,"minFontSize":48,"maxGraphemes":40,"maxLines":2,"align":"center"}
  ]
}
```

Field produksi tambahan mencakup kategori, nama, format, thumbnail, metadata path, font registry, warna teks, serta lisensi. JSON Schema menjadi sumber validasi paket; renderer tidak menebak geometri dari PNG.

## 12. Arsitektur implementasi yang diusulkan

### 12.1 Pilihan teknis awal

Web client menggunakan TypeScript, komponen UI React, build tool Vite, dan Canvas 2D untuk komposisi. Pilihan ini merupakan usulan proyek; versi dependensi dipilih, diverifikasi kompatibilitasnya, lalu dikunci saat implementasi. Tidak ada klaim penggunaan versi “terbaru” dalam PRD.

Web dapat di-host sebagai aplikasi statis dengan HTTPS. Backend tidak diperlukan untuk kamera, crop, dan ekspor lokal. Kebutuhan akun, upload server, atau pembayaran akan mengubah arsitektur dan dibahas sebagai lingkup terpisah.

### 12.2 Modul dan tanggung jawab

| Modul | Tanggung jawab |
|---|---|
| Frame catalog/validator | Memuat manifest, memeriksa paket, memberi galeri frame valid |
| Camera controller | Lifecycle stream, readiness, timer, capture, penanganan izin |
| Photo ingest | Validasi file, decode, normalisasi orientasi, manajemen Blob |
| Session store | Foto, placements, teks, frame, revision, history |
| Geometry engine | Cover/contain, clamp, shape bounds, transform, hit-testing |
| Renderer | Background, foto clipped, dekorasi, teks untuk preview/ekspor |
| Export manager | Snapshot, resolusi, PNG/JPEG Blob, fallback dan retry |
| UI flow | Galeri, sumber foto, kamera, editor, hasil, bantuan |
| Local drafts P1 | IndexedDB, opt-in, expiry, restore, hapus |

UI dan renderer dipisah. Fungsi geometri harus bisa diuji tanpa DOM. Renderer menerima frame, session snapshot, assets siap, dan dimensi output. Tidak memakai ukuran elemen UI sebagai sumber kebenaran slot.

### 12.3 Aset dan konfigurasi

- Manifest/aset frame dan font dikirim dari origin aplikasi dengan versi di path.
- Thumbnail kecil dimuat di galeri; aset resolusi penuh dimuat hanya untuk frame aktif.
- Foto pengguna tidak dimasukkan ke URL, query parameter, log, ataupun bundel.
- Navigasi internal dapat memakai router; hosting wajib mendukung fallback ke halaman aplikasi jika memakai path route.
- MVP tidak memakai service worker atau janji bisa dipakai offline. Tambahkan hanya setelah strategi cache/update dirancang.
- Domain, penyedia hosting, anggaran, dan nama produk dipilih saat implementasi; spesifikasi tidak bergantung pada penyedia tertentu.

## 13. State aplikasi dan penanganan kesalahan

### 13.1 State utama

`frame-selection → source-selection → camera/upload → editing → preparing-export → result-ready`.

Camera state: `idle → requesting → live → counting → capturing → live`, dengan `error` dan `stopped` sebagai kondisi eksplisit. Tidak boleh capture sebelum live/ready.

Export state: `idle → rendering → encoding → ready` atau `failed`. UI tidak menampilkan “hasil siap” jika encoding belum berhasil.

### 13.2 Pesan kegagalan dan pemulihan

| Kondisi | Pesan pengguna | Pemulihan |
|---|---|---|
| Kamera ditolak | “Kamera belum diizinkan.” | Petunjuk izin browser + unggah |
| Kamera tidak ada | “Perangkat ini belum memiliki kamera yang tersedia.” | Unggah |
| Kamera dipakai aplikasi lain | “Kamera belum bisa dibuka. Coba tutup aplikasi yang sedang memakainya.” | Coba lagi + unggah |
| Video belum siap | “Menyiapkan kamera…” | Timeout terkendali, retry; tidak mengambil foto hitam |
| File tidak didukung | “Format ini belum didukung. Pilih JPG, PNG, atau WebP.” | Pilih file lain |
| File melewati batas | “Foto terlalu besar untuk diproses di perangkat ini.” | Tampilkan batas MB/MP dan sarankan salinan lebih kecil |
| File rusak | “Foto ini tidak berhasil dibaca.” | Pertahankan file lain dan penempatan sebelumnya |
| Aset frame gagal | “Frame ini belum bisa dimuat.” | Coba lagi atau pilih frame lain; foto tetap tersimpan |
| Slot kosong | “Tambahkan foto untuk bagian yang masih kosong.” | Sorot slot pertama kosong |
| Font gagal | “Teks frame belum siap. Coba muat ulang frame.” | Retry; jangan ekspor dengan font berbeda diam-diam |
| Memori/encoding gagal | “Hasil belum berhasil dibuat.” | Retry dan ukuran ringan |
| Unduh tidak tersedia | “Hasil sudah siap. Buka gambar untuk menyimpannya.” | Tampilan Blob gambar dan petunjuk perangkat |

Detail teknis disimpan sebagai kode error non-sensitif untuk debugging. Pengguna tidak perlu membaca stack trace.

## 14. Privasi, penyimpanan, dan keamanan dasar

- Foto/capture diproses lokal. Tidak ada endpoint upload foto pada MVP.
- Data sesi berada di memori tab. Reload/menutup tab menghapus kemampuan memulihkan sesi; sampaikan sebelum pengguna mulai.
- “Hapus sesi” membersihkan foto, history, Blob/Object URL, hasil ekspor, dan track kamera aplikasi. Ini tidak menghapus file yang sudah diunduh pengguna.
- Jangan memasang session replay atau analitik yang mengambil canvas/foto. Jika analitik digunakan, payload hanya event dan kode error; tidak menyertakan caption, tanggal, filename, bytes, atau thumbnail.
- Font dan aset aplikasi tidak membutuhkan layanan pihak ketiga saat sesi pengguna berjalan.
- Teks diperlakukan sebagai plain text, bukan HTML. Tidak mengizinkan pengguna mengunggah SVG atau memasukkan URL aset bebas pada MVP.
- Terapkan HTTPS dan header keamanan sesuai aplikasi. Kamera hanya diaktifkan pada origin aplikasi; mikrofon dinonaktifkan.
- Pengguna memakai foto yang memang dapat mereka gunakan. Foto contoh, font, stiker, dan ilustrasi memiliki catatan sumber/lisensi sebelum rilis.
- P1 draft lokal meminta pilihan “Simpan di perangkat ini”, tersedia daftar/hapus draft, dan expiry default 24 jam dengan pengecekan saat aplikasi dibuka. Browser tetap dapat membersihkan storage lebih awal; jangan menjanjikan penyimpanan permanen.
- Tanpa akun/cloud, link web tidak dapat membagikan sesi berisi foto. Berbagi pada P1 adalah berbagi file yang sudah dibuat.

## 15. Kebutuhan nonfungsional

### 15.1 Kinerja

- Galeri harus interaktif tanpa memuat seluruh aset resolusi tinggi.
- Decode maksimal satu foto besar secara bersamaan pada jalur awal.
- Bitmap preview dibatasi sisi terpanjang 1600 px. Simpan Blob sumber dan metadata orientasi; jangan mempertahankan delapan bitmap penuh 24 MP sekaligus. Ekspor membaca sumber resolusi penuh secara bertahap, dengan orientasi dinormalisasi sekali pada jalur decode tersebut, bukan memperbesar bitmap preview.
- Gunakan thumbnail terpisah untuk daftar foto. Jangan menyimpan banyak salinan base64 foto dalam state/history.
- Lepas resource yang tidak lagi direferensikan; uji pergantian frame dan ekspor berulang untuk mendeteksi akumulasi memori.
- Target interaksi crop terasa responsif; pada perangkat referensi, frame time p95 ≤ 33 ms untuk drag dengan aset sudah siap.
- Ekspor memblokir tombol unduh sementara, tetapi halaman tetap dapat menampilkan status proses.
- Ukur galeri, decode, render, dan encode terpisah. Angka performa tidak mengikutsertakan waktu pengguna memberi izin/memilih file.

### 15.2 Aksesibilitas dan kegunaan

- Tombol sentuh minimal 44 × 44 CSS px; status aktif terlihat selain lewat warna.
- Kontrol mendapat nama aksesibel, fokus terlihat, dan urutan tab mengikuti alur.
- Keyboard dapat memilih frame/foto, memilih slot, menggeser crop, mengganti zoom, dan mengunduh.
- Drag bukan satu-satunya cara mengatur foto. Sediakan tombol arah, slider, dan pemilihan thumbnail.
- Canvas diberi deskripsi; daftar slot dan kontrol disediakan dalam HTML yang dapat dibaca pembaca layar.
- Countdown/pesan proses diumumkan secukupnya; hormati reduced motion dan hindari flash layar.
- Kontras target minimal 4,5:1 untuk teks biasa pada UI; dekorasi frame boleh artistik selama kontrol tetap terbaca.
- Dialog/drawer menjaga fokus dan dapat ditutup dengan Escape; keyboard virtual tidak menutupi CTA pada HP.

### 15.3 Kompatibilitas

- Browser wajib: Chrome Android, Safari iOS, serta Chrome/Edge desktop pada versi stabil dan satu versi mayor sebelumnya saat rilis.
- Firefox desktop diuji tambahan; jika ada keterbatasan, dokumentasikan secara spesifik.
- Uji pada perangkat nyata untuk izin kamera, switch kamera, orientasi EXIF, tab background, memory, dan unduh. Emulasi viewport saja tidak cukup.
- In-app browser menjadi dukungan best-effort. Jika kamera tidak tersedia, unggah tetap tersedia dan ada petunjuk membuka browser utama.
- Feature detection mengendalikan kamera, decoder, dan share; jangan mengandalkan nama browser saja.

## 16. Acceptance criteria utama

| ID | Kondisi | Perilaku yang wajib terbukti |
|---|---|---|
| AC-01 | Galeri dibuka | Ada 8 konsep valid, masing-masing sesuai thumbnail dan jumlah slot |
| AC-02 | Foto portrait dipasang pada slot landscape | Rasio tidak berubah, cover terisi, crop dapat digeser |
| AC-03 | Foto landscape dipasang pada slot portrait | Tidak stretch; contain menampilkan seluruh foto dengan matte |
| AC-04 | Slot circle/path digunakan | Foto tidak muncul di luar mask, termasuk setelah zoom/resize |
| AC-05 | Preview berubah dari 360 ke 1440 px | Placement tetap sama dalam ruang desain |
| AC-06 | DPR 1, 2, atau 3 | Dimensi file ekspor tetap mengikuti pilihan resolusi |
| AC-07 | Frame diganti dari 4 ke 2 slot lalu kembali | Foto surplus tetap ada; crop lama pulih jika mapping foto sama |
| AC-08 | Izin kamera ditolak | Pengguna dapat menyelesaikan dengan unggah tanpa reload |
| AC-09 | Rangkaian kamera dihentikan | Tidak ada capture berikutnya; foto berhasil sebelumnya tetap ada |
| AC-10 | Ambil ulang foto kedua | Foto lain dan editnya tidak berubah |
| AC-11 | EXIF portrait/mirror dari HP | Orientasi benar dan tidak diterapkan dua kali |
| AC-12 | Mirror/rotasi foto diubah | Preview dan ekspor sama; tulisan/dekorasi frame tidak ikut terbalik |
| AC-13 | Satu file unggah rusak | File lain tetap masuk; slot lama tidak terhapus |
| AC-14 | Slot wajib masih kosong | Ekspor tidak aktif, slot kosong diberi arahan |
| AC-15 | Ekspor standar PNG/JPEG | Blob valid dapat didecode kembali dengan dimensi yang benar |
| AC-16 | Hasil dibandingkan preview | Foto, mask, crop, teks, dan urutan lapisan sama |
| AC-17 | Caption melewati kapasitas | Ada batas yang jelas; tidak keluar area atau terpotong diam-diam |
| AC-18 | Undo/redo setelah drag/frame switch | Mengembalikan keadaan sebelumnya dengan foto tetap tersedia |
| AC-19 | Aset lama selesai load setelah frame baru dipilih | Frame aktif tidak tertimpa hasil asynchronous lama |
| AC-20 | Kamera ditinggalkan/tab background | Countdown berhenti dan track kamera dilepas |
| AC-21 | Hapus sesi | Foto aplikasi, history, output, dan kamera dibersihkan |
| AC-22 | Audit request jaringan selama alur | Tidak ada bytes foto/caption pengguna yang dikirim aplikasi |
| AC-23 | Navigasi keyboard di HP/desktop | Alur unggah→edit→unduh dapat diselesaikan tanpa drag |
| AC-24 | Ekspor gagal | Edit dipertahankan; tersedia retry/ukuran ringan |

Semua AC di atas adalah gate rilis. Dokumen ini belum menyatakan bahwa pengujian tersebut telah dijalankan pada website.

## 17. Rencana pengujian

### 17.1 Fixture yang wajib tersedia

Foto landscape 4:3, portrait 3:4, persegi, panorama, portrait sangat panjang, foto kecil, PNG transparan, WebP, JPEG EXIF orientasi 1–8, file rusak, file terlalu besar, dan foto dengan pola grid/gambar asimetris untuk mendeteksi flip serta stretch.

Setiap frame diuji dengan foto portrait, landscape, dan fixture grid. Gunakan foto contoh yang berizin, bukan foto pribadi tanpa persetujuan.

### 17.2 Jenis pengujian

| Jenis | Fokus | Bukti |
|---|---|---|
| Unit | Cover/contain, clamp, koordinat, rotasi, inverse transform, validator | Test deterministik dengan angka dan kasus batas |
| Integration renderer | Mask, layer, readiness, state revision, text fit | File hasil render dan perbandingan visual |
| End-to-end | Unggah→edit→ganti frame→ekspor, error recovery | Alur otomatis dan output yang dibuka ulang |
| Perangkat nyata | Kamera/izin/switch, EXIF, unduh Safari, background tab | Checklist model/OS/browser dan hasil |
| Visual QA | Delapan frame, caption terpanjang, tepi mask | Contact sheet preview/ekspor ukuran sama |
| Privasi/resource | Jaringan, Object URL, track kamera, memori berulang | Log non-sensitif dan audit lifecycle |
| Uji pengguna | Kejelasan alur dan daya tarik variasi | Catatan tugas 10 peserta dan isu prioritas |

### 17.3 Pemeriksaan visual khusus

- Render semua delapan frame ke PNG standar/ringan.
- Pastikan area terlindungi foreground transparan, tidak ada garis foto bocor, dan sudut rounded/circle rapi.
- Bandingkan preview yang diskalakan dengan file ekspor pada ukuran sama. Antialias/font rasterization lintas browser boleh berbeda tipis; perbedaan geometri/crop tidak boleh disamarkan sebagai toleransi warna.
- Periksa slot berputar dengan pointer, keyboard, crop, dan inverse transform.
- Periksa teks terpanjang, tanggal aktif/nonaktif, dan matte contain pada setiap bentuk.
- Ulangi pilih frame→edit→ekspor minimal 10 siklus untuk menilai resource bertambah tanpa dilepas.

### 17.4 Klasifikasi bug

**Blocker:** foto hilang/tertutup, crop meleset, ekspor gagal, izin kamera membuat alur buntu, upload foto tidak disengaja, atau kamera terus menyala setelah keluar.

**Mayor:** satu frame rusak, kontrol utama tidak bisa dipakai di HP, undo merusak penempatan, atau teks hasil berbeda.

**Minor:** masalah dekorasi/spacing yang tidak menghalangi alur. Blocker dan mayor wajib nol sebelum rilis.

## 18. Tahapan pembangunan sampai selesai

Urutan mengikuti risiko: buktikan engine foto terlebih dahulu, baru selesaikan koleksi dekorasi. Estimasi kalender ditetapkan setelah pengembang menilai kapasitas; milestone selesai berdasarkan bukti, bukan hanya tampilan.

| Tahap | Pekerjaan | Deliverable dan gate selesai |
|---|---|---|
| M0 — Tetapkan dasar | Finalisasi nama sementara, format, batas file, keputusan lingkup | PRD/backlog terkonfirmasi; tidak perlu menunggu merek final untuk prototipe |
| M1 — Prototipe penempatan | Satu frame sederhana, file lokal, cover/contain, clipping, preview/ekspor | Fixture portrait/landscape/grid dan PNG ekspor cocok; AC-02–06,15–16 terbukti |
| M2 — Arah visual | Sketsa 8 konsep, geometri, area teks, review variasi | Delapan konsep memenuhi ≥3 dimensi perbedaan; seluruh slot layak dipakai |
| M3 — Alur foto | Kamera, izin, timer, upload, normalisasi, retake | Alur kamera/upload berjalan; error recovery di perangkat nyata |
| M4 — Editor lengkap | Crop, zoom, rotation, mirror, swap, frame switch, teks, history | Semua perubahan non-destruktif dan konsisten di ekspor |
| M5 — Paket frame final | Produksi background/foreground/mask/font/thumbnail | 8 paket tervalidasi, berizin, tidak ada placeholder |
| M6 — Responsif dan reliabilitas | UI HP, aksesibilitas, memori, performa, format output | Semua AC lulus pada matriks browser/perangkat wajib |
| M7 — Preview rilis | Deploy staging HTTPS, QA, uji pengguna, perbaiki bug | Tidak ada blocker/mayor; laporan QA dan build kandidat tersimpan |
| M8 — Peluncuran | Domain, deployment produksi, smoke test, rollback | URL publik HTTPS bekerja; kamera dan unduh diuji kembali di produksi |
| M9 — Stabilitas awal | Pantau error non-sensitif dan feedback | Perbaiki regresi; P1 masuk setelah P0 stabil |

Desainer dan pengembang bisa merupakan orang yang sama. Pemilik produk menentukan arah visual; pengembang bertanggung jawab pada geometri/render/lifecycle; QA mencatat bukti acceptance.

## 19. Backlog kerja dan dependensi

| Kelompok | Tugas konkret | Dependensi |
|---|---|---|
| Fondasi | Setup aplikasi, types/schema, frame catalog, error boundary | M0 |
| Engine | Transform, cover/contain, masks, renderer, output Blob | Schema |
| Input | Kamera lifecycle, file ingest, EXIF, resource registry | Engine dasar |
| Editor | Session store, controls, crop history, frame cache | Engine + input |
| Konten | 8 paket frame, font registry, thumbnails, licenses | Schema + arah visual |
| Output | Ukuran standar/ringan, PNG/JPEG, retry, save fallback | Renderer + state snapshot |
| Kualitas | Test fixture, perangkat nyata, responsif, aksesibilitas, resource audit | Semua P0 |
| Rilis | Staging, HTTPS, domain, headers, cache, smoke, rollback | Gate QA |

Tugas yang tidak boleh ditunda ke “finishing”: uji export, alpha foreground, kamera fallback, normalisasi EXIF, responsif HP, dan pemetaan crop. Itu bagian inti produk.

## 20. Peluncuran dan operasional

### 20.1 Sebelum produksi

- Build bersih, dependency lockfile tersimpan, dan konfigurasi produksi tervalidasi.
- Semua halaman/rute dibuka langsung dari URL staging; navigasi tidak menghasilkan 404.
- HTTPS aktif dan camera permissions sesuai origin; uji perangkat nyata pada staging.
- Delapan frame dan font dimuat tanpa path rusak, mixed content, atau kegagalan CORS.
- Pilihan cache mengikat aset ke versi manifest; hindari versi lama tertahan setelah deploy.
- Tidak ada tombol pura-pura, link kosong, placeholder, atau klaim privasi yang tidak sesuai jaringan.
- Simpan build sebelumnya serta prosedur rollback yang sudah dicoba di staging.

### 20.2 Smoke test setelah deploy

1. Buka beranda dan galeri melalui URL publik HTTPS.
2. Unggah fixture portrait/landscape, edit crop, lalu ganti frame.
3. Ambil foto kamera di satu laptop dan satu HP.
4. Unduh PNG dan JPEG, buka ulang, verifikasi ukuran serta posisi foto.
5. Tolak izin kamera dan selesaikan melalui unggah.
6. Audit bahwa foto tidak dikirim dalam request aplikasi.
7. Tutup kamera dan pastikan indikator kamera perangkat berhenti.

### 20.3 Pemeliharaan

- Catat error kode, versi aplikasi/frame, browser, serta durasi proses tanpa data foto.
- Metrik produk dapat dihitung lewat `frame_selected`, `input_ready`, `export_requested`, `export_ready`, dan `export_failed`. `export_ready` berarti file disiapkan, bukan pasti disimpan pengguna.
- Karena MVP tidak mewajibkan analitik, gunakan QA/uji pengguna untuk baseline. Penggunaan analitik server perlu keputusan terpisah dan pemeriksaan privasi.
- Jika satu frame regresi, nonaktifkan paket tersebut melalui rilis katalog terkontrol; jangan menghapus foto pengguna yang sedang mengedit. Jika engine ekspor rusak luas, rollback build.
- Setiap frame baru melewati validator, contact sheet, fixtures, lisensi, dan matriks ekspor yang sama.

## 21. Risiko dan keputusan lanjutan

| Risiko | Dampak | Mitigasi/keputusan |
|---|---|---|
| Desain hanya berbeda warna | Tidak memenuhi arah produk | Review perbedaan ≥3 dimensi sebelum aset final |
| Ilustrasi frame dibuat sebagai gambar flat | Foto tertutup atau slot tak bisa dipakai | Paket berlapis + mask/geometri eksplisit |
| Preview DOM dan ekspor canvas terpisah | Crop/layer meleset | Satu renderer dan ruang desain |
| Perangkat HP kehabisan memori | Decode/ekspor gagal | Batas file/piksel, decode serial, ukuran ringan, audit lifecycle |
| HEIC pengguna tidak terbaca | Alur upload terhambat | Jelaskan format wajib; konversi lokal dipertimbangkan P1 setelah diuji |
| Kamera berbeda antar perangkat | Capture gagal/terbalik | Feature detection, EXIF/mirror tests, upload fallback |
| Font/ilustrasi eksternal tidak tersedia | Hasil berubah atau export gagal | Aset same-origin, versi, readiness gate |
| Scope akun/pembayaran masuk terlalu awal | Rilis P0 tertunda | Tetapkan sebagai perubahan PRD terpisah |

Keputusan yang dapat ditunda tanpa menghalangi prototipe: nama merek final, domain, hosting, filter P1, dan jumlah palet alternatif. Arah visual delapan konsep perlu ditinjau sebelum produksi aset penuh. Jika cloud sharing atau akun dipilih nanti, tetapkan retensi, akses, biaya, dan keamanan sebagai spesifikasi tambahan.

## 22. Definition of Done

Website dianggap selesai untuk rilis pertama ketika seluruh poin berikut terbukti:

- [ ] P0 FR-01–FR-13 berfungsi penuh.
- [ ] Delapan konsep frame final memiliki perbedaan yang jelas, aset lengkap, dan lisensi tercatat.
- [ ] Semua slot menerima foto, clipping/crop benar, dan foto tidak stretch.
- [ ] Kamera dan unggah dapat menyelesaikan alur sampai hasil tersedia.
- [ ] Semua AC-01–AC-24 lulus dengan bukti pada matriks wajib.
- [ ] PNG/JPEG standar/ringan valid dan preview sesuai hasil.
- [ ] UI HP/laptop serta alur keyboard diperiksa.
- [ ] Tidak ada blocker atau mayor; batasan minor tercatat.
- [ ] Foto tidak dikirim oleh aplikasi; track kamera dan resource dilepas sesuai lifecycle.
- [ ] Tidak ada placeholder, tombol palsu, link kosong, atau frame rusak dalam katalog.
- [ ] URL produksi HTTPS, seluruh aset/rute berfungsi, dan smoke test produksi lulus.
- [ ] Tersedia source, lockfile, petunjuk menjalankan/build/deploy, registry frame, laporan QA, dan prosedur rollback.

Pembuatan PRD ini tidak mencentang gate website. Checklist diisi dengan bukti saat implementasi, sehingga “sudah jadi” berarti pengguna benar-benar bisa membuat dan menyimpan hasil fotonya.
