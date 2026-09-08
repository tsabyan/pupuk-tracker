# Skrip Demo

Alur presentasi untuk menunjukkan rantai penuh **START → SELESAI** dalam
sekitar 10 menit. Jalankan aplikasi lebih dulu:

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

>  "Petani punya bukti digital. Statusnya langsung **Selesai** — di sini
> rantai distribusinya tuntas. Kalau jumlahnya tidak cocok, dia bisa
> menandai tidak sesuai, statusnya menjadi **Disanggah**, dan pengawas
> langsung mendapat pemberitahuan."

---

## 5. Pengawas KP3 — memilih objek pengawasan (1,5 menit)

Bagian ini sekaligus mengoreksi kesalahpahaman yang paling sering muncul:
**KP3 tidak memvalidasi transaksi**.

1. Avatar → **Lihat sebagai → Pengawas KP3**.
2. **Monitoring Real-time**: alokasi, serapan, stok kios, **cakupan
   pengawasan**, dan blok "Perlu perhatian".
3. **Objek Pengawasan** → tab "Bertanda penapisan". Tunjukkan bahwa
   transaksinya sudah berstatus **Selesai** sebelum pengawas menyentuhnya.
4. Buka satu transaksi. Tunjukkan panel **Penapisan tujuh tepat** — sistem
   yang mengujinya, dan butir yang gagal itulah alasan berbasis data untuk
   memilih objek pemeriksaan.
5. Simpan hasil telaah, atau klik **Jadikan objek pemeriksaan lapangan**.

> "KP3 tidak memberi izin apa pun. Penyaluran sudah sah begitu kios dan
> kelompok tani sepakat. Yang dikerjakan KP3 adalah mengawasi setelahnya,
> dengan uji petik — karena itu yang diukur cakupan pengawasan, bukan
> panjang antrian. Satu komisi kabupaten tidak mungkin memeriksa ribuan
> transaksi satu per satu."

---

## 6. Pengawas KP3 — berita acara pemeriksaan (2 menit)

Ini bagian paling kuat untuk pemangku kepentingan pengawasan.

1. **Pemeriksaan → Catat pemeriksaan**. Pilih objek **Pengecer resmi**.
2. Pada **Uji stok fisik**, angka sistem sudah terisi sendiri. Turunkan satu
   angka fisik. Lihat panel **Pratinjau berita acara**: temuan aspek "tepat
   jumlah" muncul seketika, dengan tingkat yang dinilai dari besar
   simpangannya.
3. Pada **Uji harga**, naikkan harga jual Urea di atas HET.

> "Perhatikan ini. Pelanggaran HET **tidak mungkin** terbaca dari data
> transaksi: di sana harga selalu tercatat sebesar HET, karena kios yang
> menjual lebih mahal tidak akan melaporkannya sendiri. Satu-satunya
> jalannya adalah pemeriksaan lapangan seperti ini — atau pengaduan petani."

4. Hilangkan centang satu butir **administrasi**, isi instansi pendamping,
   tanda tangani berita acara, lalu **Terbitkan berita acara**.
5. Buka berita acaranya: uji stok, uji harga, verifikasi penerima, checklist
   administrasi, temuan berkategori, dan sampel uji petik — satu dokumen.

---

## 7. Pengawas KP3 — menutup lingkaran (1,5 menit)

1. **Temuan**: tunjukkan sebaran menurut **tujuh tepat** dan status tiap
   temuan.
2. Pilih temuan terbuka → **Tindak lanjuti** → **Susun draf dari temuan**.
   Tetapkan tenggat, terbitkan.
3. Buka suratnya, perbarui status pelaksanaan menjadi **Selesai** dengan
   bukti pelaksanaan. Temuannya ikut menjadi **Selesai**.
4. Tunjukkan surat yang **lewat tenggat** pada daftar, dan pilihan
   **eskalasi** ke Satgas Pangan atau aparat penegak hukum.
5. Buka **Laporan** — cakupan pengawasan dan kepatuhan kios ikut bergerak.

> "Inilah yang dinilai pada maturitas SPIP: bukan berapa surat yang
> diterbitkan, tetapi apakah temuannya terbukti selesai."

---

## Penutup

Refresh browser — data tetap ada. Tekan **Reset data demo** untuk mengulang
presentasi dari awal.

> "Rantai distribusinya berhenti pada kelompok tani. Pengawasan berjalan di
> atasnya sebagai lapisan sendiri: perencanaan objek, pemeriksaan, temuan,
> tindak lanjut, pelaporan."

---

## Catatan untuk penyaji

- Ini prototipe: semua nama pelaku usaha, kelompok tani, dan transaksi adalah
  data sintetis, dan data tersimpan di browser masing-masing.
- Belum ada autentikasi sungguhan, peta sebaran, maupun integrasi ke e-Pubers.
- Kanal **pengaduan masyarakat** (WA, telepon, surat) belum dimodelkan, begitu
  pula rencana pengawasan tahunan dan laporan hasil pengawasan sebagai dokumen
  periodik. Bila ditanya, sebut ketiganya sebagai tahap berikutnya — bukan
  sebagai hal yang terlewat.
- Implementasi produksi direncanakan memakai Laravel + Filament; rancangan
  tabelnya sudah disiapkan di [ERD.md](ERD.md).
