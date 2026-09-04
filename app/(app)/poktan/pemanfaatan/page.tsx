'use client'

import { useMemo } from 'react'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import * as f from '@/lib/domain/format'
import { totalKg } from '@/lib/domain/stok'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

export default function DaftarPemanfaatan() {
  const db = useDb()
  const { poktan } = useSesi()
  const cari = usePencari()

  const daftar = useMemo(
    () =>
      db.laporanPemanfaatan
        .filter((l) => l.poktanId === poktan?.id)
        .sort((a, b) => b.tanggalAplikasi.localeCompare(a.tanggalAplikasi)),
    [db, poktan],
  )

  return (
    <>
      <PageHeader
        langkah="Langkah 4"
        judul="Pemanfaatan & Laporan"
        keterangan="Laporan penggunaan pupuk sesuai rekomendasi. Diisi berkala dan menjadi bahan analisis serapan bagi Pengawas KP3."
        aksi={
          <TombolTautan href="/poktan/pemanfaatan/baru" varian="utama">
            Buat laporan
          </TombolTautan>
        }
      />

      <Card>
        <CardHeader judul={`${daftar.length} laporan pemanfaatan`} />
        {daftar.length === 0 ? (
          <Kosong
            judul="Belum ada laporan pemanfaatan"
            keterangan="Laporkan penggunaan pupuk setelah aplikasi di lahan."
            aksi={
              <TombolTautan href="/poktan/pemanfaatan/baru" varian="utama" ukuran="sm">
                Buat laporan
              </TombolTautan>
            }
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Komoditas</Th>
                  <Th>Tanggal aplikasi</Th>
                  <Th numerik>Luas tanam</Th>
                  <Th numerik>Pupuk dipakai</Th>
                  <Th>Catatan</Th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((l) => (
                  <Tr key={l.id}>
                    <Td>
                      <p className="font-medium text-neutral-900">{l.kode}</p>
                      <p className="text-xs text-neutral-500">{l.periode}</p>
                    </Td>
                    <Td>{l.komoditas}</Td>
                    <Td className="whitespace-nowrap">{f.tanggalSingkat(l.tanggalAplikasi)}</Td>
                    <Td numerik>{l.luasTanamHa} ha</Td>
                    <Td numerik>
                      {f.kg(totalKg(l.dipakai))}
                      <p className="text-xs font-normal text-neutral-500">
                        {l.dipakai.map((d) => cari.kodePupuk(d.jenisPupukId)).join(', ')}
                      </p>
                    </Td>
                    <Td className="max-w-xs text-sm text-neutral-600">{l.catatan ?? '—'}</Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWadah>
        )}
      </Card>
    </>
  )
}
