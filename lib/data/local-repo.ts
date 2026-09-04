'use client'

/**
 * Implementasi `DataRepo` di atas store lokal.
 *
 * Setiap aksi menjalankan aturan domain (transisi status, stok, hak RDKK)
 * sebelum menyentuh data — persis seperti yang nanti dilakukan Service di
 * sisi Laravel.
 */

import {
  saatPengirimanDikirim,
  saatPengirimanDikonfirmasi,
  saatPenyaluranDikonfirmasi,
  saatPenyaluranDisalurkan,
  saatPenyaluranDivalidasi,
  saatTindakLanjut,
  type DraftNotifikasi,
} from '@/lib/domain/notifikasi'
import { cekTransisiPengiriman, cekTransisiPenyaluran } from '@/lib/domain/status'
import { hitungSisaHak, sisaStok } from '@/lib/domain/stok'
import type {
  Alokasi,
  Database,
  Inspeksi,
  ItemPenyaluran,
  LaporanPemanfaatan,
  Notifikasi,
  Pengiriman,
  Penyaluran,
  StatusPenyaluran,
  TindakLanjut,
} from '@/lib/domain/types'
import { KesalahanAturan, type DataRepo } from './repository'
import { konteksNotif, pad, urutBerikut } from './konteks'
import { useDbStore } from './store'

const sekarang = () => new Date().toISOString()

function tambahNotif(db: Database, draft: DraftNotifikasi[]): void {
  let urut = urutBerikut(db.notifikasi, 'notif')
  for (const d of draft) {
    db.notifikasi.push({
      id: `notif-${pad(urut++)}`,
      ...d,
      dibaca: false,
      dibuatPada: sekarang(),
    })
  }
}

function terapkan<T>(ubah: (db: Database) => T): T {
  let hasil!: T
  useDbStore.getState().terapkan((db) => {
    hasil = ubah(db)
  })
  return hasil
}

export const localRepo: DataRepo = {
  async muat() {
    return useDbStore.getState().db
  },

  async resetDemo() {
    useDbStore.getState().resetDemo()
    return useDbStore.getState().db
  },

  /* ---------------------------------------------------------------- */
  /* Distributor                                                       */
  /* ---------------------------------------------------------------- */

  async buatAlokasi(input) {
    const bersih = input.rincian
      .map((r) => ({
        pengecerId: r.pengecerId,
        items: r.items.filter((i) => i.jumlahKg > 0),
      }))
      .filter((r) => r.items.length > 0)

    if (bersih.length === 0) {
      throw new KesalahanAturan('Isi minimal satu jumlah pupuk untuk satu pengecer.')
    }

    return terapkan((db) => {
      const urut = urutBerikut(db.alokasi, 'alokasi')
      const alokasi: Alokasi = {
        id: `alokasi-${pad(urut, 3)}`,
        kode: `ALO/${input.musimTanam}/${input.tahun}/${pad(urut, 3)}`,
        distributorId: input.distributorId,
        musimTanam: input.musimTanam,
        tahun: input.tahun,
        kecamatanId: input.kecamatanId,
        periodeMulai: input.periodeMulai,
        periodeSelesai: input.periodeSelesai,
        rincian: bersih,
        status: 'aktif',
        catatan: input.catatan,
        dibuatPada: sekarang(),
      }
      db.alokasi.push(alokasi)
      return alokasi
    })
  },

  async buatPengiriman(input) {
    const items = input.items.filter((i) => i.jumlahKg > 0)
    if (items.length === 0) {
      throw new KesalahanAturan('Isi minimal satu jenis pupuk yang dikirim.')
    }

    return terapkan((db) => {
      const urut = urutBerikut(db.pengiriman, 'kirim')
      const bulan = input.tanggalKirim.slice(5, 7)
      const tahun = input.tanggalKirim.slice(0, 4)

      const pengiriman: Pengiriman = {
        id: `kirim-${pad(urut)}`,
        kode: `KRM-${pad(urut)}`,
        noFaktur: `FK/${tahun}/${bulan}/${pad(urut)}`,
        noBeritaAcara: `BA/${tahun}/${bulan}/${pad(urut)}`,
        distributorId: input.distributorId,
        pengecerId: input.pengecerId,
        alokasiId: input.alokasiId,
        tanggalKirim: input.tanggalKirim,
        items,
        status: 'dikirim',
        dibuatPada: sekarang(),
      }

      db.pengiriman.push(pengiriman)
      tambahNotif(db, saatPengirimanDikirim(pengiriman, konteksNotif(db)))
      return pengiriman
    })
  },

  /* ---------------------------------------------------------------- */
  /* Pengecer                                                          */
  /* ---------------------------------------------------------------- */

  async konfirmasiPengiriman(id, input) {
    return terapkan((db) => {
      const pengiriman = db.pengiriman.find((p) => p.id === id)
      if (!pengiriman) throw new KesalahanAturan('Pengiriman tidak ditemukan.')

      const tujuan = input.tolak
        ? 'ditolak'
        : pengiriman.items.some((item) => {
              const d = input.diterima.find((x) => x.jenisPupukId === item.jenisPupukId)
              return (d?.jumlahDiterimaKg ?? item.jumlahKg) !== item.jumlahKg
            })
          ? 'selisih'
          : 'dikonfirmasi'

      const cek = cekTransisiPengiriman(pengiriman.status, tujuan)
      if (!cek.ok) throw new KesalahanAturan(cek.alasan)

      for (const item of pengiriman.items) {
        const d = input.diterima.find((x) => x.jenisPupukId === item.jenisPupukId)
        const jumlah = input.tolak ? 0 : (d?.jumlahDiterimaKg ?? item.jumlahKg)
        if (jumlah < 0) throw new KesalahanAturan('Jumlah diterima tidak boleh negatif.')
        if (jumlah > item.jumlahKg) {
          throw new KesalahanAturan(
            'Jumlah diterima tidak boleh melebihi jumlah pada faktur.',
          )
        }
        item.jumlahDiterimaKg = jumlah
      }

      if (tujuan === 'selisih' && !input.catatan?.trim()) {
        throw new KesalahanAturan('Isi catatan penyebab selisih jumlah.')
      }
      if (tujuan === 'ditolak' && !input.catatan?.trim()) {
        throw new KesalahanAturan('Isi alasan penolakan kiriman.')
      }

      pengiriman.status = tujuan
      pengiriman.tanggalKonfirmasi = sekarang().slice(0, 10)
      pengiriman.catatanPengecer = input.catatan?.trim() || undefined

      tambahNotif(db, saatPengirimanDikonfirmasi(pengiriman, konteksNotif(db)))
      return pengiriman
    })
  },

  async buatPenyaluran(input) {
    const diminta = input.items.filter((i) => i.jumlahKg > 0)
    if (diminta.length === 0) {
      throw new KesalahanAturan('Isi minimal satu jenis pupuk yang disalurkan.')
    }

    return terapkan((db) => {
      const poktan = db.kelompokTani.find((k) => k.id === input.poktanId)
      if (!poktan) throw new KesalahanAturan('Kelompok tani tidak ditemukan.')

      const rdkk = db.rdkk.find((r) => r.poktanId === input.poktanId)
      if (!rdkk) {
        throw new KesalahanAturan(
          `${poktan.nama} belum memiliki RDKK pada musim tanam ini.`,
        )
      }

      const hak = hitungSisaHak(
        rdkk,
        db.penyaluran.filter((p) => p.poktanId === input.poktanId),
      )

      const items: ItemPenyaluran[] = diminta.map((i) => {
        const jp = db.jenisPupuk.find((j) => j.id === i.jenisPupukId)
        if (!jp) throw new KesalahanAturan('Jenis pupuk tidak dikenal.')

        const sisaHak = hak.find((h) => h.jenisPupukId === i.jenisPupukId)?.sisaKg ?? 0
        if (i.jumlahKg > sisaHak) {
          throw new KesalahanAturan(
            `${jp.nama}: melebihi sisa hak RDKK ${poktan.nama} (sisa ${sisaHak} kg).`,
          )
        }

        const stok = sisaStok(input.pengecerId, i.jenisPupukId, db.pengiriman, db.penyaluran)
        if (i.jumlahKg > stok) {
          throw new KesalahanAturan(`${jp.nama}: stok kios tidak cukup (sisa ${stok} kg).`)
        }

        return {
          jenisPupukId: i.jenisPupukId,
          jumlahKg: i.jumlahKg,
          het: jp.het,
          subtotal: i.jumlahKg * jp.het,
        }
      })

      const kios = db.pengecer.find((p) => p.id === input.pengecerId)
      const urut = urutBerikut(db.penyaluran, 'salur')

      const penyaluran: Penyaluran = {
        id: `salur-${pad(urut)}`,
        kode: `SLR-${pad(urut)}`,
        noTransaksi: `TRX/${kios?.kode ?? 'PR-000'}/${input.tanggal.slice(0, 4)}/${pad(urut)}`,
        pengecerId: input.pengecerId,
        poktanId: input.poktanId,
        rdkkId: rdkk.id,
        tanggal: input.tanggal,
        items,
        total: items.reduce((t, i) => t + i.subtotal, 0),
        metodeBayar: input.metodeBayar,
        status: 'disalurkan',
        bukti: {
          ttdPenerima: input.ttdPenerima,
          fotoStruk: input.fotoStruk,
          catatan: input.catatan?.trim() || undefined,
        },
        dibuatPada: sekarang(),
      }

      db.penyaluran.push(penyaluran)
      tambahNotif(db, saatPenyaluranDisalurkan(penyaluran, konteksNotif(db)))
      return penyaluran
    })
  },

  /* ---------------------------------------------------------------- */
  /* Kelompok Tani                                                     */
  /* ---------------------------------------------------------------- */

  async konfirmasiPenyaluran(id, input) {
    if (!input.ttdKetua) {
      throw new KesalahanAturan('Tanda tangan ketua kelompok tani wajib diisi.')
    }

    return terapkan((db) => {
      const penyaluran = db.penyaluran.find((p) => p.id === id)
      if (!penyaluran) throw new KesalahanAturan('Penyaluran tidak ditemukan.')

      const cek = cekTransisiPenyaluran(penyaluran.status, 'dikonfirmasi')
      if (!cek.ok) throw new KesalahanAturan(cek.alasan)

      if (input.kesesuaian === 'tidak_sesuai' && !input.catatan?.trim()) {
        throw new KesalahanAturan('Jelaskan ketidaksesuaian yang ditemukan.')
      }

      penyaluran.status = 'dikonfirmasi'
      penyaluran.konfirmasi = {
        tanggal: sekarang().slice(0, 10),
        ttdKetua: input.ttdKetua,
        fotoTerima: input.fotoTerima,
        kesesuaian: input.kesesuaian,
        catatan: input.catatan?.trim() || undefined,
      }

      tambahNotif(db, saatPenyaluranDikonfirmasi(penyaluran, konteksNotif(db)))
      return penyaluran
    })
  },

  async buatPemanfaatan(input) {
    if (input.luasTanamHa <= 0) {
      throw new KesalahanAturan('Luas tanam harus lebih dari nol.')
    }
    const dipakai = input.dipakai.filter((i) => i.jumlahKg > 0)
    if (dipakai.length === 0) {
      throw new KesalahanAturan('Isi minimal satu jenis pupuk yang dipakai.')
    }

    return terapkan((db) => {
      const urut = urutBerikut(db.laporanPemanfaatan, 'pemanfaatan')
      const laporan: LaporanPemanfaatan = {
        id: `pemanfaatan-${pad(urut, 3)}`,
        kode: `LPM/${input.tanggalAplikasi.slice(0, 4)}/${pad(urut, 3)}`,
        poktanId: input.poktanId,
        penyaluranId: input.penyaluranId,
        periode: input.periode,
        komoditas: input.komoditas,
        luasTanamHa: input.luasTanamHa,
        dipakai,
        tanggalAplikasi: input.tanggalAplikasi,
        catatan: input.catatan?.trim() || undefined,
        dibuatPada: sekarang(),
      }
      db.laporanPemanfaatan.push(laporan)
      return laporan
    })
  },

  /* ---------------------------------------------------------------- */
  /* Pengawas KP3                                                      */
  /* ---------------------------------------------------------------- */

  async validasiPenyaluran(id, input) {
    return terapkan((db) => {
      const penyaluran = db.penyaluran.find((p) => p.id === id)
      if (!penyaluran) throw new KesalahanAturan('Penyaluran tidak ditemukan.')

      if (penyaluran.status !== 'dikonfirmasi') {
        throw new KesalahanAturan(
          'Hanya penyaluran yang sudah dikonfirmasi kelompok tani yang bisa divalidasi.',
        )
      }
      if (input.hasil === 'tidak_valid' && !input.catatan?.trim()) {
        throw new KesalahanAturan('Isi catatan temuan untuk hasil tidak valid.')
      }

      const tanggal = sekarang().slice(0, 10)

      // "Perlu verifikasi" tidak memindahkan status: transaksi tetap
      // menunggu sampai pengawas turun ke lapangan (flowchart KP3 #2 → #4).
      const tujuan: StatusPenyaluran | null =
        input.hasil === 'valid'
          ? 'divalidasi'
          : input.hasil === 'tidak_valid'
            ? 'bermasalah'
            : null

      if (tujuan) {
        const cek = cekTransisiPenyaluran(penyaluran.status, tujuan)
        if (!cek.ok) throw new KesalahanAturan(cek.alasan)
        penyaluran.status = tujuan
      }

      penyaluran.validasi = {
        pengawasId: input.pengawasId,
        tanggal,
        hasil: input.hasil,
        catatan: input.catatan?.trim() || undefined,
      }

      const urut = urutBerikut(db.validasi, 'validasi')
      db.validasi.push({
        id: `validasi-${pad(urut, 3)}`,
        kode: `VAL/${tanggal.slice(0, 4)}/${pad(urut, 3)}`,
        pengawasId: input.pengawasId,
        targetTipe: 'penyaluran',
        targetId: penyaluran.id,
        hasil: input.hasil,
        catatan: input.catatan?.trim() || undefined,
        tanggal,
        dibuatPada: sekarang(),
      })

      if (tujuan) {
        tambahNotif(db, saatPenyaluranDivalidasi(penyaluran, konteksNotif(db)))
      }
      return penyaluran
    })
  },

  async buatInspeksi(input) {
    const temuan = input.temuan.map((t) => t.trim()).filter(Boolean)
    if (temuan.length === 0) {
      throw new KesalahanAturan('Isi minimal satu temuan hasil inspeksi.')
    }

    return terapkan((db) => {
      const urut = urutBerikut(db.inspeksi, 'inspeksi')
      const inspeksi: Inspeksi = {
        id: `inspeksi-${pad(urut, 3)}`,
        kode: `INS/${input.tanggal.slice(0, 4)}/${pad(urut, 3)}`,
        pengawasId: input.pengawasId,
        lokasiTipe: input.lokasiTipe,
        lokasiId: input.lokasiId,
        tanggal: input.tanggal,
        temuan,
        kesesuaian: input.kesesuaian,
        catatan: input.catatan?.trim() || undefined,
        dibuatPada: sekarang(),
      }
      db.inspeksi.push(inspeksi)
      return inspeksi
    })
  },

  async buatTindakLanjut(input) {
    if (!input.judul.trim() || !input.isi.trim()) {
      throw new KesalahanAturan('Judul dan isi tindak lanjut wajib diisi.')
    }

    return terapkan((db) => {
      const urut = urutBerikut(db.tindakLanjut, 'tindaklanjut')
      const tindak: TindakLanjut = {
        id: `tindaklanjut-${pad(urut, 3)}`,
        kode: `TL/${input.tanggal.slice(0, 4)}/${pad(urut, 3)}`,
        pengawasId: input.pengawasId,
        jenis: input.jenis,
        sasaranTipe: input.sasaranTipe,
        sasaranId: input.sasaranId,
        refTipe: input.refTipe,
        refId: input.refId,
        judul: input.judul.trim(),
        isi: input.isi.trim(),
        tanggal: input.tanggal,
        dibuatPada: sekarang(),
      }
      db.tindakLanjut.push(tindak)
      tambahNotif(db, saatTindakLanjut(tindak, konteksNotif(db)))
      return tindak
    })
  },

  /* ---------------------------------------------------------------- */
  /* Notifikasi                                                        */
  /* ---------------------------------------------------------------- */

  async tandaiNotifikasiDibaca(id) {
    terapkan((db) => {
      const notif = db.notifikasi.find((n: Notifikasi) => n.id === id)
      if (notif) notif.dibaca = true
    })
  },

  async tandaiSemuaNotifikasiDibaca(userId) {
    terapkan((db) => {
      for (const n of db.notifikasi) {
        if (n.untukUserId === userId) n.dibaca = true
      }
    })
  },
}
