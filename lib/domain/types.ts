/**
 * Tipe domain aplikasi pengawasan pupuk bersubsidi.
 *
 * File ini murni TypeScript: tidak boleh mengimpor React, Next, zustand,
 * atau library penyimpanan apa pun. Struktur di sini adalah acuan langsung
 * untuk migration + Model Laravel pada implementasi produksi.
 */

export type Role = 'distributor' | 'pengecer' | 'poktan' | 'kp3'

export const ROLE_LABEL: Record<Role, string> = {
  distributor: 'Distributor',
  pengecer: 'Pengecer Resmi',
  poktan: 'Kelompok Tani',
  kp3: 'Pengawas KP3',
}

/* ------------------------------------------------------------------ */
/* Master data                                                         */
/* ------------------------------------------------------------------ */

export interface Kecamatan {
  id: string
  /** Dua digit terakhir kode wilayah BPS, dipakai pada penyusunan NIK. */
  kode: string
  nama: string
}

export interface Desa {
  id: string
  nama: string
  kecamatanId: string
}

export type SatuanPupuk = 'kg' | 'liter'

export interface JenisPupuk {
  id: string
  kode: string
  nama: string
  satuan: SatuanPupuk
  /** Harga Eceran Tertinggi per satuan, dalam rupiah. */
  het: number
}

export interface Distributor {
  id: string
  kode: string
  nama: string
  produsen: string
  alamat: string
  telepon: string
  /** Wilayah kerja distributor. */
  kecamatanIds: string[]
}

export interface Pengecer {
  id: string
  kode: string
  nama: string
  pemilik: string
  alamat: string
  desaId: string
  distributorId: string
  telepon: string
}

export interface KelompokTani {
  id: string
  kode: string
  nama: string
  ketua: string
  desaId: string
  /** Kios resmi tempat poktan menebus pupuk. */
  pengecerId: string
  jumlahAnggota: number
  luasLahanHa: number
}

export interface Petani {
  id: string
  nik: string
  nama: string
  poktanId: string
  luasLahanHa: number
  komoditas: string
}

export interface Pengawas {
  id: string
  nama: string
  nip: string
  instansi: string
  jabatan: string
  kecamatanIds: string[]
}

export interface User {
  id: string
  nama: string
  email: string
  role: Role
  /** Id entitas yang diwakili: distributor / pengecer / poktan / pengawas. */
  entityId: string
  jabatan: string
}

/* ------------------------------------------------------------------ */
/* RDKK — dasar seluruh hak alokasi                                    */
/* ------------------------------------------------------------------ */

export interface ItemPupuk {
  jenisPupukId: string
  jumlahKg: number
}

export interface Rdkk {
  id: string
  kode: string
  poktanId: string
  musimTanam: string
  tahun: number
  /** Hak tebus poktan per jenis pupuk untuk satu musim tanam. */
  items: ItemPupuk[]
  disahkanPada: string
}

/* ------------------------------------------------------------------ */
/* Alokasi & Pengiriman (Distributor)                                  */
/* ------------------------------------------------------------------ */

export type StatusAlokasi = 'draft' | 'aktif'

export interface AlokasiRincian {
  pengecerId: string
  items: ItemPupuk[]
}

export interface Alokasi {
  id: string
  kode: string
  distributorId: string
  musimTanam: string
  tahun: number
  kecamatanId: string
  periodeMulai: string
  periodeSelesai: string
  rincian: AlokasiRincian[]
  status: StatusAlokasi
  catatan?: string
  dibuatPada: string
}

export type StatusPengiriman =
  | 'draft'
  | 'dikirim'
  | 'dikonfirmasi'
  | 'selisih'
  | 'ditolak'

export interface ItemPengiriman extends ItemPupuk {
  /** Diisi pengecer saat konfirmasi penerimaan. */
  jumlahDiterimaKg?: number
}

export interface Pengiriman {
  id: string
  kode: string
  noFaktur: string
  noBeritaAcara: string
  distributorId: string
  pengecerId: string
  alokasiId?: string
  tanggalKirim: string
  items: ItemPengiriman[]
  status: StatusPengiriman
  tanggalKonfirmasi?: string
  catatanPengecer?: string
  dibuatPada: string
}

/* ------------------------------------------------------------------ */
/* Penyaluran (Pengecer → Kelompok Tani)                               */
/* ------------------------------------------------------------------ */

export type StatusPenyaluran =
  | 'draft'
  | 'disalurkan'
  | 'dikonfirmasi'
  | 'divalidasi'
  | 'bermasalah'

export interface ItemPenyaluran extends ItemPupuk {
  het: number
  subtotal: number
}

export type MetodeBayar = 'tunai' | 'kartu_tani'

/** Bukti yang diunggah pengecer (flowchart Pengecer Resmi #5). */
export interface BuktiPenyaluran {
  /** Data URL tanda tangan penerima. */
  ttdPenerima?: string
  /** Data URL foto serah terima / struk. */
  fotoStruk?: string
  catatan?: string
}

export type Kesesuaian = 'sesuai' | 'tidak_sesuai'

/** Konfirmasi ketua kelompok tani (flowchart Kelompok Tani #3). */
export interface KonfirmasiPoktan {
  tanggal: string
  /** Data URL tanda tangan ketua poktan. */
  ttdKetua: string
  fotoTerima?: string
  kesesuaian: Kesesuaian
  catatan?: string
}

export type HasilValidasi = 'valid' | 'perlu_verifikasi' | 'tidak_valid'

export interface HasilValidasiPenyaluran {
  pengawasId: string
  tanggal: string
  hasil: HasilValidasi
  catatan?: string
}

export interface Penyaluran {
  id: string
  kode: string
  noTransaksi: string
  pengecerId: string
  poktanId: string
  rdkkId: string
  tanggal: string
  items: ItemPenyaluran[]
  total: number
  metodeBayar: MetodeBayar
  status: StatusPenyaluran
  bukti?: BuktiPenyaluran
  konfirmasi?: KonfirmasiPoktan
  validasi?: HasilValidasiPenyaluran
  dibuatPada: string
}

/* ------------------------------------------------------------------ */
/* Pemanfaatan (Kelompok Tani)                                         */
/* ------------------------------------------------------------------ */

export interface LaporanPemanfaatan {
  id: string
  kode: string
  poktanId: string
  penyaluranId?: string
  periode: string
  komoditas: string
  luasTanamHa: number
  dipakai: ItemPupuk[]
  tanggalAplikasi: string
  catatan?: string
  dibuatPada: string
}

/* ------------------------------------------------------------------ */
/* Pengawasan (KP3)                                                    */
/* ------------------------------------------------------------------ */

export type TargetPengawasan = 'pengiriman' | 'penyaluran'

export interface Validasi {
  id: string
  kode: string
  pengawasId: string
  targetTipe: TargetPengawasan
  targetId: string
  hasil: HasilValidasi
  catatan?: string
  tanggal: string
  dibuatPada: string
}

export type LokasiInspeksi = 'pengecer' | 'poktan'
export type KesesuaianInspeksi = 'sesuai' | 'sebagian' | 'tidak_sesuai'

export interface Inspeksi {
  id: string
  kode: string
  pengawasId: string
  lokasiTipe: LokasiInspeksi
  lokasiId: string
  tanggal: string
  temuan: string[]
  kesesuaian: KesesuaianInspeksi
  catatan?: string
  dibuatPada: string
}

export type JenisTindakLanjut = 'teguran' | 'rekomendasi' | 'penghargaan'
export type SasaranTindakLanjut = 'distributor' | 'pengecer' | 'poktan'

export interface TindakLanjut {
  id: string
  kode: string
  pengawasId: string
  jenis: JenisTindakLanjut
  sasaranTipe: SasaranTindakLanjut
  sasaranId: string
  refTipe?: 'validasi' | 'inspeksi'
  refId?: string
  judul: string
  isi: string
  tanggal: string
  dibuatPada: string
}

/* ------------------------------------------------------------------ */
/* Notifikasi                                                          */
/* ------------------------------------------------------------------ */

export type TipeNotifikasi =
  | 'pengiriman_dikirim'
  | 'pengiriman_dikonfirmasi'
  | 'pengiriman_selisih'
  | 'pengiriman_ditolak'
  | 'penyaluran_disalurkan'
  | 'penyaluran_dikonfirmasi'
  | 'penyaluran_divalidasi'
  | 'penyaluran_bermasalah'
  | 'tindak_lanjut'

export interface Notifikasi {
  id: string
  untukUserId: string
  tipe: TipeNotifikasi
  judul: string
  pesan: string
  /** Path tujuan saat notifikasi diklik. */
  tautan: string
  dibaca: boolean
  dibuatPada: string
}

/* ------------------------------------------------------------------ */
/* Bentuk basis data prototype                                         */
/* ------------------------------------------------------------------ */

export interface Database {
  versi: number
  kecamatan: Kecamatan[]
  desa: Desa[]
  jenisPupuk: JenisPupuk[]
  distributor: Distributor[]
  pengecer: Pengecer[]
  kelompokTani: KelompokTani[]
  petani: Petani[]
  pengawas: Pengawas[]
  users: User[]
  rdkk: Rdkk[]
  alokasi: Alokasi[]
  pengiriman: Pengiriman[]
  penyaluran: Penyaluran[]
  laporanPemanfaatan: LaporanPemanfaatan[]
  validasi: Validasi[]
  inspeksi: Inspeksi[]
  tindakLanjut: TindakLanjut[]
  notifikasi: Notifikasi[]
}
