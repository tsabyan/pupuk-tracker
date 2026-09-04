import type { Database } from '@/lib/domain/types'
import {
  DESA,
  DISTRIBUTOR,
  JENIS_PUPUK,
  KECAMATAN,
  KELOMPOK_TANI,
  PENGAWAS,
  PENGECER,
  PETANI,
  RDKK,
  USERS,
} from './master'
import { buatTransaksi } from './transaksi'

/** Versi skema data lokal. Naikkan bila bentuk `Database` berubah. */
export const VERSI_DATA = 1

/** Basis data demo lengkap. Deterministik — hasilnya selalu sama. */
export function buatDatabase(): Database {
  const trx = buatTransaksi()

  return {
    versi: VERSI_DATA,
    kecamatan: KECAMATAN,
    desa: DESA,
    jenisPupuk: JENIS_PUPUK,
    distributor: DISTRIBUTOR,
    pengecer: PENGECER,
    kelompokTani: KELOMPOK_TANI,
    petani: PETANI,
    pengawas: PENGAWAS,
    users: USERS,
    rdkk: RDKK,
    ...trx,
  }
}

export * from './master'
