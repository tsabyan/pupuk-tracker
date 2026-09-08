'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader, StatCard } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import * as f from '@/lib/domain/format'
import { STATUS_TINDAK_LANJUT, tindakLanjutTerlambat } from '@/lib/domain/status'
import type { JenisTindakLanjut } from '@/lib/domain/types'
import { useDb, usePencari } from '@/lib/hooks'

type Bagian = 'berjalan' | 'selesai' | 'semua'

const LABEL_JENIS: Record<JenisTindakLanjut, string> = {
  teguran: 'Teguran',
  rekomendasi: 'Rekomendasi',
  pembinaan: 'Pembinaan',
  penghargaan: 'Penghargaan',
}

const NADA_JENIS: Record<JenisTindakLanjut, 'bahaya' | 'peringatan' | 'info' | 'sukses'> = {
  teguran: 'bahaya',
  rekomendasi: 'peringatan',
  pembinaan: 'info',
  penghargaan: 'sukses',
}

export default function DaftarTindakLanjut() {
  const db = useDb()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('berjalan')
  const hariIni = f.hariIni()

  const namaSasaran = (tipe: string, id: string) =>
    tipe === 'pengecer'
      ? cari.namaPengecer(id)
      : tipe === 'poktan'
        ? cari.namaPoktan(id)
        : cari.namaDistributor(id)

  const { semua, berjalan, selesai, terlambat } = useMemo(() => {
    const urut = [...db.tindakLanjut].sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return {
      semua: urut,
      berjalan: urut.filter((t) => t.status !== 'selesai'),
      selesai: urut.filter((t) => t.status === 'selesai'),
      terlambat: urut.filter((t) => tindakLanjutTerlambat(t.status, t.tenggat, hariIni)),
    }
  }, [db, hariIni])

  const tampil = bagian === 'berjalan' ? berjalan : bagian === 'selesai' ? selesai : semua

  return (
    <>
      <PageHeader
        langkah="Langkah 5"
        judul="Tindak Lanjut"
        keterangan="Teguran, rekomendasi, pembinaan, dan penghargaan atas hasil pengawasan. Setiap penerbitan punya tenggat dan status pelaksanaan — pengawasan baru tuntas ketika perbaikannya terverifikasi."
        aksi={
          <TombolTautan href="/kp3/tindak-lanjut/baru" varian="utama">
            Terbitkan tindak lanjut
          </TombolTautan>
        }
      />

      <div className="grid *:min-w-0 gap-4 sm:grid-cols-3">
        <StatCard
          label="Sedang berjalan"
          nilai={f.angka(berjalan.length)}
          satuan="surat"
          ikon="Clock"
          aksen="jingga"
          keterangan="Belum dinyatakan selesai"
        />
        <StatCard
          label="Lewat tenggat"
          nilai={f.angka(terlambat.length)}
          satuan="surat"
          ikon="AlertTriangle"
          aksen="merah"
          keterangan={
            terlambat.length > 0 ? 'Pertimbangkan eskalasi' : 'Semua dalam tenggat'
          }
        />
        <StatCard
          label="Tuntas"
          nilai={f.angka(selesai.length)}
          satuan="surat"
          ikon="CheckCircle2"
          aksen="hijau"
          keterangan="Perbaikan terverifikasi pengawas"
        />
      </div>

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'berjalan', label: 'Berjalan', jumlah: berjalan.length },
            { nilai: 'selesai', label: 'Selesai', jumlah: selesai.length },
            { nilai: 'semua', label: 'Semua', jumlah: semua.length },
          ]}
        />

        {tampil.length === 0 ? (
          <Kosong
            judul="Belum ada tindak lanjut"
            aksi={
              <TombolTautan href="/kp3/tindak-lanjut/baru" varian="utama" ukuran="sm">
                Terbitkan tindak lanjut
              </TombolTautan>
            }
          />
        ) : (
          <ul className="divide-y divide-garis">
            {tampil.map((t) => {
              const lewat = tindakLanjutTerlambat(t.status, t.tenggat, hariIni)
              const meta = STATUS_TINDAK_LANJUT[t.status]
              return (
                <li key={t.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={NADA_JENIS[t.jenis]}>{LABEL_JENIS[t.jenis]}</Badge>
                        <Badge tone={meta.tone} titik>
                          {meta.label}
                        </Badge>
                        {lewat ? <Badge tone="bahaya">Lewat tenggat</Badge> : null}
                        <span className="text-xs text-neutral-500">{t.kode}</span>
                      </div>
                      <Link
                        href={`/kp3/tindak-lanjut/${t.id}`}
                        className="mt-1.5 block font-medium text-tinta hover:underline"
                      >
                        {t.judul}
                      </Link>
                      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-600">
                        {t.isi}
                      </p>
                      {t.temuanIds.length > 0 ? (
                        <p className="mt-1.5 text-xs text-neutral-500">
                          Menutup {t.temuanIds.length} temuan:{' '}
                          {t.temuanIds
                            .map((id) => db.temuan.find((x) => x.id === id)?.kode ?? '—')
                            .join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-tinta">
                        {namaSasaran(t.sasaranTipe, t.sasaranId)}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Terbit {f.tanggalSingkat(t.tanggal)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Tenggat {f.tanggalSingkat(t.tenggat)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {cari.namaPengawas(t.pengawasId)}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          judul="Rekap jenis"
          keterangan="Pengawasan yang sehat tidak hanya berisi teguran."
        />
        <TabelWadah>
          <Tabel>
            <thead>
              <tr>
                <Th>Jenis</Th>
                <Th numerik>Diterbitkan</Th>
                <Th numerik>Selesai</Th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(LABEL_JENIS) as JenisTindakLanjut[]).map((j) => (
                <Tr key={j}>
                  <Td>
                    <Badge tone={NADA_JENIS[j]}>{LABEL_JENIS[j]}</Badge>
                  </Td>
                  <Td numerik>{semua.filter((t) => t.jenis === j).length}</Td>
                  <Td numerik>
                    {semua.filter((t) => t.jenis === j && t.status === 'selesai').length}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tabel>
        </TabelWadah>
      </Card>
    </>
  )
}
