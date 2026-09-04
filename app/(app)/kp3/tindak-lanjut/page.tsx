'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import * as f from '@/lib/domain/format'
import type { JenisTindakLanjut } from '@/lib/domain/types'
import { useDb, usePencari } from '@/lib/hooks'

const NADA: Record<JenisTindakLanjut, 'bahaya' | 'peringatan' | 'sukses'> = {
  teguran: 'bahaya',
  rekomendasi: 'peringatan',
  penghargaan: 'sukses',
}

const LABEL: Record<JenisTindakLanjut, string> = {
  teguran: 'Teguran',
  rekomendasi: 'Rekomendasi',
  penghargaan: 'Penghargaan',
}

export default function DaftarTindakLanjut() {
  const db = useDb()
  const cari = usePencari()

  const daftar = useMemo(
    () => [...db.tindakLanjut].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [db],
  )

  const namaSasaran = (tipe: string, id: string) =>
    tipe === 'pengecer'
      ? cari.namaPengecer(id)
      : tipe === 'poktan'
        ? cari.namaPoktan(id)
        : cari.namaDistributor(id)

  return (
    <>
      <PageHeader
        langkah="Langkah 5"
        judul="Tindak Lanjut"
        keterangan="Teguran, rekomendasi, dan penghargaan hasil pengawasan. Setiap penerbitan langsung dikirim sebagai notifikasi ke pihak yang bersangkutan."
        aksi={
          <TombolTautan href="/kp3/tindak-lanjut/baru" varian="utama">
            Terbitkan tindak lanjut
          </TombolTautan>
        }
      />

      <Card>
        <CardHeader judul={`${daftar.length} tindak lanjut diterbitkan`} />
        {daftar.length === 0 ? (
          <Kosong
            judul="Belum ada tindak lanjut"
            aksi={
              <TombolTautan href="/kp3/tindak-lanjut/baru" varian="utama" ukuran="sm">
                Terbitkan tindak lanjut
              </TombolTautan>
            }
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {daftar.map((t) => (
              <li key={t.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={NADA[t.jenis]}>{LABEL[t.jenis]}</Badge>
                      <span className="text-xs text-neutral-500">{t.kode}</span>
                    </div>
                    <p className="mt-1.5 font-medium text-neutral-900">{t.judul}</p>
                    <p className="mt-1 max-w-3xl text-sm text-neutral-600">{t.isi}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {namaSasaran(t.sasaranTipe, t.sasaranId)}
                    </p>
                    <p className="text-xs text-neutral-500">{f.tanggal(t.tanggal)}</p>
                    <p className="text-xs text-neutral-500">
                      {cari.namaPengawas(t.pengawasId)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader judul="Ringkasan" />
        <TabelWadah>
          <Tabel>
            <thead>
              <tr>
                <Th>Jenis</Th>
                <Th numerik>Jumlah</Th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(LABEL) as JenisTindakLanjut[]).map((j) => (
                <Tr key={j}>
                  <Td>
                    <Badge tone={NADA[j]}>{LABEL[j]}</Badge>
                  </Td>
                  <Td numerik>{daftar.filter((t) => t.jenis === j).length}</Td>
                </Tr>
              ))}
            </tbody>
          </Tabel>
        </TabelWadah>
      </Card>
    </>
  )
}
