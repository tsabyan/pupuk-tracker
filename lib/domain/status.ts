/**
 * Mesin status rantai distribusi.
 *
 * Inilah tulang punggung aplikasi: satu aksi di satu role memindahkan
 * status transaksi, dan perpindahan itu yang memunculkan pekerjaan di
 * layar role berikutnya. Semua aturan perpindahan tinggal di file ini.
 */

import type { StatusPengiriman, StatusPenyaluran } from './types'

export type Tone = 'netral' | 'info' | 'sukses' | 'peringatan' | 'bahaya'

export interface StatusMeta {
  label: string
  tone: Tone
  deskripsi: string
}

/* ------------------------------------------------------------------ */
/* Pengiriman: Distributor → Pengecer                                  */
/* ------------------------------------------------------------------ */

export const TRANSISI_PENGIRIMAN: Record<StatusPengiriman, StatusPengiriman[]> = {
  draft: ['dikirim'],
  dikirim: ['dikonfirmasi', 'selisih', 'ditolak'],
  dikonfirmasi: [],
  selisih: [],
  ditolak: [],
}

export const STATUS_PENGIRIMAN: Record<StatusPengiriman, StatusMeta> = {
  draft: {
    label: 'Draft',
    tone: 'netral',
    deskripsi: 'Belum dikirim, masih bisa diubah distributor.',
  },
  dikirim: {
    label: 'Menunggu Konfirmasi',
    tone: 'info',
    deskripsi: 'Pupuk dalam perjalanan, menunggu pengecer mengonfirmasi penerimaan.',
  },
  dikonfirmasi: {
    label: 'Diterima',
    tone: 'sukses',
    deskripsi: 'Pengecer menerima seluruh kiriman sesuai faktur.',
  },
  selisih: {
    label: 'Diterima dengan Selisih',
    tone: 'peringatan',
    deskripsi: 'Pengecer menerima kiriman, tetapi jumlahnya berbeda dari faktur.',
  },
  ditolak: {
    label: 'Ditolak',
    tone: 'bahaya',
    deskripsi: 'Pengecer menolak kiriman. Stok tidak bertambah.',
  },
}

/** Status yang berarti barang sudah masuk gudang pengecer. */
export function pengirimanDiterima(status: StatusPengiriman): boolean {
  return status === 'dikonfirmasi' || status === 'selisih'
}

/* ------------------------------------------------------------------ */
/* Penyaluran: Pengecer → Kelompok Tani                                */
/* ------------------------------------------------------------------ */

export const TRANSISI_PENYALURAN: Record<StatusPenyaluran, StatusPenyaluran[]> = {
  draft: ['disalurkan'],
  disalurkan: ['dikonfirmasi'],
  dikonfirmasi: ['divalidasi', 'bermasalah'],
  divalidasi: [],
  bermasalah: [],
}

export const STATUS_PENYALURAN: Record<StatusPenyaluran, StatusMeta> = {
  draft: {
    label: 'Draft',
    tone: 'netral',
    deskripsi: 'Transaksi belum disimpan sebagai penyaluran resmi.',
  },
  disalurkan: {
    label: 'Menunggu Konfirmasi Poktan',
    tone: 'info',
    deskripsi: 'Pupuk sudah diserahkan, menunggu konfirmasi ketua kelompok tani.',
  },
  dikonfirmasi: {
    label: 'Dikonfirmasi Poktan',
    tone: 'sukses',
    deskripsi: 'Ketua kelompok tani sudah menandatangani penerimaan.',
  },
  divalidasi: {
    label: 'Tervalidasi KP3',
    tone: 'sukses',
    deskripsi: 'Pengawas KP3 sudah memvalidasi transaksi ini.',
  },
  bermasalah: {
    label: 'Bermasalah',
    tone: 'bahaya',
    deskripsi: 'Pengawas KP3 menemukan ketidaksesuaian pada transaksi ini.',
  },
}

/** Status yang berarti barang sudah keluar dari gudang pengecer. */
export function penyaluranKeluar(status: StatusPenyaluran): boolean {
  return status !== 'draft'
}

/* ------------------------------------------------------------------ */
/* Penjaga transisi                                                    */
/* ------------------------------------------------------------------ */

export type HasilTransisi = { ok: true } | { ok: false; alasan: string }

function periksa<S extends string>(
  tabel: Record<S, S[]>,
  meta: Record<S, StatusMeta>,
  dari: S,
  ke: S,
): HasilTransisi {
  if (dari === ke) {
    return { ok: false, alasan: `Status sudah "${meta[ke].label}".` }
  }
  if (!tabel[dari].includes(ke)) {
    return {
      ok: false,
      alasan: `Tidak bisa berpindah dari "${meta[dari].label}" ke "${meta[ke].label}".`,
    }
  }
  return { ok: true }
}

export function cekTransisiPengiriman(
  dari: StatusPengiriman,
  ke: StatusPengiriman,
): HasilTransisi {
  return periksa(TRANSISI_PENGIRIMAN, STATUS_PENGIRIMAN, dari, ke)
}

export function cekTransisiPenyaluran(
  dari: StatusPenyaluran,
  ke: StatusPenyaluran,
): HasilTransisi {
  return periksa(TRANSISI_PENYALURAN, STATUS_PENYALURAN, dari, ke)
}
