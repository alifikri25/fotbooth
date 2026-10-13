# Efek AR Fotbooth

Status: diterapkan ke kamera dan publik di [Fotbooth](https://fotbooth.pages.dev) setelah persetujuan pengguna pada 7 Oktober 2026. Pilih **AR playground** setelah membuka kamera.

| Kelompok | Pilihan | Perilaku |
| --- | --- | --- |
| Telinga | Kitty Club, Bunny Pop, Teddy Mood | Telinga, hidung dan pipi mengikuti wajah |
| Kacamata | Disco Glasses | Kacamata berbingkai emas mengikuti garis mata |
| Kepala | Golden Crown, Ribbon Crush, Party Time | Mahkota, pita atau topi pesta mengikuti sudut kepala |
| Makeup | Peach Freckles | Blush, freckles dan glitter mengikuti pipi |
| Orbit | Heart Orbit, Butterfly Halo | Hati atau kupu-kupu bergerak mengelilingi wajah |
| Reaksi | Smile Confetti, Comic Boom | Confetti saat senyum; burst saat senyum atau membuka mulut |
| Latar | Peach Studio, Aqua World, Neon City | Latar diganti menggunakan segmentasi orang |
| Siluet | Neon Silhouette | Cahaya cyan/magenta mengikuti batas orang |

16 efek ditambah **Tanpa AR**. Wajah yang belum terdeteksi menampilkan petunjuk; aksesori tidak dipasang sembarang di tengah layar. Pelacakan hingga dua wajah. Bila model gagal atau perangkat tidak mendukung AR, kamera biasa dan unggah foto tetap tersedia.

Foto asli disimpan terpisah dari snapshot landmark/ekspresi/mask AR. Editor dapat mematikan AR, lalu mengembalikannya melalui checkbox atau undo. Mirror, crop, zoom dan putaran diterapkan pada foto dan AR bersama. Efek warna tetap tersedia; PNG/JPEG menggunakan kompositor yang sama. Animasi dibekukan ketika shutter. Latar/makeup/aksesori adalah visual 2D; tidak memerlukan sensor kedalaman.

Runtime MediaPipe Tasks Vision 1.1.0 dan model versi 1 disajikan dari origin Fotbooth. Kamera tidak dikirim ke server. Model/WASM dimuat ketika AR dipilih; inferensi memakai sisi panjang maksimal 640px dan pratinjau maksimal 10Hz. Worker digunakan jika OffscreenCanvas WebGL tersedia; Safari lama memakai CPU di jalur utama dengan batas yang sama. Bila worker gagal memakai konteks grafisnya, worker dihentikan dan gambar yang sama dicoba pada jalur utama. Pembatalan tetap menghentikan inferensi dan melepas bitmap. Runtime dihentikan saat Tanpa AR, keluar kamera atau tab tersembunyi. CSP hanya menambah izin kompilasi WASM dan worker dari origin sendiri.

Unduhan pertama sekitar 17 MB untuk aksesori wajah, atau 13 MB untuk latar (sebagian besar WASM, disimpan cache browser). Performa tetap bergantung pada perangkat, pencahayaan dan posisi wajah. Sisakan ruang di atas kepala dan lihat panduan slot. Mask rambut/tepi dapat kurang rapi pada cahaya rendah atau latar yang mirip. Tes otomatis mencakup model asli, dua wajah, pembatalan pemuatan, raster, transformasi, editor, ekspor dan CSP. Kamera fisik dan matriks HP belum diuji.

Referensi implementasi: [Face Landmarker web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js), [Image Segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter). Sumber, versi dan hash aset tercatat dalam [provenance runtime](../artwork/provenance/ar-runtime-20261007.json). Jalankan `node scripts/sync-ar-assets.mjs` untuk memulihkan aset dari versi yang sama; build normal tidak mengunduh model.
