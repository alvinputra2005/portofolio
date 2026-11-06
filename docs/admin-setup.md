# Menjalankan Alvin Studio dengan Supabase

Website publik tetap di `/`. Studio ada di `/alvin-ganteng`. Implementasi ini dijalankan lokal dahulu; website online yang lama tidak diubah.

## Masuk langsung saat pengembangan lokal

Set `LOCAL_ADMIN_NO_AUTH=true` pada `.env` (atau `.env.local` bila dipakai), lalu jalankan `npm.cmd run dev`. Buka `http://127.0.0.1:3000/alvin-ganteng` langsung tanpa akun atau password. Script dev mengikat server ke `127.0.0.1`. Jika port 3000 dipakai, gunakan port yang ditampilkan terminal. Restart server yang sudah berjalan setelah mengubah flag ini.

Mode ini hanya aktif pada **development** dengan host loopback; alamat publik, host terusan, dan production tetap memakai login. Jangan meneruskan server pengembangan lewat tunnel/proxy publik. Secret key dipakai hanya di server untuk CRUD lokal; key tidak dikirim ke browser. RLS Supabase tidak dibuka untuk pengguna anonim.

Untuk mengimpor konten tanpa membuat akun Auth:

```powershell
npm.cmd run db:check -- --local
npm.cmd run db:seed -- --local
```

Dalam mode ini `portfolio_admins` boleh kosong dan tidak diperlukan tabel tambahan. Publikasi serta urutan memakai server lokal dan penulisan permintaan diserialkan dalam satu proses pengembangan; mode production tetap memakai fungsi transaksi PostgreSQL. Kembalikan flag ke `false` ketika ingin menguji login biasa, dan buat akun admin seperti petunjuk di bawah sebelum deployment.

## 1. Buat project Supabase dan isi konfigurasi

Membuat akun Supabase belum otomatis membuat database project atau akun login aplikasi. Buat project pada Dashboard, lalu isi `.env.local` di folder `alvin-portfolio`. Template tersedia di `.env.example`; jangan commit atau membagikan `.env.local`.

| Variabel | Nilai dari |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Connect → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Connect / Settings → API Keys → Publishable key |
| `SUPABASE_SECRET_KEY` | Settings → API Keys → Secret key, khusus bootstrap dan seed |
| `SUPABASE_ADMIN_EMAIL` | Email akun yang dibuat di Authentication → Users |
| `GEMINI_API_KEY` | Opsional, Google AI Studio |
| `GEMINI_MODEL` | Default `gemini-3.8-flash`; ganti bila akses model akun berbeda |

Publishable key memang dapat digunakan browser; keamanan data memakai RLS. Secret key dan Gemini key tidak menggunakan awalan `NEXT_PUBLIC_`. Secret key hanya dipakai untuk migrasi dan mode lokal tanpa login. Tidak ada password admin di env.

## 2. Jalankan SQL dan buat akun admin

1. Buka Supabase SQL Editor, tempel seluruh `supabase/migrations/001_portfolio.sql`, lalu jalankan. SQL ini dapat dijalankan ulang tanpa menghapus konten.
2. Di Authentication → Users → Add user, buat satu akun email/password milikmu. Tandai email terkonfirmasi melalui dashboard bila diminta.
3. Nonaktifkan **Allow new users to sign up** pada pengaturan Auth. Tidak ada form daftar di aplikasi.
4. Isi `SUPABASE_ADMIN_EMAIL` dengan email akun tersebut. Akun dashboard Supabase berbeda dengan akun Authentication aplikasi.
5. Untuk lupa password pada tahap lokal, kelola melalui Authentication Dashboard. Tidak ada pengaturan SMTP yang diperlukan untuk login email/password.

## 3. Periksa dan migrasikan konten

```powershell
npm.cmd install
npm.cmd run db:check
npm.cmd run db:seed
```

`db:check` memvalidasi payload dan berkas lokal. Jika konfigurasi lengkap, ia juga memeriksa koneksi, skema, dan keberadaan akun Auth tanpa mengubah database. Jika belum diisi, ia menyebutkan nama variabel yang kurang tanpa mencetak nilainya.

`db:seed` menetapkan akun itu sebagai admin, menyalin media konten ke bucket privat/publik, lalu memasukkan konten awal beserta dua bahasa. Semua file lokal dipertahankan. ID media berdasarkan hash isi dan ID konten stabil; seed ulang melewati entri yang sudah ada sehingga hasil edit admin tidak ditimpa. Seed tidak mengimpor desain lama yang memang tidak dipakai halaman. Bila publikasi terputus setelah draft terimpor, publikasikan draft itu melalui panel.

Setelah selesai, Secret key dapat dihapus dari env lokal jika tidak sedang melakukan migrasi. Jangan memakai kredensial produksi pada server pengujian simulasi.

## 4. Jalankan aplikasi

```powershell
npm.cmd run dev
```

Buka `http://localhost:3000` dan `http://localhost:3000/alvin-ganteng`. Restart server setelah mengubah env.

Untuk menjalankan hasil produksi lokal:

```powershell
npm.cmd run build
npm.cmd start
```

Proyek sekarang memerlukan runtime Next.js. Folder `out/` dan konfigurasi hosting statis lama tidak lagi menjadi keluaran terbaru. `.openai/hosting.json` masih identitas hosting lama; jangan deploy melalui konfigurasi statis tersebut. Pemilihan hosting backend dan deployment belum dilakukan.

## 5. Mengelola konten

Konten publik memakai cache server 60 detik. Publikasi, penarikan, penghapusan konten, dan penerbitan urutan langsung membatalkan cache terkait; simpan draft tidak mengubah cache publik. Perubahan langsung lewat Dashboard Supabase dapat menunggu refresh cache. Daftar admin dikirim bersama halaman dan hanya memuat jenis konten yang dibuka. URL preview gambar disiapkan sekaligus; URL privat berumur singkat dan tidak masuk cache publik.

- Menu utama admin menampilkan Profil, Pengalaman, Proyek, Pencapaian, dan Sertifikat & Penghargaan. Grup Keahlian, Teknologi & Alat, Pengaturan, dan Pustaka Media tidak lagi menjadi menu/pintasan dashboard.
- Pilih menu, tambahkan atau edit data, lalu **Publikasikan**. Tombol ini menyimpan isian dan menerbitkannya sekaligus. Formulir hanya menampilkan **Publikasikan** dan **Delete**; profil tunggal hanya dapat diperbarui, dan Delete aktif setelah entri biasa tersimpan.
- Isi Indonesia wajib dan Inggris opsional. Inggris kosong memakai isi Indonesia. Teks antarmuka tetap diterjemahkan.
- **Publikasikan** menyalin isian tersimpan menjadi snapshot publik. Publik melihat pembaruan setelah reload, tanpa rebuild. Tombol preview, simpan draft, dan tarik dari publik sudah dihapus dari formulir.
- **Delete** meminta konfirmasi lalu menghapus entri dan versi publiknya. Konten kosong tetap kosong, tidak digantikan dummy lama.
- Panah atas/bawah mengatur urutan draft. **Terbitkan urutan** hanya menerapkan urutannya tanpa menerbitkan revisi teks yang belum siap.
- Pengalaman memakai satu foto dengan caption hover dan crop 0–100. Menaikkan angka membuat isi foto bergeser ke atas dalam kotak.
- Gambar menerima JPEG/PNG/WebP sampai 10 MB, PDF sampai 20 MB. Upload SVG baru ditolak; SVG bawaan proyek hanya diimpor sebagai aset tepercaya saat seed.
- Pustaka menyimpan berkas yang dilepas dari formulir. Hapus manual jika tidak digunakan; penghapusan ditolak bila masih dirujuk draft, publikasi, atau desain.

Draft dan bahan mockup ada di `portfolio-media` (privat). Media preview memakai signed URL singkat yang diperoleh setelah pemeriksaan admin. Ketika konten dipublikasikan, salinan media dibuat pada `portfolio-public`. Berkas yang pernah dipublikasikan tetap ada hingga dihapus dari pustaka dan tidak lagi dirujuk; menarik konten tidak menjanjikan pencabutan salinan yang sudah diunduh orang lain.

## 6. Membuat cover proyek

Buka **Proyek → Edit → Mockup**. Editor memakai satu template persegi **1200×1200**, dengan dua slot mockup tetap. Pilih gambar melalui tombol **Tambah mockup** atau **Ganti mockup** dari pustaka. Mengisi slot pertama juga mengisi slot kedua jika masih kosong; keduanya tetap dapat memakai gambar berbeda. Pilih Desktop, Mobile, atau gabungan melalui dropdown. Frame perangkat dirender dengan Three.js saat WebGL tersedia.

Subjudul berada setelah judul dalam formulir. Deskripsi hanya tampil di bawah perangkat; headline dan tulisan tangan sudah dihapus. Foto `public/images/mockup/kota.jpeg` berasal dari `Dokumentasi/Kota.jpeg`, dengan crop gedung dan opasitas awal 10% pada area berwarna. Opasitas serta crop foto dapat disesuaikan. Pola dekorasi tetap dibatasi pada area putih. QR Prototype dan Case Study ditampilkan jika tautannya diisi. Desain lama dinormalisasi ke format persegi; referensi gambar tambahan lama tetap disimpan agar tidak hilang.

Tombol **Pasang ke proyek** berada di bawah editor. Satu aksi menyimpan desain JSON dan membuat PNG 1200×1200 pada cover galeri draft proyek. Publikasikan proyek dari tab **Form Data** saat sudah siap. Tidak ada tombol simpan salinan, unduh PNG, atau pemilih slot galeri di editor.

Logo/screenshot tidak digambar ulang oleh AI. Tulis arahan, klik **Minta usulan**, tinjau, lalu **Terapkan** atau **Batal**. Elemen terkunci dan referensi aset dipertahankan oleh server. Tanpa Gemini key, editor manual tetap berfungsi. Permintaan dibatasi 5 per menit per admin pada proses server lokal; reset ketika server restart. Tidak ada biaya AI saat hanya mengedit manual. Ketika meminta usulan, gambar terpilih dan arahan dikirim ke Gemini.

## 7. Verifikasi

```powershell
npm.cmd run typecheck
npm.cmd run test:cms
npm.cmd run build
node scripts/verify.mjs
npm.cmd run test:admin
```

Unit test menggunakan PostgreSQL dalam memori (PGlite) untuk menjalankan SQL dan menguji RLS. Pengujian browser admin memakai server Supabase simulasi dengan data uji, bukan project Supabase asli. Pengujian ini tidak menggantikan verifikasi konfigurasi di Supabase hosted.

Sesudah env diisi dan seed selesai, periksa login, CRUD, upload, publikasi, dan akses anonim ke draft pada project Supabase sendiri. Uji Gemini nyata dilakukan ketika key tersedia dengan permintaan yang kamu kirim melalui editor. Jangan menyatakan integrasi hosted telah diverifikasi hanya dari pengujian simulasi.
