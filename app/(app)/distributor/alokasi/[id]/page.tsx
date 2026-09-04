'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { BarisRingkas, Kosong, PageHeader, TautanKembali } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import * as f from '@/lib/domain/format'
import { totalKg } from '@/lib/domain/stok'
import { useDb, usePencari } from '@/lib/hooks'

export default function DetailAlokasi() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()

  const alokasi = useMemo(() => db.alokasi.find((a) => a.id === id), [db, id])

  if (!alokasi) {
    return (
      <Card>
        <Kosong
          judul="Rencana alokasi tidak ditemukan"
          aksi={<TombolTautan href="/distributor/alokasi">Kembali ke daftar</TombolTautan>}
        />
      </Card>
    )
  }

  const total = alokasi.rincian.reduce((t, r) => t + totalKg(r.items), 0)

  return (
    <>
      <TautanKembali href="/distributor/alokasi">Rencana Alokasi</TautanKembali>
      <PageHeader
        judul={alokasi.kode}
        keterangan={`Kecamatan ${cari.namaKecamatan(alokasi.kecamatanId)} · ${alokasi.musimTanam} ${alokasi.tahun}`}
        aksi={
          <TombolTautan
            href={`/distributor/pengiriman/baru?alokasi=${alokasi.id}`}
            varian="utama"
          >
            Kirim dari alokasi ini
          </TombolTautan>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader
            judul="Rincian per pengecer resmi"
            keterangan={`${alokasi.rincian.length} kios · total ${f.kg(total)}`}
          />
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Pengecer</Th>
                  {db.jenisPupuk.map((jp) => (
                    <Th key={jp.id} numerik>
                      {jp.kode}
                    </Th>
                  ))}
                  <Th numerik>Total</Th>
                </tr>
              </thead>
              <tbody>
                {alokasi.rincian.map((r) => {
                  const kios = cari.pengecer(r.pengecerId)
                  return (
                    <Tr key={r.pengecerId}>
                      <Td>
                        <p className="font-medium text-neutral-900">{kios?.nama}</p>
                        <p className="text-xs text-neutral-500">
                          Desa {cari.namaDesa(kios?.desaId ?? '')}
                        </p>
                      </Td>
                      {db.jenisPupuk.map((jp) => {
                        const item = r.items.find((i) => i.jenisPupukId === jp.id)
                        return (
                          <Td key={jp.id} numerik>
                            {item ? f.angka(item.jumlahKg) : '—'}
                          </Td>
                        )
                      })}
                      <Td numerik className="font-medium">
                        {f.angka(totalKg(r.items))}
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50/80">
                  <Td className="font-semibold">Total</Td>
                  {db.jenisPupuk.map((jp) => (
                    <Td key={jp.id} numerik className="font-semibold">
                      {f.angka(
                        alokasi.rincian.reduce(
                          (t, r) =>
                            t +
                            (r.items.find((i) => i.jenisPupukId === jp.id)?.jumlahKg ?? 0),
                          0,
                        ),
                      )}
                    </Td>
                  ))}
                  <Td numerik className="font-semibold">
                    {f.angka(total)}
                  </Td>
                </tr>
              </tfoot>
            </Tabel>
          </TabelWadah>
        </Card>

        <Card className="h-fit">
          <CardHeader judul="Keterangan" />
          <CardBody>
            <dl>
              <BarisRingkas label="Musim tanam">
                {alokasi.musimTanam} {alokasi.tahun}
              </BarisRingkas>
              <BarisRingkas label="Wilayah">
                Kec. {cari.namaKecamatan(alokasi.kecamatanId)}
              </BarisRingkas>
              <BarisRingkas label="Periode mulai">
                {f.tanggal(alokasi.periodeMulai)}
              </BarisRingkas>
              <BarisRingkas label="Periode selesai">
                {f.tanggal(alokasi.periodeSelesai)}
              </BarisRingkas>
              <BarisRingkas label="Total alokasi">{f.kg(total)}</BarisRingkas>
              <BarisRingkas label="Dibuat">
                {f.tanggalWaktu(alokasi.dibuatPada)}
              </BarisRingkas>
            </dl>
            {alokasi.catatan ? (
              <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
                {alokasi.catatan}
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
