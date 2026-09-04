import { describe, expect, it } from 'vitest'
import { hitungSisaHak, hitungStokPengecer, sisaStok } from './stok'
import type { Pengiriman, Penyaluran, Rdkk, StatusPengiriman, StatusPenyaluran } from './types'

const KIOS = 'kios-01'
const UREA = 'pk-urea'

function kirim(status: StatusPengiriman, jumlahKg: number, jumlahDiterimaKg?: number): Pengiriman {
  return {
    id: `k-${status}-${jumlahKg}`,
    kode: 'KRM-0001',
    noFaktur: 'FK/2026/08/0001',
    noBeritaAcara: 'BA/2026/08/0001',
    distributorId: 'dist-01',
    pengecerId: KIOS,
    tanggalKirim: '2026-08-01',
    items: [{ jenisPupukId: UREA, jumlahKg, jumlahDiterimaKg }],
    status,
    dibuatPada: '2026-08-01T08:00:00.000Z',
  }
}

function salur(status: StatusPenyaluran, jumlahKg: number, poktanId = 'poktan-01'): Penyaluran {
  return {
    id: `s-${status}-${jumlahKg}`,
    kode: 'SLR-0001',
    noTransaksi: 'TRX/PR-001/2026/0001',
    pengecerId: KIOS,
    poktanId,
    rdkkId: 'rdkk-001',
    tanggal: '2026-08-10',
    items: [{ jenisPupukId: UREA, jumlahKg, het: 2250, subtotal: jumlahKg * 2250 }],
    total: jumlahKg * 2250,
    metodeBayar: 'tunai',
    status,
    dibuatPada: '2026-08-10T08:00:00.000Z',
  }
}

describe('stok pengecer', () => {
  it('bertambah hanya setelah pengiriman dikonfirmasi', () => {
    expect(sisaStok(KIOS, UREA, [kirim('dikirim', 1000)], [])).toBe(0)
    expect(sisaStok(KIOS, UREA, [kirim('dikonfirmasi', 1000)], [])).toBe(1000)
  })

  it('tidak bertambah dari pengiriman yang ditolak', () => {
    expect(sisaStok(KIOS, UREA, [kirim('ditolak', 1000)], [])).toBe(0)
  })

  it('memakai jumlah diterima, bukan jumlah faktur, saat ada selisih', () => {
    expect(sisaStok(KIOS, UREA, [kirim('selisih', 1000, 900)], [])).toBe(900)
  })

  it('berkurang oleh penyaluran non-draft', () => {
    const masuk = [kirim('dikonfirmasi', 1000)]
    expect(sisaStok(KIOS, UREA, masuk, [salur('disalurkan', 300)])).toBe(700)
    expect(sisaStok(KIOS, UREA, masuk, [salur('draft', 300)])).toBe(1000)
  })

  it('memisahkan stok antar kios', () => {
    const lain = { ...kirim('dikonfirmasi', 5000), pengecerId: 'kios-02' }
    expect(sisaStok(KIOS, UREA, [kirim('dikonfirmasi', 1000), lain], [])).toBe(1000)
  })

  it('melaporkan rincian masuk, keluar, dan sisa', () => {
    const baris = hitungStokPengecer(
      KIOS,
      [kirim('dikonfirmasi', 1000)],
      [salur('divalidasi', 250)],
    )
    expect(baris).toEqual([{ jenisPupukId: UREA, masukKg: 1000, keluarKg: 250, sisaKg: 750 }])
  })
})

describe('sisa hak RDKK', () => {
  const rdkk: Rdkk = {
    id: 'rdkk-001',
    kode: 'RDKK/MT-2/2026/KT-001',
    poktanId: 'poktan-01',
    musimTanam: 'MT-2',
    tahun: 2026,
    disahkanPada: '2026-06-20',
    items: [{ jenisPupukId: UREA, jumlahKg: 1000 }],
  }

  it('mengurangi hak dengan penyaluran yang sudah terjadi', () => {
    const hasil = hitungSisaHak(rdkk, [salur('dikonfirmasi', 400)])
    expect(hasil).toEqual([
      { jenisPupukId: UREA, hakKg: 1000, ditebusKg: 400, sisaKg: 600 },
    ])
  })

  it('mengabaikan penyaluran draft', () => {
    expect(hitungSisaHak(rdkk, [salur('draft', 400)])[0].sisaKg).toBe(1000)
  })

  it('tidak pernah menghasilkan sisa negatif', () => {
    const hasil = hitungSisaHak(rdkk, [salur('divalidasi', 900), salur('divalidasi', 400)])
    expect(hasil[0].sisaKg).toBe(0)
  })

  it('mengembalikan daftar kosong bila poktan belum punya RDKK', () => {
    expect(hitungSisaHak(undefined, [])).toEqual([])
  })
})
