'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Kosong, PageHeader, Peringatan } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import type { Penyaluran } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

type Bagian = 'menunggu' | 'riwayat'

export default function DaftarPenerimaanPoktan() {
  const db = useDb()
  const { poktan } = useSesi()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('menunggu')

  const { menunggu, riwayat } = useMemo(() => {
    const milik = db.penyaluran
      .filter((p) => p.poktanId === poktan?.id)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return {
      menunggu: milik.filter((p) => p.status === 'disalurkan'),
      riwayat: milik.filter((p) => p.status !== 'disalurkan'),
    }
  }, [db, poktan])

  const daftar = bagian === 'menunggu' ? menunggu : riwayat

  const baris = (p: Penyaluran) => (
    <Tr key={p.id}>
      <Td>
        <Link
          href={`/poktan/penerimaan/${p.id}`}
          className="font-medium text-tinta hover:underline"
        >
          {p.noTransaksi}
        </Link>
      </Td>
      <Td className="text-neutral-600">{cari.namaPengecer(p.pengecerId)}</Td>
      <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggal)}</Td>
      <Td numerik>{f.kg(p.items.reduce((t, i) => t + i.jumlahKg, 0))}</Td>
      <Td numerik>{f.rupiah(p.total)}</Td>
      <Td>
        <BadgePenyaluran status={p.status} />
      </Td>
    </Tr>
  )

  return (
    <>
      <PageHeader
        langkah="Langkah 2 & 3"
        judul="Terima Pupuk"
        keterangan="Cek jenis, jumlah, dan kualitas pupuk yang diserahkan kios, lalu konfirmasi dengan tanda tangan ketua kelompok tani."
      />

      {menunggu.length > 0 ? (
        <Peringatan
          nada="info"
          judul={`${menunggu.length} penyerahan menunggu tanda tangan Anda`}
        >
          Konfirmasi menjadi bukti serah terima sekaligus membuka antrian validasi
          Pengawas KP3.
        </Peringatan>
      ) : null}

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'menunggu', label: 'Menunggu konfirmasi', jumlah: menunggu.length },
            { nilai: 'riwayat', label: 'Riwayat penerimaan', jumlah: riwayat.length },
          ]}
        />

        {daftar.length === 0 ? (
          <Kosong
            judul={
              bagian === 'menunggu' ? 'Tidak ada penerimaan tertunda' : 'Belum ada riwayat'
            }
            keterangan={
              bagian === 'menunggu'
                ? 'Semua penyerahan dari kios sudah Anda konfirmasi.'
                : undefined
            }
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>No. transaksi</Th>
                  <Th>Kios</Th>
                  <Th>Tanggal</Th>
                  <Th numerik>Jumlah</Th>
                  <Th numerik>Nilai</Th>
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
