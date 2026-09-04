'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import * as f from '@/lib/domain/format'
import { totalKg } from '@/lib/domain/stok'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

export default function DaftarAlokasi() {
  const db = useDb()
  const { distributor } = useSesi()
  const cari = usePencari()

  const daftar = useMemo(
    () =>
      db.alokasi
        .filter((a) => a.distributorId === distributor?.id)
        .sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada)),
    [db, distributor],
  )

  return (
    <>
      <PageHeader
        langkah="Langkah 2"
        judul="Rencana Alokasi"
        keterangan="Rencana penyaluran pupuk bersubsidi per wilayah, jenis, jumlah, dan periode. Alokasi menjadi dasar setiap pengiriman ke kios resmi."
        aksi={
          <TombolTautan href="/distributor/alokasi/baru" varian="utama">
            Buat rencana alokasi
          </TombolTautan>
        }
      />

      <Card>
        <CardHeader judul={`${daftar.length} rencana alokasi`} />
        {daftar.length === 0 ? (
          <Kosong
            judul="Belum ada rencana alokasi"
            keterangan="Susun alokasi per kecamatan untuk musim tanam berjalan."
            aksi={
              <TombolTautan href="/distributor/alokasi/baru" varian="utama" ukuran="sm">
                Buat rencana alokasi
              </TombolTautan>
            }
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Wilayah</Th>
                  <Th>Periode</Th>
                  <Th numerik>Kios</Th>
                  <Th numerik>Total alokasi</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((a) => {
                  const total = a.rincian.reduce((t, r) => t + totalKg(r.items), 0)
                  return (
                    <Tr key={a.id}>
                      <Td>
                        <Link
                          href={`/distributor/alokasi/${a.id}`}
                          className="font-medium text-[var(--aksen)] hover:underline"
                        >
                          {a.kode}
                        </Link>
                        <p className="text-xs text-neutral-500">
                          {a.musimTanam} {a.tahun}
                        </p>
                      </Td>
                      <Td>Kec. {cari.namaKecamatan(a.kecamatanId)}</Td>
                      <Td className="whitespace-nowrap">
                        {f.tanggalSingkat(a.periodeMulai)} &ndash;{' '}
                        {f.tanggalSingkat(a.periodeSelesai)}
                      </Td>
                      <Td numerik>{a.rincian.length}</Td>
                      <Td numerik>{f.kg(total)}</Td>
                      <Td>
                        <Badge tone={a.status === 'aktif' ? 'sukses' : 'netral'}>
                          {a.status === 'aktif' ? 'Aktif' : 'Draft'}
                        </Badge>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Tabel>
          </TabelWadah>
        )}
      </Card>
    </>
  )
}
