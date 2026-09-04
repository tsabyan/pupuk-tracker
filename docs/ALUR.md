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

## Pengawas KP3 (ungu)

| # | Langkah pada diagram | Layar | Berkas |
|---|---|---|---|
| 1 | Monitoring Real-time | `/kp3` | `app/(app)/kp3/page.tsx` |
| 2 | Validasi & Verifikasi | `/kp3/validasi`, `/kp3/validasi/[id]` | `app/(app)/kp3/validasi/` |
| 3 | Laporan & Analitik | `/kp3/laporan` | `app/(app)/kp3/laporan/page.tsx` |
| 4 | Pengawasan Lapangan | `/kp3/inspeksi/baru` | `app/(app)/kp3/inspeksi/baru/page.tsx` |
| 5 | Tindak Lanjut | `/kp3/tindak-lanjut/baru` | `app/(app)/kp3/tindak-lanjut/baru/page.tsx` |

## SELESAI

Status akhir rantai adalah `divalidasi` pada penyaluran: data tersimpan,
terkonfirmasi kedua pihak, dan tervalidasi pengawas.

## Fitur pendukung

| Fitur pada diagram | Status di prototipe |
|---|---|
| Dashboard per role | ✅ empat dashboard, warna mengikuti diagram |
| Notifikasi real-time | ✅ notifikasi in-app (`/notifikasi` + lonceng) |
| Riwayat transaksi | ✅ melekat pada tiap transaksi & mutasi stok |
| Peta sebaran | ❌ di luar cakupan tahap ini |
| Integrasi RDKK / e-Alokasi / e-Pubers | ⚠️ RDKK dimodelkan penuh, tetapi datanya sintetis |
