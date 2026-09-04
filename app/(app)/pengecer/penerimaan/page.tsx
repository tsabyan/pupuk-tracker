'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Kosong, PageHeader, Peringatan } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { BadgePengiriman } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import type { Pengiriman } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

type Bagian = 'menunggu' | 'riwayat'

export default function DaftarPenerimaan() {
  const db = useDb()
  const { pengecer } = useSesi()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('menunggu')

  const { menunggu, selesai } = useMemo(() => {
    const milik = db.pengiriman
      .filter((p) => p.pengecerId === pengecer?.id)
      .sort((a, b) => b.tanggalKirim.localeCompare(a.tanggalKirim))
    return {
      menunggu: milik.filter((p) => p.status === 'dikirim'),
      selesai: milik.filter((p) => p.status !== 'dikirim'),
    }
  }, [db, pengecer])

  const daftar = bagian === 'menunggu' ? menunggu : selesai

  const baris = (p: Pengiriman) => {
    const dikirim = p.items.reduce((t, i) => t + i.jumlahKg, 0)
    const diterima = p.items.reduce((t, i) => t + (i.jumlahDiterimaKg ?? 0), 0)
    return (
      <Tr key={p.id}>
        <Td>
          <Link
            href={`/pengecer/penerimaan/${p.id}`}
            className="font-medium text-tinta hover:underline"
          >
            {p.noFaktur}
          </Link>
          <p className="mt-0.5 text-xs text-neutral-500">{p.noBeritaAcara}</p>
        </Td>
        <Td className="text-neutral-600">{cari.namaDistributor(p.distributorId)}</Td>
        <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggalKirim)}</Td>
        <Td numerik>{f.kg(dikirim)}</Td>
        <Td numerik>
          {p.status === 'dikirim' ? (
            <span className="text-neutral-400">—</span>
          ) : (
            f.kg(diterima)
          )}
        </Td>
        <Td>
          <BadgePengiriman status={p.status} />
        </Td>
      </Tr>
    )
  }

  return (
    <>
      <PageHeader
        langkah="Langkah 2"
        judul="Konfirmasi Penerimaan"
        keterangan="Cek jenis dan jumlah pupuk yang datang, lalu konfirmasi. Stok kios baru bertambah setelah kiriman dikonfirmasi."
      />

      {menunggu.length > 0 ? (
        <Peringatan nada="info" judul={`${menunggu.length} kiriman menunggu konfirmasi`}>
          Selama belum dikonfirmasi, pupuknya belum tercatat sebagai stok dan belum bisa
          disalurkan ke kelompok tani.
        </Peringatan>
      ) : null}

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'menunggu', label: 'Menunggu konfirmasi', jumlah: menunggu.length },
            { nilai: 'riwayat', label: 'Riwayat penerimaan', jumlah: selesai.length },
          ]}
        />

        {daftar.length === 0 ? (
          <Kosong
            judul={
              bagian === 'menunggu'
                ? 'Tidak ada kiriman tertunda'
                : 'Belum ada riwayat penerimaan'
            }
            keterangan={
              bagian === 'menunggu'
                ? 'Semua kiriman dari distributor sudah dikonfirmasi.'
                : undefined
            }
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Faktur / Berita acara</Th>
                  <Th>Distributor</Th>
                  <Th>Tanggal kirim</Th>
                  <Th numerik>Faktur</Th>
                  <Th numerik>Diterima</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>{daftar.map(baris)}</tbody>
            </Tabel>
          </TabelWadah>
        )}
      </Card>
    </>
  )
}
