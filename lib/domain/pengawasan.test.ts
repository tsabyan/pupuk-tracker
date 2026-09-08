import { describe, expect, it } from 'vitest'
import {
  cakupanPengawasan,
  kesimpulanOtomatis,
  penandaPenapisan,
  penapisanPenyaluran,
  rekapTemuan,
  temuanDariPemeriksaan,
} from './pengawasan'
import type {
  KelompokTani,
  Pemeriksaan,
  Penyaluran,
  Rdkk,
  Temuan,
} from './types'

const HARI_INI = '2026-09-08'

const POKTAN: KelompokTani = {
  id: 'poktan-01',
  kode: 'KT-001',
  nama: 'Tani Makmur',
  ketua: 'Sahwan',
  desaId: 'desa-01',
  pengecerId: 'kios-01',
  jumlahAnggota: 30,
  luasLahanHa: 22,
}

const RDKK: Rdkk = {
  id: 'rdkk-01',
  kode: 'RDKK-001',
  poktanId: 'poktan-01',
  musimTanam: 'MT1',
  tahun: 2026,
  items: [{ jenisPupukId: 'pk-urea', jumlahKg: 1000 }],
  disahkanPada: '2026-06-01',
}

function trx(ubah: Partial<Penyaluran> = {}): Penyaluran {
  return {
    id: 'salur-0001',
    kode: 'SLR-0001',
    noTransaksi: 'TRX/PR-001/2026/0001',
    pengecerId: 'kios-01',
    poktanId: 'poktan-01',
    rdkkId: 'rdkk-01',
    tanggal: '2026-09-01',
    items: [{ jenisPupukId: 'pk-urea', jumlahKg: 400, het: 2250, subtotal: 900_000 }],
    total: 900_000,
    metodeBayar: 'tunai',
    status: 'dikonfirmasi',
    bukti: { ttdPenerima: 'data:ttd' },
    konfirmasi: { tanggal: '2026-09-02', ttdKetua: 'data:ttd', kesesuaian: 'sesuai' },
    dibuatPada: '2026-09-01T08:00:00.000Z',
    ...ubah,
  }
}

const ctx = (penyaluranPoktan: Penyaluran[]) => ({
  poktan: POKTAN,
  rdkk: RDKK,
  penyaluranPoktan,
  het: () => 2250,
  namaPupuk: () => 'Urea Bersubsidi',
  hariIni: HARI_INI,
})

describe('penapisan tujuh tepat', () => {
  it('meloloskan transaksi yang bersih pada ketujuh aspek', () => {
    const p = trx()
    const butir = penapisanPenyaluran(p, ctx([p]))
    expect(butir).toHaveLength(7)
    expect(penandaPenapisan(butir)).toHaveLength(0)
  })

  it('menandai sanggahan kelompok tani sebagai aspek tepat jumlah', () => {
    const p = trx({
      status: 'disanggah',
      konfirmasi: {
        tanggal: '2026-09-02',
        ttdKetua: 'data:ttd',
        kesesuaian: 'tidak_sesuai',
        catatan: 'Urea kurang 50 kg.',
      },
    })
    const penanda = penandaPenapisan(penapisanPenyaluran(p, ctx([p])))
    expect(penanda.map((b) => b.aspek)).toContain('jumlah')
  })

  it('menandai penebusan kumulatif yang melewati hak RDKK', () => {
    const a = trx({ id: 'salur-0001' })
    const b = trx({
      id: 'salur-0002',
      items: [{ jenisPupukId: 'pk-urea', jumlahKg: 900, het: 2250, subtotal: 2_025_000 }],
    })
    const penanda = penandaPenapisan(penapisanPenyaluran(a, ctx([a, b])))
    expect(penanda.map((x) => x.aspek)).toContain('penerima')
  })

  it('menandai penyaluran oleh kios yang bukan penyalur resmi poktan', () => {
    const p = trx({ pengecerId: 'kios-99' })
    const penanda = penandaPenapisan(penapisanPenyaluran(p, ctx([p])))
    expect(penanda.map((b) => b.aspek)).toContain('tempat')
  })

  it('tidak pernah menyatakan harga jual terbukti sesuai dari data sistem', () => {
    const p = trx()
    const harga = penapisanPenyaluran(p, ctx([p])).find((b) => b.aspek === 'harga')
    expect(harga?.lolos).toBe(true)
    // Butirnya lolos, tetapi keterangannya wajib menyebut batas keandalannya.
    expect(harga?.keterangan).toMatch(/lapangan/i)
  })
})

function periksa(ubah: Partial<Pemeriksaan> = {}): Pemeriksaan {
  return {
    id: 'periksa-001',
    kode: 'PRK/2026/001',
    noBeritaAcara: 'BAP/2026/09/001',
    pengawasId: 'pengawas-01',
    pendamping: [],
    objekTipe: 'pengecer',
    objekId: 'kios-01',
    tanggal: '2026-09-05',
    sampelPenyaluranIds: [],
    stok: [],
    harga: [],
    penerima: [],
    administrasi: [],
    kesimpulan: 'sesuai',
    dibuatPada: '2026-09-05T08:00:00.000Z',
    ...ubah,
  }
}

const namaPupuk = () => 'Urea Bersubsidi'
const namaObjek = () => 'Tani Makmur'

describe('penurunan temuan dari berita acara', () => {
  it('tidak menghasilkan temuan bila seluruh butir cocok', () => {
    const hasil = temuanDariPemeriksaan(
      periksa({
        stok: [{ jenisPupukId: 'pk-urea', sistemKg: 1000, fisikKg: 1000 }],
        harga: [
          { jenisPupukId: 'pk-urea', het: 2250, hargaJual: 2250, biayaTambahan: 0 },
        ],
        administrasi: [{ butir: 'Kartu stok masuk dan keluar', ada: true }],
      }),
      namaPupuk,
      namaObjek,
    )
    expect(hasil).toHaveLength(0)
    expect(kesimpulanOtomatis(hasil)).toBe('sesuai')
  })

  it('menilai selisih stok dari besar simpangannya, bukan angka mutlaknya', () => {
    const kecil = temuanDariPemeriksaan(
      periksa({ stok: [{ jenisPupukId: 'pk-urea', sistemKg: 10_000, fisikKg: 9_900 }] }),
      namaPupuk,
      namaObjek,
    )
    const besar = temuanDariPemeriksaan(
      periksa({ stok: [{ jenisPupukId: 'pk-urea', sistemKg: 200, fisikKg: 100 }] }),
      namaPupuk,
      namaObjek,
    )
    expect(kecil[0].tingkat).toBe('ringan')
    expect(besar[0].tingkat).toBe('berat')
  })

  it('menjadikan harga di atas HET sebagai temuan aspek harga', () => {
    const hasil = temuanDariPemeriksaan(
      periksa({
        harga: [
          { jenisPupukId: 'pk-urea', het: 2250, hargaJual: 2500, biayaTambahan: 100 },
        ],
      }),
      namaPupuk,
      namaObjek,
    )
    expect(hasil).toHaveLength(2)
    expect(hasil.every((t) => t.aspek === 'harga')).toBe(true)
    expect(hasil[0].tingkat).toBe('berat')
  })

  it('menjadikan penerima di luar RDKK sebagai temuan berat', () => {
    const hasil = temuanDariPemeriksaan(
      periksa({
        objekTipe: 'poktan',
        objekId: 'poktan-01',
        penerima: [
          { poktanId: 'poktan-01', terdaftarRdkk: false, hakKg: 1000, ditebusKg: 400 },
        ],
      }),
      namaPupuk,
      namaObjek,
    )
    expect(hasil).toHaveLength(1)
    expect(hasil[0].aspek).toBe('penerima')
    expect(hasil[0].tingkat).toBe('berat')
    expect(kesimpulanOtomatis(hasil)).toBe('tidak_sesuai')
  })

  it('meringkas dokumen yang tidak ada menjadi satu temuan ketentuan', () => {
    const hasil = temuanDariPemeriksaan(
      periksa({
        administrasi: [
          { butir: 'Kartu stok masuk dan keluar', ada: false },
          { butir: 'Bukti transaksi / penebusan', ada: false },
          { butir: 'Data penerima sesuai RDKK', ada: true },
        ],
      }),
      namaPupuk,
      namaObjek,
    )
    expect(hasil).toHaveLength(1)
    expect(hasil[0].aspek).toBe('ketentuan')
    expect(kesimpulanOtomatis(hasil)).toBe('sebagian')
  })
})

describe('rekap pengawasan', () => {
  const temuan: Temuan[] = [
    {
      id: 'temuan-001',
      kode: 'TMN/2026/001',
      sumber: 'pemeriksaan',
      sumberId: 'periksa-001',
      aspek: 'harga',
      uraian: 'Di atas HET',
      tingkat: 'berat',
      status: 'terbuka',
      objekTipe: 'pengecer',
      objekId: 'kios-01',
      tanggal: '2026-09-05',
      dibuatPada: '2026-09-05T08:00:00.000Z',
    },
    {
      id: 'temuan-002',
      kode: 'TMN/2026/002',
      sumber: 'pemeriksaan',
      sumberId: 'periksa-001',
      aspek: 'harga',
      uraian: 'Pungutan tambahan',
      tingkat: 'sedang',
      status: 'selesai',
      objekTipe: 'pengecer',
      objekId: 'kios-01',
      tanggal: '2026-09-05',
      dibuatPada: '2026-09-05T08:00:00.000Z',
    },
  ]

  it('mengurutkan aspek dari yang paling banyak temuannya', () => {
    const rekap = rekapTemuan(temuan)
    expect(rekap[0].aspek).toBe('harga')
    expect(rekap[0]).toMatchObject({ total: 2, belumTuntas: 1, berat: 1 })
  })

  it('menghitung cakupan hanya atas transaksi yang sudah dikonfirmasi', () => {
    const a = trx({ id: 'salur-0001' })
    const b = trx({
      id: 'salur-0002',
      pengawasan: {
        pengawasId: 'pengawas-01',
        tanggal: '2026-09-05',
        hasil: 'sesuai',
      },
    })
    const belumKonfirmasi = trx({
      id: 'salur-0003',
      status: 'disalurkan',
      konfirmasi: undefined,
    })

    const hasil = cakupanPengawasan([a, b, belumKonfirmasi])
    expect(hasil).toMatchObject({ selesai: 2, diperiksa: 1 })
    expect(hasil.rasio).toBe(0.5)
  })
})
