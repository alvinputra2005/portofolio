# Portofolio Alvin

Website portofolio responsif dengan Next.js 16 App Router, TypeScript, Tailwind CSS 4, Motion, dan Lucide. Font Montserrat untuk judul/navbar, Poppins untuk teks, dan Outfit untuk wordmark disajikan lokal melalui Fontsource. Desain terinspirasi dari [Vegliano Celo](https://veglianocelo.framer.website/).

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
- Narasi hero dan Tentang sudah mengikuti CV pengguna: hero memakai `profile.bio` untuk merangkum peran dan fokus; Tentang memakai `profile.about` untuk latar pendidikan, pengalaman, dan cara kerja. Versi Inggrisnya ada di `getLocalizedPortfolio` pada `src/data/translations.ts`.
- Foto profil menggunakan `profile.portrait`. Masukkan foto proyek ke `public/images/`, lalu isi `projects[].image` dengan path lokal seperti `/images/proyek-pertama.jpg`. Nilai `null` menampilkan kartu placeholder yang sudah dirancang.
- Ubah `projects[].isPlaceholder` menjadi `false` setelah isi proyek asli tersedia untuk menghilangkan catatan konsep sementara.
- Setiap proyek memiliki satu `category`, misalnya `"Desain Grafis"`, sesuai pilihan di `projectCategories`. Tambahkan kategori pada daftar tersebut jika diperlukan agar filter bekerja dengan tepat.
- Email serta tautan WhatsApp, Instagram, GitHub, dan LinkedIn sudah diisi melalui `profile.email` dan `profile.socialLinks[].href`. WhatsApp memakai format internasional `wa.me`; email memakai `mailto:`. CV masih `null`; isi `profile.cvUrl` dengan path PDF atau URL CV. Simpan CV di `public/` jika ingin menggunakan file lokal, misalnya `/cv-alvin.pdf`.
- Bagian Tentang langsung mengikuti hero. Foto transparannya memakai `profile.aboutPortrait`; `profile.statistics.projects` dan `competitions` berisi `"10+"` serta `"5+"`. `experience` berisi angka tahun `1.5`, ditampilkan sebagai `1,5` dalam bahasa Indonesia dan `1.5` dalam bahasa Inggris. Nilai `null` menampilkan `—`.
- Bagian Pengalaman mengikuti Tentang dengan tiga peran asisten praktikum di Universitas Negeri Malang: Sistem Informasi, Basis Data, dan Algoritma Pemrograman, masing-masing 4 bulan. Logo lokal `public/images/logo-um.webp` disalin dari `Dokumentasi/Logo UM.webp`. Empat elemen `experiences[].photos` masih `null` dan menampilkan placeholder dokumentasi. Isi dengan path foto asli saat tersedia. Terjemahan Inggrisnya ada di `englishExperiences` pada `src/data/translations.ts`.
- Urutan halaman dan navbar: Tentang → Pengalaman → Proyek → Pencapaian → Sertifikat → Tech Stack → Kontak. Proyek memakai tiga kolom SaaS, SCM, dan ERP dengan format seperti Pengalaman serta galeri 2×2. Isi `softwareProjects[].title`, `year`, `role`, `description`, `logo`, dan `photos` di `src/data/portfolio.ts`, serta `englishSoftwareProjects` di `src/data/translations.ts` untuk versi Inggris. Set `isPlaceholder: false` setelah data asli siap. Data proyek desain lama tetap tersimpan di `projects` dan tidak ditampilkan pada halaman.
- Pencapaian memakai tiga kartu Hak Cipta, Kompetensi, dan Organisasi dengan galeri 2×2; isi `achievements[].category`, `title`, `year`, `role`, `description`, `logo`, dan `photos`, serta `englishAchievements` untuk terjemahan Inggris. Data `null` tetap menampilkan placeholder, tanpa klaim prestasi nyata.
- Sertifikat & Penghargaan berada setelah Pencapaian dalam carousel putih dengan kartu aktif di tengah dan pratinjau di samping. Tombol panah, titik navigasi, keyboard (panah kiri/kanan, Home, End), geser horizontal, dan filter kategori mengubah dokumen. Klik kartu tengah untuk membuka detail; Escape menutupnya. Animasi mengikuti preferensi pengurangan gerakan. Isi `credentials[].photos` dengan dokumen asli dan `englishCredentials` untuk terjemahannya; setiap foto menjadi satu slide dan gambar ditampilkan utuh dengan `object-fit: contain`.
- Tech Stack setelah Sertifikat & Penghargaan menampilkan strip logo satu baris tepat di bawah judul, diikuti tiga kartu putih Front End, Back End, dan AI/ML dengan ikon putih di atas latar biru. Semua 16 teknologi pada strip bergerak dalam satu jalur; preferensi pengurangan gerakan menghentikan animasi dan mengizinkan gulir horizontal. Daftar teknologi kartu, ikon lokal, serta durasi dalam bulan ada di `skillGroups`. Durasi saat ini adalah dummy 8–18 bulan dan ditandai sebagai contoh pada halaman.
- Hero menampilkan tombol Hubungi Aku / Contact Me untuk membuka informasi kontak dan Lihat Proyek / View Projects di sampingnya untuk menuju `#proyek`. Tombol Unduh CV / Download CV berada di Tentang Aku, menggantikan tombol Profil Media Sosial dan ikon Instagram/LinkedIn. Tombol CV memakai `profile.cvUrl` dengan atribut `download` jika sudah diisi; jika masih `null`, dialog menampilkan informasi bahwa CV segera tersedia. Bagian Tentang langsung mengikuti hero.
- Foto hero dan Tentang menggunakan komponen `src/components/portrait-motion.tsx` yang sama: kemiringan maksimal 3°, cahaya mengikuti kursor, dan lingkaran kuning bergerak berlawanan untuk memberi kedalaman. Saat kursor keluar, foto kembali rata dan cahaya menghilang. Crop dan koreksi tampilan foto Tentang tetap diatur melalui CSS. Preferensi pengurangan gerakan menghentikan animasi dan respons kursor tersebut; sentuhan di HP tidak memicu tilt.
- Navbar memiliki wordmark `alvin.` di kiri. Navbar, hero, seluruh bagian konten, dan footer memakai margin kiri/kanan simetris yang sama melalui `--portfolio-page-left` dan `--portfolio-page-right`. Menu berubah ke tampilan mobile pada lebar 1100px ke bawah agar seluruh tautan tetap terbaca.
- Footer berwarna biru `--blue` (`#005a91`) menampilkan judul serta deskripsi kolaborasi rata tengah, tanpa deretan ikon sosial atau tombol tambahan. Bahasa Indonesia menampilkan “Mari Bekerja Sama”; pilihan Inggris di navbar mengubahnya menjadi “Let's Work Together”. Baris nama, hak cipta, dan kembali ke atas tetap berada di bawahnya. Tautan navbar `#kontak` mengarah langsung ke footer; tombol kontak utama tersedia di hero.
- Sesuaikan `siteSettings.title`, `siteSettings.description`, dan `siteSettings.year` di file data yang sama. Layout menggunakan pengaturan ini untuk metadata halaman.

Antarmuka menyediakan menu responsif dan dialog HTML native untuk kontak dengan tautan email serta tombol salin alamat. Animasi menghormati preferensi pengurangan gerakan perangkat. Pengiriman email menggunakan aplikasi email pengguna melalui `mailto:`.

Beranda, Tentang, dan navbar dipisahkan ke `src/components/hero.tsx`, `src/components/about.tsx`, dan `src/components/site-header.tsx`. Styling ada di `src/app/reference-home.css`; pola gelombang ringan `public/images/hero-pattern.svg` diteruskan hingga kontak dan footer. Navbar menyediakan penanda bagian aktif, hover biru transparan, serta menu mobile yang menutup lewat Escape, klik di luar, atau pemilihan tautan.

Scroll menggunakan Lenis melalui `src/components/smooth-scroll.tsx`: roda mouse dan tautan antarbagian bergerak halus dengan `lerp: 0.075`, sementara sentuhan tetap menggunakan scroll native perangkat. Jarak navbar mengikuti `scroll-padding-top`. Dialog menghentikan scroll halaman dan tetap bisa digulir sendiri; menutupnya mengaktifkan scroll kembali. Preferensi pengurangan gerakan berlaku langsung tanpa reload. Setelah build, jalankan `node scripts/verify-scroll.mjs` untuk memeriksa integrasi ini.

## Bahasa dan foto hero

Tombol globe di navbar mengganti bahasa Indonesia/Inggris tanpa memuat ulang halaman. Pilihan disimpan di localStorage dan atribut `lang` dokumen ikut diperbarui. Default bahasa Indonesia. Terjemahan UI dan konten Inggris ada di `src/data/translations.ts`; data dasar Indonesia tetap di `src/data/portfolio.ts`. `LanguageProvider` mengelola bahasa di seluruh komponen. Nama proyek dan teks ilustrasi konsep dipertahankan sebagai bagian dari karya.

`profile.heroPortrait` memakai `public/images/alvin-hero-framed.webp`, hasil framing foto transparan pengguna `Dokumentasi/Foto Alvin Terbaru.png`. `profile.aboutPortrait` memakai `public/images/alvin-about-seated-v2.webp` dari versi terbaru `Dokumentasi/Foto Alvin 2.png` (pose duduk), dengan ruang transparan kosong dipangkas. Card foto Tentang mengikuti ukuran card hero; foto hero berada di atas teks dan terpusat pada HP. Sumber dan riwayat aset dicatat di [docs/hero-image-edit.md](docs/hero-image-edit.md). Jalankan `node scripts/verify.mjs` untuk memeriksa kedua bahasa, preferensi setelah reload, navigasi, filter, dialog, dan layout empat ukuran layar; Windows memakai Chrome yang terpasang. Di lingkungan lain, set `BROWSER_PATH` ke browser Chromium yang sesuai atau siapkan browser Playwright.

## Deployment

Unggah isi `out/` ke hosting statis yang mendukung halaman `index.html` per direktori. Bisa juga impor proyek ke Vercel dan gunakan pengaturan build Next.js dengan konfigurasi ekspor yang sudah ada. Jalankan build ulang setiap kali mengubah data atau aset.
