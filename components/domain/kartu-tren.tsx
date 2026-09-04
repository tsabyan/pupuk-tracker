'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { GrafikTren } from '@/components/ui/grafik'
import * as f from '@/lib/domain/format'
import { perubahanTren, totalTren, trenPenyaluranHarian } from '@/lib/domain/tren'
import type { Penyaluran } from '@/lib/domain/types'

const RENTANG_HARI = 30

/**
 * Kartu tren penyaluran harian.
 *
 * Rentangnya berakhir pada transaksi terbaru — bukan tanggal hari ini —
 * supaya data demo tetap terlihat kapan pun prototipe dibuka.
 */
export function KartuTren({
  penyaluran,
  judul = 'Tren penyaluran ke kelompok tani',
  keterangan = `Jumlah pupuk yang sampai ke petani, ${RENTANG_HARI} hari terakhir`,
}: {
  penyaluran: Penyaluran[]
  judul?: string
  keterangan?: string
}) {
  const { tren, total, perubahan } = useMemo(() => {
    const sampai = penyaluran.reduce(
      (maks, p) => (p.tanggal > maks ? p.tanggal : maks),
      f.hariIni(),
    )
    const tren = trenPenyaluranHarian(penyaluran, sampai, RENTANG_HARI)
    return { tren, total: totalTren(tren), perubahan: perubahanTren(tren) }
  }, [penyaluran])

  const naik = perubahan >= 0

  return (
    <Card>
      <CardHeader
        judul={judul}
        keterangan={keterangan}
        aksi={
          <div className="text-right">
            <p className="text-xl font-semibold tracking-tight text-tinta tabular-nums">
              {f.kg(total)}
            </p>
            <Badge tone={naik ? 'sukses' : 'peringatan'} className="mt-1">
              {naik ? '▲' : '▼'} {f.persen(Math.abs(perubahan), 0)} vs paruh awal
            </Badge>
          </div>
        }
      />
      <CardBody className="pt-1">
        <GrafikTren titik={tren} />
      </CardBody>
    </Card>
  )
}
