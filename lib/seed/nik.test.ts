import { describe, expect, it } from 'vitest'
import { KECAMATAN, DESA } from './master'
import { buatDatabase } from './index'

const db = buatDatabase()

describe('NIK petani', () => {
  it('selalu 16 digit angka', () => {
    for (const p of db.petani) {
      expect(p.nik, p.nama).toMatch(/^\d{16}$/)
    }
  })

  it('berawalan kode kabupaten dan kecamatan tempat poktannya berada', () => {
    for (const p of db.petani) {
      const poktan = db.kelompokTani.find((k) => k.id === p.poktanId)!
      const desa = DESA.find((d) => d.id === poktan.desaId)!
      const kec = KECAMATAN.find((k) => k.id === desa.kecamatanId)!
      expect(p.nik.slice(0, 6), p.nama).toBe(`3527${kec.kode}`)
    }
  })

  it('memakai pola tanggal lahir perempuan (hari + 40) untuk nama perempuan', () => {
    const perempuan = db.petani.filter((p) =>
      /^(Halimah|Hosniyah|Maimunah|Nur Aini|Siti)/.test(p.nama),
    )
    expect(perempuan.length).toBeGreaterThan(0)
    for (const p of perempuan) {
      expect(Number(p.nik.slice(6, 8)), p.nama).toBeGreaterThan(40)
    }
    for (const p of db.petani.filter((x) => !perempuan.includes(x))) {
      expect(Number(p.nik.slice(6, 8)), p.nama).toBeLessThanOrEqual(31)
    }
  })

  it('tidak ada NIK ganda', () => {
    expect(new Set(db.petani.map((p) => p.nik)).size).toBe(db.petani.length)
  })
})
