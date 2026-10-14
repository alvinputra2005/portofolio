# Portofolio Alvin

Website portofolio responsif dengan Next.js 16 App Router, TypeScript, Tailwind CSS 4, Motion, dan Lucide. Font Montserrat untuk judul/navbar dan Poppins untuk teks disajikan lokal melalui Fontsource. Desain terinspirasi dari [Vegliano Celo](https://veglianocelo.framer.website/).

## Menjalankan proyek

Gunakan Node.js **20.9 atau lebih baru** dan npm. Dari folder proyek:

```sh
npm install
npm run dev
```

Buka `http://localhost:3000`. Untuk memeriksa TypeScript dan lint:

```sh
npm run check
```

## Build dan preview

```sh
npm run build
npm run preview
```

Build menghasilkan website statis dalam `out/`. Preview tersedia di `http://127.0.0.1:3000`; hentikan dengan `Ctrl+C`. Jika port digunakan, jalankan `npm run preview -- --port 3001`. Variabel lingkungan `PORT` juga didukung.

Konfigurasi menggunakan `output: "export"`. Setelah build, `npm start` juga menjalankan server preview statis yang sama.

## Struktur

```text
src/
  app/                   Halaman utama, layout, metadata, dan CSS global
  components/            Komponen antarmuka portofolio
  data/portfolio.ts      Profil, proyek, kategori, dan informasi kontak
public/
  images/                Foto profil dan aset proyek
scripts/
  preview.mjs            Server preview statis tanpa dependensi tambahan
```

## Mengisi portofolio

Konten proyek dan pengalaman saat ini adalah **contoh**, bukan klaim riwayat nyata. Ganti dengan informasi yang benar. Foto profil menggunakan foto asli `Dokumentasi/Foto Alvin.png`, disalin ke `public/images/alvin-profile.png` dan dioptimalkan sebagai `alvin-profile.webp` tanpa mengubah foto sumber.

- Edit `src/data/portfolio.ts` untuk `profile.name`, `profile.initials`, `profile.role`, `profile.bio`, `profile.about`, dan `profile.location`, serta isi `projects`, `experiences`, dan `services` dengan informasi Anda.
- Foto profil menggunakan `profile.portrait`. Masukkan foto proyek ke `public/images/`, lalu isi `projects[].image` dengan path lokal seperti `/images/proyek-pertama.jpg`. Nilai `null` menampilkan kartu placeholder yang sudah dirancang.
- Ubah `projects[].isPlaceholder` menjadi `false` setelah isi proyek asli tersedia untuk menghilangkan catatan konsep sementara.
- Setiap proyek memiliki satu `category`, misalnya `"Desain Grafis"`, sesuai pilihan di `projectCategories`. Tambahkan kategori pada daftar tersebut jika diperlukan agar filter bekerja dengan tepat.
- Alamat email, tautan sosial, dan CV belum diisi (`null`). Isi `profile.email`, `profile.socialLinks[].href`, dan `profile.cvUrl` dengan alamat serta URL yang benar. Simpan CV di `public/` jika ingin menggunakan file lokal, misalnya `/cv-alvin.pdf`.
- Sesuaikan `siteSettings.title`, `siteSettings.description`, dan `siteSettings.year` di file data yang sama. Layout menggunakan pengaturan ini untuk metadata halaman.

Antarmuka menyediakan tab filter proyek, menu responsif, dan dialog HTML native untuk detail proyek serta kontak. Animasi menghormati preferensi pengurangan gerakan perangkat. Kontak belum memiliki backend pengiriman pesan; alamat email masih kosong sampai diisi pada data profil.

Beranda dan navbar dipisahkan ke `src/components/hero.tsx` dan `src/components/site-header.tsx`. Styling keduanya ada di `src/app/reference-home.css`; pola gelombang ringan ada di `public/images/hero-pattern.svg`. Navbar menyediakan home, penanda bagian aktif, hover kuning, serta menu mobile yang menutup lewat Escape, klik di luar, atau pemilihan tautan.

## Deployment

Unggah isi `out/` ke hosting statis yang mendukung halaman `index.html` per direktori. Bisa juga impor proyek ke Vercel dan gunakan pengaturan build Next.js dengan konfigurasi ekspor yang sudah ada. Jalankan build ulang setiap kali mengubah data atau aset.
