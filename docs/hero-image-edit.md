# Foto hero tanpa latar

- Sumber asli: `../../Dokumentasi/Foto Alvin.png` (tetap tersimpan).
- Proses: tool Imagegen bawaan, mode edit `background-extraction`, transparent_background=true.
- PNG transparan: `../public/images/alvin-hero-cutout.png`.
- Aset web: `../public/images/alvin-hero-cutout.webp` (alpha transparan dipertahankan; margin transparan dipangkas; kompresi WebP kualitas 90).
- Verifikasi: PNG dan WebP memiliki kanal alpha; area luar subjek transparan. Dipasang hanya pada hero melalui `profile.heroPortrait`; foto profil bagian lain tetap memakai aset asli.

## Prompt final

Use case: background-extraction. Edit target: the provided real portrait photograph of Alvin. Primary request: remove ONLY the pale blue/white wall background and replace it with genuine transparent alpha for a portfolio website hero cutout. Preserve the EXACT original person, facial identity, facial features, expression, glasses, hair, skin texture and color, dark navy suit, white shirt, blue lanyard, hands and crossed-arm pose. Preserve the full visible person down to the bottom of the original photograph and the same camera angle. Do not beautify, restyle, redraw, relight, add objects, change clothing, change body shape, or add shadows/backgrounds. Keep crisp natural hair and suit edges with no halo; preserve opaque foreground. Output one high-resolution PNG with a genuinely transparent background, not a checkerboard image. Tighten only empty transparent margins if helpful; do not crop away the person.

## Foto terbaru yang aktif

- Sumber: `../../Dokumentasi/Foto Alvin Terbaru.png`.
- File sumber sudah memiliki kanal alpha transparan; tidak diproses dengan Imagegen.
- PNG web: `../public/images/alvin-hero-latest.png`.
- Aset transparan penuh: `../public/images/alvin-hero-latest.webp`.
- Aset web aktif: `../public/images/alvin-hero-framed.webp` (WebP kualitas 92 dengan alpha dipertahankan).
- Penyesuaian: ruang transparan kosong dipangkas dan framing diperpanjang sampai kantong jas terlihat, tanpa mengubah isi foto.
- Penggunaan: hero memakai foto ini di atas kartu biru; foto pada bagian Tentang tetap memakai foto profil sebelumnya.

## Foto kedua pada bagian Tentang

- Sumber asli: `../../Dokumentasi/Foto Alvin 2.png`, tidak diubah.
- Aset aktif: `../public/images/alvin-about-seated-v2.webp` melalui `profile.aboutPortrait`, dari versi terbaru sumber dengan pose duduk dan potongan kursi yang diperbarui. Nama aset baru memastikan browser memuat foto terbaru.
- Aset versi sebelumnya (pose menerima penghargaan): `../public/images/alvin-about-2.webp`.
- Optimasi: pangkas margin transparan dengan Sharp dan simpan sebagai WebP kualitas 92; alpha tetap dipertahankan, tanpa mengubah isi foto.
- Card Tentang mengikuti dimensi card hero pada setiap breakpoint. Pada HP, kedua card terpusat dengan jarak kiri dan kanan yang sama.
- Framing pose duduk di card memakai `object-fit: cover` dan skala 1,47 dengan titik acuan di bagian atas. Offset ke bawah 60px memberi ruang lebih di atas kepala; kaki dipotong oleh batas card agar fokus pada wajah, badan, dan paha sesuai referensi. Efek pudar di bagian bawah dihapus.
- Warna tampilan dinetralkan dan noise dilembutkan secara ringan melalui CSS; foto asli tetap dipakai untuk mempertahankan struktur wajah. Detail, percobaan imagegen yang tidak dipakai, dan prompt dicatat di [about-photo-retouch.md](about-photo-retouch.md).

