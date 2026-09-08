'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { TombolTautan } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Kosong, PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import { RincianPenyaluran } from '@/components/domain/rincian-penyaluran'
import { useDb, usePencari } from '@/lib/hooks'

export default function DetailPenyaluranPengecer() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()

  const penyaluran = useMemo(() => db.penyaluran.find((p) => p.id === id), [db, id])

  if (!penyaluran) {
    return (
      <Card>
        <Kosong
          judul="Penyaluran tidak ditemukan"
          aksi={<TombolTautan href="/pengecer/penyaluran">Kembali ke daftar</TombolTautan>}
        />
      </Card>
    )
  }

  return (
    <>
      <TautanKembali href="/pengecer/penyaluran">Penyaluran</TautanKembali>
      <PageHeader
        judul={penyaluran.noTransaksi}
        keterangan={`Penerima: ${cari.namaPoktan(penyaluran.poktanId)}`}
        aksi={<BadgePenyaluran status={penyaluran.status} />}
      />

      {penyaluran.status === 'disanggah' ? (
        <Peringatan nada="bahaya">
          Kelompok tani menyanggah penerimaan transaksi ini.
          {penyaluran.konfirmasi?.catatan ? ` ${penyaluran.konfirmasi.catatan}` : ''}
        </Peringatan>
      ) : null}
      {penyaluran.pengawasan?.hasil === 'temuan' ? (
        <Peringatan nada="peringatan">
          Pengawas KP3 mencatat temuan pada transaksi ini.
          {penyaluran.pengawasan.catatan ? ` ${penyaluran.pengawasan.catatan}` : ''}
        </Peringatan>
      ) : null}
      {penyaluran.status === 'disalurkan' ? (
        <Peringatan nada="info">
          Menunggu ketua {cari.namaPoktan(penyaluran.poktanId)} mengonfirmasi penerimaan.
          Transaksi tuntas begitu konfirmasi itu masuk.
        </Peringatan>
      ) : null}

      <RincianPenyaluran penyaluran={penyaluran} />
    </>
  )
}
