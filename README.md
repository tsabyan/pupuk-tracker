# Pengawasan Pupuk Bersubsidi Terintegrasi

Prototipe aplikasi pengawasan rantai distribusi pupuk bersubsidi yang
menghubungkan empat pihak dalam satu rantai data:

**Distributor → Pengecer Resmi → Kelompok Tani → Pengawas KP3**

Setiap penyerahan pupuk dikonfirmasi kedua belah pihak, dibatasi hak RDKK
kelompok tani dan stok kios yang benar-benar ada, lalu divalidasi Pengawas KP3.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`, lalu pilih salah satu dari empat peran. Tidak
diperlukan kata sandi — ini lingkungan demo dengan data sintetis yang tersimpan
di browser.

Untuk penguji atau pemangku kepentingan yang baru pertama kali membuka: mulai
dari **`/petunjuk`**. Halaman itu memandu alur uji coba enam tahap, merinci use
case tiap peran, dan menunjukkan pengujian batas yang layak dicoba.

## Dokumentasi

| Dokumen | Isi |
|---|---|
| `/petunjuk` (di dalam aplikasi) | panduan uji coba untuk klien, lengkap dengan tombol pintas ke tiap layar |
| [docs/DEMO.md](docs/DEMO.md) | skrip presentasi alur penuh, sekitar 8 menit |
| [docs/ALUR.md](docs/ALUR.md) | peta 18 langkah diagram alur ke layar aplikasi |
| [docs/ERD.md](docs/ERD.md) | rancangan tabel sebagai blueprint migrasi Laravel |
| [AGENTS.md](AGENTS.md) | aturan arsitektur dan konvensi kode |

## Status

Prototipe untuk validasi alur, **bukan sistem produksi**. Belum ada
autentikasi sungguhan, peta sebaran, mode luring, maupun integrasi ke e-Alokasi
dan e-Pubers. Implementasi produksi direncanakan memakai Laravel + Filament.

## Perintah

```bash
npm run dev        # jalankan mode pengembangan
npm run test       # uji aturan domain (status, stok, hak RDKK, integritas seed)
npm run check      # typecheck + lint + test + build
```
