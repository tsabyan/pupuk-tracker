import { describe, expect, it } from 'vitest'
import {
  TRANSISI_PENYALURAN,
  cekTransisiPengiriman,
  cekTransisiPenyaluran,
  cekTransisiTindakLanjut,
  pengirimanDiterima,
  penyaluranKeluar,
  penyaluranSelesai,
  tindakLanjutTerlambat,
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
  it('berakhir pada pernyataan kelompok tani, bukan persetujuan pengawas', () => {
    expect(cekTransisiPenyaluran('draft', 'disalurkan').ok).toBe(true)
    expect(cekTransisiPenyaluran('disalurkan', 'dikonfirmasi').ok).toBe(true)
    expect(cekTransisiPenyaluran('disalurkan', 'disanggah').ok).toBe(true)
  })

  it('menjadikan konfirmasi dan sanggahan sebagai status akhir', () => {
    expect(TRANSISI_PENYALURAN.dikonfirmasi).toHaveLength(0)
    expect(TRANSISI_PENYALURAN.disanggah).toHaveLength(0)
  })

  it('melarang poktan mengonfirmasi transaksi yang masih draft', () => {
    expect(cekTransisiPenyaluran('draft', 'dikonfirmasi').ok).toBe(false)
  })

  it('menganggap semua status selain draft sebagai stok keluar', () => {
    expect(penyaluranKeluar('draft')).toBe(false)
    expect(penyaluranKeluar('disalurkan')).toBe(true)
    expect(penyaluranKeluar('disanggah')).toBe(true)
  })

  it('menganggap transaksi tuntas hanya setelah poktan menyatakan sikap', () => {
    expect(penyaluranSelesai('disalurkan')).toBe(false)
    expect(penyaluranSelesai('dikonfirmasi')).toBe(true)
    expect(penyaluranSelesai('disanggah')).toBe(true)
  })
})

describe('transisi tindak lanjut', () => {
  it('menutup lingkaran pengawasan sampai status selesai', () => {
    expect(cekTransisiTindakLanjut('terbit', 'dalam_proses').ok).toBe(true)
    expect(cekTransisiTindakLanjut('dalam_proses', 'selesai').ok).toBe(true)
    expect(cekTransisiTindakLanjut('terbit', 'eskalasi').ok).toBe(true)
    expect(cekTransisiTindakLanjut('eskalasi', 'selesai').ok).toBe(true)
  })

  it('melarang membuka kembali tindak lanjut yang sudah selesai', () => {
    expect(cekTransisiTindakLanjut('selesai', 'dalam_proses').ok).toBe(false)
  })

  it('menandai keterlambatan hanya untuk yang belum selesai', () => {
    expect(tindakLanjutTerlambat('terbit', '2026-09-01', '2026-09-08')).toBe(true)
    expect(tindakLanjutTerlambat('terbit', '2026-09-30', '2026-09-08')).toBe(false)
    expect(tindakLanjutTerlambat('selesai', '2026-09-01', '2026-09-08')).toBe(false)
  })
})
