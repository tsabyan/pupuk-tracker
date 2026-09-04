'use client'

import { useMemo } from 'react'
import { useSesiStore } from '@/lib/auth/session'
import { useDbStore } from '@/lib/data/store'
import type {
  Database,
  Distributor,
  KelompokTani,
  Notifikasi,
  Pengawas,
  Pengecer,
  Role,
  User,
} from '@/lib/domain/types'

/**
 * Basis data aktif. Sengaja mengembalikan objek utuh: referensinya stabil
 * sampai ada perubahan data, jadi aman dipakai `useSyncExternalStore`.
 * Turunkan data yang dibutuhkan komponen dengan `useMemo`.
 */
export function useDb(): Database {
  return useDbStore((s) => s.db)
}

/** True setelah data localStorage selesai dibaca di browser. */
export function useSiap(): boolean {
  const dbSiap = useDbStore((s) => s.hydrated)
  const sesiSiap = useSesiStore((s) => s.hydrated)
  return dbSiap && sesiSiap
}

export interface Sesi {
  user: User | null
  role: Role | null
  distributor: Distributor | null
  pengecer: Pengecer | null
  poktan: KelompokTani | null
  pengawas: Pengawas | null
  /** Nama entitas yang diwakili pengguna, untuk ditampilkan di header. */
  namaEntitas: string
}

export function useSesi(): Sesi {
  const db = useDb()
  const userId = useSesiStore((s) => s.userId)

  return useMemo(() => {
    const user = db.users.find((u) => u.id === userId) ?? null
    const kosong: Sesi = {
      user: null,
      role: null,
      distributor: null,
      pengecer: null,
      poktan: null,
      pengawas: null,
      namaEntitas: '',
    }
    if (!user) return kosong

    const distributor =
      user.role === 'distributor'
        ? (db.distributor.find((d) => d.id === user.entityId) ?? null)
        : null
    const pengecer =
      user.role === 'pengecer'
        ? (db.pengecer.find((p) => p.id === user.entityId) ?? null)
        : null
    const poktan =
      user.role === 'poktan'
        ? (db.kelompokTani.find((k) => k.id === user.entityId) ?? null)
        : null
    const pengawas =
      user.role === 'kp3'
        ? (db.pengawas.find((p) => p.id === user.entityId) ?? null)
        : null

    return {
      user,
      role: user.role,
      distributor,
      pengecer,
      poktan,
      pengawas,
      namaEntitas:
        distributor?.nama ??
        pengecer?.nama ??
        poktan?.nama ??
        pengawas?.instansi ??
        '',
    }
  }, [db, userId])
}

const GELAR = /^(Ir|Drs|Dra|H|Hj|Aiptu|Aipda|Bripka|Kompol|Dr)\.?$/i
/** Partikel yang selalu menempel pada nama berikutnya, bukan nama panggilan. */
const PARTIKEL = /^(Moh|Muh|Mohammad|Muhammad|Abd|Abdul|Ach|Achmad|Siti|Nur)\.?$/i

/**
 * Nama panggilan untuk sapaan dan avatar.
 *
 * Melewati gelar di depan, lalu melewati partikel nama seperti "Moh." atau
 * "Abd." yang tidak pernah dipakai sendiri sebagai panggilan.
 */
export function namaPanggilan(nama: string): string {
  const bagian = nama.split(/\s+/).filter(Boolean)
  let i = 0
  while (i < bagian.length - 1 && GELAR.test(bagian[i])) i++
  while (i < bagian.length - 1 && PARTIKEL.test(bagian[i])) i++
  return bagian[i] ?? nama
}

export function useNotifikasi(): { daftar: Notifikasi[]; belumDibaca: number } {
  const db = useDb()
  const { user } = useSesi()

  return useMemo(() => {
    if (!user) return { daftar: [], belumDibaca: 0 }
    const daftar = db.notifikasi
      .filter((n) => n.untukUserId === user.id)
      .sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada))
    return { daftar, belumDibaca: daftar.filter((n) => !n.dibaca).length }
  }, [db, user])
}

/** Pencari nama entitas, dipakai di banyak tabel. */
export function usePencari() {
  const db = useDb()
  return useMemo(
    () => ({
      pupuk: (id: string) => db.jenisPupuk.find((j) => j.id === id),
      namaPupuk: (id: string) => db.jenisPupuk.find((j) => j.id === id)?.nama ?? id,
      kodePupuk: (id: string) => db.jenisPupuk.find((j) => j.id === id)?.kode ?? id,
      pengecer: (id: string) => db.pengecer.find((p) => p.id === id),
      namaPengecer: (id: string) => db.pengecer.find((p) => p.id === id)?.nama ?? '—',
      poktan: (id: string) => db.kelompokTani.find((k) => k.id === id),
      namaPoktan: (id: string) => db.kelompokTani.find((k) => k.id === id)?.nama ?? '—',
      distributor: (id: string) => db.distributor.find((d) => d.id === id),
      namaDistributor: (id: string) =>
        db.distributor.find((d) => d.id === id)?.nama ?? '—',
      pengawas: (id: string) => db.pengawas.find((p) => p.id === id),
      namaPengawas: (id: string) => db.pengawas.find((p) => p.id === id)?.nama ?? '—',
      desa: (id: string) => db.desa.find((d) => d.id === id),
      namaDesa: (id: string) => db.desa.find((d) => d.id === id)?.nama ?? '—',
      kecamatan: (id: string) => db.kecamatan.find((k) => k.id === id),
      namaKecamatan: (id: string) => db.kecamatan.find((k) => k.id === id)?.nama ?? '—',
      rdkkPoktan: (poktanId: string) => db.rdkk.find((r) => r.poktanId === poktanId),
    }),
    [db],
  )
}
