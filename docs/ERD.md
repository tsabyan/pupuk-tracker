# Rancangan Data — Blueprint Migrasi Laravel

Dokumen ini menerjemahkan model data prototipe (`lib/domain/types.ts`) menjadi
rancangan tabel untuk implementasi produksi dengan **Laravel + Filament**.

Prototipe sengaja menyimpan data sebagai satu objek JSON di browser, tetapi
bentuknya sudah disusun seperti tabel relasional agar pemindahannya lurus:
satu antarmuka TypeScript = satu tabel.

---

## Prinsip yang harus ikut pindah

Tiga aturan berikut hidup di `lib/domain/` dan **wajib dijalankan di sisi
server** pada implementasi nyata. Klien tidak boleh dipercaya menegakkannya.

1. **Stok pengecer tidak disimpan sebagai kolom.**
   Selalu dihitung dari riwayat: `Σ pengiriman diterima − Σ penyaluran non-draft`.
   Acuan: `lib/domain/stok.ts`. Kalau perlu cepat, buat *materialized view* atau
   tabel ringkasan yang dibangun ulang dari riwayat — jangan kolom yang ditulis manual.

2. **Transisi status hanya boleh mengikuti tabel di `lib/domain/status.ts`.**
   Terapkan sebagai state machine di Service/Action Laravel, bukan sebagai
   `update()` bebas dari Filament.

3. **Penyaluran tidak boleh melebihi sisa hak RDKK.**
   Divalidasi ulang di server saat menyimpan, dengan penguncian baris
   (`lockForUpdate`) agar dua kasir kios tidak menembus batas bersamaan.

---

## Daftar tabel

### Master wilayah & komoditas

| Tabel | Kolom penting | Relasi |
|---|---|---|
| `kecamatan` | `id`, `kode` (2 digit BPS), `nama` | — |
| `desa` | `id`, `nama`, `kecamatan_id` | → `kecamatan` |
| `jenis_pupuk` | `id`, `kode` (unik), `nama`, `satuan` enum(`kg`,`liter`), `het` integer (rupiah) | — |

> HET berubah tiap periode. Pada produksi, pindahkan ke tabel `het_periode`
> (`jenis_pupuk_id`, `berlaku_mulai`, `berlaku_sampai`, `harga`) dan simpan
> harga yang dipakai pada baris `penyaluran_item` sebagai snapshot.

### Pelaku rantai distribusi

| Tabel | Kolom penting | Relasi |
|---|---|---|
| `distributor` | `id`, `kode`, `nama`, `produsen`, `alamat`, `telepon` | — |
| `distributor_kecamatan` | `distributor_id`, `kecamatan_id` | pivot wilayah kerja |
| `pengecer` | `id`, `kode`, `nama`, `pemilik`, `alamat`, `telepon`, `desa_id`, `distributor_id` | → `desa`, `distributor` |
| `kelompok_tani` | `id`, `kode`, `nama`, `ketua`, `jumlah_anggota`, `luas_lahan_ha` decimal(6,2), `desa_id`, `pengecer_id` | → `desa`, `pengecer` |
| `petani` | `id`, `nik` (unik), `nama`, `luas_lahan_ha`, `komoditas`, `poktan_id` | → `kelompok_tani` |
| `pengawas` | `id`, `nama`, `nip`, `instansi`, `jabatan` | — |
| `pengawas_kecamatan` | `pengawas_id`, `kecamatan_id` | pivot wilayah kerja |
| `users` | `id`, `nama`, `email`, `password`, `role` enum, `entity_type`, `entity_id`, `jabatan` | relasi polimorfik ke pelaku |

`role`: `distributor` \| `pengecer` \| `poktan` \| `kp3`.

> Pada prototipe `entityId` adalah kolom tunggal. Di Laravel gunakan relasi
> polimorfik (`morphTo`) atau empat kolom nullable — polimorfik lebih rapi
> untuk kebijakan otorisasi.

### RDKK

| Tabel | Kolom penting | Relasi |
|---|---|---|
| `rdkk` | `id`, `kode`, `poktan_id`, `musim_tanam`, `tahun`, `disahkan_pada` | → `kelompok_tani` |
| `rdkk_item` | `rdkk_id`, `jenis_pupuk_id`, `jumlah_kg` | → `rdkk`, `jenis_pupuk` |

Indeks unik: (`poktan_id`, `musim_tanam`, `tahun`) — satu poktan satu RDKK per musim.

### Alokasi & pengiriman

| Tabel | Kolom penting | Relasi |
|---|---|---|
| `alokasi` | `id`, `kode`, `distributor_id`, `kecamatan_id`, `musim_tanam`, `tahun`, `periode_mulai`, `periode_selesai`, `status` enum(`draft`,`aktif`), `catatan` | → `distributor`, `kecamatan` |
| `alokasi_rincian` | `id`, `alokasi_id`, `pengecer_id` | → `alokasi`, `pengecer` |
| `alokasi_item` | `alokasi_rincian_id`, `jenis_pupuk_id`, `jumlah_kg` | → `alokasi_rincian`, `jenis_pupuk` |
| `pengiriman` | `id`, `kode`, `no_faktur` (unik), `no_berita_acara`, `distributor_id`, `pengecer_id`, `alokasi_id` nullable, `tanggal_kirim`, `status` enum, `tanggal_konfirmasi` nullable, `catatan_pengecer` nullable | → `distributor`, `pengecer`, `alokasi` |
| `pengiriman_item` | `pengiriman_id`, `jenis_pupuk_id`, `jumlah_kg`, `jumlah_diterima_kg` nullable | → `pengiriman`, `jenis_pupuk` |

`pengiriman.status`: `draft` → `dikirim` → { `dikonfirmasi` \| `selisih` \| `ditolak` }.

`jumlah_diterima_kg` diisi pengecer saat konfirmasi. **Hanya status
`dikonfirmasi` dan `selisih` yang menambah stok**, dan yang dihitung adalah
`jumlah_diterima_kg`, bukan `jumlah_kg`.

### Penyaluran

| Tabel | Kolom penting | Relasi |
|---|---|---|
| `penyaluran` | `id`, `kode`, `no_transaksi` (unik), `pengecer_id`, `poktan_id`, `rdkk_id`, `tanggal`, `total` integer, `metode_bayar` enum(`tunai`,`kartu_tani`), `status` enum | → `pengecer`, `kelompok_tani`, `rdkk` |
| `penyaluran_item` | `penyaluran_id`, `jenis_pupuk_id`, `jumlah_kg`, `het` (snapshot), `subtotal` | → `penyaluran`, `jenis_pupuk` |
| `penyaluran_bukti` | `penyaluran_id`, `ttd_penerima_path`, `foto_struk_path`, `catatan` | 1–1 dengan `penyaluran` |
| `penyaluran_konfirmasi` | `penyaluran_id`, `tanggal`, `ttd_ketua_path`, `foto_terima_path`, `kesesuaian` enum(`sesuai`,`tidak_sesuai`), `catatan` | 1–1 dengan `penyaluran` |

`penyaluran.status`: `draft` → `disalurkan` → `dikonfirmasi` → { `divalidasi` \| `bermasalah` }.

> Pada prototipe, tanda tangan dan foto disimpan sebagai data URL di dalam
> objek. Di produksi simpan **berkas** di storage (S3/lokal) dan tabel hanya
> menyimpan path. Ukuran gambar dikecilkan di sisi klien sebelum diunggah —
> lihat `components/domain/foto-upload.tsx`.

### Pemanfaatan & pengawasan

| Tabel | Kolom penting | Relasi |
|---|---|---|
| `laporan_pemanfaatan` | `id`, `kode`, `poktan_id`, `penyaluran_id` nullable, `periode`, `komoditas`, `luas_tanam_ha`, `tanggal_aplikasi`, `catatan` | → `kelompok_tani`, `penyaluran` |
| `pemanfaatan_item` | `laporan_id`, `jenis_pupuk_id`, `jumlah_kg` | → `laporan_pemanfaatan`, `jenis_pupuk` |
| `validasi` | `id`, `kode`, `pengawas_id`, `target_type`, `target_id`, `hasil` enum(`valid`,`perlu_verifikasi`,`tidak_valid`), `catatan`, `tanggal` | polimorfik ke `pengiriman`/`penyaluran` |
| `inspeksi` | `id`, `kode`, `pengawas_id`, `lokasi_type`, `lokasi_id`, `tanggal`, `kesesuaian` enum(`sesuai`,`sebagian`,`tidak_sesuai`), `catatan` | polimorfik ke `pengecer`/`kelompok_tani` |
| `inspeksi_temuan` | `inspeksi_id`, `isi` | → `inspeksi` |
| `tindak_lanjut` | `id`, `kode`, `pengawas_id`, `jenis` enum(`teguran`,`rekomendasi`,`penghargaan`), `sasaran_type`, `sasaran_id`, `ref_type` nullable, `ref_id` nullable, `judul`, `isi`, `tanggal` | polimorfik |
| `notifikasi` | `id`, `user_id`, `tipe`, `judul`, `pesan`, `tautan`, `dibaca` boolean, `created_at` | → `users` |

---

## Peta berkas prototipe → berkas Laravel

| Prototipe | Padanan di Laravel |
|---|---|
| `lib/domain/types.ts` | migration + Eloquent Model |
| `lib/domain/status.ts` | Service/Action state machine + Enum PHP |
| `lib/domain/stok.ts` | Service `StokPengecer`, query scope |
| `lib/domain/laporan.ts` | Service laporan / Filament Widget |
| `lib/domain/notifikasi.ts` | Laravel Notification + Listener |
| `lib/data/repository.ts` | daftar Action / Form Request |
| `lib/data/local-repo.ts` | isi Action (validasi + penulisan) |
| `lib/seed/` | Database Seeder + Factory |

---

## Catatan otorisasi

Prototipe tidak punya otorisasi. Di produksi, minimal:

- Distributor hanya melihat pengiriman dan kios binaannya sendiri.
- Pengecer hanya melihat transaksi kiosnya sendiri.
- Kelompok tani hanya melihat penyaluran yang ditujukan kepadanya.
- Pengawas KP3 melihat lintas wilayah, tetapi hanya bisa **memvalidasi**,
  bukan mengubah, transaksi.

Terapkan lewat Policy Laravel, dan pada Filament lewat `Resource::getEloquentQuery()`
yang sudah tersaring — jangan mengandalkan penyembunyian tombol saja.
