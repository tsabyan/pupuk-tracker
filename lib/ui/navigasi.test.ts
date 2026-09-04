import { describe, expect, it } from 'vitest'
import { NAVIGASI, NAVIGASI_UMUM, menuAktif } from '@/lib/ui/navigasi'
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
    ['kp3', '/kp3/validasi/salur-0001', '/kp3/validasi'],
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
