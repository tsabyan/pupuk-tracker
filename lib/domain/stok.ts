/**
 * Perhitungan stok pengecer dan sisa hak RDKK.
 *
 * Stok TIDAK disimpan sebagai angka di basis data. Selalu dihitung ulang
 * dari riwayat transaksi supaya tidak pernah ada stok yang tidak sinkron
 * dengan buktinya.
 */

import type {
  ItemPupuk,
  Pengiriman,
  Penyaluran,
  Rdkk,
} from './types'
import { pengirimanDiterima, penyaluranKeluar } from './status'

export interface BarisStok {
  jenisPupukId: string
  masukKg: number
  keluarKg: number
  sisaKg: number
}

/** Jumlah kg yang benar-benar diterima pengecer untuk satu item. */
export function jumlahDiterima(item: {
  jumlahKg: number
  jumlahDiterimaKg?: number
}): number {
  return item.jumlahDiterimaKg ?? item.jumlahKg
}

/**
 * Stok kios = Σ pengiriman yang sudah diterima − Σ penyaluran non-draft.
 * Pengiriman berstatus `dikirim` belum menambah stok karena barangnya
 * belum dikonfirmasi masuk gudang.
 */
export function hitungStokPengecer(
  pengecerId: string,
  semuaPengiriman: Pengiriman[],
  semuaPenyaluran: Penyaluran[],
): BarisStok[] {
  const peta = new Map<string, BarisStok>()

  const baris = (jenisPupukId: string): BarisStok => {
    let b = peta.get(jenisPupukId)
    if (!b) {
      b = { jenisPupukId, masukKg: 0, keluarKg: 0, sisaKg: 0 }
      peta.set(jenisPupukId, b)
    }
    return b
  }

  for (const p of semuaPengiriman) {
    if (p.pengecerId !== pengecerId || !pengirimanDiterima(p.status)) continue
    for (const item of p.items) {
      baris(item.jenisPupukId).masukKg += jumlahDiterima(item)
    }
  }

  for (const p of semuaPenyaluran) {
    if (p.pengecerId !== pengecerId || !penyaluranKeluar(p.status)) continue
    for (const item of p.items) {
      baris(item.jenisPupukId).keluarKg += item.jumlahKg
    }
  }

  for (const b of peta.values()) {
    b.sisaKg = b.masukKg - b.keluarKg
  }

  return [...peta.values()]
}

/** Sisa stok satu jenis pupuk di satu kios. */
export function sisaStok(
  pengecerId: string,
  jenisPupukId: string,
  semuaPengiriman: Pengiriman[],
  semuaPenyaluran: Penyaluran[],
): number {
  const baris = hitungStokPengecer(pengecerId, semuaPengiriman, semuaPenyaluran)
  return baris.find((b) => b.jenisPupukId === jenisPupukId)?.sisaKg ?? 0
}

export type TipeMutasi = 'masuk' | 'keluar'

export interface MutasiStok {
  tanggal: string
  tipe: TipeMutasi
  jenisPupukId: string
  jumlahKg: number
  refTipe: 'pengiriman' | 'penyaluran'
  refId: string
  refKode: string
  keterangan: string
}

/** Riwayat keluar-masuk stok satu kios, terbaru di atas. */
export function riwayatMutasi(
  pengecerId: string,
  semuaPengiriman: Pengiriman[],
  semuaPenyaluran: Penyaluran[],
  namaPoktan: (id: string) => string,
): MutasiStok[] {
  const hasil: MutasiStok[] = []

  for (const p of semuaPengiriman) {
    if (p.pengecerId !== pengecerId || !pengirimanDiterima(p.status)) continue
    for (const item of p.items) {
      hasil.push({
        tanggal: p.tanggalKonfirmasi ?? p.tanggalKirim,
        tipe: 'masuk',
        jenisPupukId: item.jenisPupukId,
        jumlahKg: jumlahDiterima(item),
        refTipe: 'pengiriman',
        refId: p.id,
        refKode: p.noFaktur,
        keterangan: `Penerimaan dari distributor — faktur ${p.noFaktur}`,
      })
    }
  }

  for (const p of semuaPenyaluran) {
    if (p.pengecerId !== pengecerId || !penyaluranKeluar(p.status)) continue
    for (const item of p.items) {
      hasil.push({
        tanggal: p.tanggal,
        tipe: 'keluar',
        jenisPupukId: item.jenisPupukId,
        jumlahKg: item.jumlahKg,
        refTipe: 'penyaluran',
        refId: p.id,
        refKode: p.noTransaksi,
        keterangan: `Penyaluran ke ${namaPoktan(p.poktanId)}`,
      })
    }
  }

  return hasil.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
}

/* ------------------------------------------------------------------ */
/* Hak tebus RDKK                                                      */
/* ------------------------------------------------------------------ */

export interface SisaHak {
  jenisPupukId: string
  hakKg: number
  ditebusKg: number
  sisaKg: number
}

/**
 * Hak tebus poktan dikurangi yang sudah pernah ditebus. Penyaluran draft
 * tidak dihitung karena belum resmi terjadi.
 */
export function hitungSisaHak(
  rdkk: Rdkk | undefined,
  penyaluranPoktan: Penyaluran[],
): SisaHak[] {
  if (!rdkk) return []

  const ditebus = new Map<string, number>()
  for (const p of penyaluranPoktan) {
    if (!penyaluranKeluar(p.status)) continue
    for (const item of p.items) {
      ditebus.set(
        item.jenisPupukId,
        (ditebus.get(item.jenisPupukId) ?? 0) + item.jumlahKg,
      )
    }
  }

  return rdkk.items.map((item) => {
    const sudah = ditebus.get(item.jenisPupukId) ?? 0
    return {
      jenisPupukId: item.jenisPupukId,
      hakKg: item.jumlahKg,
      ditebusKg: sudah,
      sisaKg: Math.max(0, item.jumlahKg - sudah),
    }
  })
}

/** Total kg dari sekumpulan item. */
export function totalKg(items: ItemPupuk[]): number {
  return items.reduce((jml, i) => jml + i.jumlahKg, 0)
}
