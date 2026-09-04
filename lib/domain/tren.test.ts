import { describe, expect, it } from 'vitest'
import { perubahanTren, totalTren, trenPenyaluranHarian } from './tren'
import type { Penyaluran, StatusPenyaluran } from './types'

function salur(tanggal: string, jumlahKg: number, status: StatusPenyaluran = 'divalidasi'): Penyaluran {
  return {
    id: `s-${tanggal}-${jumlahKg}`,
    kode: 'SLR-0001',
    noTransaksi: 'TRX/PR-001/2026/0001',
    pengecerId: 'kios-01',
    poktanId: 'poktan-01',
    rdkkId: 'rdkk-001',
    tanggal,
    items: [{ jenisPupukId: 'pk-urea', jumlahKg, het: 2250, subtotal: jumlahKg * 2250 }],
    total: jumlahKg * 2250,
    metodeBayar: 'tunai',
    status,
    dibuatPada: `${tanggal}T08:00:00.000Z`,
  }
}

describe('tren penyaluran harian', () => {
  it('mengisi hari tanpa transaksi dengan nol', () => {
    const tren = trenPenyaluranHarian([salur('2026-09-03', 100)], '2026-09-03', 3)
    expect(tren).toEqual([
      { tanggal: '2026-09-01', nilai: 0 },
      { tanggal: '2026-09-02', nilai: 0 },
      { tanggal: '2026-09-03', nilai: 100 },
    ])
  })

  it('menjumlahkan beberapa transaksi pada hari yang sama', () => {
    const tren = trenPenyaluranHarian(
      [salur('2026-09-03', 100), salur('2026-09-03', 250)],
      '2026-09-03',
      1,
    )
    expect(tren[0].nilai).toBe(350)
  })

  it('mengabaikan penyaluran yang masih draft', () => {
    const tren = trenPenyaluranHarian([salur('2026-09-03', 100, 'draft')], '2026-09-03', 1)
    expect(tren[0].nilai).toBe(0)
  })

  it('mengabaikan transaksi di luar rentang', () => {
    const tren = trenPenyaluranHarian([salur('2026-08-01', 999)], '2026-09-03', 3)
    expect(totalTren(tren)).toBe(0)
  })

  it('menghitung perubahan paruh akhir dibanding paruh awal', () => {
    const naik = trenPenyaluranHarian(
      [salur('2026-09-03', 200), salur('2026-09-04', 300)],
      '2026-09-04',
      4,
    )
    expect(perubahanTren(naik)).toBeGreaterThan(0)
    expect(perubahanTren([])).toBe(0)
  })
})
