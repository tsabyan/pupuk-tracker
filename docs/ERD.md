# Rancangan Data — Blueprint Migrasi Laravel

Dokumen ini menerjemahkan model data prototipe (`lib/domain/types.ts`) menjadi
rancangan tabel untuk implementasi produksi dengan **Laravel + Filament**.

Prototipe sengaja menyimpan data sebagai satu objek JSON di browser, tetapi
bentuknya sudah disusun seperti tabel relasional agar pemindahannya lurus:
satu antarmuka TypeScript = satu tabel.

---

## Prinsip yang harus ikut pindah

Empat aturan berikut hidup di `lib/domain/` dan **wajib dijalankan di sisi
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

4. **Pengawasan tidak boleh menjadi gerbang transaksi.**
   Tidak ada status transaksi yang menunggu tindakan KP3, dan tidak ada
   notifikasi ke pengawas untuk penerimaan yang wajar. Acuan:
   `lib/domain/pengawasan.ts`. Menaruh pengawas sebagai penyetuju berarti
   ribuan transaksi per musim menggantung menunggu satu komisi kabupaten —
   sekaligus salah menggambarkan kewenangan KP3.

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

`penyaluran.status`: `draft` → `disalurkan` → { `dikonfirmasi` \| `disanggah` }.

> **Daur hidupnya berhenti di dua pihak transaksi.** Pengawas KP3 tidak punya
> transisi status di sini: penyaluran sudah sah begitu ketua kelompok tani
> menyatakan sikapnya. Jejak pengawasan disimpan pada tabel terpisah
> (`penyaluran_pengawasan`), dan ketiadaan barisnya bukan tunggakan — KP3
> mengawasi dengan uji petik.

| Tabel | Kolom penting | Relasi |
|---|---|---|
| `penyaluran_pengawasan` | `penyaluran_id`, `pengawas_id`, `tanggal`, `pemeriksaan_id` nullable, `hasil` enum(`sesuai`,`temuan`), `catatan` | 1–1 dengan `penyaluran` |

> Pada prototipe, tanda tangan dan foto disimpan sebagai data URL di dalam
> objek. Di produksi simpan **berkas** di storage (S3/lokal) dan tabel hanya
> menyimpan path. Ukuran gambar dikecilkan di sisi klien sebelum diunggah —
> lihat `components/domain/foto-upload.tsx`.

### Pemanfaatan & pengawasan

| Tabel | Kolom penting | Relasi |
|---|---|---|
| `laporan_pemanfaatan` | `id`, `kode`, `poktan_id`, `penyaluran_id` nullable, `periode`, `komoditas`, `luas_tanam_ha`, `tanggal_aplikasi`, `catatan` | → `kelompok_tani`, `penyaluran` |
| `pemanfaatan_item` | `laporan_id`, `jenis_pupuk_id`, `jumlah_kg` | → `laporan_pemanfaatan`, `jenis_pupuk` |
| `pemeriksaan` | `id`, `kode`, `no_berita_acara` (unik), `pengawas_id`, `objek_type`, `objek_id`, `tanggal`, `kesimpulan` enum(`sesuai`,`sebagian`,`tidak_sesuai`), `catatan`, `ttd_pengawas_path`, `ttd_objek_path` | polimorfik ke `distributor`/`pengecer`/`kelompok_tani`/`petani` |
| `pemeriksaan_pendamping` | `pemeriksaan_id`, `instansi` | → `pemeriksaan` |
| `pemeriksaan_sampel` | `pemeriksaan_id`, `penyaluran_id` | pivot uji petik |
| `pemeriksaan_stok` | `pemeriksaan_id`, `jenis_pupuk_id`, `sistem_kg`, `fisik_kg` | → `pemeriksaan`, `jenis_pupuk` |
| `pemeriksaan_harga` | `pemeriksaan_id`, `jenis_pupuk_id`, `het`, `harga_jual`, `biaya_tambahan`, `keterangan` | → `pemeriksaan`, `jenis_pupuk` |
| `pemeriksaan_penerima` | `pemeriksaan_id`, `poktan_id`, `petani_id` nullable, `terdaftar_rdkk` boolean, `hak_kg`, `ditebus_kg` | → `pemeriksaan`, `kelompok_tani`, `petani` |
| `pemeriksaan_administrasi` | `pemeriksaan_id`, `butir`, `ada` boolean | → `pemeriksaan` |
| `temuan` | `id`, `kode`, `sumber` enum(`pemeriksaan`,`penapisan`,`pengaduan`), `sumber_id`, `aspek` enum(7 tepat), `uraian`, `tingkat` enum(`ringan`,`sedang`,`berat`), `status` enum(`terbuka`,`ditindaklanjuti`,`selesai`), `objek_type`, `objek_id`, `tanggal`, `tindak_lanjut_id` nullable | polimorfik |
| `tindak_lanjut` | `id`, `kode`, `pengawas_id`, `jenis` enum(`teguran`,`rekomendasi`,`pembinaan`,`penghargaan`), `sasaran_type`, `sasaran_id`, `judul`, `isi`, `tanggal`, `tenggat`, `status` enum(`terbit`,`dalam_proses`,`selesai`,`eskalasi`), `bukti_pelaksanaan` nullable, `tanggal_selesai` nullable, `eskalasi_ke` nullable | polimorfik |
| `tindak_lanjut_temuan` | `tindak_lanjut_id`, `temuan_id` | pivot; satu surat bisa menutup beberapa temuan |
| `notifikasi` | `id`, `user_id`, `tipe`, `judul`, `pesan`, `tautan`, `dibaca` boolean, `created_at` | → `users` |

`temuan.aspek` mengikuti kerangka tujuh tepat: `jenis`, `jumlah`, `harga`,
`tempat`, `waktu`, `penerima`, `ketentuan`. Dipakai sebagai kategori baku agar
rekap antar periode bisa dibandingkan.

`tindak_lanjut.status`: `terbit` → { `dalam_proses` \| `selesai` \| `eskalasi` },
`dalam_proses` → { `selesai` \| `eskalasi` }, `eskalasi` → `selesai`. Status
`selesai` menutup seluruh temuan yang dirujuk pivotnya — di situlah lingkaran
pengawasan tertutup, dan itulah yang dinilai pada maturitas SPIP.

---

## Peta berkas prototipe → berkas Laravel

| Prototipe | Padanan di Laravel |
|---|---|
| `lib/domain/types.ts` | migration + Eloquent Model |
| `lib/domain/status.ts` | Service/Action state machine + Enum PHP |
| `lib/domain/pengawasan.ts` | Service `Penapisan` + `PenurunanTemuan` |
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
- Pengawas KP3 melihat lintas wilayah, tetapi **tidak boleh mengubah satu pun
  baris transaksi** — termasuk statusnya. Yang boleh ditulis KP3 hanyalah
  `penyaluran_pengawasan`, `pemeriksaan*`, `temuan`, dan `tindak_lanjut`.
  Batas ini bukan kenyamanan UI: pengawas yang bisa menyunting objek
  pengawasannya sendiri membuat seluruh jejak audit kehilangan arti.

Terapkan lewat Policy Laravel, dan pada Filament lewat `Resource::getEloquentQuery()`
yang sudah tersaring — jangan mengandalkan penyembunyian tombol saja.
