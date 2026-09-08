/**
 * Aturan pengawasan KP3.
 *
 * Dua hal yang dikerjakan di sini:
 *
 * 1. **Penapisan** — memeriksa satu transaksi terhadap kerangka tujuh
 *    tepat memakai data yang sudah ada di sistem. Hasilnya bukan
 *    keputusan sah/tidak sah, melainkan alasan mengapa sebuah transaksi
 *    layak dipilih menjadi objek pemeriksaan. KP3 mengawasi dengan uji
 *    petik; penapisan inilah yang membuat uji petiknya terarah.
 *
 * 2. **Penurunan temuan** — mengubah butir berita acara pemeriksaan
 *    (selisih stok, harga di atas HET, penerima di luar RDKK, dokumen
 *    tidak lengkap) menjadi temuan yang bisa dilacak sampai tuntas.
 *
 * Murni TypeScript: tidak ada React, Next, atau penyimpanan di sini.
 */

import type {
  AspekTepat,
  KelompokTani,
  KesimpulanPemeriksaan,
  Pemeriksaan,
  Penyaluran,
  Rdkk,
  Temuan,
  TingkatTemuan,
} from './types'
import { kg as formatKg, rupiah } from './format'
import { penyaluranKeluar } from './status'
import type { Tone } from './status'
import { hitungSisaHak } from './stok'

/* ------------------------------------------------------------------ */
/* Label                                                               */
/* ------------------------------------------------------------------ */

export const LABEL_ASPEK: Record<AspekTepat, string> = {
  jenis: 'Tepat jenis',
  jumlah: 'Tepat jumlah',
  harga: 'Tepat harga',
  tempat: 'Tepat tempat',
  waktu: 'Tepat waktu',
  penerima: 'Tepat penerima',
  ketentuan: 'Sesuai ketentuan',
}

export const LABEL_TINGKAT: Record<TingkatTemuan, string> = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  berat: 'Berat',
}

export const NADA_TINGKAT: Record<TingkatTemuan, Tone> = {
  ringan: 'netral',
  sedang: 'peringatan',
  berat: 'bahaya',
}

export const LABEL_STATUS_TEMUAN: Record<Temuan['status'], string> = {
  terbuka: 'Terbuka',
  ditindaklanjuti: 'Ditindaklanjuti',
  selesai: 'Selesai',
}

export const NADA_STATUS_TEMUAN: Record<Temuan['status'], Tone> = {
  terbuka: 'bahaya',
  ditindaklanjuti: 'peringatan',
  selesai: 'sukses',
}

export const LABEL_OBJEK: Record<Pemeriksaan['objekTipe'], string> = {
  distributor: 'Distributor',
  pengecer: 'Pengecer resmi',
  poktan: 'Kelompok tani',
  petani: 'Petani penerima',
}

export const LABEL_KESIMPULAN: Record<KesimpulanPemeriksaan, string> = {
  sesuai: 'Sesuai',
  sebagian: 'Sesuai sebagian',
  tidak_sesuai: 'Tidak sesuai',
}

export const NADA_KESIMPULAN: Record<KesimpulanPemeriksaan, Tone> = {
  sesuai: 'sukses',
  sebagian: 'peringatan',
  tidak_sesuai: 'bahaya',
}

/* ------------------------------------------------------------------ */
/* Penapisan tujuh tepat                                               */
/* ------------------------------------------------------------------ */

export interface ButirPenapisan {
  aspek: AspekTepat
  label: string
  lolos: boolean
  /** Alasan bila tidak lolos, atau catatan batas keandalan pemeriksaan. */
  keterangan?: string
}

export interface KonteksPenapisan {
  poktan: KelompokTani | undefined
  rdkk: Rdkk | undefined
  /** Seluruh penyaluran ke poktan yang sama, untuk hitung penebusan kumulatif. */
  penyaluranPoktan: Penyaluran[]
  het: (jenisPupukId: string) => number
  namaPupuk: (jenisPupukId: string) => string
  /** Tanggal acuan pemeriksaan, format "YYYY-MM-DD". */
  hariIni: string
}

/**
 * Uji satu transaksi terhadap tujuh tepat memakai data sistem.
 *
 * Butir yang tidak lolos adalah alasan untuk turun ke lapangan, bukan
 * pembatalan transaksi. Perhatikan butir "tepat harga": dari data sistem
 * yang bisa diuji hanya kebenaran hitungannya, karena harga yang
 * tercatat memang selalu HET. Harga jual sebenarnya hanya terbukti dari
 * pemeriksaan lapangan atau pengaduan petani.
 */
export function penapisanPenyaluran(
  p: Penyaluran,
  ctx: KonteksPenapisan,
): ButirPenapisan[] {
  const jenisRdkk = new Set(ctx.rdkk?.items.map((i) => i.jenisPupukId) ?? [])
  const diluarRdkk = p.items.filter((i) => !jenisRdkk.has(i.jenisPupukId))

  const hak = hitungSisaHak(ctx.rdkk, ctx.penyaluranPoktan)
  const lebihHak = hak.filter((h) => h.ditebusKg > h.hakKg)

  const hitunganBenar = p.items.every(
    (i) => i.het === ctx.het(i.jenisPupukId) && i.subtotal === i.jumlahKg * i.het,
  )
  const totalBenar = p.total === p.items.reduce((t, i) => t + i.subtotal, 0)

  const kiosBinaan = !ctx.poktan || ctx.poktan.pengecerId === p.pengecerId

  return [
    {
      aspek: 'jenis',
      label: 'Jenis pupuk termasuk dalam RDKK kelompok tani',
      lolos: ctx.rdkk ? diluarRdkk.length === 0 : false,
      keterangan: !ctx.rdkk
        ? 'Kelompok tani tidak punya RDKK pada musim tanam ini.'
        : diluarRdkk.length > 0
          ? `Di luar RDKK: ${diluarRdkk.map((i) => ctx.namaPupuk(i.jenisPupukId)).join(', ')}.`
          : undefined,
    },
    {
      aspek: 'jumlah',
      label: 'Kelompok tani tidak menyanggah jumlah yang diterima',
      lolos: p.konfirmasi ? p.konfirmasi.kesesuaian === 'sesuai' : false,
      keterangan: !p.konfirmasi
        ? 'Belum dikonfirmasi kelompok tani.'
        : p.konfirmasi.kesesuaian === 'tidak_sesuai'
          ? (p.konfirmasi.catatan ?? 'Kelompok tani menyatakan tidak sesuai.')
          : undefined,
    },
    {
      aspek: 'harga',
      label: 'Nilai transaksi konsisten dengan HET',
      lolos: hitunganBenar && totalBenar,
      keterangan:
        'Dari data sistem hanya kebenaran hitungan yang teruji. Harga jual sebenarnya perlu dicek di lapangan.',
    },
    {
      aspek: 'tempat',
      label: 'Disalurkan oleh kios penyalur resmi kelompok tani',
      lolos: kiosBinaan,
      keterangan: kiosBinaan
        ? undefined
        : 'Kios bukan penyalur resmi kelompok tani ini.',
    },
    {
      aspek: 'waktu',
      label: 'Tanggal transaksi wajar dan tidak mendahului sistem',
      lolos: p.tanggal <= ctx.hariIni,
      keterangan: p.tanggal <= ctx.hariIni ? undefined : 'Tanggal transaksi di masa depan.',
    },
    {
      aspek: 'penerima',
      label: 'Penebusan kumulatif tidak melebihi hak RDKK',
      lolos: lebihHak.length === 0,
      keterangan:
        lebihHak.length > 0
          ? lebihHak
              .map(
                (h) =>
                  `${ctx.namaPupuk(h.jenisPupukId)} ditebus ${h.ditebusKg} kg dari hak ${h.hakKg} kg`,
              )
              .join('; ')
          : undefined,
    },
    {
      aspek: 'ketentuan',
      label: 'Bukti serah terima lengkap dua pihak',
      lolos: Boolean(p.bukti?.ttdPenerima) && Boolean(p.konfirmasi?.ttdKetua),
      keterangan:
        !p.bukti?.ttdPenerima || !p.konfirmasi?.ttdKetua
          ? [
              p.bukti?.ttdPenerima ? null : 'tanda tangan penerima di kios belum ada',
              p.konfirmasi?.ttdKetua ? null : 'tanda tangan ketua kelompok tani belum ada',
            ]
              .filter(Boolean)
              .join('; ')
          : undefined,
    },
  ]
}

/** Butir penapisan yang tidak lolos — alasan menjadikannya objek pemeriksaan. */
export function penandaPenapisan(butir: ButirPenapisan[]): ButirPenapisan[] {
  return butir.filter((b) => !b.lolos)
}

/* ------------------------------------------------------------------ */
/* Penurunan temuan dari berita acara                                  */
/* ------------------------------------------------------------------ */

export interface DraftTemuan {
  aspek: AspekTepat
  uraian: string
  tingkat: TingkatTemuan
}

/** Tingkat selisih stok dinilai dari besar simpangannya, bukan angka mutlak. */
function tingkatSelisih(selisih: number, acuan: number): TingkatTemuan {
  if (acuan <= 0) return selisih === 0 ? 'ringan' : 'berat'
  const rasio = Math.abs(selisih) / acuan
  if (rasio > 0.1) return 'berat'
  if (rasio > 0.02) return 'sedang'
  return 'ringan'
}

/**
 * Temuan yang lahir sendiri dari butir berita acara.
 *
 * Pengawas tidak perlu menuliskannya ulang: selisih stok, harga di atas
 * HET, penerima di luar RDKK, dan dokumen yang tidak ada langsung menjadi
 * temuan berkategori. Yang tinggal diketik pengawas hanyalah temuan yang
 * memang tidak terbaca dari angka.
 */
export function temuanDariPemeriksaan(
  p: Pemeriksaan,
  namaPupuk: (id: string) => string,
  namaObjek: (tipe: Pemeriksaan['objekTipe'], id: string) => string,
): DraftTemuan[] {
  const hasil: DraftTemuan[] = []

  for (const s of p.stok) {
    const selisih = s.fisikKg - s.sistemKg
    if (selisih === 0) continue
    hasil.push({
      aspek: 'jumlah',
      uraian: `Stok fisik ${namaPupuk(s.jenisPupukId)} ${
        selisih < 0 ? 'kurang' : 'lebih'
      } ${formatKg(Math.abs(selisih))} dari catatan sistem (fisik ${formatKg(s.fisikKg)}, sistem ${formatKg(s.sistemKg)}).`,
      tingkat: tingkatSelisih(selisih, s.sistemKg),
    })
  }

  for (const h of p.harga) {
    if (h.hargaJual > h.het) {
      const lebih = h.hargaJual - h.het
      hasil.push({
        aspek: 'harga',
        uraian: `${namaPupuk(h.jenisPupukId)} dijual ${rupiah(h.hargaJual)} per satuan, ${rupiah(lebih)} di atas HET ${rupiah(h.het)}.`,
        tingkat: lebih > h.het * 0.1 ? 'berat' : 'sedang',
      })
    }
    if (h.biayaTambahan > 0) {
      hasil.push({
        aspek: 'harga',
        uraian: `Pungutan tambahan ${rupiah(h.biayaTambahan)} per satuan di luar harga ${namaPupuk(h.jenisPupukId)}.${
          h.keterangan ? ` ${h.keterangan}` : ''
        }`,
        tingkat: 'sedang',
      })
    }
  }

  for (const v of p.penerima) {
    const nama = namaObjek('poktan', v.poktanId)
    if (!v.terdaftarRdkk) {
      hasil.push({
        aspek: 'penerima',
        uraian: `Penerima pada ${nama} tidak terdaftar dalam RDKK musim tanam berjalan.`,
        tingkat: 'berat',
      })
      continue
    }
    if (v.ditebusKg > v.hakKg) {
      hasil.push({
        aspek: 'penerima',
        uraian: `${nama} menebus ${formatKg(v.ditebusKg)}, melebihi hak RDKK ${formatKg(v.hakKg)}.`,
        tingkat: 'sedang',
      })
    }
  }

  const dokumenKurang = p.administrasi.filter((a) => !a.ada)
  if (dokumenKurang.length > 0) {
    hasil.push({
      aspek: 'ketentuan',
      // Butirnya tidak di-lowercase: sebagian memuat singkatan (RDKK) yang
      // berubah arti bila dikecilkan.
      uraian: `Administrasi penyaluran tidak lengkap — ${dokumenKurang
        .map((a) => a.butir)
        .join('; ')}.`,
      tingkat: dokumenKurang.length > 2 ? 'sedang' : 'ringan',
    })
  }

  return hasil
}

/** Kesimpulan berita acara mengikuti temuan terberat yang ditemukan. */
export function kesimpulanOtomatis(temuan: DraftTemuan[]): KesimpulanPemeriksaan {
  if (temuan.some((t) => t.tingkat === 'berat')) return 'tidak_sesuai'
  if (temuan.length > 0) return 'sebagian'
  return 'sesuai'
}

/* ------------------------------------------------------------------ */
/* Rekap                                                               */
/* ------------------------------------------------------------------ */

export interface RekapAspek {
  aspek: AspekTepat
  total: number
  /** Belum dinyatakan selesai — termasuk yang sedang ditindaklanjuti. */
  belumTuntas: number
  berat: number
}

/** Sebaran temuan per aspek tujuh tepat, aspek terbanyak di atas. */
export function rekapTemuan(temuan: Temuan[]): RekapAspek[] {
  const urutan = Object.keys(LABEL_ASPEK) as AspekTepat[]
  return urutan
    .map((aspek) => {
      const milik = temuan.filter((t) => t.aspek === aspek)
      return {
        aspek,
        total: milik.length,
        belumTuntas: milik.filter((t) => t.status !== 'selesai').length,
        berat: milik.filter((t) => t.tingkat === 'berat').length,
      }
    })
    .sort((a, b) => b.total - a.total)
}

/**
 * Cakupan pengawasan: bagian transaksi selesai yang sudah tersentuh
 * telaah atau pemeriksaan.
 *
 * Ini pengganti "antrian validasi". Angka di bawah 100% adalah hal wajar
 * pada pengawasan uji petik — yang dibaca pengawas adalah apakah
 * cakupannya memadai, bukan apakah antriannya habis.
 */
export function cakupanPengawasan(penyaluran: Penyaluran[]): {
  selesai: number
  diperiksa: number
  rasio: number
} {
  const selesai = penyaluran.filter((p) => penyaluranKeluar(p.status) && p.konfirmasi)
  const diperiksa = selesai.filter((p) => p.pengawasan).length
  return {
    selesai: selesai.length,
    diperiksa,
    rasio: selesai.length > 0 ? diperiksa / selesai.length : 0,
  }
}
