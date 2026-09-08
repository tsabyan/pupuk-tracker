/**
 * Aturan notifikasi: satu peristiwa di rantai distribusi → siapa yang
 * perlu tahu, dan pesan apa yang mereka lihat.
 *
 * Fungsi di sini murni: menghasilkan draft notifikasi, bukan menyimpannya.
 */

import type {
  Pemeriksaan,
  Pengiriman,
  Penyaluran,
  Role,
  TindakLanjut,
  TipeNotifikasi,
  User,
} from './types'
import { tanggal as formatTanggal } from './format'

export interface DraftNotifikasi {
  untukUserId: string
  tipe: TipeNotifikasi
  judul: string
  pesan: string
  tautan: string
}

/** Data pendukung yang dibutuhkan untuk menyusun pesan notifikasi. */
export interface KonteksNotif {
  /** Semua user yang mewakili satu entitas (mis. semua petugas satu kios). */
  penggunaDari: (role: Role, entityId: string) => User[]
  /** Semua user pengawas KP3. */
  semuaPengawas: () => User[]
  namaDistributor: (id: string) => string
  namaPengecer: (id: string) => string
  namaPoktan: (id: string) => string
}

function untukSemua(
  users: User[],
  isi: Omit<DraftNotifikasi, 'untukUserId'>,
): DraftNotifikasi[] {
  return users.map((u) => ({ untukUserId: u.id, ...isi }))
}

/* ------------------------------------------------------------------ */
/* Pengiriman                                                          */
/* ------------------------------------------------------------------ */

/** Distributor menekan "Kirim" — flowchart Distributor #4. */
export function saatPengirimanDikirim(
  p: Pengiriman,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  return untukSemua(ctx.penggunaDari('pengecer', p.pengecerId), {
    tipe: 'pengiriman_dikirim',
    judul: 'Pengiriman pupuk masuk',
    pesan: `${ctx.namaDistributor(p.distributorId)} mengirim pupuk dengan faktur ${p.noFaktur}. Mohon konfirmasi penerimaan.`,
    tautan: `/pengecer/penerimaan/${p.id}`,
  })
}

/** Pengecer mengonfirmasi penerimaan — flowchart Pengecer Resmi #2. */
export function saatPengirimanDikonfirmasi(
  p: Pengiriman,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  const nama = ctx.namaPengecer(p.pengecerId)
  const keDistributor = untukSemua(
    ctx.penggunaDari('distributor', p.distributorId),
    {
      tipe:
        p.status === 'selisih'
          ? 'pengiriman_selisih'
          : p.status === 'ditolak'
            ? 'pengiriman_ditolak'
            : 'pengiriman_dikonfirmasi',
      judul:
        p.status === 'selisih'
          ? 'Penerimaan dengan selisih'
          : p.status === 'ditolak'
            ? 'Pengiriman ditolak'
            : 'Pengiriman dikonfirmasi',
      pesan:
        p.status === 'selisih'
          ? `${nama} menerima faktur ${p.noFaktur} dengan selisih jumlah. Perlu ditinjau.`
          : p.status === 'ditolak'
            ? `${nama} menolak faktur ${p.noFaktur}. ${p.catatanPengecer ?? ''}`.trim()
            : `${nama} sudah mengonfirmasi penerimaan faktur ${p.noFaktur}.`,
      tautan: `/distributor/pengiriman/${p.id}`,
    },
  )

  // Selisih dan penolakan adalah anomali distribusi: pengawas perlu tahu.
  if (p.status === 'dikonfirmasi') return keDistributor

  return [
    ...keDistributor,
    ...untukSemua(ctx.semuaPengawas(), {
      tipe: p.status === 'selisih' ? 'pengiriman_selisih' : 'pengiriman_ditolak',
      judul: 'Anomali pengiriman terdeteksi',
      pesan: `Faktur ${p.noFaktur} ke ${nama} berstatus ${p.status}. Perlu verifikasi.`,
      tautan: `/kp3/objek`,
    }),
  ]
}

/* ------------------------------------------------------------------ */
/* Penyaluran                                                          */
/* ------------------------------------------------------------------ */

/** Pengecer menyalurkan ke poktan — flowchart Kelompok Tani #2. */
export function saatPenyaluranDisalurkan(
  p: Penyaluran,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  return untukSemua(ctx.penggunaDari('poktan', p.poktanId), {
    tipe: 'penyaluran_disalurkan',
    judul: 'Pupuk siap diterima',
    pesan: `${ctx.namaPengecer(p.pengecerId)} menyalurkan pupuk dengan transaksi ${p.noTransaksi}. Mohon cek dan konfirmasi.`,
    tautan: `/poktan/penerimaan/${p.id}`,
  })
}

/**
 * Ketua poktan menandatangani penerimaan — di sini transaksi tuntas.
 *
 * Pengawas KP3 sengaja TIDAK diberi tahu untuk penerimaan yang wajar.
 * Memberi kabar setiap transaksi berarti mengubur satu komisi kabupaten
 * di bawah ribuan pesan per musim; yang perlu sampai ke pengawas hanya
 * transaksi yang disanggah penerimanya.
 */
export function saatPenyaluranDikonfirmasi(
  p: Penyaluran,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  const poktan = ctx.namaPoktan(p.poktanId)
  const disanggah = p.status === 'disanggah'

  const kePengecer = untukSemua(ctx.penggunaDari('pengecer', p.pengecerId), {
    tipe: disanggah ? 'penyaluran_disanggah' : 'penyaluran_dikonfirmasi',
    judul: disanggah ? 'Penyaluran disanggah kelompok tani' : 'Penyaluran dikonfirmasi',
    pesan: disanggah
      ? `${poktan} menyatakan penerimaan transaksi ${p.noTransaksi} tidak sesuai. ${p.konfirmasi?.catatan ?? ''}`.trim()
      : `${poktan} sudah mengonfirmasi penerimaan transaksi ${p.noTransaksi}.`,
    tautan: `/pengecer/penyaluran/${p.id}`,
  })

  if (!disanggah) return kePengecer

  return [
    ...kePengecer,
    ...untukSemua(ctx.semuaPengawas(), {
      tipe: 'penyaluran_disanggah',
      judul: 'Sanggahan kelompok tani',
      pesan: `${poktan} menyanggah transaksi ${p.noTransaksi} dari ${ctx.namaPengecer(p.pengecerId)}. Layak dijadikan objek pemeriksaan.`,
      tautan: `/kp3/objek/${p.id}`,
    }),
  ]
}

/* ------------------------------------------------------------------ */
/* Pemeriksaan lapangan                                                */
/* ------------------------------------------------------------------ */

/** Peran yang mewakili objek pemeriksaan, bila ada penggunanya di aplikasi. */
function roleObjek(tipe: Pemeriksaan['objekTipe']): Role | null {
  return tipe === 'petani' ? null : tipe
}

/**
 * Berita acara pemeriksaan ditutup.
 *
 * Pihak yang diperiksa selalu diberi salinan hasilnya — itu bagian dari
 * berita acara, bukan kemurahan hati sistem.
 */
export function saatPemeriksaan(
  p: Pemeriksaan,
  jumlahTemuan: number,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  const role = roleObjek(p.objekTipe)
  if (!role) return []

  const ringkas =
    jumlahTemuan > 0
      ? `${jumlahTemuan} temuan dicatat pada berita acara ${p.noBeritaAcara}.`
      : `Tidak ada temuan. Berita acara ${p.noBeritaAcara} sudah diterbitkan.`

  return untukSemua(ctx.penggunaDari(role, p.objekId), {
    tipe: jumlahTemuan > 0 ? 'temuan_pengawasan' : 'hasil_pemeriksaan',
    judul: jumlahTemuan > 0 ? 'Temuan hasil pemeriksaan KP3' : 'Hasil pemeriksaan KP3',
    pesan: ringkas,
    tautan: '/notifikasi',
  })
}

/* ------------------------------------------------------------------ */
/* Tindak lanjut                                                       */
/* ------------------------------------------------------------------ */

/** Pengawas menerbitkan teguran / rekomendasi / penghargaan — KP3 #5. */
export function saatTindakLanjut(
  t: TindakLanjut,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  const role: Role =
    t.sasaranTipe === 'distributor'
      ? 'distributor'
      : t.sasaranTipe === 'pengecer'
        ? 'pengecer'
        : 'poktan'

  const label = {
    teguran: 'Teguran dari Pengawas KP3',
    rekomendasi: 'Rekomendasi dari Pengawas KP3',
    pembinaan: 'Pembinaan dari Pengawas KP3',
    penghargaan: 'Penghargaan dari Pengawas KP3',
  }[t.jenis]

  const tenggat =
    t.jenis === 'penghargaan'
      ? ''
      : ` Batas waktu perbaikan: ${formatTanggal(t.tenggat)}.`

  return untukSemua(ctx.penggunaDari(role, t.sasaranId), {
    tipe: 'tindak_lanjut',
    judul: label,
    pesan: `${t.judul}.${tenggat}`,
    tautan: '/notifikasi',
  })
}

/** Pengawas memindahkan status pelaksanaan tindak lanjut. */
export function saatTindakLanjutDiperbarui(
  t: TindakLanjut,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  const role: Role =
    t.sasaranTipe === 'distributor'
      ? 'distributor'
      : t.sasaranTipe === 'pengecer'
        ? 'pengecer'
        : 'poktan'

  const pesan = {
    terbit: `${t.kode} kembali berstatus terbit.`,
    dalam_proses: `${t.kode} tercatat sedang dikerjakan.`,
    selesai: `${t.kode} dinyatakan selesai dan diverifikasi pengawas.`,
    eskalasi: `${t.kode} dieskalasi karena belum ditindaklanjuti.`,
  }[t.status]

  return untukSemua(ctx.penggunaDari(role, t.sasaranId), {
    tipe: t.status === 'eskalasi' ? 'tindak_lanjut_jatuh_tempo' : 'tindak_lanjut',
    judul: 'Perkembangan tindak lanjut',
    pesan,
    tautan: '/notifikasi',
  })
}
