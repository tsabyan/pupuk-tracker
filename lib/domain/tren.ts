/**
 * Deret waktu untuk grafik dashboard.
 *
 * Tetap murni TypeScript seperti isi `lib/domain/` lainnya: menghitung
 * angka, tidak tahu apa pun soal cara menggambarnya.
 */

import { penyaluranKeluar } from './status'
import type { Penyaluran } from './types'

export interface TitikTren {
  /** Tanggal ISO, YYYY-MM-DD. */
  tanggal: string
  nilai: number
}

function geser(iso: string, hari: number): string {
  const t = new Date(`${iso}T00:00:00.000Z`)
  t.setUTCDate(t.getUTCDate() + hari)
  return t.toISOString().slice(0, 10)
}

/**
 * Jumlah kg tersalur per hari selama `hari` terakhir sampai `sampai`.
 * Hari tanpa transaksi tetap muncul sebagai nol supaya sumbu waktunya
 * rata dan jeda distribusi terlihat.
 */
export function trenPenyaluranHarian(
  penyaluran: Penyaluran[],
  sampai: string,
  hari = 30,
): TitikTren[] {
  const perHari = new Map<string, number>()

  for (const p of penyaluran) {
    if (!penyaluranKeluar(p.status)) continue
    const kg = p.items.reduce((t, i) => t + i.jumlahKg, 0)
    perHari.set(p.tanggal, (perHari.get(p.tanggal) ?? 0) + kg)
  }

  const hasil: TitikTren[] = []
  for (let i = hari - 1; i >= 0; i--) {
    const tanggal = geser(sampai, -i)
    hasil.push({ tanggal, nilai: perHari.get(tanggal) ?? 0 })
  }
  return hasil
}

/** Total nilai pada satu deret. */
export function totalTren(titik: TitikTren[]): number {
  return titik.reduce((t, p) => t + p.nilai, 0)
}

/**
 * Perubahan paruh akhir dibanding paruh awal, sebagai rasio.
 * Dipakai untuk menandai tren naik atau turun di samping angka total.
 */
export function perubahanTren(titik: TitikTren[]): number {
  if (titik.length < 2) return 0
  const tengah = Math.floor(titik.length / 2)
  const awal = totalTren(titik.slice(0, tengah))
  const akhir = totalTren(titik.slice(tengah))
  if (awal === 0) return akhir > 0 ? 1 : 0
  return (akhir - awal) / awal
}
