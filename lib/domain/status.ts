/**
 * Mesin status rantai distribusi.
 *
 * Inilah tulang punggung aplikasi: satu aksi di satu role memindahkan
 * status transaksi, dan perpindahan itu yang memunculkan pekerjaan di
 * layar role berikutnya. Semua aturan perpindahan tinggal di file ini.
 */

import type {
  StatusPengiriman,
  StatusPenyaluran,
  StatusTindakLanjut,
} from './types'

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

/**
 * Penyaluran berhenti pada pernyataan kelompok tani, bukan pada
 * persetujuan pengawas: `dikonfirmasi` bila sesuai, `disanggah` bila
 * penerima menyatakan ada yang tidak sesuai. Keduanya status akhir.
 *
 * KP3 sengaja tidak punya transisi di sini. Menaruh pengawas sebagai
 * gerbang akan membuat setiap transaksi menggantung menunggu satu komisi
 * kabupaten — padahal penyaluran sudah sah begitu kedua pihak sepakat,
 * dan pengawasan bekerja dengan uji petik atas transaksi yang sudah
 * selesai.
 */
export const TRANSISI_PENYALURAN: Record<StatusPenyaluran, StatusPenyaluran[]> = {
  draft: ['disalurkan'],
  disalurkan: ['dikonfirmasi', 'disanggah'],
  dikonfirmasi: [],
  disanggah: [],
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
    label: 'Selesai',
    tone: 'sukses',
    deskripsi:
      'Ketua kelompok tani menandatangani penerimaan dan menyatakan sesuai. Transaksi tuntas.',
  },
  disanggah: {
    label: 'Disanggah Poktan',
    tone: 'bahaya',
    deskripsi:
      'Penerimaan tercatat, tetapi kelompok tani menyatakan ada yang tidak sesuai. Menjadi bahan pengawasan.',
  },
}

/** Status yang berarti barang sudah keluar dari gudang pengecer. */
export function penyaluranKeluar(status: StatusPenyaluran): boolean {
  return status !== 'draft'
}

/** Status yang berarti transaksi sudah tuntas antara kios dan poktan. */
export function penyaluranSelesai(status: StatusPenyaluran): boolean {
  return status === 'dikonfirmasi' || status === 'disanggah'
}

/* ------------------------------------------------------------------ */
/* Tindak lanjut hasil pengawasan                                      */
/* ------------------------------------------------------------------ */

/**
 * Rekomendasi tidak berhenti pada penerbitan surat. Tanpa status
 * pelaksanaan, tidak ada bukti bahwa perbaikannya benar-benar terjadi —
 * dan itulah yang dinilai pada maturitas SPIP.
 */
export const TRANSISI_TINDAK_LANJUT: Record<
  StatusTindakLanjut,
  StatusTindakLanjut[]
> = {
  terbit: ['dalam_proses', 'selesai', 'eskalasi'],
  dalam_proses: ['selesai', 'eskalasi'],
  selesai: [],
  eskalasi: ['selesai'],
}

export const STATUS_TINDAK_LANJUT: Record<StatusTindakLanjut, StatusMeta> = {
  terbit: {
    label: 'Terbit',
    tone: 'info',
    deskripsi: 'Sudah dikirim ke pihak sasaran, belum ada tanggapan.',
  },
  dalam_proses: {
    label: 'Dalam Proses',
    tone: 'peringatan',
    deskripsi: 'Pihak sasaran sedang mengerjakan perbaikan yang diminta.',
  },
  selesai: {
    label: 'Selesai',
    tone: 'sukses',
    deskripsi: 'Perbaikan terlaksana dan diverifikasi pengawas.',
  },
  eskalasi: {
    label: 'Dieskalasi',
    tone: 'bahaya',
    deskripsi: 'Tidak ditindaklanjuti atau di luar kewenangan KP3, diteruskan ke instansi lain.',
  },
}

/** Tindak lanjut yang melewati tenggat tetapi belum tuntas. */
export function tindakLanjutTerlambat(
  status: StatusTindakLanjut,
  tenggat: string,
  hariIni: string,
): boolean {
  if (status === 'selesai') return false
  return tenggat < hariIni
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

export function cekTransisiTindakLanjut(
  dari: StatusTindakLanjut,
  ke: StatusTindakLanjut,
): HasilTransisi {
  return periksa(TRANSISI_TINDAK_LANJUT, STATUS_TINDAK_LANJUT, dari, ke)
}
