<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Prototipe Pengawasan Pupuk Bersubsidi

Aplikasi pengawasan rantai distribusi pupuk bersubsidi: **Distributor →
Pengecer Resmi → Kelompok Tani → Pengawas KP3**.

Tahap ini adalah **prototipe clickable** untuk validasi alur ke pemangku
kepentingan. Implementasi produksi direncanakan memakai **Laravel + Filament**,
jadi rancangan datanya sengaja dibuat portabel.

## Aturan yang tidak boleh dilanggar

1. **`lib/domain/` harus murni TypeScript.** Tidak boleh mengimpor React, Next,
   zustand, atau apa pun yang berkaitan dengan penyimpanan. Isinya yang nanti
   diterjemahkan menjadi Model + Service Laravel.
2. **Semua akses data lewat `DataRepo`** (`lib/data/repository.ts`), dan semua
   methodnya `async` meski implementasi prototipenya sinkron. Ini yang membuat
   pindah ke API nyata tidak perlu menyentuh satu pun komponen.
3. **Stok tidak pernah disimpan sebagai angka.** Selalu dihitung dari riwayat
   di `lib/domain/stok.ts`.
4. **Perpindahan status hanya lewat `lib/domain/status.ts`.** Jangan menulis
   `status = '...'` langsung di komponen.
5. **Pengawas KP3 bukan gerbang persetujuan.** Daur hidup penyaluran berhenti
   pada pernyataan kelompok tani (`dikonfirmasi` atau `disanggah`); KP3 tidak
   punya satu pun transisi status. Jejak pengawasan menempel sebagai anotasi
   (`Penyaluran.pengawasan`) dan boleh kosong — KP3 bekerja dengan uji petik,
   jadi transaksi tanpa anotasi bukan tunggakan. Jangan pula mengirim
   notifikasi ke pengawas untuk peristiwa yang wajar; hanya anomali.
6. **Bahasa antarmuka dan penamaan kode: Indonesia.** Istilah domain (alokasi,
   penyaluran, RDKK, HET, poktan) dipakai apa adanya karena itu kosakata yang
   dipahami pengguna sebenarnya.

## Peta berkas

| Letak | Isi |
|---|---|
| `lib/domain/` | tipe, mesin status, perhitungan stok & RDKK, penapisan & penurunan temuan pengawasan, agregasi laporan, deret waktu grafik, aturan notifikasi, formatter |
| `lib/data/` | kontrak `DataRepo`, implementasi lokal (zustand + localStorage), stub Supabase |
| `lib/seed/` | data sintetis deterministik — hasilnya selalu sama |
| `lib/hooks/` | pembacaan store dan sesi untuk komponen |
| `lib/ui/` | identitas peran, konfigurasi navigasi, naskah halaman petunjuk, util kelas |
| `components/ui/` | primitif tampilan |
| `components/domain/` | komponen khusus domain (tanda tangan, editor item pupuk, rincian penyaluran) |
| `docs/` | ERD blueprint Laravel, peta diagram alur, skrip demo |

## Peran KP3

Umpan pemangku kepentingan pernah menegaskan satu hal yang mengubah rancangan:
**KP3 tidak melakukan validasi transaksi.** Tugasnya memastikan penyaluran
tepat jenis, jumlah, harga, tempat, waktu, penerima, dan sesuai ketentuan —
lewat pengawasan uji petik atas transaksi yang sudah selesai.

Karena itu:

- Yang menggantikan "antrian validasi" adalah **penapisan** di
  `lib/domain/pengawasan.ts`: setiap transaksi selesai diuji terhadap tujuh
  tepat, dan butir yang gagal menjadi alasan berbasis data untuk memilih objek
  pemeriksaan. Ukurannya **cakupan pengawasan**, bukan panjang antrian.
- Output KP3 adalah dokumen, bukan kolom status: berita acara `Pemeriksaan`
  (uji stok fisik, uji harga, verifikasi penerima, checklist administrasi),
  register `Temuan` berkategori tujuh tepat, lalu `TindakLanjut` dengan tenggat
  dan status pelaksanaan sampai terverifikasi.
- Objek pemeriksaan mencakup distributor, pengecer, kelompok tani, dan petani —
  bukan hanya kios.
- **`ItemPenyaluran.het` selalu sama dengan HET master**, jadi pelanggaran
  harga mustahil terbaca dari data transaksi: kios yang menjual di atas HET
  tidak akan melaporkannya sendiri. Satu-satunya jalan adalah `PeriksaHarga`
  pada berita acara. Jangan membuat pemeriksaan harga yang tautologis dan
  mengesankan sudah teruji.

Belum dimodelkan dan sengaja disebut terbuka: kanal pengaduan masyarakat,
rencana pengawasan tahunan, dan laporan hasil pengawasan sebagai dokumen
periodik.

## Letak halaman

Halaman `/petunjuk` berada di luar grup `(app)` supaya bisa dibuka sebelum
login. Naskahnya ada di `lib/ui/panduan.ts` — ubah di sana, bukan di komponen,
agar bisa ditinjau bersama pemangku kepentingan tanpa membaca kode tampilan.

## Tampilan

Tata letak dashboard baku: sidebar terang tetap di kiri, bilah atas untuk
identitas dan akun, isi halaman dibatasi `max-w-6xl`. Semua token ada di
`app/globals.css`.

**Kedalaman dibentuk oleh bayangan berlapis, bukan garis tebal.** Kartu memakai
`shadow-kartu` + `ring-1 ring-black/[0.04]`, radius `rounded-3xl`. Hindari
`border` 1px sebagai pemisah utama; sisakan garis hanya untuk baris tabel.

**Satu warna aksen untuk seluruh aplikasi** (`--color-tinta`, hampir hitam).
Peran tidak diberi warna sendiri — dibedakan lewat judul halaman, isi menu,
dan inisial pada avatar.

**Warna hanya untuk menandai jenis metrik, bukan peran.** `StatCard` menerima
`aksen` (biru, hijau, jingga, merah, ungu) yang mewarnai lencana ikonnya:
biru untuk volume, hijau untuk yang sudah tuntas, jingga untuk yang menunggu,
merah untuk masalah, ungu untuk stok dan hak. Dipakai konsisten lintas peran.

Setiap halaman punya satu titik fokus berupa `PanelMetrik` (kartu gelap
bergradasi berisi 2–3 angka utama), didampingi `StatCard` untuk angka pendukung.

## Grafik

`components/ui/grafik.tsx` menggambar area chart sebagai SVG biasa — tanpa
pustaka grafik. Angkanya dihitung di `lib/domain/tren.ts`, jadi logikanya bisa
diuji terpisah dari cara menggambarnya. Kurva dihaluskan lewat titik tengah
supaya tidak pernah melengkung di bawah nol.

Bungkusnya `components/domain/kartu-tren.tsx`; rentangnya berakhir pada
transaksi terbaru, bukan tanggal hari ini, supaya data demo tetap terlihat
kapan pun prototipe dibuka.

## Responsif

Diperiksa pada 320, 360, 390, 414, 768, dan 1024 px. Dua jebakan yang sudah
pernah menggigit dan mudah terulang:

1. **Grid tanpa `grid-cols-*` membentuk kolom implisit seukuran `max-content`.**
   Isinya melebar mengikuti baris teks terpanjang dan menembus tepi layar.
   Selalu sebut kolomnya — `grid-cols-1` sekalipun.
2. **Grid item tidak bisa menyusut di bawah `min-content`.** Tabel lebar di
   dalamnya akan mendorong seluruh grid dan `overflow-x-auto` tidak pernah
   aktif. Karena itu semua grid dua kolom memakai `*:min-w-0` dan
   `minmax(0,1fr)`, bukan `1fr`.

Kolom tabel yang berisi input wajib punya lebar minimum (`min-w-24`); tanpa itu
`w-full` membuat kolom menyusut sampai angkanya tidak terbaca.

`html { overflow-x: clip }` di `app/globals.css` hanya jaring pengaman — bukan
izin membiarkan elemen melebar. Ukur dengan
`documentElement.scrollWidth - clientWidth`, yang tetap membaca selisihnya
walau visualnya sudah terpotong.

## Kepadatan halaman

Satu layar tidak boleh menumpuk beberapa tabel sekaligus. Bila sebuah halaman
punya lebih dari satu tabel, bungkus dalam satu `Card` dan pisahkan dengan
`components/ui/tabs.tsx` — pengguna memilih satu bagian, sisanya disembunyikan.
Pola ini dipakai di keempat dashboard, laporan KP3, halaman stok, dan daftar
penerimaan.

## Hal yang disengaja dan jangan "diperbaiki"

- **Halaman di bawah `app/(app)/` adalah client component.** Datanya di
  localStorage, jadi server component tidak bisa membacanya. Utang teknis ini
  hilang sendiri saat backend nyata dipasang.
- **`skipHydration: true` pada store zustand.** Rehydrate dijalankan manual di
  `components/store-provider.tsx` supaya render server dan render pertama di
  browser identik. Menghapusnya akan memunculkan hydration mismatch.
- **Tidak ada autentikasi.** Sesi hanya menyimpan id pengguna; pemilih peran ada
  supaya demo bisa berpindah sudut pandang tanpa keluar-masuk aplikasi.

## Perintah

```bash
npm run dev        # jalankan
npm run test       # uji aturan domain
npm run check      # typecheck + lint + test + build
```
