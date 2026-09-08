'use client'

/**
 * Implementasi `DataRepo` di atas store lokal.
 *
 * Setiap aksi menjalankan aturan domain (transisi status, stok, hak RDKK)
 * sebelum menyentuh data — persis seperti yang nanti dilakukan Service di
 * sisi Laravel.
 */

import {
  saatPemeriksaan,
  saatPengirimanDikirim,
  saatPengirimanDikonfirmasi,
  saatPenyaluranDikonfirmasi,
  saatPenyaluranDisalurkan,
  saatTindakLanjut,
  saatTindakLanjutDiperbarui,
  type DraftNotifikasi,
} from '@/lib/domain/notifikasi'
import {
  kesimpulanOtomatis,
  temuanDariPemeriksaan,
  type DraftTemuan,
} from '@/lib/domain/pengawasan'
import {
  cekTransisiPengiriman,
  cekTransisiPenyaluran,
  cekTransisiTindakLanjut,
  penyaluranSelesai,
} from '@/lib/domain/status'
import { hitungSisaHak, sisaStok } from '@/lib/domain/stok'
import type {
  Alokasi,
  Database,
  ItemPenyaluran,
  LaporanPemanfaatan,
  Notifikasi,
  ObjekPengawasan,
  Pemeriksaan,
  Pengiriman,
  Penyaluran,
  Temuan,
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

/** Nama entitas objek pengawasan, untuk menyusun uraian temuan. */
function namaObjek(db: Database, tipe: ObjekPengawasan, id: string): string {
  switch (tipe) {
    case 'distributor':
      return db.distributor.find((d) => d.id === id)?.nama ?? id
    case 'pengecer':
      return db.pengecer.find((p) => p.id === id)?.nama ?? id
    case 'poktan':
      return db.kelompokTani.find((k) => k.id === id)?.nama ?? id
    case 'petani':
      return db.petani.find((p) => p.id === id)?.nama ?? id
  }
}

/** Simpan satu temuan dengan penomoran berurutan. */
function catatTemuan(
  db: Database,
  input: Omit<Temuan, 'id' | 'kode' | 'status' | 'dibuatPada'>,
): Temuan {
  const urut = urutBerikut(db.temuan, 'temuan')
  const temuan: Temuan = {
    id: `temuan-${pad(urut, 3)}`,
    kode: `TMN/${input.tanggal.slice(0, 4)}/${pad(urut, 3)}`,
    status: 'terbuka',
    dibuatPada: sekarang(),
    ...input,
  }
  db.temuan.push(temuan)
  return temuan
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

      // Pernyataan penerima yang menentukan status akhir, bukan pengawas.
      const tujuan = input.kesesuaian === 'sesuai' ? 'dikonfirmasi' : 'disanggah'
      const cek = cekTransisiPenyaluran(penyaluran.status, tujuan)
      if (!cek.ok) throw new KesalahanAturan(cek.alasan)

      if (input.kesesuaian === 'tidak_sesuai' && !input.catatan?.trim()) {
        throw new KesalahanAturan('Jelaskan ketidaksesuaian yang ditemukan.')
      }

      penyaluran.status = tujuan
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

  async telaahPenyaluran(id, input) {
    return terapkan((db) => {
      const penyaluran = db.penyaluran.find((p) => p.id === id)
      if (!penyaluran) throw new KesalahanAturan('Penyaluran tidak ditemukan.')

      // Telaah menilai transaksi yang sudah terjadi. Sebelum kelompok tani
      // menyatakan sikapnya, belum ada apa pun untuk ditelaah.
      if (!penyaluranSelesai(penyaluran.status)) {
        throw new KesalahanAturan(
          'Transaksi belum tuntas antara kios dan kelompok tani, jadi belum ada yang bisa ditelaah.',
        )
      }
      if (input.hasil === 'temuan' && !input.temuan?.length) {
        throw new KesalahanAturan('Isi minimal satu temuan bila hasil telaah bertemuan.')
      }

      const tanggal = sekarang().slice(0, 10)

      // Status transaksi TIDAK disentuh: pengawasan hanya menempelkan catatan.
      penyaluran.pengawasan = {
        pengawasId: input.pengawasId,
        tanggal,
        hasil: input.hasil,
        catatan: input.catatan?.trim() || undefined,
      }

      for (const t of input.temuan ?? []) {
        catatTemuan(db, {
          ...t,
          sumber: 'penapisan',
          sumberId: penyaluran.id,
          objekTipe: 'pengecer',
          objekId: penyaluran.pengecerId,
          tanggal,
        })
      }

      return penyaluran
    })
  },

  async buatPemeriksaan(input) {
    if (input.administrasi.length === 0 && input.stok.length === 0) {
      throw new KesalahanAturan('Isi minimal pemeriksaan stok atau kelengkapan administrasi.')
    }
    for (const h of input.harga) {
      if (h.hargaJual < 0 || h.biayaTambahan < 0) {
        throw new KesalahanAturan('Harga dan biaya tambahan tidak boleh negatif.')
      }
    }
    for (const st of input.stok) {
      if (st.fisikKg < 0) throw new KesalahanAturan('Stok fisik tidak boleh negatif.')
    }

    return terapkan((db) => {
      const urut = urutBerikut(db.pemeriksaan, 'periksa')
      const tahun = input.tanggal.slice(0, 4)
      const bulan = input.tanggal.slice(5, 7)

      const pemeriksaan: Pemeriksaan = {
        id: `periksa-${pad(urut, 3)}`,
        kode: `PRK/${tahun}/${pad(urut, 3)}`,
        noBeritaAcara: `BAP/${tahun}/${bulan}/${pad(urut, 3)}`,
        pengawasId: input.pengawasId,
        pendamping: input.pendamping.map((x) => x.trim()).filter(Boolean),
        objekTipe: input.objekTipe,
        objekId: input.objekId,
        tanggal: input.tanggal,
        sampelPenyaluranIds: input.sampelPenyaluranIds,
        stok: input.stok,
        harga: input.harga,
        penerima: input.penerima,
        administrasi: input.administrasi,
        // Diisi di bawah setelah temuan diturunkan.
        kesimpulan: 'sesuai',
        catatan: input.catatan?.trim() || undefined,
        ttdPengawas: input.ttdPengawas,
        ttdObjek: input.ttdObjek,
        dibuatPada: sekarang(),
      }

      const otomatis = temuanDariPemeriksaan(
        pemeriksaan,
        (id) => db.jenisPupuk.find((j) => j.id === id)?.nama ?? id,
        (tipe, id) => namaObjek(db, tipe, id),
      )
      const semua: DraftTemuan[] = [...otomatis, ...input.temuanTambahan]
      pemeriksaan.kesimpulan = kesimpulanOtomatis(semua)

      db.pemeriksaan.push(pemeriksaan)

      for (const t of semua) {
        catatTemuan(db, {
          ...t,
          sumber: 'pemeriksaan',
          sumberId: pemeriksaan.id,
          objekTipe: input.objekTipe,
          objekId: input.objekId,
          tanggal: input.tanggal,
        })
      }

      // Transaksi yang menjadi sampel uji petik ikut tercatat terperiksa.
      for (const id of input.sampelPenyaluranIds) {
        const trx = db.penyaluran.find((p) => p.id === id)
        if (!trx) continue
        trx.pengawasan = {
          pengawasId: input.pengawasId,
          tanggal: input.tanggal,
          pemeriksaanId: pemeriksaan.id,
          hasil: semua.length > 0 ? 'temuan' : 'sesuai',
          catatan: `Uji petik pada pemeriksaan ${pemeriksaan.noBeritaAcara}.`,
        }
      }

      tambahNotif(db, saatPemeriksaan(pemeriksaan, semua.length, konteksNotif(db)))
      return pemeriksaan
    })
  },

  async buatTemuan(input) {
    if (!input.uraian.trim()) throw new KesalahanAturan('Uraian temuan wajib diisi.')
    return terapkan((db) => catatTemuan(db, input))
  },

  async buatTindakLanjut(input) {
    if (!input.judul.trim() || !input.isi.trim()) {
      throw new KesalahanAturan('Judul dan isi tindak lanjut wajib diisi.')
    }
    if (input.tenggat < input.tanggal) {
      throw new KesalahanAturan('Tenggat perbaikan tidak boleh mendahului tanggal terbit.')
    }

    return terapkan((db) => {
      const temuan = input.temuanIds.map((id) => {
        const t = db.temuan.find((x) => x.id === id)
        if (!t) throw new KesalahanAturan('Temuan yang dirujuk tidak ditemukan.')
        if (t.status === 'selesai') {
          throw new KesalahanAturan(`Temuan ${t.kode} sudah dinyatakan selesai.`)
        }
        return t
      })

      const urut = urutBerikut(db.tindakLanjut, 'tindaklanjut')
      const tindak: TindakLanjut = {
        id: `tindaklanjut-${pad(urut, 3)}`,
        kode: `TL/${input.tanggal.slice(0, 4)}/${pad(urut, 3)}`,
        pengawasId: input.pengawasId,
        jenis: input.jenis,
        sasaranTipe: input.sasaranTipe,
        sasaranId: input.sasaranId,
        temuanIds: input.temuanIds,
        judul: input.judul.trim(),
        isi: input.isi.trim(),
        tanggal: input.tanggal,
        tenggat: input.tenggat,
        status: 'terbit',
        dibuatPada: sekarang(),
      }

      db.tindakLanjut.push(tindak)

      // Temuan berhenti "terbuka" begitu ada rekomendasi yang menanganinya.
      for (const t of temuan) {
        t.status = 'ditindaklanjuti'
        t.tindakLanjutId = tindak.id
      }

      tambahNotif(db, saatTindakLanjut(tindak, konteksNotif(db)))
      return tindak
    })
  },

  async perbaruiTindakLanjut(id, input) {
    return terapkan((db) => {
      const tindak = db.tindakLanjut.find((t) => t.id === id)
      if (!tindak) throw new KesalahanAturan('Tindak lanjut tidak ditemukan.')

      const cek = cekTransisiTindakLanjut(tindak.status, input.status)
      if (!cek.ok) throw new KesalahanAturan(cek.alasan)

      if (input.status === 'selesai' && !input.buktiPelaksanaan?.trim()) {
        throw new KesalahanAturan(
          'Isi keterangan pelaksanaan sebagai bukti sebelum menyatakan selesai.',
        )
      }
      if (input.status === 'eskalasi' && !input.eskalasiKe) {
        throw new KesalahanAturan('Pilih instansi tujuan eskalasi.')
      }

      tindak.status = input.status
      tindak.buktiPelaksanaan = input.buktiPelaksanaan?.trim() || tindak.buktiPelaksanaan
      tindak.eskalasiKe = input.eskalasiKe ?? tindak.eskalasiKe

      if (input.status === 'selesai') {
        tindak.tanggalSelesai = sekarang().slice(0, 10)
        // Lingkaran pengawasan baru tertutup di sini: temuannya ikut selesai.
        for (const idTemuan of tindak.temuanIds) {
          const t = db.temuan.find((x) => x.id === idTemuan)
          if (t) t.status = 'selesai'
        }
      }

      tambahNotif(db, saatTindakLanjutDiperbarui(tindak, konteksNotif(db)))
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
