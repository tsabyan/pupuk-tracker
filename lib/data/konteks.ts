import type { Database, Role, User } from '@/lib/domain/types'
import type { KonteksNotif } from '@/lib/domain/notifikasi'

/** Rakit konteks penyusunan notifikasi dari basis data. */
export function konteksNotif(db: Database): KonteksNotif {
  return {
    penggunaDari: (role: Role, entityId: string): User[] =>
      db.users.filter((u) => u.role === role && u.entityId === entityId),
    semuaPengawas: () => db.users.filter((u) => u.role === 'kp3'),
    namaDistributor: (id) =>
      db.distributor.find((d) => d.id === id)?.nama ?? 'Distributor',
    namaPengecer: (id) => db.pengecer.find((p) => p.id === id)?.nama ?? 'Pengecer',
    namaPoktan: (id) =>
      db.kelompokTani.find((k) => k.id === id)?.nama ?? 'Kelompok Tani',
  }
}

/** Nomor urut berikutnya berdasarkan koleksi yang sudah ada. */
export function urutBerikut(daftar: Array<{ id: string }>, awalan: string): number {
  let maksimum = 0
  for (const item of daftar) {
    if (!item.id.startsWith(`${awalan}-`)) continue
    const angka = Number(item.id.slice(awalan.length + 1))
    if (Number.isFinite(angka) && angka > maksimum) maksimum = angka
  }
  return maksimum + 1
}

export const pad = (n: number, lebar = 4) => String(n).padStart(lebar, '0')
