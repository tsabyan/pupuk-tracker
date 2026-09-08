import { describe, expect, it } from 'vitest'
import { cakupanPengawasan } from '@/lib/domain/pengawasan'
import { hitungSisaHak, hitungStokPengecer } from '@/lib/domain/stok'
import { buatDatabase } from './index'

const db = buatDatabase()

describe('basis data demo', () => {
  it('deterministik: dua kali dibuat hasilnya identik', () => {
    expect(JSON.stringify(buatDatabase())).toBe(JSON.stringify(db))
  })

  it('tidak pernah menghasilkan stok kios yang minus', () => {
    for (const kios of db.pengecer) {
      const baris = hitungStokPengecer(kios.id, db.pengiriman, db.penyaluran)
      for (const b of baris) {
        expect(b.sisaKg, `${kios.nama} / ${b.jenisPupukId}`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('tidak pernah menyalurkan melebihi hak RDKK kelompok tani', () => {
    for (const rdkk of db.rdkk) {
      const milikPoktan = db.penyaluran.filter((p) => p.poktanId === rdkk.poktanId)
      for (const hak of hitungSisaHak(rdkk, milikPoktan)) {
        expect(hak.ditebusKg, `${rdkk.kode} / ${hak.jenisPupukId}`).toBeLessThanOrEqual(hak.hakKg)
      }
    }
  })

  it('menyisakan pekerjaan menggantung di setiap role untuk demo', () => {
    expect(db.pengiriman.some((p) => p.status === 'dikirim')).toBe(true)
    expect(db.penyaluran.some((p) => p.status === 'disalurkan')).toBe(true)
    expect(db.penyaluran.some((p) => p.status === 'dikonfirmasi')).toBe(true)
    expect(db.penyaluran.some((p) => p.status === 'disanggah')).toBe(true)
    expect(db.notifikasi.length).toBeGreaterThan(0)
  })

  it('memakai uji petik: sebagian transaksi selesai memang belum diperiksa', () => {
    const { rasio, selesai, diperiksa } = cakupanPengawasan(db.penyaluran)
    expect(selesai).toBeGreaterThan(0)
    expect(diperiksa).toBeGreaterThan(0)
    expect(rasio).toBeLessThan(1)
  })

  it('menghasilkan temuan berkategori dari berita acara pemeriksaan', () => {
    expect(db.pemeriksaan.length).toBeGreaterThan(0)
    expect(db.temuan.length).toBeGreaterThan(0)

    // Pelanggaran harga hanya bisa lahir dari pemeriksaan lapangan, tidak
    // pernah dari data transaksi yang memang selalu mencatat HET.
    expect(db.temuan.some((t) => t.aspek === 'harga')).toBe(true)
    for (const t of db.temuan) {
      if (t.sumber !== 'pemeriksaan') continue
      expect(db.pemeriksaan.some((p) => p.id === t.sumberId)).toBe(true)
    }
  })

  it('menutup lingkaran: tindak lanjut selesai membuat temuannya selesai', () => {
    const tuntas = db.tindakLanjut.filter((t) => t.status === 'selesai')
    expect(tuntas.length).toBeGreaterThan(0)
    for (const t of tuntas) {
      for (const id of t.temuanIds) {
        expect(db.temuan.find((x) => x.id === id)?.status).toBe('selesai')
      }
    }
    // Sengaja ada yang masih menggantung sebagai umpan aksi saat presentasi.
    expect(db.temuan.some((t) => t.status === 'terbuka')).toBe(true)
    expect(db.tindakLanjut.some((t) => t.status !== 'selesai')).toBe(true)
  })

  it('menyediakan akun demo untuk keempat role', () => {
    for (const role of ['distributor', 'pengecer', 'poktan', 'kp3'] as const) {
      expect(db.users.some((u) => u.role === role)).toBe(true)
    }
  })

  it('menghubungkan setiap kelompok tani ke satu RDKK', () => {
    for (const poktan of db.kelompokTani) {
      expect(db.rdkk.filter((r) => r.poktanId === poktan.id)).toHaveLength(1)
    }
  })

  it('memastikan setiap relasi transaksi menunjuk entitas yang ada', () => {
    const idPengecer = new Set(db.pengecer.map((p) => p.id))
    const idPoktan = new Set(db.kelompokTani.map((k) => k.id))
    const idPupuk = new Set(db.jenisPupuk.map((j) => j.id))

    for (const p of db.pengiriman) {
      expect(idPengecer.has(p.pengecerId)).toBe(true)
      for (const i of p.items) expect(idPupuk.has(i.jenisPupukId)).toBe(true)
    }
    for (const p of db.penyaluran) {
      expect(idPengecer.has(p.pengecerId)).toBe(true)
      expect(idPoktan.has(p.poktanId)).toBe(true)
      for (const i of p.items) expect(idPupuk.has(i.jenisPupukId)).toBe(true)
    }
  })
})
