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
5. **Bahasa antarmuka dan penamaan kode: Indonesia.** Istilah domain (alokasi,
   penyaluran, RDKK, HET, poktan) dipakai apa adanya karena itu kosakata yang
   dipahami pengguna sebenarnya.

## Peta berkas

| Letak | Isi |
|---|---|
| `lib/domain/` | tipe, mesin status, perhitungan stok & RDKK, agregasi laporan, deret waktu grafik, aturan notifikasi, formatter |
| `lib/data/` | kontrak `DataRepo`, implementasi lokal (zustand + localStorage), stub Supabase |
| `lib/seed/` | data sintetis deterministik — hasilnya selalu sama |
| `lib/hooks/` | pembacaan store dan sesi untuk komponen |
| `lib/ui/` | identitas peran, konfigurasi navigasi, naskah halaman petunjuk, util kelas |
| `components/ui/` | primitif tampilan |
| `components/domain/` | komponen khusus domain (tanda tangan, editor item pupuk, rincian penyaluran) |
| `docs/` | ERD blueprint Laravel, peta diagram alur, skrip demo |

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
