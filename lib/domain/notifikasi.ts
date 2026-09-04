/**
 * Aturan notifikasi: satu peristiwa di rantai distribusi → siapa yang
 * perlu tahu, dan pesan apa yang mereka lihat.
 *
 * Fungsi di sini murni: menghasilkan draft notifikasi, bukan menyimpannya.
 */

import type {
  Pengiriman,
  Penyaluran,
  Role,
  TindakLanjut,
  TipeNotifikasi,
  User,
} from './types'

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
      tautan: `/kp3/validasi`,
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

/** Ketua poktan menandatangani — flowchart Kelompok Tani #3. */
export function saatPenyaluranDikonfirmasi(
  p: Penyaluran,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  const poktan = ctx.namaPoktan(p.poktanId)
  return [
    ...untukSemua(ctx.penggunaDari('pengecer', p.pengecerId), {
      tipe: 'penyaluran_dikonfirmasi',
      judul: 'Penyaluran dikonfirmasi',
      pesan: `${poktan} sudah mengonfirmasi penerimaan transaksi ${p.noTransaksi}.`,
      tautan: `/pengecer/penyaluran/${p.id}`,
    }),
    ...untukSemua(ctx.semuaPengawas(), {
      tipe: 'penyaluran_dikonfirmasi',
      judul: 'Transaksi menunggu validasi',
      pesan: `Penyaluran ${p.noTransaksi} ke ${poktan} siap divalidasi.`,
      tautan: `/kp3/validasi/${p.id}`,
    }),
  ]
}

/** Pengawas KP3 memutuskan hasil validasi — flowchart Pengawas KP3 #2. */
export function saatPenyaluranDivalidasi(
  p: Penyaluran,
  ctx: KonteksNotif,
): DraftNotifikasi[] {
  const bermasalah = p.status === 'bermasalah'
  const isi = {
    tipe: (bermasalah
      ? 'penyaluran_bermasalah'
      : 'penyaluran_divalidasi') as TipeNotifikasi,
    judul: bermasalah ? 'Penyaluran ditandai bermasalah' : 'Penyaluran tervalidasi',
    pesan: bermasalah
      ? `Pengawas KP3 menemukan ketidaksesuaian pada transaksi ${p.noTransaksi}. ${p.validasi?.catatan ?? ''}`.trim()
      : `Transaksi ${p.noTransaksi} sudah divalidasi Pengawas KP3.`,
    tautan: `/pengecer/penyaluran/${p.id}`,
  }

  const penerima = [
    ...untukSemua(ctx.penggunaDari('pengecer', p.pengecerId), isi),
    ...untukSemua(ctx.penggunaDari('poktan', p.poktanId), {
      ...isi,
      tautan: `/poktan/penerimaan/${p.id}`,
    }),
  ]

  return penerima
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

  const label =
    t.jenis === 'teguran'
      ? 'Teguran dari Pengawas KP3'
      : t.jenis === 'rekomendasi'
        ? 'Rekomendasi dari Pengawas KP3'
        : 'Penghargaan dari Pengawas KP3'

  return untukSemua(ctx.penggunaDari(role, t.sasaranId), {
    tipe: 'tindak_lanjut',
    judul: label,
    pesan: t.judul,
    tautan: '/notifikasi',
  })
}
