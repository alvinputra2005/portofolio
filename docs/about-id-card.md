# Kartu profil interaktif di Tentang Aku

Kartu menggantikan panel foto lama di bagian `#tentang`. Foto asli kedua Alvin tetap memakai `public/images/alvin-about-seated-v2.webp`, tanpa regenerasi wajah. Nama dan peran dirender sebagai teks HTML agar tetap tajam dan dapat diakses. Palet mengikuti biru dan kuning portofolio.

- Komponen: `src/components/about-id-card.tsx` dan `about-id-card.module.css`.
- Animasi: Motion yang sudah terpasang; masuk sekali saat terlihat, drag dua arah, tali SVG mengikuti titik pengait, lalu kartu kembali dengan pegas. Posisi kartu dan ujung tali memakai sumber pegas yang sama. Pointer capture memakai koordinat pointer tanpa pengukuran layout selama gerakan; batas tarikan melambat secara bertahap. Tidak menambahkan engine 3D atau dependensi.
- Optimasi drag: satu geometri SVG digunakan ulang untuk tiga lapisan tali, filter bayangan SVG dihilangkan, dan kartu memakai layer transform tersendiri. Efek pembesaran saat drag dihilangkan agar pengait tetap stabil. Kartu bisa ditangkap kembali di tengah ayunan serta pulih saat sentuhan dibatalkan.
- Interaksi: mouse dan sentuhan; tombol panah, Enter/Spasi, serta Escape/Home. Pengguna yang memilih reduced motion mendapatkan tampilan tanpa animasi masuk atau ayunan otomatis; tombol panah memindahkan kartu langsung dan Escape mengembalikannya.
- Bahasa: keterangan dan label aksesibilitas mengikuti pilihan Indonesia/Inggris di navbar.
- Pemeriksaan: `npm run build`, `node scripts/verify-id-card.mjs`, serta skrip regresi yang tersedia.

## Aset hasil generasi

Tool: built-in `image_gen`, generasi baru, latar tidak transparan. Aset akhir untuk aplikasi: `public/images/alvin-id-artwork.webp` (864 × 1152, sekitar 122 KiB). Ini grafis cetak kartu; foto, teks, tali, dan pengait dipasang oleh kode. Tidak meniru desain kartu pada foto referensi.

Prompt yang digunakan:

```text
Use case: stylized-concept. Asset type: original printed artwork for the front of an interactive personal portfolio ID badge, later assembled in HTML with a real portrait and live typography. Generate ONLY the flat full-bleed artwork, portrait aspect ratio 3:4, no mockup or perspective. Visual direction: refined contemporary Indonesian software engineer portfolio in cobalt ocean blue (#005a91), luminous sky blue (#38b4ff), white and a restrained vivid warm yellow (#ffe000). Upper 65 percent: rich layered blue abstract fluid topographic relief with softly lit translucent sculptural waves, fine printed grain, an open uncluttered center reserved for a portrait, one cropped yellow orbital arc toward the upper-right edge and a smaller subtle yellow curved accent at lower-left. Lower 35 percent: a clean nearly-white field, subtly curved transition from the blue above; leave completely empty for name and role typeset by code. Sophisticated editorial print design, crisp edges, plausible high-quality satin PVC print texture, balanced rather than busy. Artwork fills entire rectangular canvas edge-to-edge. No people, no face, no text or lettering, no logos, no QR codes, no barcode, no lanyard, no clip, no outer card outline, no border, no rounded corners, no cast shadow, no surrounding background, no 3D product shot. This is a new original graphic, not a reproduction of the provided reference.
```

Referensi perilaku drag: [dokumentasi resmi Motion](https://motion.dev/docs/react-drag).
