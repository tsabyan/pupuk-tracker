/**
 * Transaksi awal demo.
 *
 * Disimulasikan berurutan (kirim → terima → salurkan) supaya stok kios
 * tidak pernah minus dan penyaluran tidak pernah melebihi hak RDKK —
 * data demo harus lolos aturan yang sama dengan input manual.
 *
 * Beberapa transaksi sengaja ditinggalkan menggantung sebagai umpan aksi
 * saat presentasi: minimal satu pengiriman menunggu konfirmasi kios, satu
 * penyaluran menunggu konfirmasi poktan, dan beberapa menunggu validasi KP3.
 */

import type {
  Alokasi,
  Inspeksi,
  ItemPengiriman,
  ItemPenyaluran,
  LaporanPemanfaatan,
  Notifikasi,
  Pengiriman,
  Penyaluran,
  Role,
  TindakLanjut,
  User,
  Validasi,
} from '@/lib/domain/types'
import {
  saatPengirimanDikirim,
  saatPenyaluranDikonfirmasi,
  saatPenyaluranDisalurkan,
  type DraftNotifikasi,
  type KonteksNotif,
} from '@/lib/domain/notifikasi'
import { buatRng, geserHari, jamKerja } from './rng'
import {
  DESA,
  DISTRIBUTOR,
  JENIS_PUPUK,
  KELOMPOK_TANI,
  MUSIM_TANAM,
  PENGAWAS,
  PENGECER,
  PERIODE_MULAI,
  PERIODE_SELESAI,
  RDKK,
  TAHUN_MUSIM,
  TANGGAL_ACUAN,
  USERS,
} from './master'

export interface HasilTransaksi {
  alokasi: Alokasi[]
  pengiriman: Pengiriman[]
  penyaluran: Penyaluran[]
  laporanPemanfaatan: LaporanPemanfaatan[]
  validasi: Validasi[]
  inspeksi: Inspeksi[]
  tindakLanjut: TindakLanjut[]
  notifikasi: Notifikasi[]
}

const nomor = (n: number, lebar = 4) => String(n).padStart(lebar, '0')

/** Total hak RDKK seluruh kelompok tani binaan satu kios, dibulatkan. */
function rekapRdkkKios(pengecerId: string, jenisPupukId: string): number {
  const poktan = KELOMPOK_TANI.filter((k) => k.pengecerId === pengecerId)
  const total = poktan.reduce((jml, p) => {
    const rdkk = RDKK.find((r) => r.poktanId === p.id)
    return jml + (rdkk?.items.find((i) => i.jenisPupukId === jenisPupukId)?.jumlahKg ?? 0)
  }, 0)
  return Math.round(total / 25) * 25
}
const bulanDari = (iso: string) => iso.slice(5, 7)

/** Tanda tangan placeholder — SVG data URL agar demo tidak butuh aset. */
const TTD_CONTOH =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="90">' +
      '<path d="M10 62 C 40 18, 60 82, 88 44 S 132 12, 158 56 S 196 70, 228 30" ' +
      'fill="none" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/></svg>',
  )

export function buatTransaksi(): HasilTransaksi {
  const rng = buatRng(20260903)

  const alokasi: Alokasi[] = []
  const pengiriman: Pengiriman[] = []
  const penyaluran: Penyaluran[] = []
  const laporanPemanfaatan: LaporanPemanfaatan[] = []
  const validasi: Validasi[] = []
  const inspeksi: Inspeksi[] = []
  const tindakLanjut: TindakLanjut[] = []

  /* --------------------------------------------------------------- */
  /* 1. Rencana alokasi — satu per distributor per kecamatan          */
  /* --------------------------------------------------------------- */

  let urutAlokasi = 1
  for (const dist of DISTRIBUTOR) {
    for (const kecamatanId of dist.kecamatanIds) {
      const kiosDiKecamatan = PENGECER.filter((p) => {
        if (p.distributorId !== dist.id) return false
        const desa = DESA.find((d) => d.id === p.desaId)
        return desa?.kecamatanId === kecamatanId
      })

      alokasi.push({
        id: `alokasi-${nomor(urutAlokasi, 3)}`,
        kode: `ALO/${MUSIM_TANAM}/${TAHUN_MUSIM}/${nomor(urutAlokasi, 3)}`,
        distributorId: dist.id,
        musimTanam: MUSIM_TANAM,
        tahun: TAHUN_MUSIM,
        kecamatanId,
        periodeMulai: PERIODE_MULAI,
        periodeSelesai: PERIODE_SELESAI,
        status: 'aktif',
        catatan: 'Alokasi disusun berdasarkan rekap RDKK kelompok tani binaan.',
        dibuatPada: jamKerja('2026-06-28', rng),
        rincian: kiosDiKecamatan.map((kios) => ({
          pengecerId: kios.id,
          items: JENIS_PUPUK.map((jp) => ({
            jenisPupukId: jp.id,
            jumlahKg: rekapRdkkKios(kios.id, jp.id),
          })),
        })),
      })
      urutAlokasi++
    }
  }

  /* --------------------------------------------------------------- */
  /* 2. Pengiriman & penyaluran, disimulasikan per kios               */
  /* --------------------------------------------------------------- */

  const stok = new Map<string, number>()
  const kunciStok = (kiosId: string, pupukId: string) => `${kiosId}|${pupukId}`
  const ambilStok = (kiosId: string, pupukId: string) =>
    stok.get(kunciStok(kiosId, pupukId)) ?? 0
  const ubahStok = (kiosId: string, pupukId: string, delta: number) =>
    stok.set(kunciStok(kiosId, pupukId), ambilStok(kiosId, pupukId) + delta)

  /** Sisa hak RDKK yang belum ditebus, dilacak selama simulasi. */
  const sisaHak = new Map<string, number>()
  for (const r of RDKK) {
    for (const item of r.items) {
      sisaHak.set(`${r.poktanId}|${item.jenisPupukId}`, item.jumlahKg)
    }
  }

  let urutKirim = 1
  let urutSalur = 1

  PENGECER.forEach((kios, indexKios) => {
    const alokasiKios = alokasi.find((a) =>
      a.rincian.some((r) => r.pengecerId === kios.id),
    )

    // --- 2a. Dua pengiriman yang sudah diterima, jadi kios punya stok ---
    for (let ke = 0; ke < 3; ke++) {
      const tanggalKirim = geserHari(TANGGAL_ACUAN, -(54 - ke * 14) - indexKios)
      const selisih = indexKios === 3 && ke === 1

      // Tiap termin mengirim sebagian jatah alokasi kios, bukan angka lepas,
      // supaya total penerimaan tidak pernah melampaui rencana alokasi.
      const items: ItemPengiriman[] = JENIS_PUPUK.map((jp) => {
        const jatah = rekapRdkkKios(kios.id, jp.id)
        const porsi = rng.int(20, 27) / 100
        const dikirim = Math.max(50, Math.round((jatah * porsi) / 50) * 50)
        const diterima = selisih && jp.id === 'pk-npk' ? dikirim - 100 : dikirim
        return { jenisPupukId: jp.id, jumlahKg: dikirim, jumlahDiterimaKg: diterima }
      })

      for (const item of items) {
        ubahStok(kios.id, item.jenisPupukId, item.jumlahDiterimaKg ?? item.jumlahKg)
      }

      const bulan = bulanDari(tanggalKirim)
      pengiriman.push({
        id: `kirim-${nomor(urutKirim)}`,
        kode: `KRM-${nomor(urutKirim)}`,
        noFaktur: `FK/${TAHUN_MUSIM}/${bulan}/${nomor(urutKirim)}`,
        noBeritaAcara: `BA/${TAHUN_MUSIM}/${bulan}/${nomor(urutKirim)}`,
        distributorId: kios.distributorId,
        pengecerId: kios.id,
        alokasiId: alokasiKios?.id,
        tanggalKirim,
        items,
        status: selisih ? 'selisih' : 'dikonfirmasi',
        tanggalKonfirmasi: geserHari(tanggalKirim, 1),
        catatanPengecer: selisih
          ? 'Satu sak NPK sobek saat bongkar muat, jumlah diterima dikurangi 100 kg.'
          : 'Barang diterima lengkap dan dalam kondisi baik.',
        dibuatPada: jamKerja(tanggalKirim, rng),
      })
      urutKirim++
    }

    // --- 2b. Penyaluran ke kelompok tani binaan kios ---
    const poktanBinaan = KELOMPOK_TANI.filter((k) => k.pengecerId === kios.id)

    poktanBinaan.forEach((poktan, indexPoktan) => {
      const rdkk = RDKK.find((r) => r.poktanId === poktan.id)
      if (!rdkk) return

      // Kios & poktan demo menyisakan satu transaksi menggantung di akhir.
      const jumlahTransaksi = 3

      for (let ke = 0; ke < jumlahTransaksi; ke++) {
        // Disebar acak sepanjang bulan berjalan supaya grafik tren memperlihatkan
        // aktivitas harian yang wajar, bukan tiga lonjakan seragam.
        const tanggal = geserHari(TANGGAL_ACUAN, -rng.int(2, 30))

        const items: ItemPenyaluran[] = []
        for (const jp of JENIS_PUPUK) {
          const kunciHak = `${poktan.id}|${jp.id}`
          const hak = sisaHak.get(kunciHak) ?? 0
          const tersedia = ambilStok(kios.id, jp.id)
          const wajar = rng.bulat(250, 650, 25)
          const jumlahKg = Math.min(hak, tersedia, wajar)
          if (jumlahKg < 25) continue

          items.push({
            jenisPupukId: jp.id,
            jumlahKg,
            het: jp.het,
            subtotal: jumlahKg * jp.het,
          })
          sisaHak.set(kunciHak, hak - jumlahKg)
          ubahStok(kios.id, jp.id, -jumlahKg)
        }

        if (items.length === 0) continue

        // Sebaran status: yang lama sudah tervalidasi, yang baru masih berjalan.
        const terakhir = ke === jumlahTransaksi - 1
        const bermasalah = indexKios === 5 && indexPoktan === 0 && terakhir
        const status: Penyaluran['status'] = bermasalah
          ? 'bermasalah'
          : terakhir
            ? rng.peluang(0.45)
              ? 'dikonfirmasi'
              : 'divalidasi'
            : 'divalidasi'

        const total = items.reduce((t, i) => t + i.subtotal, 0)
        const tanggalKonfirmasi = geserHari(tanggal, 1)

        const trx: Penyaluran = {
          id: `salur-${nomor(urutSalur)}`,
          kode: `SLR-${nomor(urutSalur)}`,
          noTransaksi: `TRX/${kios.kode}/${TAHUN_MUSIM}/${nomor(urutSalur)}`,
          pengecerId: kios.id,
          poktanId: poktan.id,
          rdkkId: rdkk.id,
          tanggal,
          items,
          total,
          metodeBayar: rng.peluang(0.7) ? 'tunai' : 'kartu_tani',
          status,
          bukti: {
            ttdPenerima: TTD_CONTOH,
            catatan: 'Serah terima di kios, disaksikan pengurus kelompok.',
          },
          konfirmasi: {
            tanggal: tanggalKonfirmasi,
            ttdKetua: TTD_CONTOH,
            kesesuaian: bermasalah ? 'tidak_sesuai' : 'sesuai',
            catatan: bermasalah
              ? 'Jumlah Urea yang diterima kurang dari yang tertulis di struk.'
              : 'Jenis dan jumlah pupuk sesuai, kondisi kemasan baik.',
          },
          dibuatPada: jamKerja(tanggal, rng),
        }

        if (status === 'divalidasi' || status === 'bermasalah') {
          const pengawas = PENGAWAS[indexKios % PENGAWAS.length]
          const tanggalValidasi = geserHari(tanggal, 3)
          trx.validasi = {
            pengawasId: pengawas.id,
            tanggal: tanggalValidasi,
            hasil: bermasalah ? 'tidak_valid' : 'valid',
            catatan: bermasalah
              ? 'Selisih jumlah dengan bukti struk. Diteruskan ke tindak lanjut.'
              : 'Dokumen dan bukti penyaluran lengkap serta sesuai RDKK.',
          }

          validasi.push({
            id: `validasi-${nomor(validasi.length + 1, 3)}`,
            kode: `VAL/${TAHUN_MUSIM}/${nomor(validasi.length + 1, 3)}`,
            pengawasId: pengawas.id,
            targetTipe: 'penyaluran',
            targetId: trx.id,
            hasil: bermasalah ? 'tidak_valid' : 'valid',
            catatan: trx.validasi.catatan,
            tanggal: tanggalValidasi,
            dibuatPada: jamKerja(tanggalValidasi, rng),
          })
        }

        penyaluran.push(trx)
        urutSalur++
      }
    })

    // --- 2c. Satu pengiriman menggantung: menunggu konfirmasi kios ---
    const tanggalPending = geserHari(TANGGAL_ACUAN, -(1 + (indexKios % 3)))
    pengiriman.push({
      id: `kirim-${nomor(urutKirim)}`,
      kode: `KRM-${nomor(urutKirim)}`,
      noFaktur: `FK/${TAHUN_MUSIM}/${bulanDari(tanggalPending)}/${nomor(urutKirim)}`,
      noBeritaAcara: `BA/${TAHUN_MUSIM}/${bulanDari(tanggalPending)}/${nomor(urutKirim)}`,
      distributorId: kios.distributorId,
      pengecerId: kios.id,
      alokasiId: alokasiKios?.id,
      tanggalKirim: tanggalPending,
      items: JENIS_PUPUK.map((jp) => ({
        jenisPupukId: jp.id,
        jumlahKg: Math.max(
          50,
          Math.round((rekapRdkkKios(kios.id, jp.id) * rng.int(10, 16)) / 100 / 50) * 50,
        ),
      })),
      status: 'dikirim',
      dibuatPada: jamKerja(tanggalPending, rng),
    })
    urutKirim++
  })

  /* --------------------------------------------------------------- */
  /* 3. Penyaluran menggantung: menunggu konfirmasi kelompok tani     */
  /* --------------------------------------------------------------- */

  const poktanMenunggu = [KELOMPOK_TANI[0], KELOMPOK_TANI[4], KELOMPOK_TANI[9]]
  for (const poktan of poktanMenunggu) {
    const kios = PENGECER.find((p) => p.id === poktan.pengecerId)!
    const rdkk = RDKK.find((r) => r.poktanId === poktan.id)!
    const tanggal = geserHari(TANGGAL_ACUAN, -1)

    const items: ItemPenyaluran[] = []
    for (const jp of JENIS_PUPUK.slice(0, 3)) {
      const kunciHak = `${poktan.id}|${jp.id}`
      const hak = sisaHak.get(kunciHak) ?? 0
      const jumlahKg = Math.min(hak, ambilStok(kios.id, jp.id), rng.bulat(75, 250, 25))
      if (jumlahKg < 25) continue
      items.push({
        jenisPupukId: jp.id,
        jumlahKg,
        het: jp.het,
        subtotal: jumlahKg * jp.het,
      })
      sisaHak.set(kunciHak, hak - jumlahKg)
      ubahStok(kios.id, jp.id, -jumlahKg)
    }
    if (items.length === 0) continue

    penyaluran.push({
      id: `salur-${nomor(urutSalur)}`,
      kode: `SLR-${nomor(urutSalur)}`,
      noTransaksi: `TRX/${kios.kode}/${TAHUN_MUSIM}/${nomor(urutSalur)}`,
      pengecerId: kios.id,
      poktanId: poktan.id,
      rdkkId: rdkk.id,
      tanggal,
      items,
      total: items.reduce((t, i) => t + i.subtotal, 0),
      metodeBayar: 'tunai',
      status: 'disalurkan',
      bukti: {
        ttdPenerima: TTD_CONTOH,
        catatan: 'Diserahkan kepada pengurus kelompok di kios.',
      },
      dibuatPada: jamKerja(tanggal, rng),
    })
    urutSalur++
  }

  /* --------------------------------------------------------------- */
  /* 4. Laporan pemanfaatan, inspeksi, tindak lanjut                  */
  /* --------------------------------------------------------------- */

  const tervalidasi = penyaluran.filter((p) => p.status === 'divalidasi')
  tervalidasi.slice(0, 10).forEach((p, i) => {
    const poktan = KELOMPOK_TANI.find((k) => k.id === p.poktanId)!
    const tanggalAplikasi = geserHari(p.tanggal, 5)
    laporanPemanfaatan.push({
      id: `pemanfaatan-${nomor(i + 1, 3)}`,
      kode: `LPM/${TAHUN_MUSIM}/${nomor(i + 1, 3)}`,
      poktanId: poktan.id,
      penyaluranId: p.id,
      periode: `${MUSIM_TANAM} ${TAHUN_MUSIM}`,
      komoditas: rng.pilih(['Padi Sawah', 'Jagung', 'Cabai Merah']),
      luasTanamHa: Number((poktan.luasLahanHa * 0.6).toFixed(1)),
      dipakai: p.items.map((it) => ({
        jenisPupukId: it.jenisPupukId,
        jumlahKg: Math.round(it.jumlahKg * 0.8),
      })),
      tanggalAplikasi,
      catatan: 'Pemupukan susulan tahap pertama, kondisi tanaman baik.',
      dibuatPada: jamKerja(tanggalAplikasi, rng),
    })
  })

  const TEMUAN = [
    'Papan informasi HET tidak terpasang di kios',
    'Buku catatan penyaluran manual belum diperbarui',
    'Stok fisik sesuai dengan catatan sistem',
    'Kartu Tani sebagian anggota belum aktif',
    'Penyimpanan pupuk organik terkena rembesan air',
  ]

  PENGECER.slice(0, 4).forEach((kios, i) => {
    const tanggal = geserHari(TANGGAL_ACUAN, -(6 + i * 4))
    const pengawas = PENGAWAS[i % PENGAWAS.length]
    const kesesuaian: Inspeksi['kesesuaian'] =
      i === 1 ? 'tidak_sesuai' : i === 2 ? 'sebagian' : 'sesuai'

    inspeksi.push({
      id: `inspeksi-${nomor(i + 1, 3)}`,
      kode: `INS/${TAHUN_MUSIM}/${nomor(i + 1, 3)}`,
      pengawasId: pengawas.id,
      lokasiTipe: 'pengecer',
      lokasiId: kios.id,
      tanggal,
      temuan: [TEMUAN[i % TEMUAN.length], TEMUAN[(i + 2) % TEMUAN.length]],
      kesesuaian,
      catatan: 'Inspeksi rutin bulanan sesuai jadwal pengawasan KP3.',
      dibuatPada: jamKerja(tanggal, rng),
    })
  })

  const tindakLanjutAwal: Array<{
    jenis: TindakLanjut['jenis']
    sasaranId: string
    judul: string
    isi: string
    refId: string
  }> = [
    {
      jenis: 'teguran',
      sasaranId: PENGECER[1].id,
      judul: 'Teguran tertulis: papan HET tidak terpasang',
      isi: 'Kios wajib memasang papan informasi Harga Eceran Tertinggi di tempat yang mudah dilihat petani paling lambat 7 hari sejak surat ini diterbitkan.',
      refId: 'inspeksi-002',
    },
    {
      jenis: 'rekomendasi',
      sasaranId: PENGECER[2].id,
      judul: 'Rekomendasi perbaikan penyimpanan pupuk organik',
      isi: 'Pupuk organik granul agar ditempatkan di atas palet dan dijauhkan dari dinding lembap untuk mencegah penggumpalan.',
      refId: 'inspeksi-003',
    },
    {
      jenis: 'penghargaan',
      sasaranId: PENGECER[0].id,
      judul: 'Apresiasi kepatuhan penyaluran',
      isi: 'Kios tercatat menyalurkan seluruh transaksi sesuai RDKK dengan bukti lengkap sepanjang musim tanam berjalan.',
      refId: 'inspeksi-001',
    },
  ]

  tindakLanjutAwal.forEach((t, i) => {
    const tanggal = geserHari(TANGGAL_ACUAN, -(4 + i * 3))
    tindakLanjut.push({
      id: `tindaklanjut-${nomor(i + 1, 3)}`,
      kode: `TL/${TAHUN_MUSIM}/${nomor(i + 1, 3)}`,
      pengawasId: PENGAWAS[i % PENGAWAS.length].id,
      jenis: t.jenis,
      sasaranTipe: 'pengecer',
      sasaranId: t.sasaranId,
      refTipe: 'inspeksi',
      refId: t.refId,
      judul: t.judul,
      isi: t.isi,
      tanggal,
      dibuatPada: jamKerja(tanggal, rng),
    })
  })

  /* --------------------------------------------------------------- */
  /* 5. Notifikasi untuk pekerjaan yang masih menggantung             */
  /* --------------------------------------------------------------- */

  const ctx = konteksNotifSeed()
  const draft: DraftNotifikasi[] = []

  for (const p of pengiriman) {
    if (p.status === 'dikirim') draft.push(...saatPengirimanDikirim(p, ctx))
  }
  for (const p of penyaluran) {
    if (p.status === 'disalurkan') draft.push(...saatPenyaluranDisalurkan(p, ctx))
    if (p.status === 'dikonfirmasi') draft.push(...saatPenyaluranDikonfirmasi(p, ctx))
  }

  const notifikasi: Notifikasi[] = draft.map((d, i) => ({
    id: `notif-${nomor(i + 1)}`,
    ...d,
    dibaca: false,
    dibuatPada: jamKerja(geserHari(TANGGAL_ACUAN, -(i % 3)), rng),
  }))

  return {
    alokasi,
    pengiriman,
    penyaluran,
    laporanPemanfaatan,
    validasi,
    inspeksi,
    tindakLanjut,
    notifikasi,
  }
}

function konteksNotifSeed(): KonteksNotif {
  const cari = (role: Role, entityId: string): User[] =>
    USERS.filter((u) => u.role === role && u.entityId === entityId)

  return {
    penggunaDari: cari,
    semuaPengawas: () => USERS.filter((u) => u.role === 'kp3'),
    namaDistributor: (id) => DISTRIBUTOR.find((d) => d.id === id)?.nama ?? 'Distributor',
    namaPengecer: (id) => PENGECER.find((p) => p.id === id)?.nama ?? 'Pengecer',
    namaPoktan: (id) => KELOMPOK_TANI.find((k) => k.id === id)?.nama ?? 'Kelompok Tani',
  }
}
