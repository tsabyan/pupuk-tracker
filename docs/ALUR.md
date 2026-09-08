# Peta Diagram Alur → Layar Aplikasi

Setiap langkah pada diagram alur "Aplikasi Pengawasan Pupuk Bersubsidi
Terintegrasi" punya layarnya sendiri. Tabel ini dipakai saat presentasi untuk
menunjukkan bahwa tidak ada langkah yang terlewat.

## START

| Langkah | Layar | Berkas |
|---|---|---|
| Login Aplikasi | `/login` | `app/login/page.tsx` |

## Distributor (biru)

| # | Langkah pada diagram | Layar | Berkas |
|---|---|---|---|
| 1 | Login & akses dashboard | `/distributor` | `app/(app)/distributor/page.tsx` |
| 2 | Input Rencana Alokasi | `/distributor/alokasi/baru` | `app/(app)/distributor/alokasi/baru/page.tsx` |
| 3 | Pengiriman ke Pengecer | `/distributor/pengiriman/baru` | `app/(app)/distributor/pengiriman/baru/page.tsx` |
| 4 | Notifikasi Terkirim | lonceng + `/distributor/pengiriman/[id]` | `components/shell/lonceng.tsx` |

## Pengecer Resmi (hijau)

| # | Langkah pada diagram | Layar | Berkas |
|---|---|---|---|
| 1 | Login & akses dashboard | `/pengecer` | `app/(app)/pengecer/page.tsx` |
| 2 | Konfirmasi Penerimaan | `/pengecer/penerimaan/[id]` | `app/(app)/pengecer/penerimaan/[id]/page.tsx` |
| 3 | Stok Pengecer bertambah | `/pengecer/stok` | `app/(app)/pengecer/stok/page.tsx` |
| 4 | Penyaluran ke Kelompok Tani | `/pengecer/penyaluran/baru` | `app/(app)/pengecer/penyaluran/baru/page.tsx` |
| 5 | Bukti Penyaluran | bagian "Bukti penyaluran" pada layar yang sama | `components/domain/ttd-pad.tsx`, `foto-upload.tsx` |

## Kelompok Tani (oranye)

| # | Langkah pada diagram | Layar | Berkas |
|---|---|---|---|
| 1 | Login (melalui ketua) | `/poktan` | `app/(app)/poktan/page.tsx` |
| 2 | Terima Pupuk | `/poktan/penerimaan/[id]` | `app/(app)/poktan/penerimaan/[id]/page.tsx` |
| 3 | Konfirmasi Penerimaan (ttd, foto) | bagian "Konfirmasi penerimaan" pada layar yang sama | idem |
| 4 | Pemanfaatan & Laporan | `/poktan/pemanfaatan/baru` | `app/(app)/poktan/pemanfaatan/baru/page.tsx` |

## SELESAI — rantai distribusi

Status akhir rantai adalah `dikonfirmasi` pada penyaluran: data tersimpan,
berbukti, dan disetujui **kedua pihak transaksi**. Bila penerima menyatakan
ada yang tidak sesuai, status akhirnya `disanggah` — tetap tercatat, dan
menjadi bahan pengawasan.

Pengawas KP3 sengaja tidak punya langkah di dalam rantai ini. Diagram alur
awal menempatkan "Validasi & Verifikasi KP3" sebagai penutup rantai; itu
keliru dan sudah dikoreksi. Alasannya di `lib/domain/status.ts`.

## Pengawas KP3 (ungu) — lapisan pengawasan di atas rantai

Bukan sambungan rantai, melainkan siklus tersendiri yang berjalan atas
transaksi yang sudah tuntas: **perencanaan objek → pemeriksaan → temuan →
tindak lanjut → pelaporan**.

| # | Langkah | Layar | Berkas |
|---|---|---|---|
| 1 | Monitoring real-time | `/kp3` | `app/(app)/kp3/page.tsx` |
| 2 | Penapisan & pemilihan objek | `/kp3/objek`, `/kp3/objek/[id]` | `app/(app)/kp3/objek/` |
| 3 | Pemeriksaan & berita acara | `/kp3/pemeriksaan`, `/kp3/pemeriksaan/baru`, `/kp3/pemeriksaan/[id]` | `app/(app)/kp3/pemeriksaan/` |
| 4 | Register temuan | `/kp3/temuan` | `app/(app)/kp3/temuan/page.tsx` |
| 5 | Tindak lanjut & verifikasi pelaksanaan | `/kp3/tindak-lanjut`, `/kp3/tindak-lanjut/[id]`, `/kp3/tindak-lanjut/baru` | `app/(app)/kp3/tindak-lanjut/` |
| 6 | Laporan & analitik | `/kp3/laporan` | `app/(app)/kp3/laporan/page.tsx` |

### Tugas KP3 → layar yang mewadahinya

| Tugas pengawasan | Di mana |
|---|---|
| Mengawasi penyaluran distributor → kios → poktan | `/kp3` dan `/kp3/objek` |
| Memeriksa ketersediaan & kesesuaian stok fisik vs administrasi | uji stok pada `/kp3/pemeriksaan/baru` |
| Mengawasi harga terhadap HET dan pungutan tambahan | uji harga pada `/kp3/pemeriksaan/baru` |
| Memeriksa kesesuaian penerima dengan RDKK | verifikasi penerima pada `/kp3/pemeriksaan/baru`, penapisan aspek "tepat penerima" |
| Memeriksa administrasi penyaluran | checklist administrasi pada `/kp3/pemeriksaan/baru` |
| Pemeriksaan lapangan ke distributor, kios, poktan, petani | pilihan jenis objek pada `/kp3/pemeriksaan/baru` |
| Mengidentifikasi & melaporkan penyimpangan | `/kp3/pemeriksaan/[id]` (berita acara) dan `/kp3/temuan` |
| Rekomendasi tindak lanjut & pemantauan pelaksanaannya | `/kp3/tindak-lanjut` |
| Koordinasi antarinstansi | instansi pendamping pada berita acara, eskalasi pada tindak lanjut |
| Menindaklanjuti pengaduan masyarakat | ❌ belum — lihat "Fitur pendukung" |

## Fitur pendukung

| Fitur pada diagram | Status di prototipe |
|---|---|
| Dashboard per role | ✅ empat dashboard, warna mengikuti diagram |
| Notifikasi real-time | ✅ notifikasi in-app (`/notifikasi` + lonceng) |
| Riwayat transaksi | ✅ melekat pada tiap transaksi & mutasi stok |
| Peta sebaran | ❌ di luar cakupan tahap ini |
| Integrasi RDKK / e-Alokasi / e-Pubers | ⚠️ RDKK dimodelkan penuh, tetapi datanya sintetis |
| Pengaduan masyarakat (WA, telepon, surat, langsung) | ❌ belum dimodelkan — tahap berikutnya |
| Rencana pengawasan tahunan & penentuan objek berjadwal | ❌ belum — objek kini dipilih dari hasil penapisan |
| Laporan hasil pengawasan sebagai dokumen periodik | ⚠️ `/kp3/laporan` menyajikan angkanya, belum menerbitkan dokumennya |
