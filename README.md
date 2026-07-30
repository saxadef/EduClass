# EduClass

EduClass adalah platform digital modern untuk membantu guru mempublikasikan materi pembelajaran, mengumumkan tugas terstruktur, serta mengelola pengumpulan tugas siswa secara terintegrasi dengan Google Drive dan Google Sheets melalui Google Apps Script.

## Fitur Utama

- **Portal Siswa**: Antarmuka responsif bagi siswa untuk melihat daftar pertemuan, instruksi panduan belajar, serta mengunggah file tugas secara instan.
- **Panel Dashboard Admin**: Statistik real-time, ringkasan pengumpulan tugas terbaru, serta pemantauan status penilaian.
- **Manajemen Materi & Tugas**: Pengelolaan data kelas, daftar pertemuan, materi pembelajaran, serta penjadwalan batas waktu pengumpulan tugas.
- **Integrasi Cloud**: Sinkronisasi data aman menggunakan Google Sheets sebagai database utama dan Google Drive sebagai penyimpanan berkas tugas.

## Pengembangan Lokal

Untuk menjalankan aplikasi ini di komputer Anda secara lokal:

1. Pastikan Anda telah menginstal **Node.js** (versi 18 atau lebih tinggi).
2. Instal semua dependensi proyek:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:3000` di peramban Anda.

## Panduan Deploy ke GitHub Pages

Aplikasi ini telah dikonfigurasi menggunakan relative paths (`base: './'`) dan Hash Routing agar dapat dijalankan secara instan di layanan hosting statis seperti GitHub Pages tanpa konfigurasi tambahan di file kode.

### Cara Deploy Otomatis Menggunakan GitHub Actions

1. Hubungkan atau push repositori ini ke akun **GitHub** Anda.
2. Buka repositori Anda di situs GitHub, lalu buka tab **Settings** (Pengaturan).
3. Di panel sebelah kiri, pilih menu **Pages** di bawah bagian *Code and automation*.
4. Di bagian **Build and deployment**:
   - Di bawah dropdown **Source**, pilih opsi **GitHub Actions** (bukan *Deploy from a branch*).
5. File alur kerja GitHub Actions yang berada di `.github/workflows/deploy.yml` secara otomatis akan aktif dan melakukan build serta publikasi web setiap kali Anda melakukan push atau sinkronisasi perubahan ke branch utama (`main` atau `master`).
