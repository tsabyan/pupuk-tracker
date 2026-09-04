'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import * as f from '@/lib/domain/format'
import type { KesesuaianInspeksi } from '@/lib/domain/types'
import { useDb, usePencari } from '@/lib/hooks'

const NADA: Record<KesesuaianInspeksi, 'sukses' | 'peringatan' | 'bahaya'> = {
  sesuai: 'sukses',
  sebagian: 'peringatan',
  tidak_sesuai: 'bahaya',
}

const LABEL: Record<KesesuaianInspeksi, string> = {
  sesuai: 'Sesuai',
  sebagian: 'Sesuai sebagian',
  tidak_sesuai: 'Tidak sesuai',
}

export default function DaftarInspeksi() {
  const db = useDb()
  const cari = usePencari()

  const daftar = useMemo(
    () => [...db.inspeksi].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [db],
  )

  return (
    <>
      <PageHeader
        langkah="Langkah 4"
        judul="Pengawasan Lapangan"
        keterangan="Catatan inspeksi langsung ke kios resmi dan kelompok tani untuk mengecek kesesuaian penyaluran dengan data sistem."
        aksi={
          <TombolTautan href="/kp3/inspeksi/baru" varian="utama">
            Catat inspeksi
          </TombolTautan>
        }
      />

      <Card>
        <CardHeader judul={`${daftar.length} inspeksi tercatat`} />
        {daftar.length === 0 ? (
          <Kosong
            judul="Belum ada inspeksi"
            aksi={
              <TombolTautan href="/kp3/inspeksi/baru" varian="utama" ukuran="sm">
                Catat inspeksi
              </TombolTautan>
            }
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Lokasi</Th>
                  <Th>Tanggal</Th>
                  <Th>Pengawas</Th>
                  <Th>Temuan</Th>
                  <Th>Kesesuaian</Th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((i) => (
                  <Tr key={i.id}>
                    <Td className="font-medium text-neutral-900">{i.kode}</Td>
                    <Td>
                      <p className="font-medium text-neutral-900">
                        {i.lokasiTipe === 'pengecer'
                          ? cari.namaPengecer(i.lokasiId)
                          : cari.namaPoktan(i.lokasiId)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {i.lokasiTipe === 'pengecer' ? 'Pengecer resmi' : 'Kelompok tani'}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap">{f.tanggalSingkat(i.tanggal)}</Td>
                    <Td>{cari.namaPengawas(i.pengawasId)}</Td>
                    <Td>
                      <ul className="list-inside list-disc text-sm text-neutral-700">
                        {i.temuan.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </Td>
                    <Td>
                      <Badge tone={NADA[i.kesesuaian]}>{LABEL[i.kesesuaian]}</Badge>
                    </Td>
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
