'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader } from '@/components/ui/misc'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import type { TipeNotifikasi } from '@/lib/domain/types'
import { useNotifikasi, useSesi } from '@/lib/hooks'
import { cn } from '@/lib/ui/cn'

const NADA: Record<TipeNotifikasi, 'info' | 'sukses' | 'peringatan' | 'bahaya'> = {
  pengiriman_dikirim: 'info',
  pengiriman_dikonfirmasi: 'sukses',
  pengiriman_selisih: 'peringatan',
  pengiriman_ditolak: 'bahaya',
  penyaluran_disalurkan: 'info',
  penyaluran_dikonfirmasi: 'sukses',
  penyaluran_divalidasi: 'sukses',
  penyaluran_bermasalah: 'bahaya',
  tindak_lanjut: 'peringatan',
}

const LABEL: Record<TipeNotifikasi, string> = {
  pengiriman_dikirim: 'Pengiriman',
  pengiriman_dikonfirmasi: 'Penerimaan',
  pengiriman_selisih: 'Selisih',
  pengiriman_ditolak: 'Penolakan',
  penyaluran_disalurkan: 'Penyaluran',
  penyaluran_dikonfirmasi: 'Konfirmasi',
  penyaluran_divalidasi: 'Validasi',
  penyaluran_bermasalah: 'Bermasalah',
  tindak_lanjut: 'Tindak lanjut',
}

export default function HalamanNotifikasi() {
  const { daftar, belumDibaca } = useNotifikasi()
  const { user } = useSesi()
  const [hanyaBelumDibaca, setHanyaBelumDibaca] = useState(false)

  const tampil = hanyaBelumDibaca ? daftar.filter((n) => !n.dibaca) : daftar

  return (
    <>
      <PageHeader
        judul="Notifikasi"
        keterangan="Pemberitahuan otomatis setiap kali transaksi berpindah tahap di rantai distribusi."
        aksi={
          <>
            <Button
              varian={hanyaBelumDibaca ? 'utama' : 'garis'}
              onClick={() => setHanyaBelumDibaca((v) => !v)}
            >
              {hanyaBelumDibaca ? 'Tampilkan semua' : `Belum dibaca (${belumDibaca})`}
            </Button>
            {belumDibaca > 0 && user ? (
              <Button
                varian="garis"
                onClick={() => void repo.tandaiSemuaNotifikasiDibaca(user.id)}
              >
                Tandai semua dibaca
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader
          judul={`${tampil.length} notifikasi`}
          keterangan={belumDibaca > 0 ? `${belumDibaca} belum dibaca` : 'Semua sudah dibaca'}
        />
        {tampil.length === 0 ? (
          <Kosong
            judul={hanyaBelumDibaca ? 'Tidak ada yang belum dibaca' : 'Belum ada notifikasi'}
            keterangan="Notifikasi muncul saat ada pengiriman, penerimaan, konfirmasi, atau validasi baru."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {tampil.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.tautan}
                  onClick={() => void repo.tandaiNotifikasiDibaca(n.id)}
                  className={cn(
                    'flex gap-3 p-4 hover:bg-neutral-50 sm:p-5',
                    !n.dibaca && 'bg-[var(--aksen)]/5',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      n.dibaca ? 'bg-neutral-300' : 'bg-[var(--aksen)]',
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={NADA[n.tipe]}>{LABEL[n.tipe]}</Badge>
                      <span className="text-xs text-neutral-500">
                        {f.tanggalWaktu(n.dibuatPada)}
                      </span>
                    </div>
                    <p className="mt-1.5 font-medium text-neutral-900">{n.judul}</p>
                    <p className="mt-0.5 text-sm text-neutral-600">{n.pesan}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
