import { describe, expect, it } from 'vitest'
import { NAVIGASI, NAVIGASI_UMUM, menuAktif, peranPemilik } from '@/lib/ui/navigasi'
import type { Role } from '@/lib/domain/types'

describe('penyorotan menu sidebar', () => {
  const kasus: Array<[Role, string, string]> = [
    ['distributor', '/distributor', '/distributor'],
    ['distributor', '/distributor/alokasi', '/distributor/alokasi'],
    ['distributor', '/distributor/alokasi/baru', '/distributor/alokasi'],
    ['distributor', '/distributor/alokasi/alokasi-001', '/distributor/alokasi'],
    ['distributor', '/distributor/pengiriman', '/distributor/pengiriman'],
    ['distributor', '/distributor/pengiriman/kirim-0004', '/distributor/pengiriman'],
    ['distributor', '/notifikasi', '/notifikasi'],
    ['distributor', '/petunjuk', '/petunjuk'],
    ['kp3', '/petunjuk', '/petunjuk'],
    ['pengecer', '/pengecer', '/pengecer'],
    ['pengecer', '/pengecer/penerimaan/kirim-0004', '/pengecer/penerimaan'],
    ['pengecer', '/pengecer/penyaluran/baru', '/pengecer/penyaluran'],
    ['pengecer', '/pengecer/stok', '/pengecer/stok'],
    ['poktan', '/poktan', '/poktan'],
    ['poktan', '/poktan/pemanfaatan/baru', '/poktan/pemanfaatan'],
    ['kp3', '/kp3', '/kp3'],
    ['kp3', '/kp3/objek/salur-0001', '/kp3/objek'],
    ['kp3', '/kp3/pemeriksaan/baru', '/kp3/pemeriksaan'],
    ['kp3', '/kp3/temuan', '/kp3/temuan'],
    ['kp3', '/kp3/tindak-lanjut/baru', '/kp3/tindak-lanjut'],
  ]

  it.each(kasus)('%s pada %s menyalakan %s', (role, pathname, diharapkan) => {
    expect(menuAktif(role, pathname)).toBe(diharapkan)
  })

  it('tidak pernah menyalakan lebih dari satu menu', () => {
    for (const [role, pathname] of kasus) {
      const cocok = [...NAVIGASI[role], ...NAVIGASI_UMUM]
        .map((m) => m.href)
        .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      const menyala = menuAktif(role, pathname)
      expect(cocok.filter((h) => h === menyala)).toHaveLength(1)
    }
  })
})

describe('pemilik halaman', () => {
  const kasus: Array<[string, Role | null]> = [
    ['/distributor', 'distributor'],
    ['/distributor/pengiriman/kirim-0004', 'distributor'],
    ['/pengecer/stok', 'pengecer'],
    ['/poktan/pemanfaatan/baru', 'poktan'],
    ['/kp3/laporan', 'kp3'],
    ['/notifikasi', null],
    ['/petunjuk', null],
  ]

  it.each(kasus)('%s dimiliki %s', (pathname, peran) => {
    expect(peranPemilik(pathname)).toBe(peran)
  })

  it('setiap menu peran dimiliki peran itu sendiri', () => {
    for (const peran of Object.keys(NAVIGASI) as Role[]) {
      for (const item of NAVIGASI[peran]) {
        expect(peranPemilik(item.href)).toBe(peran)
      }
    }
  })

  it('menu umum tidak dimiliki peran mana pun', () => {
    for (const item of NAVIGASI_UMUM) {
      expect(peranPemilik(item.href)).toBeNull()
    }
  })
})
