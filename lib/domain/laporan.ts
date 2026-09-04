/**
 * Agregasi untuk dashboard dan laporan.
 *
 * Dipakai bersama oleh Distributor (serapan per kios binaan) dan Pengawas
 * KP3 (rekap lintas wilayah), jadi definisi "serapan" dan "kepatuhan"
 * hanya ada satu — tidak mungkin dua layar menampilkan angka berbeda
 * untuk hal yang sama.
 */

import { pengirimanDiterima, penyaluranKeluar } from './status'
import { hitungStokPengecer, jumlahDiterima } from './stok'
import type { Database } from './types'

export interface RingkasanDistribusi {
  alokasiKg: number
  dikirimKg: number
  diterimaKg: number
  disalurkanKg: number
  sisaStokKg: number
  /** Bagian alokasi yang sudah sampai ke kelompok tani (0..1). */
  rasioSerapan: number
  menungguKonfirmasiKios: number
  menungguKonfirmasiPoktan: number
  menungguValidasi: number
  bermasalah: number
}

export interface FilterLaporan {
  distributorId?: string
  kecamatanId?: string
  pengecerId?: string
}

/** Id kios yang lolos filter wilayah / distributor. */
function kiosTerpilih(db: Database, filter: FilterLaporan): Set<string> {
  const hasil = new Set<string>()

  for (const kios of db.pengecer) {
    if (filter.pengecerId && kios.id !== filter.pengecerId) continue
    if (filter.distributorId && kios.distributorId !== filter.distributorId) continue
    if (filter.kecamatanId) {
      const desa = db.desa.find((d) => d.id === kios.desaId)
      if (desa?.kecamatanId !== filter.kecamatanId) continue
    }
    hasil.add(kios.id)
  }

  return hasil
}

export function ringkasanDistribusi(
  db: Database,
  filter: FilterLaporan = {},
): RingkasanDistribusi {
  const kios = kiosTerpilih(db, filter)

  let alokasiKg = 0
  for (const a of db.alokasi) {
    if (filter.distributorId && a.distributorId !== filter.distributorId) continue
    if (filter.kecamatanId && a.kecamatanId !== filter.kecamatanId) continue
    for (const r of a.rincian) {
      if (!kios.has(r.pengecerId)) continue
      for (const i of r.items) alokasiKg += i.jumlahKg
    }
  }

  let dikirimKg = 0
  let diterimaKg = 0
  let menungguKonfirmasiKios = 0

  for (const p of db.pengiriman) {
    if (!kios.has(p.pengecerId)) continue
    if (p.status === 'ditolak') continue
    for (const i of p.items) dikirimKg += i.jumlahKg
    if (pengirimanDiterima(p.status)) {
      for (const i of p.items) diterimaKg += jumlahDiterima(i)
    }
    if (p.status === 'dikirim') menungguKonfirmasiKios++
  }

  let disalurkanKg = 0
  let menungguKonfirmasiPoktan = 0
  let menungguValidasi = 0
  let bermasalah = 0

  for (const p of db.penyaluran) {
    if (!kios.has(p.pengecerId)) continue
    if (penyaluranKeluar(p.status)) {
      for (const i of p.items) disalurkanKg += i.jumlahKg
    }
    if (p.status === 'disalurkan') menungguKonfirmasiPoktan++
    if (p.status === 'dikonfirmasi') menungguValidasi++
    if (p.status === 'bermasalah') bermasalah++
  }

  let sisaStokKg = 0
  for (const id of kios) {
    for (const b of hitungStokPengecer(id, db.pengiriman, db.penyaluran)) {
      sisaStokKg += b.sisaKg
    }
  }

  return {
    alokasiKg,
    dikirimKg,
    diterimaKg,
    disalurkanKg,
    sisaStokKg,
    rasioSerapan: alokasiKg > 0 ? disalurkanKg / alokasiKg : 0,
    menungguKonfirmasiKios,
    menungguKonfirmasiPoktan,
    menungguValidasi,
    bermasalah,
  }
}

export interface SerapanPengecer {
  pengecerId: string
  alokasiKg: number
  diterimaKg: number
  disalurkanKg: number
  sisaStokKg: number
  rasioSerapan: number
  jumlahPenyaluran: number
}

export function serapanPerPengecer(
  db: Database,
  filter: FilterLaporan = {},
): SerapanPengecer[] {
  const kios = kiosTerpilih(db, filter)

  return [...kios]
    .map((id) => {
      const r = ringkasanDistribusi(db, { ...filter, pengecerId: id })
      return {
        pengecerId: id,
        alokasiKg: r.alokasiKg,
        diterimaKg: r.diterimaKg,
        disalurkanKg: r.disalurkanKg,
        sisaStokKg: r.sisaStokKg,
        rasioSerapan: r.rasioSerapan,
        jumlahPenyaluran: db.penyaluran.filter(
          (p) => p.pengecerId === id && penyaluranKeluar(p.status),
        ).length,
      }
    })
    .sort((a, b) => b.disalurkanKg - a.disalurkanKg)
}

export interface SerapanKecamatan {
  kecamatanId: string
  alokasiKg: number
  disalurkanKg: number
  sisaStokKg: number
  rasioSerapan: number
  jumlahPoktan: number
}

export function serapanPerKecamatan(db: Database): SerapanKecamatan[] {
  return db.kecamatan.map((kec) => {
    const r = ringkasanDistribusi(db, { kecamatanId: kec.id })
    const desaIds = new Set(
      db.desa.filter((d) => d.kecamatanId === kec.id).map((d) => d.id),
    )
    return {
      kecamatanId: kec.id,
      alokasiKg: r.alokasiKg,
      disalurkanKg: r.disalurkanKg,
      sisaStokKg: r.sisaStokKg,
      rasioSerapan: r.rasioSerapan,
      jumlahPoktan: db.kelompokTani.filter((k) => desaIds.has(k.desaId)).length,
    }
  })
}

export interface KepatuhanPengecer {
  pengecerId: string
  totalPenyaluran: number
  berbuktiLengkap: number
  dikonfirmasiPoktan: number
  tervalidasi: number
  bermasalah: number
  selisihPenerimaan: number
  /** Bagian penyaluran yang punya bukti dan konfirmasi poktan (0..1). */
  rasioKepatuhan: number
}

export function kepatuhanPengecer(db: Database): KepatuhanPengecer[] {
  return db.pengecer
    .map((kios) => {
      const milik = db.penyaluran.filter(
        (p) => p.pengecerId === kios.id && penyaluranKeluar(p.status),
      )
      const berbuktiLengkap = milik.filter((p) => Boolean(p.bukti?.ttdPenerima)).length
      const dikonfirmasiPoktan = milik.filter((p) => Boolean(p.konfirmasi)).length
      const patuh = milik.filter(
        (p) => Boolean(p.bukti?.ttdPenerima) && Boolean(p.konfirmasi),
      ).length

      return {
        pengecerId: kios.id,
        totalPenyaluran: milik.length,
        berbuktiLengkap,
        dikonfirmasiPoktan,
        tervalidasi: milik.filter((p) => p.status === 'divalidasi').length,
        bermasalah: milik.filter((p) => p.status === 'bermasalah').length,
        selisihPenerimaan: db.pengiriman.filter(
          (p) => p.pengecerId === kios.id && p.status === 'selisih',
        ).length,
        rasioKepatuhan: milik.length > 0 ? patuh / milik.length : 0,
      }
    })
    .sort((a, b) => a.rasioKepatuhan - b.rasioKepatuhan)
}

export interface SerapanPupuk {
  jenisPupukId: string
  alokasiKg: number
  disalurkanKg: number
  sisaStokKg: number
  hakRdkkKg: number
}

export function serapanPerJenisPupuk(
  db: Database,
  filter: FilterLaporan = {},
): SerapanPupuk[] {
  const kios = kiosTerpilih(db, filter)
  const poktan = new Set(
    db.kelompokTani.filter((k) => kios.has(k.pengecerId)).map((k) => k.id),
  )

  return db.jenisPupuk.map((jp) => {
    let alokasiKg = 0
    for (const a of db.alokasi) {
      if (filter.distributorId && a.distributorId !== filter.distributorId) continue
      for (const r of a.rincian) {
        if (!kios.has(r.pengecerId)) continue
        for (const i of r.items) if (i.jenisPupukId === jp.id) alokasiKg += i.jumlahKg
      }
    }

    let disalurkanKg = 0
    for (const p of db.penyaluran) {
      if (!kios.has(p.pengecerId) || !penyaluranKeluar(p.status)) continue
      for (const i of p.items) if (i.jenisPupukId === jp.id) disalurkanKg += i.jumlahKg
    }

    let sisaStokKg = 0
    for (const id of kios) {
      const baris = hitungStokPengecer(id, db.pengiriman, db.penyaluran)
      sisaStokKg += baris.find((b) => b.jenisPupukId === jp.id)?.sisaKg ?? 0
    }

    let hakRdkkKg = 0
    for (const r of db.rdkk) {
      if (!poktan.has(r.poktanId)) continue
      for (const i of r.items) if (i.jenisPupukId === jp.id) hakRdkkKg += i.jumlahKg
    }

    return { jenisPupukId: jp.id, alokasiKg, disalurkanKg, sisaStokKg, hakRdkkKg }
  })
}
