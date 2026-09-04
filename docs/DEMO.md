# Skrip Demo

Alur presentasi untuk menunjukkan rantai penuh **START → SELESAI** dalam
sekitar 8 menit. Jalankan aplikasi lebih dulu:

```bash
npm run dev
```

Buka `http://localhost:3000`. Sebelum mulai, tekan avatar di kanan atas →
**Reset data demo** supaya data kembali ke kondisi awal.

> Skrip ini untuk penyaji. Bila klien ingin menelusuri sendiri tanpa dipandu,
> arahkan ke halaman **`/petunjuk`** di dalam aplikasi — isinya alur yang sama
> plus daftar use case per peran dan pengujian batas.

---

## Persiapan panggung (30 detik)

Tunjukkan halaman login. Empat peran pada diagram alur muncul sebagai empat
kartu, dengan warna yang sama seperti pada diagram: biru, hijau, oranye, ungu.

> "Empat pihak ini yang selama ini bekerja terpisah. Aplikasi menyatukan
> mereka dalam satu rantai data."

---

## 1. Distributor — menyusun alokasi & mengirim (2 menit)

1. Masuk sebagai **Distributor**.
2. Dashboard: tunjukkan **serapan per pengecer** — distributor kini tahu
   berapa yang benar-benar sampai ke petani, bukan hanya berapa yang dikirim.
3. **Rencana Alokasi → Buat rencana alokasi**.
   Pilih kecamatan, klik **Isi dari rekap RDKK** — alokasi tersusun otomatis
   dari kebutuhan kelompok tani, bukan dikira-kira. Simpan.
4. **Pengiriman → Buat pengiriman**. Pilih kios, pilih alokasi tadi, klik
   **Isi sisa alokasi**, lalu **Kirim & terbitkan faktur**.
5. Tunjukkan status **Menunggu Konfirmasi** dan blok "Posisi pada alur
   distribusi" di halaman detail.

> "Nomor faktur dan berita acara terbit otomatis. Kios langsung dapat
> notifikasi — tidak perlu telepon."

---

## 2. Pengecer Resmi — konfirmasi & stok (2 menit)

1. Avatar kanan atas → **Lihat sebagai → Pengecer Resmi**.
2. Lonceng notifikasi sudah berisi pemberitahuan kiriman masuk. Klik.
3. Di layar konfirmasi, **ubah satu angka** menjadi lebih kecil dari faktur.
   Peringatan selisih muncul dan catatan menjadi wajib.
   Kembalikan angkanya, isi catatan, lalu **Konfirmasi penerimaan**.
4. Aplikasi langsung membuka **Stok Pengecer**: angka stok naik persis
   sejumlah yang dikonfirmasi, dan riwayat mutasi mencatat asal usulnya.

> "Stok tidak diketik. Dihitung dari riwayat, jadi tidak bisa berbeda dengan
> buktinya."

---

## 3. Pengecer Resmi — menyalurkan ke kelompok tani (2 menit)

1. **Catat penyaluran**. Pilih kelompok tani.
2. Tunjukkan bahwa tiap jenis pupuk menampilkan **sisa hak RDKK** dan
   **sisa stok kios**.
3. Ketik jumlah yang melebihi hak RDKK — kolom berubah merah dan tombol
   simpan mengunci. Turunkan lagi ke angka yang wajar.
4. Tanda tangan penerima di kotak tanda tangan, lalu **Simpan penyaluran**.

> "Dua pagar sekaligus: tidak bisa melebihi hak petani, tidak bisa melebihi
> barang yang benar-benar ada."

---

## 4. Kelompok Tani — konfirmasi penerimaan (1,5 menit)

1. Avatar → **Lihat sebagai → Kelompok Tani**.
2. Dashboard menampilkan **hak tebus RDKK** dan berapa yang sudah ditebus.
3. **Terima Pupuk** → buka transaksi yang menunggu.
4. Pilih **Sesuai**, tanda tangani sebagai ketua, lalu **Konfirmasi penerimaan**.

> "Petani punya bukti digital. Kalau jumlahnya tidak cocok, dia bisa menandai
> tidak sesuai — dan pengawas langsung melihatnya."

---

## 5. Pengawas KP3 — validasi & tindak lanjut (2 menit)

1. Avatar → **Lihat sebagai → Pengawas KP3**.
2. **Monitoring Real-time**: alokasi, serapan, stok kios, dan blok
   "Perlu perhatian" berisi transaksi bermasalah.
3. **Validasi**: transaksi yang tadi dikonfirmasi kelompok tani sudah berada
   di antrian teratas. Buka.
4. Tunjukkan **Hasil pemeriksaan** — kelengkapan bukti diperiksa otomatis.
5. Pilih **Valid**, simpan. Antrian berkurang satu.
6. Buka **Laporan** — angka serapan sudah ikut berubah.
7. Singgung **Inspeksi Lapangan** dan **Tindak Lanjut** sebagai penutup rantai:
   teguran, rekomendasi, atau penghargaan yang langsung terkirim sebagai
   notifikasi.

---

## Penutup

Refresh browser — data tetap ada. Tekan **Reset data demo** untuk mengulang
presentasi dari awal.

> "Yang tadi kita lewati adalah 18 langkah pada diagram alur, tanpa ada satu
> pun yang dilompati."

---

## Catatan untuk penyaji

- Ini prototipe: semua nama pelaku usaha, kelompok tani, dan transaksi adalah
  data sintetis, dan data tersimpan di browser masing-masing.
- Belum ada autentikasi sungguhan, peta sebaran, maupun integrasi ke e-Pubers.
- Implementasi produksi direncanakan memakai Laravel + Filament; rancangan
  tabelnya sudah disiapkan di [ERD.md](ERD.md).
