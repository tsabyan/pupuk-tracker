import type { Role } from '@/lib/domain/types'

/**
 * Identitas peran.
 *
 * Sengaja tanpa warna: seluruh aplikasi memakai satu aksen gelap seperti
 * dashboard pada umumnya. Peran dibedakan lewat judul halaman, isi menu,
 * dan inisial pada avatar.
 */
export interface TemaRole {
  label: string
  ringkas: string
  /** Dipakai pada avatar dan lencana peran. */
  singkatan: string
  beranda: string
}

export const TEMA: Record<Role, TemaRole> = {
  distributor: {
    label: 'Distributor',
    ringkas: 'Menyusun alokasi dan mengirim pupuk ke kios resmi',
    singkatan: 'DIS',
    beranda: '/distributor',
  },
  pengecer: {
    label: 'Pengecer Resmi',
    ringkas: 'Menerima kiriman, mengelola stok, menyalurkan ke kelompok tani',
    singkatan: 'KIO',
    beranda: '/pengecer',
  },
  poktan: {
    label: 'Kelompok Tani',
    ringkas: 'Menerima pupuk, mengonfirmasi, melaporkan pemanfaatan',
    singkatan: 'KT',
    beranda: '/poktan',
  },
  kp3: {
    label: 'Pengawas KP3',
    ringkas: 'Memantau, memvalidasi, menginspeksi, menindaklanjuti',
    singkatan: 'KP3',
    beranda: '/kp3',
  },
}

export const URUTAN_ROLE: Role[] = ['distributor', 'pengecer', 'poktan', 'kp3']
