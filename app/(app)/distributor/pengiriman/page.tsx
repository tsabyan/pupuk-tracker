'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/field'
import { Kosong, PageHeader } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { BadgePengiriman } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import type { StatusPengiriman } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

const SARINGAN: Array<{ nilai: StatusPengiriman | 'semua'; label: string }> = [
  { nilai: 'semua', label: 'Semua status' },
  { nilai: 'dikirim', label: 'Menunggu konfirmasi' },
  { nilai: 'dikonfirmasi', label: 'Diterima' },
  { nilai: 'selisih', label: 'Diterima dengan selisih' },
  { nilai: 'ditolak', label: 'Ditolak' },
]

export default function DaftarPengiriman() {
  const db = useDb()
  const { distributor } = useSesi()
  const cari = usePencari()
  const [status, setStatus] = useState<StatusPengiriman | 'semua'>('semua')

  const daftar = useMemo(
    () =>
      db.pengiriman
        .filter((p) => p.distributorId === distributor?.id)
        .filter((p) => status === 'semua' || p.status === status)
        .sort((a, b) => b.tanggalKirim.localeCompare(a.tanggalKirim)),
    [db, distributor, status],
  )

  const menunggu = db.pengiriman.filter(
    (p) => p.distributorId === distributor?.id && p.status === 'dikirim',
  ).length

  return (
    <>
      <PageHeader
        langkah="Langkah 3 & 4"
        judul="Pengiriman ke Pengecer"
        keterangan="Setiap pengiriman menerbitkan faktur dan berita acara, lalu mengirim notifikasi ke kios tujuan untuk dikonfirmasi."
        aksi={
          <TombolTautan href="/distributor/pengiriman/baru" varian="utama">
            Buat pengiriman
          </TombolTautan>
        }
      />

      <Card>
        <CardHeader
          judul={`${daftar.length} pengiriman`}
          keterangan={
            menunggu > 0
              ? `${menunggu} pengiriman masih menunggu konfirmasi kios`
              : 'Semua pengiriman sudah ditanggapi kios'
          }
          aksi={
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusPengiriman | 'semua')}
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
            judul="Tidak ada pengiriman pada saringan ini"
            keterangan="Ubah saringan status atau buat pengiriman baru."
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Faktur / Berita acara</Th>
                  <Th>Pengecer tujuan</Th>
                  <Th>Tanggal kirim</Th>
                  <Th numerik>Dikirim</Th>
                  <Th numerik>Diterima</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((p) => {
                  const kios = cari.pengecer(p.pengecerId)
                  const dikirim = p.items.reduce((t, i) => t + i.jumlahKg, 0)
                  const diterima = p.items.reduce(
                    (t, i) => t + (i.jumlahDiterimaKg ?? 0),
                    0,
                  )
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <Link
                          href={`/distributor/pengiriman/${p.id}`}
                          className="font-medium text-[var(--aksen)] hover:underline"
                        >
                          {p.noFaktur}
                        </Link>
                        <p className="text-xs text-neutral-500">{p.noBeritaAcara}</p>
                      </Td>
                      <Td>
                        <p className="font-medium text-neutral-900">{kios?.nama}</p>
                        <p className="text-xs text-neutral-500">
                          Desa {cari.namaDesa(kios?.desaId ?? '')}
                        </p>
                      </Td>
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
                })}
              </tbody>
            </Tabel>
          </TabelWadah>
        )}
      </Card>
    </>
  )
}
