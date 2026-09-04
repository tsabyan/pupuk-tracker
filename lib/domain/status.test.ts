import { describe, expect, it } from 'vitest'
import {
  cekTransisiPengiriman,
  cekTransisiPenyaluran,
  pengirimanDiterima,
  penyaluranKeluar,
} from './status'

describe('transisi pengiriman', () => {
  it('mengizinkan alur normal draft → dikirim → dikonfirmasi', () => {
    expect(cekTransisiPengiriman('draft', 'dikirim').ok).toBe(true)
    expect(cekTransisiPengiriman('dikirim', 'dikonfirmasi').ok).toBe(true)
  })

  it('mengizinkan pengecer menandai selisih atau menolak', () => {
    expect(cekTransisiPengiriman('dikirim', 'selisih').ok).toBe(true)
    expect(cekTransisiPengiriman('dikirim', 'ditolak').ok).toBe(true)
  })

  it('menolak konfirmasi kiriman yang belum dikirim', () => {
    const hasil = cekTransisiPengiriman('draft', 'dikonfirmasi')
    expect(hasil.ok).toBe(false)
  })

  it('menolak perubahan status yang sudah final', () => {
    expect(cekTransisiPengiriman('dikonfirmasi', 'ditolak').ok).toBe(false)
    expect(cekTransisiPengiriman('ditolak', 'dikonfirmasi').ok).toBe(false)
  })

  it('menolak transisi ke status yang sama', () => {
    expect(cekTransisiPengiriman('dikirim', 'dikirim').ok).toBe(false)
  })

  it('hanya menghitung dikonfirmasi dan selisih sebagai barang masuk', () => {
    expect(pengirimanDiterima('dikonfirmasi')).toBe(true)
    expect(pengirimanDiterima('selisih')).toBe(true)
    expect(pengirimanDiterima('dikirim')).toBe(false)
    expect(pengirimanDiterima('ditolak')).toBe(false)
  })
})

describe('transisi penyaluran', () => {
  it('mengizinkan alur penuh sampai validasi KP3', () => {
    expect(cekTransisiPenyaluran('draft', 'disalurkan').ok).toBe(true)
    expect(cekTransisiPenyaluran('disalurkan', 'dikonfirmasi').ok).toBe(true)
    expect(cekTransisiPenyaluran('dikonfirmasi', 'divalidasi').ok).toBe(true)
    expect(cekTransisiPenyaluran('dikonfirmasi', 'bermasalah').ok).toBe(true)
  })

  it('melarang KP3 memvalidasi sebelum poktan konfirmasi', () => {
    expect(cekTransisiPenyaluran('disalurkan', 'divalidasi').ok).toBe(false)
  })

  it('melarang poktan mengonfirmasi transaksi yang masih draft', () => {
    expect(cekTransisiPenyaluran('draft', 'dikonfirmasi').ok).toBe(false)
  })

  it('menganggap semua status selain draft sebagai stok keluar', () => {
    expect(penyaluranKeluar('draft')).toBe(false)
    expect(penyaluranKeluar('disalurkan')).toBe(true)
    expect(penyaluranKeluar('bermasalah')).toBe(true)
  })
})
