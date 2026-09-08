/**
 * Transaksi awal demo.
 *
 * Disimulasikan berurutan (kirim → terima → salurkan) supaya stok kios
 * tidak pernah minus dan penyaluran tidak pernah melebihi hak RDKK —
 * data demo harus lolos aturan yang sama dengan input manual.
 *
 * Beberapa transaksi sengaja ditinggalkan menggantung sebagai umpan aksi
 * saat presentasi: minimal satu pengiriman menunggu konfirmasi kios, satu
 * penyaluran menunggu konfirmasi poktan, dan satu penyaluran disanggah
 * kelompok tani yang belum pernah disentuh pengawasan.
 */

import type {
  Alokasi,
  ItemPengiriman,
  ItemPenyaluran,
  LaporanPemanfaatan,
  Notifikasi,
  Pemeriksaan,
  Pengiriman,
  Penyaluran,
  Role,
  Temuan,
  TindakLanjut,
  User,
} from '@/lib/domain/types'
import { BUTIR_ADMINISTRASI } from '@/lib/domain/types'
import {
  saatPemeriksaan,
  saatPengirimanDikirim,
  saatPenyaluranDikonfirmasi,
  saatPenyaluranDisalurkan,
  saatTindakLanjut,
  type DraftNotifikasi,
  type KonteksNotif,
} from '@/lib/domain/notifikasi'
import {
  kesimpulanOtomatis,
  temuanDariPemeriksaan,
  type DraftTemuan,
} from '@/lib/domain/pengawasan'
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
  PETANI,
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
  pemeriksaan: Pemeriksaan[]
  temuan: Temuan[]
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
  const pemeriksaan: Pemeriksaan[] = []
  const temuan: Temuan[] = []
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

        // Transaksi tuntas begitu kelompok tani menyatakan sikapnya. Satu
        // transaksi sengaja disanggah supaya ada objek pengawasan hidup.
        const terakhir = ke === jumlahTransaksi - 1
        const disanggah = indexKios === 5 && indexPoktan === 0 && terakhir
        const status: Penyaluran['status'] = disanggah ? 'disanggah' : 'dikonfirmasi'

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
            kesesuaian: disanggah ? 'tidak_sesuai' : 'sesuai',
            catatan: disanggah
              ? 'Jumlah Urea yang diterima kurang dari yang tertulis di struk.'
              : 'Jenis dan jumlah pupuk sesuai, kondisi kemasan baik.',
          },
          dibuatPada: jamKerja(tanggal, rng),
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
  /* 4. Laporan pemanfaatan kelompok tani                             */
  /* --------------------------------------------------------------- */

  const selesai = penyaluran.filter((p) => p.status === 'dikonfirmasi')
  selesai.slice(0, 10).forEach((p, i) => {
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

  /* --------------------------------------------------------------- */
  /* 5. Pemeriksaan lapangan & temuan                                 */
  /* --------------------------------------------------------------- */

  const namaPupuk = (id: string) => JENIS_PUPUK.find((j) => j.id === id)?.nama ?? id
  const namaObjekSeed = (tipe: Pemeriksaan['objekTipe'], id: string): string => {
    if (tipe === 'distributor') return DISTRIBUTOR.find((d) => d.id === id)?.nama ?? id
    if (tipe === 'pengecer') return PENGECER.find((p) => p.id === id)?.nama ?? id
    if (tipe === 'poktan') return KELOMPOK_TANI.find((k) => k.id === id)?.nama ?? id
    return PETANI.find((p) => p.id === id)?.nama ?? id
  }

  /** Checklist administrasi lengkap, dipakai sebagai titik awal tiap objek. */
  const administrasiLengkap = () =>
    BUTIR_ADMINISTRASI.map((butir) => ({ butir, ada: true }))

  /** Tiga transaksi terbaru satu kios, dipakai sebagai sampel uji petik. */
  const sampelKios = (pengecerId: string) =>
    penyaluran
      .filter((p) => p.pengecerId === pengecerId && p.status === 'dikonfirmasi')
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, 3)
      .map((p) => p.id)

  /** Stok sistem kios saat pemeriksaan — angka yang sama dengan yang dibaca layar. */
  const stokSistem = (pengecerId: string) =>
    JENIS_PUPUK.map((jp) => ({
      jenisPupukId: jp.id,
      sistemKg: ambilStok(pengecerId, jp.id),
      fisikKg: ambilStok(pengecerId, jp.id),
    }))

  const hargaSesuai = () =>
    JENIS_PUPUK.map((jp) => ({
      jenisPupukId: jp.id,
      het: jp.het,
      hargaJual: jp.het,
      biayaTambahan: 0,
    }))

  type RancanganPemeriksaan = Omit<
    Pemeriksaan,
    'id' | 'kode' | 'noBeritaAcara' | 'kesimpulan' | 'dibuatPada'
  > & { temuanTambahan?: DraftTemuan[] }

  const rancangan: RancanganPemeriksaan[] = []

  // 5a. Kios patuh — berita acara tanpa temuan, dasar penghargaan.
  {
    const kios = PENGECER[0]
    rancangan.push({
      pengawasId: PENGAWAS[0].id,
      pendamping: ['Dinas Perdagangan Kabupaten Sampang'],
      objekTipe: 'pengecer',
      objekId: kios.id,
      tanggal: geserHari(TANGGAL_ACUAN, -18),
      sampelPenyaluranIds: sampelKios(kios.id),
      stok: stokSistem(kios.id),
      harga: hargaSesuai(),
      penerima: KELOMPOK_TANI.filter((k) => k.pengecerId === kios.id)
        .slice(0, 2)
        .map((k) => {
          const rdkk = RDKK.find((r) => r.poktanId === k.id)
          const hak = rdkk?.items.find((i) => i.jenisPupukId === 'pk-urea')?.jumlahKg ?? 0
          const sisa = sisaHak.get(`${k.id}|pk-urea`) ?? 0
          return {
            poktanId: k.id,
            terdaftarRdkk: true,
            hakKg: hak,
            ditebusKg: hak - sisa,
          }
        }),
      administrasi: administrasiLengkap(),
      catatan:
        'Pemeriksaan rutin. Papan HET terpasang, kartu stok mutakhir, penyaluran sesuai RDKK.',
      ttdPengawas: TTD_CONTOH,
      ttdObjek: TTD_CONTOH,
    })
  }

  // 5b. Harga di atas HET — hanya terbukti di lapangan, tidak dari data sistem.
  {
    const kios = PENGECER[1]
    rancangan.push({
      pengawasId: PENGAWAS[1 % PENGAWAS.length].id,
      pendamping: [
        'Dinas Perdagangan Kabupaten Sampang',
        'Satgas Pangan Polres Sampang',
      ],
      objekTipe: 'pengecer',
      objekId: kios.id,
      tanggal: geserHari(TANGGAL_ACUAN, -12),
      sampelPenyaluranIds: sampelKios(kios.id),
      stok: stokSistem(kios.id),
      harga: JENIS_PUPUK.map((jp) =>
        jp.id === 'pk-urea'
          ? {
              jenisPupukId: jp.id,
              het: jp.het,
              hargaJual: 2500,
              biayaTambahan: 100,
              keterangan:
                'Petani membayar Rp 2.500/kg ditambah ongkos angkut Rp 100/kg. Struk hanya mencantumkan HET.',
            }
          : { jenisPupukId: jp.id, het: jp.het, hargaJual: jp.het, biayaTambahan: 0 },
      ),
      penerima: [],
      administrasi: administrasiLengkap().map((a) =>
        a.butir === 'Bukti transaksi / penebusan' ? { ...a, ada: false } : a,
      ),
      catatan:
        'Keterangan tiga petani penerima seragam: harga tebus di atas HET. Struk yang disimpan kios mencantumkan HET.',
      ttdPengawas: TTD_CONTOH,
      ttdObjek: TTD_CONTOH,
      temuanTambahan: [
        {
          aspek: 'ketentuan',
          uraian:
            'Papan informasi HET tidak terpasang pada tempat yang mudah dilihat petani.',
          tingkat: 'ringan',
        },
      ],
    })
  }

  // 5c. Stok fisik tidak cocok dengan catatan sistem.
  {
    const kios = PENGECER[2]
    rancangan.push({
      pengawasId: PENGAWAS[2 % PENGAWAS.length].id,
      pendamping: ['Dinas Pertanian dan Ketahanan Pangan Kabupaten Sampang'],
      objekTipe: 'pengecer',
      objekId: kios.id,
      tanggal: geserHari(TANGGAL_ACUAN, -9),
      sampelPenyaluranIds: sampelKios(kios.id),
      stok: stokSistem(kios.id).map((st) =>
        st.jenisPupukId === 'pk-organik'
          ? { ...st, fisikKg: Math.max(0, st.sistemKg - 175) }
          : st,
      ),
      harga: hargaSesuai(),
      penerima: [],
      administrasi: administrasiLengkap().map((a) =>
        a.butir === 'Kartu stok masuk dan keluar' ? { ...a, ada: false } : a,
      ),
      catatan:
        'Hitung fisik gudang kios disaksikan pemilik. Pupuk organik granul kurang dari catatan sistem.',
      ttdPengawas: TTD_CONTOH,
      ttdObjek: TTD_CONTOH,
    })
  }

  // 5d. Verifikasi penerima ke kelompok tani — penerima di luar RDKK.
  {
    const poktan = KELOMPOK_TANI[7 % KELOMPOK_TANI.length]
    const petaniLuar = PETANI.find((t) => t.poktanId === poktan.id)
    const rdkk = RDKK.find((r) => r.poktanId === poktan.id)
    const hak = rdkk?.items.find((i) => i.jenisPupukId === 'pk-npk')?.jumlahKg ?? 0
    rancangan.push({
      pengawasId: PENGAWAS[0].id,
      pendamping: ['Penyuluh Pertanian Lapangan (PPL) wilayah setempat'],
      objekTipe: 'poktan',
      objekId: poktan.id,
      tanggal: geserHari(TANGGAL_ACUAN, -6),
      sampelPenyaluranIds: penyaluran
        .filter((p) => p.poktanId === poktan.id && p.status === 'dikonfirmasi')
        .slice(0, 2)
        .map((p) => p.id),
      stok: [],
      harga: [],
      penerima: [
        {
          poktanId: poktan.id,
          petaniId: petaniLuar?.id,
          terdaftarRdkk: false,
          hakKg: hak,
          ditebusKg: hak - (sisaHak.get(`${poktan.id}|pk-npk`) ?? 0),
        },
      ],
      administrasi: [
        { butir: 'Data penerima sesuai RDKK', ada: false },
        { butir: 'Pencatatan penyaluran harian', ada: true },
      ],
      catatan:
        'Wawancara pengurus kelompok. Satu penerima menebus atas nama anggota yang tidak tercantum pada RDKK musim ini.',
      ttdPengawas: TTD_CONTOH,
      ttdObjek: TTD_CONTOH,
    })
  }

  // 5e. Gudang distributor — objek pemeriksaan yang sebelumnya tidak ada.
  {
    const dist = DISTRIBUTOR[0]
    rancangan.push({
      pengawasId: PENGAWAS[1 % PENGAWAS.length].id,
      pendamping: ['Dinas Perdagangan Kabupaten Sampang'],
      objekTipe: 'distributor',
      objekId: dist.id,
      tanggal: geserHari(TANGGAL_ACUAN, -21),
      sampelPenyaluranIds: [],
      stok: [],
      harga: [],
      penerima: [],
      administrasi: [
        { butir: 'Dokumen pengiriman distributor', ada: true },
        { butir: 'Perizinan dan perjanjian kios', ada: true },
        { butir: 'Kartu stok masuk dan keluar', ada: true },
      ],
      catatan:
        'Pemeriksaan gudang lini III. Penyimpanan beralas palet, dokumen penyaluran ke kios lengkap.',
      ttdPengawas: TTD_CONTOH,
      ttdObjek: TTD_CONTOH,
    })
  }

  rancangan.forEach((r, i) => {
    const { temuanTambahan = [], ...isi } = r
    const urut = i + 1
    const dasar: Pemeriksaan = {
      id: `periksa-${nomor(urut, 3)}`,
      kode: `PRK/${TAHUN_MUSIM}/${nomor(urut, 3)}`,
      noBeritaAcara: `BAP/${TAHUN_MUSIM}/${bulanDari(isi.tanggal)}/${nomor(urut, 3)}`,
      ...isi,
      // Diisi tepat setelah temuannya diturunkan.
      kesimpulan: 'sesuai',
      dibuatPada: jamKerja(isi.tanggal, rng),
    }

    // Temuan diturunkan dengan fungsi domain yang sama seperti input manual:
    // data demo harus lolos aturan yang sama dengan yang diketik pengawas.
    const draftTemuan: DraftTemuan[] = [
      ...temuanDariPemeriksaan(dasar, namaPupuk, namaObjekSeed),
      ...temuanTambahan,
    ]
    dasar.kesimpulan = kesimpulanOtomatis(draftTemuan)
    pemeriksaan.push(dasar)

    for (const t of draftTemuan) {
      const urutTemuan = temuan.length + 1
      temuan.push({
        id: `temuan-${nomor(urutTemuan, 3)}`,
        kode: `TMN/${TAHUN_MUSIM}/${nomor(urutTemuan, 3)}`,
        sumber: 'pemeriksaan',
        sumberId: dasar.id,
        aspek: t.aspek,
        uraian: t.uraian,
        tingkat: t.tingkat,
        status: 'terbuka',
        objekTipe: dasar.objekTipe,
        objekId: dasar.objekId,
        tanggal: dasar.tanggal,
        dibuatPada: jamKerja(dasar.tanggal, rng),
      })
    }

    // Transaksi yang jadi sampel uji petik ikut tercatat terperiksa.
    for (const id of dasar.sampelPenyaluranIds) {
      const trx = penyaluran.find((p) => p.id === id)
      if (!trx) continue
      trx.pengawasan = {
        pengawasId: dasar.pengawasId,
        tanggal: dasar.tanggal,
        pemeriksaanId: dasar.id,
        hasil: draftTemuan.length > 0 ? 'temuan' : 'sesuai',
        catatan: `Uji petik pada pemeriksaan ${dasar.noBeritaAcara}.`,
      }
    }
  })

  /* --------------------------------------------------------------- */
  /* 6. Telaah dokumen: uji petik tanpa turun ke lapangan             */
  /* --------------------------------------------------------------- */

  // Cakupan pengawasan tidak pernah 100% dan memang tidak perlu: KP3
  // bekerja dengan uji petik. Sebagian transaksi ditelaah dari mejanya,
  // sisanya sengaja dibiarkan belum tersentuh.
  penyaluran
    .filter((p) => p.status === 'dikonfirmasi' && !p.pengawasan)
    .forEach((p, i) => {
      if (i % 4 !== 0) return
      const tanggalTelaah = geserHari(p.tanggal, 4)
      p.pengawasan = {
        pengawasId: PENGAWAS[i % PENGAWAS.length].id,
        tanggal: tanggalTelaah,
        hasil: 'sesuai',
        catatan: 'Telaah dokumen: bukti dua pihak lengkap dan penebusan dalam batas RDKK.',
      }
    })

  /* --------------------------------------------------------------- */
  /* 7. Tindak lanjut — dengan tenggat dan status pelaksanaan         */
  /* --------------------------------------------------------------- */

  const temuanDari = (pemeriksaanId: string, aspek?: Temuan['aspek']) =>
    temuan
      .filter((t) => t.sumberId === pemeriksaanId && (!aspek || t.aspek === aspek))
      .map((t) => t.id)

  const rancanganTindakLanjut: Array<
    Omit<TindakLanjut, 'id' | 'kode' | 'dibuatPada'>
  > = [
    {
      pengawasId: PENGAWAS[1 % PENGAWAS.length].id,
      jenis: 'teguran',
      sasaranTipe: 'pengecer',
      sasaranId: PENGECER[1].id,
      temuanIds: temuanDari('periksa-002'),
      judul: 'Teguran tertulis: penjualan di atas HET',
      isi: 'Kios wajib menjual pupuk bersubsidi sesuai HET tanpa pungutan tambahan dalam bentuk apa pun, memasang papan informasi HET di tempat yang mudah dilihat petani, serta melengkapi bukti penebusan. Laporan perbaikan disampaikan kepada KP3 paling lambat pada tenggat.',
      tanggal: geserHari(TANGGAL_ACUAN, -10),
      tenggat: geserHari(TANGGAL_ACUAN, -3),
      status: 'dalam_proses',
      buktiPelaksanaan:
        'Kios melaporkan papan HET sudah dipasang; pengembalian selisih harga kepada petani masih didata.',
    },
    {
      pengawasId: PENGAWAS[2 % PENGAWAS.length].id,
      jenis: 'rekomendasi',
      sasaranTipe: 'pengecer',
      sasaranId: PENGECER[2].id,
      temuanIds: temuanDari('periksa-003'),
      judul: 'Rekomendasi penertiban kartu stok dan hitung fisik bulanan',
      isi: 'Kios agar menyelenggarakan kartu stok masuk-keluar yang mutakhir dan melakukan hitung fisik bulanan bersama penyuluh, sehingga selisih antara stok fisik dan catatan sistem terdeteksi lebih awal.',
      tanggal: geserHari(TANGGAL_ACUAN, -8),
      tenggat: geserHari(TANGGAL_ACUAN, -1),
      status: 'selesai',
      buktiPelaksanaan:
        'Kartu stok terisi lengkap dan hitung fisik pertama dilakukan bersama PPL. Selisih 175 kg pupuk organik dijelaskan sebagai susut kemasan pecah dan sudah dikoreksi pada catatan.',
      tanggalSelesai: geserHari(TANGGAL_ACUAN, -2),
    },
    {
      pengawasId: PENGAWAS[0].id,
      jenis: 'teguran',
      sasaranTipe: 'poktan',
      sasaranId: KELOMPOK_TANI[7 % KELOMPOK_TANI.length].id,
      temuanIds: temuanDari('periksa-004', 'penerima'),
      judul: 'Teguran: penebusan oleh penerima di luar RDKK',
      isi: 'Penebusan pupuk bersubsidi hanya dapat dilakukan petani yang tercantum dalam RDKK musim tanam berjalan. Pengurus kelompok agar memperbaiki data keanggotaan dan menghentikan penebusan atas nama pihak yang tidak berhak.',
      tanggal: geserHari(TANGGAL_ACUAN, -5),
      tenggat: geserHari(TANGGAL_ACUAN, -1),
      status: 'eskalasi',
      eskalasiKe: 'satgas_pangan',
      buktiPelaksanaan:
        'Tidak ada tanggapan sampai tenggat. Diteruskan ke Satgas Pangan untuk penelusuran lebih lanjut.',
    },
    {
      pengawasId: PENGAWAS[0].id,
      jenis: 'penghargaan',
      sasaranTipe: 'pengecer',
      sasaranId: PENGECER[0].id,
      temuanIds: [],
      judul: 'Apresiasi kepatuhan penyaluran',
      isi: 'Berita acara pemeriksaan tidak menemukan penyimpangan: harga sesuai HET, stok fisik cocok dengan catatan sistem, dan seluruh penyaluran sampel sesuai RDKK dengan bukti lengkap.',
      tanggal: geserHari(TANGGAL_ACUAN, -16),
      tenggat: geserHari(TANGGAL_ACUAN, -16),
      status: 'selesai',
      tanggalSelesai: geserHari(TANGGAL_ACUAN, -16),
    },
  ]

  rancanganTindakLanjut.forEach((t, i) => {
    const urut = i + 1
    tindakLanjut.push({
      id: `tindaklanjut-${nomor(urut, 3)}`,
      kode: `TL/${TAHUN_MUSIM}/${nomor(urut, 3)}`,
      ...t,
      dibuatPada: jamKerja(t.tanggal, rng),
    })

    // Temuan yang sudah ditangani tidak lagi berdiri sebagai temuan terbuka.
    for (const idTemuan of t.temuanIds) {
      const target = temuan.find((x) => x.id === idTemuan)
      if (!target) continue
      target.tindakLanjutId = `tindaklanjut-${nomor(urut, 3)}`
      target.status = t.status === 'selesai' ? 'selesai' : 'ditindaklanjuti'
    }
  })

  /* --------------------------------------------------------------- */
  /* 8. Notifikasi untuk pekerjaan yang masih menggantung             */
  /* --------------------------------------------------------------- */

  const ctx = konteksNotifSeed()
  const draft: DraftNotifikasi[] = []

  for (const p of pengiriman) {
    if (p.status === 'dikirim') draft.push(...saatPengirimanDikirim(p, ctx))
  }
  for (const p of penyaluran) {
    if (p.status === 'disalurkan') draft.push(...saatPenyaluranDisalurkan(p, ctx))
    // Hanya sanggahan yang sampai ke pengawas — konfirmasi wajar tidak.
    if (p.status === 'disanggah') draft.push(...saatPenyaluranDikonfirmasi(p, ctx))
  }
  for (const pr of pemeriksaan) {
    const jumlah = temuan.filter((t) => t.sumberId === pr.id).length
    draft.push(...saatPemeriksaan(pr, jumlah, ctx))
  }
  for (const t of tindakLanjut) {
    draft.push(...saatTindakLanjut(t, ctx))
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
    pemeriksaan,
    temuan,
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
