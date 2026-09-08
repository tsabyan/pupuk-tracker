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

/**
 * Daur hidup penyaluran sepenuhnya milik dua pihak transaksi: kios yang
 * menyerahkan dan kelompok tani yang menerima. Pengawas KP3 TIDAK ada di
 * sini — pengawasan berjalan setelah transaksi selesai dan tidak pernah
 * menahannya (lihat `CatatanPengawasan`).
 */
export type StatusPenyaluran =
  | 'draft'
  | 'disalurkan'
  | 'dikonfirmasi'
  | 'disanggah'

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
  /** Jejak pengawasan KP3 — anotasi, bukan bagian dari daur hidup transaksi. */
  pengawasan?: CatatanPengawasan
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

/**
 * Objek yang dapat diperiksa KP3. Bukan hanya kios: pemeriksaan juga
 * menyasar gudang distributor, kelompok tani, dan petani penerima.
 */
export type ObjekPengawasan = 'distributor' | 'pengecer' | 'poktan' | 'petani'

/**
 * Hasil pengawasan yang menempel pada satu transaksi penyaluran.
 *
 * Ini catatan telaah, bukan persetujuan: transaksi sudah sah sejak
 * dikonfirmasi kelompok tani. Karena KP3 bekerja dengan uji petik,
 * sebagian besar transaksi memang tidak akan pernah punya catatan ini —
 * dan itu bukan tunggakan.
 */
export interface CatatanPengawasan {
  pengawasId: string
  tanggal: string
  /** Terisi bila telaah dilakukan dalam rangka pemeriksaan lapangan. */
  pemeriksaanId?: string
  hasil: 'sesuai' | 'temuan'
  catatan?: string
}

/**
 * Kerangka "tujuh tepat" penyaluran pupuk bersubsidi. Dipakai sebagai
 * kategori baku temuan supaya rekapitulasi lintas periode bisa dibanding.
 */
export type AspekTepat =
  | 'jenis'
  | 'jumlah'
  | 'harga'
  | 'tempat'
  | 'waktu'
  | 'penerima'
  | 'ketentuan'

/* --- Berita acara pemeriksaan --------------------------------------- */

export type KesimpulanPemeriksaan = 'sesuai' | 'sebagian' | 'tidak_sesuai'

/** Butir uji stok: fisik di gudang dibandingkan catatan sistem. */
export interface PeriksaStok {
  jenisPupukId: string
  /** Angka sistem saat pemeriksaan — dihitung, tidak diketik pengawas. */
  sistemKg: number
  /** Hasil hitung fisik di gudang. */
  fisikKg: number
}

/**
 * Butir uji harga. Harga jual diisi dari hasil wawancara petani atau
 * pemeriksaan struk, bukan dari data transaksi — kios yang menjual di
 * atas HET tidak akan melaporkannya sendiri ke sistem.
 */
export interface PeriksaHarga {
  jenisPupukId: string
  het: number
  hargaJual: number
  /**
   * Pungutan per satuan di luar harga pupuk (ongkos angkut, biaya
   * administrasi). Dipisah dari `hargaJual` supaya modus "harga sesuai HET
   * tetapi ada biaya tambahan" tetap tercatat sebagai temuan sendiri.
   */
  biayaTambahan: number
  keterangan?: string
}

/** Butir verifikasi penerima terhadap RDKK. */
export interface PeriksaPenerima {
  poktanId: string
  /** Terisi bila yang diverifikasi satu petani, bukan kelompoknya. */
  petaniId?: string
  terdaftarRdkk: boolean
  hakKg: number
  ditebusKg: number
}

/** Butir kelengkapan administrasi penyaluran. */
export interface PeriksaAdministrasi {
  butir: string
  ada: boolean
}

/** Daftar butir administrasi baku yang diperiksa di kios dan distributor. */
export const BUTIR_ADMINISTRASI = [
  'Bukti transaksi / penebusan',
  'Data penerima sesuai RDKK',
  'Kartu stok masuk dan keluar',
  'Dokumen pengiriman distributor',
  'Perizinan dan perjanjian kios',
  'Pencatatan penyaluran harian',
] as const

export interface Pemeriksaan {
  id: string
  kode: string
  /** Nomor berita acara pemeriksaan. */
  noBeritaAcara: string
  pengawasId: string
  /** Instansi pendamping — pengawasan KP3 bersifat lintas instansi. */
  pendamping: string[]
  objekTipe: ObjekPengawasan
  objekId: string
  tanggal: string
  /** Transaksi yang diambil sebagai sampel uji petik. */
  sampelPenyaluranIds: string[]
  stok: PeriksaStok[]
  harga: PeriksaHarga[]
  penerima: PeriksaPenerima[]
  administrasi: PeriksaAdministrasi[]
  kesimpulan: KesimpulanPemeriksaan
  catatan?: string
  /** Data URL tanda tangan pada berita acara. */
  ttdPengawas?: string
  ttdObjek?: string
  dibuatPada: string
}

/* --- Temuan --------------------------------------------------------- */

export type SumberTemuan = 'pemeriksaan' | 'penapisan' | 'pengaduan'
export type TingkatTemuan = 'ringan' | 'sedang' | 'berat'
export type StatusTemuan = 'terbuka' | 'ditindaklanjuti' | 'selesai'

/**
 * Satu penyimpangan yang tercatat. Dipisah dari berita acara supaya bisa
 * dilacak sampai tuntas: satu pemeriksaan bisa melahirkan banyak temuan,
 * dan satu tindak lanjut bisa menutup beberapa temuan sekaligus.
 */
export interface Temuan {
  id: string
  kode: string
  sumber: SumberTemuan
  /** Id pemeriksaan, penyaluran, atau pengaduan asal temuan. */
  sumberId: string
  aspek: AspekTepat
  uraian: string
  tingkat: TingkatTemuan
  status: StatusTemuan
  objekTipe: ObjekPengawasan
  objekId: string
  tanggal: string
  tindakLanjutId?: string
  dibuatPada: string
}

/* --- Tindak lanjut -------------------------------------------------- */

export type JenisTindakLanjut =
  | 'teguran'
  | 'rekomendasi'
  | 'pembinaan'
  | 'penghargaan'

export type SasaranTindakLanjut = 'distributor' | 'pengecer' | 'poktan'

/**
 * Daur hidup rekomendasi. Tanpa status pelaksanaan, pengawasan berhenti
 * pada penerbitan surat — dan tidak ada bukti bahwa perbaikannya terjadi.
 */
export type StatusTindakLanjut =
  | 'terbit'
  | 'dalam_proses'
  | 'selesai'
  | 'eskalasi'

export type EskalasiKe = 'dinas' | 'satgas_pangan' | 'aparat_penegak_hukum'

export interface TindakLanjut {
  id: string
  kode: string
  pengawasId: string
  jenis: JenisTindakLanjut
  sasaranTipe: SasaranTindakLanjut
  sasaranId: string
  /** Temuan yang ditutup oleh tindak lanjut ini. */
  temuanIds: string[]
  judul: string
  isi: string
  tanggal: string
  /** Batas waktu perbaikan yang diminta. */
  tenggat: string
  status: StatusTindakLanjut
  /** Keterangan pelaksanaan yang dilaporkan atau diverifikasi pengawas. */
  buktiPelaksanaan?: string
  tanggalSelesai?: string
  eskalasiKe?: EskalasiKe
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
  | 'penyaluran_disanggah'
  | 'hasil_pemeriksaan'
  | 'temuan_pengawasan'
  | 'tindak_lanjut'
  | 'tindak_lanjut_jatuh_tempo'

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
  pemeriksaan: Pemeriksaan[]
  temuan: Temuan[]
  tindakLanjut: TindakLanjut[]
  notifikasi: Notifikasi[]
}
