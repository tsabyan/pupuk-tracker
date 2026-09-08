/**
 * Kontrak akses data.
 *
 * Semua method async meski implementasi prototype-nya sinkron. Saat backend
 * pindah ke Laravel, cukup ganti implementasi — tidak ada call site di UI
 * yang perlu diubah.
 */

import type {
  Alokasi,
  AspekTepat,
  Database,
  EskalasiKe,
  ItemPupuk,
  JenisTindakLanjut,
  Kesesuaian,
  LaporanPemanfaatan,
  MetodeBayar,
  ObjekPengawasan,
  Pemeriksaan,
  Pengiriman,
  Penyaluran,
  PeriksaAdministrasi,
  PeriksaHarga,
  PeriksaPenerima,
  PeriksaStok,
  SasaranTindakLanjut,
  StatusTindakLanjut,
  Temuan,
  TindakLanjut,
  TingkatTemuan,
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

/**
 * Telaah dokumen satu transaksi oleh pengawas.
 *
 * Bukan persetujuan: status transaksi tidak berubah sama sekali. Yang
 * tersimpan hanya catatan bahwa transaksi ini sudah tersentuh pengawasan
 * dan apa hasilnya.
 */
export interface TelaahPenyaluranInput {
  pengawasId: string
  hasil: 'sesuai' | 'temuan'
  catatan?: string
  /** Temuan yang lahir dari telaah, bila hasilnya `temuan`. */
  temuan?: Array<{ aspek: AspekTepat; uraian: string; tingkat: TingkatTemuan }>
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

export interface BuatPemeriksaanInput {
  pengawasId: string
  objekTipe: ObjekPengawasan
  objekId: string
  tanggal: string
  pendamping: string[]
  sampelPenyaluranIds: string[]
  stok: PeriksaStok[]
  harga: PeriksaHarga[]
  penerima: PeriksaPenerima[]
  administrasi: PeriksaAdministrasi[]
  /** Temuan yang tidak terbaca dari angka, diketik pengawas. */
  temuanTambahan: Array<{ aspek: AspekTepat; uraian: string; tingkat: TingkatTemuan }>
  catatan?: string
  ttdPengawas?: string
  ttdObjek?: string
}

export interface BuatTemuanInput {
  aspek: AspekTepat
  uraian: string
  tingkat: TingkatTemuan
  objekTipe: ObjekPengawasan
  objekId: string
  sumber: Temuan['sumber']
  sumberId: string
  tanggal: string
}

export interface BuatTindakLanjutInput {
  pengawasId: string
  jenis: JenisTindakLanjut
  sasaranTipe: SasaranTindakLanjut
  sasaranId: string
  /** Temuan yang hendak ditutup oleh tindak lanjut ini. */
  temuanIds: string[]
  judul: string
  isi: string
  tanggal: string
  tenggat: string
}

/** Perkembangan pelaksanaan — inilah yang menutup lingkaran pengawasan. */
export interface PerbaruiTindakLanjutInput {
  status: StatusTindakLanjut
  buktiPelaksanaan?: string
  eskalasiKe?: EskalasiKe
}

export interface DataRepo {
  muat(): Promise<Database>
  resetDemo(): Promise<Database>

  buatAlokasi(input: BuatAlokasiInput): Promise<Alokasi>
  buatPengiriman(input: BuatPengirimanInput): Promise<Pengiriman>
  konfirmasiPengiriman(id: string, input: KonfirmasiPengirimanInput): Promise<Pengiriman>

  buatPenyaluran(input: BuatPenyaluranInput): Promise<Penyaluran>
  konfirmasiPenyaluran(id: string, input: KonfirmasiPenyaluranInput): Promise<Penyaluran>

  buatPemanfaatan(input: BuatPemanfaatanInput): Promise<LaporanPemanfaatan>

  telaahPenyaluran(id: string, input: TelaahPenyaluranInput): Promise<Penyaluran>
  buatPemeriksaan(input: BuatPemeriksaanInput): Promise<Pemeriksaan>
  buatTemuan(input: BuatTemuanInput): Promise<Temuan>
  buatTindakLanjut(input: BuatTindakLanjutInput): Promise<TindakLanjut>
  perbaruiTindakLanjut(
    id: string,
    input: PerbaruiTindakLanjutInput,
  ): Promise<TindakLanjut>

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
