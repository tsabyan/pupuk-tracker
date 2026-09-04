/**
 * Kontrak akses data.
 *
 * Semua method async meski implementasi prototype-nya sinkron. Saat backend
 * pindah ke Laravel, cukup ganti implementasi — tidak ada call site di UI
 * yang perlu diubah.
 */

import type {
  Alokasi,
  Database,
  HasilValidasi,
  Inspeksi,
  Kesesuaian,
  KesesuaianInspeksi,
  ItemPupuk,
  JenisTindakLanjut,
  LaporanPemanfaatan,
  LokasiInspeksi,
  MetodeBayar,
  Pengiriman,
  Penyaluran,
  SasaranTindakLanjut,
  TindakLanjut,
} from '@/lib/domain/types'

export interface BuatAlokasiInput {
  distributorId: string
  kecamatanId: string
  musimTanam: string
  tahun: number
  periodeMulai: string
  periodeSelesai: string
  catatan?: string
  rincian: Array<{ pengecerId: string; items: ItemPupuk[] }>
}

export interface BuatPengirimanInput {
  distributorId: string
  pengecerId: string
  alokasiId?: string
  tanggalKirim: string
  items: ItemPupuk[]
}

export interface KonfirmasiPengirimanInput {
  /** Jumlah yang benar-benar diterima per jenis pupuk. */
  diterima: Array<{ jenisPupukId: string; jumlahDiterimaKg: number }>
  catatan?: string
  /** Tandai bila kiriman ditolak seluruhnya. */
  tolak?: boolean
}

export interface BuatPenyaluranInput {
  pengecerId: string
  poktanId: string
  tanggal: string
  metodeBayar: MetodeBayar
  items: ItemPupuk[]
  ttdPenerima?: string
  fotoStruk?: string
  catatan?: string
}

export interface KonfirmasiPenyaluranInput {
  ttdKetua: string
  kesesuaian: Kesesuaian
  fotoTerima?: string
  catatan?: string
}

export interface ValidasiPenyaluranInput {
  pengawasId: string
  hasil: HasilValidasi
  catatan?: string
}

export interface BuatPemanfaatanInput {
  poktanId: string
  penyaluranId?: string
  periode: string
  komoditas: string
  luasTanamHa: number
  dipakai: ItemPupuk[]
  tanggalAplikasi: string
  catatan?: string
}

export interface BuatInspeksiInput {
  pengawasId: string
  lokasiTipe: LokasiInspeksi
  lokasiId: string
  tanggal: string
  temuan: string[]
  kesesuaian: KesesuaianInspeksi
  catatan?: string
}

export interface BuatTindakLanjutInput {
  pengawasId: string
  jenis: JenisTindakLanjut
  sasaranTipe: SasaranTindakLanjut
  sasaranId: string
  judul: string
  isi: string
  tanggal: string
  refTipe?: 'validasi' | 'inspeksi'
  refId?: string
}

export interface DataRepo {
  muat(): Promise<Database>
  resetDemo(): Promise<Database>

  buatAlokasi(input: BuatAlokasiInput): Promise<Alokasi>
  buatPengiriman(input: BuatPengirimanInput): Promise<Pengiriman>
  konfirmasiPengiriman(id: string, input: KonfirmasiPengirimanInput): Promise<Pengiriman>

  buatPenyaluran(input: BuatPenyaluranInput): Promise<Penyaluran>
  konfirmasiPenyaluran(id: string, input: KonfirmasiPenyaluranInput): Promise<Penyaluran>
  validasiPenyaluran(id: string, input: ValidasiPenyaluranInput): Promise<Penyaluran>

  buatPemanfaatan(input: BuatPemanfaatanInput): Promise<LaporanPemanfaatan>
  buatInspeksi(input: BuatInspeksiInput): Promise<Inspeksi>
  buatTindakLanjut(input: BuatTindakLanjutInput): Promise<TindakLanjut>

  tandaiNotifikasiDibaca(id: string): Promise<void>
  tandaiSemuaNotifikasiDibaca(userId: string): Promise<void>
}

/** Kesalahan aturan bisnis — pesannya aman ditampilkan ke pengguna. */
export class KesalahanAturan extends Error {
  constructor(pesan: string) {
    super(pesan)
    this.name = 'KesalahanAturan'
  }
}
