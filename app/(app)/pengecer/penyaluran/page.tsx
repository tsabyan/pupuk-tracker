'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/field'
import { Kosong, PageHeader } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import type { StatusPenyaluran } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

const SARINGAN: Array<{ nilai: StatusPenyaluran | 'semua'; label: string }> = [
  { nilai: 'semua', label: 'Semua status' },
  { nilai: 'disalurkan', label: 'Menunggu konfirmasi poktan' },
  { nilai: 'dikonfirmasi', label: 'Dikonfirmasi poktan' },
  { nilai: 'divalidasi', label: 'Tervalidasi KP3' },
  { nilai: 'bermasalah', label: 'Bermasalah' },
]

export default function DaftarPenyaluran() {
  const db = useDb()
  const { pengecer } = useSesi()
  const cari = usePencari()
  const [status, setStatus] = useState<StatusPenyaluran | 'semua'>('semua')

  const daftar = useMemo(
    () =>
      db.penyaluran
        .filter((p) => p.pengecerId === pengecer?.id)
        .filter((p) => status === 'semua' || p.status === status)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [db, pengecer, status],
  )

  return (
    <>
      <PageHeader
        langkah="Langkah 4 & 5"
        judul="Penyaluran ke Kelompok Tani"
        keterangan="Setiap penyaluran dicek terhadap hak RDKK kelompok tani dan sisa stok kios, lalu disimpan bersama bukti serah terima."
        aksi={
          <TombolTautan href="/pengecer/penyaluran/baru" varian="utama">
            Catat penyaluran
          </TombolTautan>
        }
      />

      <Card>
        <CardHeader
          judul={`${daftar.length} transaksi penyaluran`}
          aksi={
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusPenyaluran | 'semua')}
              className="w-auto"
              aria-label="Saring status"
            >
              {SARINGAN.map((s) => (
                <option key={s.nilai} value={s.nilai}>
                  {s.label}
                </option>
              ))}
            </Select>
          }
        />
        {daftar.length === 0 ? (
          <Kosong
            judul="Tidak ada penyaluran pada saringan ini"
            aksi={
              <TombolTautan href="/pengecer/penyaluran/baru" varian="utama" ukuran="sm">
                Catat penyaluran
              </TombolTautan>
            }
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>No. transaksi</Th>
                  <Th>Kelompok tani</Th>
                  <Th>Tanggal</Th>
                  <Th numerik>Jumlah</Th>
                  <Th numerik>Nilai</Th>
                  <Th>Bukti</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <Link
                        href={`/pengecer/penyaluran/${p.id}`}
                        className="font-medium text-[var(--aksen)] hover:underline"
                      >
                        {p.noTransaksi}
                      </Link>
                    </Td>
                    <Td>
                      <p className="font-medium text-neutral-900">
                        {cari.namaPoktan(p.poktanId)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {p.metodeBayar === 'tunai' ? 'Tunai' : 'Kartu Tani'}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggal)}</Td>
                    <Td numerik>{f.kg(p.items.reduce((t, i) => t + i.jumlahKg, 0))}</Td>
                    <Td numerik>{f.rupiah(p.total)}</Td>
                    <Td>
                      <span className="text-xs text-neutral-600">
                        {p.bukti?.ttdPenerima ? '✓ TTD' : '—'}
                        {p.bukti?.fotoStruk ? ' · ✓ Foto' : ''}
                      </span>
                    </Td>
                    <Td>
                      <BadgePenyaluran status={p.status} />
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
