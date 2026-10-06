# Registry 60 frame Fotbooth

Katalog aktif: **60 frame** — 16 frame sebelumnya dan 44 edisi dekoratif dari 26 tema baru. Beberapa tema punya lebih dari satu komposisi; ini bukan klaim 60 tema independen. Batas katalog mengikuti permintaan terakhir pengguna. Paket yang tidak dipakai diarsipkan lokal dan tidak ikut source/public build.

Setiap paket versi 1 berisi manifest, background SVG, foreground SVG dan thumbnail PNG hasil renderer aplikasi. Strip: 1200×3600; card: 1800×2700. Mask foto valid dan luas foto minimal 55%. Artwork baru memiliki mask tambahan agar dekorasi tidak menutupi interior foto atau area judul/caption/tanggal.

| Frame | ID | Koleksi | Format | Foto |
| --- | --- | --- | --- | --- |
| Orbit Club | orbit-club | Original collection | strip | 3 |
| Bubble Pop | bubble-pop | Original collection | strip | 3 |
| Studio Notes | studio-notes | Original collection | card | 3 |
| Concert Pass | concert-pass | Original collection | strip | 2 |
| Pocket Arcade | pocket-arcade | Original collection | strip | 4 |
| Sticker Rush | sticker-rush | Original collection | strip | 3 |
| Cloud Windows | cloud-windows | Original collection | strip | 3 |
| Gallery Issue | gallery-issue | Original collection | card | 4 |
| Mochi Party | mochi-party | Original collection | strip | 3 |
| Kitty Club | kitty-club | Original collection | strip | 3 |
| Comic Dash | comic-dash | Original collection | card | 3 |
| Froggy Day | froggy-day | Original collection | card | 2 |
| Candy Bounce | candy-bounce | Original collection | strip | 4 |
| Space Pals | space-pals | Original collection | strip | 3 |
| Monster Moods | monster-moods | Original collection | card | 4 |
| Peach Picnic | peach-picnic | Original collection | card | 3 |
| Petal Post Trio | petal-post-trio | Petal Post | strip | 3 |
| Petal Post Arch | petal-post-arch | Petal Post | strip | 3 |
| Petal Post Mosaic | petal-post-mosaic | Petal Post | card | 4 |
| Petal Post Story | petal-post-story | Petal Post | card | 3 |
| Ribbon Diary Trio | ribbon-diary-trio | Ribbon Diary | strip | 3 |
| Ribbon Diary Wander | ribbon-diary-wander | Ribbon Diary | strip | 3 |
| Ribbon Diary Portrait | ribbon-diary-portrait | Ribbon Diary | card | 2 |
| Ribbon Diary Polaroid | ribbon-diary-polaroid | Ribbon Diary | card | 4 |
| Cherry Kiss Trio | cherry-kiss-trio | Cherry Kiss | strip | 3 |
| Cherry Kiss Film | cherry-kiss-film | Cherry Kiss | strip | 3 |
| Cherry Kiss Story | cherry-kiss-story | Cherry Kiss | card | 3 |
| Denim Daisy Trio | denim-daisy-trio | Denim Daisy | strip | 3 |
| Denim Daisy Portrait | denim-daisy-portrait | Denim Daisy | card | 2 |
| Denim Daisy Polaroid | denim-daisy-polaroid | Denim Daisy | card | 4 |
| Star Studio Wander | star-studio-wander | Star Studio | strip | 3 |
| Midnight Film Film | midnight-film-film | Midnight Film | strip | 3 |
| Midnight Film Polaroid | midnight-film-polaroid | Midnight Film | card | 4 |
| Citrus Club Mini | citrus-club-mini | Citrus Club | strip | 4 |
| Ocean Postcard Trio | ocean-postcard-trio | Ocean Postcard | strip | 3 |
| Ocean Postcard Story | ocean-postcard-story | Ocean Postcard | card | 3 |
| Botanical Journal Trio | botanical-journal-trio | Botanical Journal | strip | 3 |
| Botanical Journal Portrait | botanical-journal-portrait | Botanical Journal | card | 2 |
| Butterfly Notes Arch | butterfly-notes-arch | Butterfly Notes | strip | 3 |
| Butterfly Notes Story | butterfly-notes-story | Butterfly Notes | card | 3 |
| Retro Diner Offset | retro-diner-offset | Retro Diner | strip | 3 |
| Pixel Play Mini | pixel-play-mini | Pixel Play | strip | 4 |
| Cosmic Disco Mosaic | cosmic-disco-mosaic | Cosmic Disco | card | 4 |
| Heart Mail Trio | heart-mail-trio | Heart Mail | strip | 3 |
| Heart Mail Duo | heart-mail-duo | Heart Mail | strip | 2 |
| Heart Mail Story | heart-mail-story | Heart Mail | card | 3 |
| Lace Story Arch | lace-story-arch | Lace Story | strip | 3 |
| Gingham Picnic Mini | gingham-picnic-mini | Gingham Picnic | strip | 4 |
| Teddy Memory Trio | teddy-memory-trio | Teddy Memory | strip | 3 |
| Teddy Memory Mosaic | teddy-memory-mosaic | Teddy Memory | card | 4 |
| Coffee Date Polaroid | coffee-date-polaroid | Coffee Date | card | 4 |
| Birthday Confetti Story | birthday-confetti-story | Birthday Confetti | card | 3 |
| Graduation Club Duo | graduation-club-duo | Graduation Club | strip | 2 |
| Wedding Bloom Trio | wedding-bloom-trio | Wedding Bloom | strip | 3 |
| Wedding Bloom Portrait | wedding-bloom-portrait | Wedding Bloom | card | 2 |
| Kpop Starlight Wander | kpop-starlight-wander | Kpop Starlight | strip | 3 |
| Halloween Party Mosaic | halloween-party-mosaic | Halloween Party | card | 4 |
| Festive Wishes Offset | festive-wishes-offset | Festive Wishes | strip | 3 |
| Garden Paint Story | garden-paint-story | Garden Paint | card | 3 |
| Pop Doodle Wander | pop-doodle-wander | Pop Doodle | strip | 3 |

## Lisensi dan referensi

Artwork SVG dan ilustrasi contoh dibuat orisinal untuk Fotbooth, dengan deklarasi CC0-1.0 pada manifest. Font DM Sans dan Fraunces memakai SIL Open Font License 1.1; salinan lisensi ada di public/fonts.

Referensi gaya yang diperiksa: [Canva photo strip](https://www.canva.com/templates/s/photo-strip/?continuation=150) dan [photo booth](https://www.canva.com/templates/s/photo-booth/?continuation=150). Referensi mencakup pita, floral denim, collage scrapbook, checker, karakter ilustratif dan film analog. Tidak ada file template atau aset Canva yang disalin ke paket.

## Bukti visual

- [Board 12 pilihan dekoratif](qa/decorated-design-board.png)
- [Contact sheet seluruh 60 frame](qa/frame-contact-sheet.png)
- [Daftar thumbnail yang dihasilkan](qa/library-generation.json)

Regenerasi: npm run assets:build, kemudian npm run qa:frames dengan dev server aktif.
