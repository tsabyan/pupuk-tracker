'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { BarRasio } from '@/components/ui/bar'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader, PanelMetrik, StatCard } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import * as f from '@/lib/domain/format'
import {
  LABEL_ASPEK,
  LABEL_OBJEK,
  LABEL_STATUS_TEMUAN,
  LABEL_TINGKAT,
  NADA_STATUS_TEMUAN,
  NADA_TINGKAT,
  rekapTemuan,
} from '@/lib/domain/pengawasan'
import type { ObjekPengawasan, StatusTemuan } from '@/lib/domain/types'
import { useDb, usePencari } from '@/lib/hooks'

type Bagian = StatusTemuan | 'semua'

const LABEL_SUMBER = {
  pemeriksaan: 'Pemeriksaan lapangan',
  penapisan: 'Telaah dokumen',
  pengaduan: 'Pengaduan',
} as const

export default function DaftarTemuan() {
  const db = useDb()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('terbuka')

  const namaObjek = (tipe: ObjekPengawasan, id: string) =>
    tipe === 'distributor'
      ? cari.namaDistributor(id)
      : tipe === 'pengecer'
        ? cari.namaPengecer(id)
        : tipe === 'poktan'
          ? cari.namaPoktan(id)
          : (db.petani.find((p) => p.id === id)?.nama ?? '—')

  const { semua, rekap, hitung } = useMemo(() => {
    const urut = [...db.temuan].sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return {
      semua: urut,
      rekap: rekapTemuan(urut).filter((r) => r.total > 0),
      hitung: {
        terbuka: urut.filter((t) => t.status === 'terbuka').length,
        ditindaklanjuti: urut.filter((t) => t.status === 'ditindaklanjuti').length,
        selesai: urut.filter((t) => t.status === 'selesai').length,
        berat: urut.filter((t) => t.tingkat === 'berat').length,
      },
    }
  }, [db])

  const tampil = bagian === 'semua' ? semua : semua.filter((t) => t.status === bagian)
  const maksimum = Math.max(1, ...rekap.map((r) => r.total))

  return (
    <>
      <PageHeader
        langkah="Langkah 4"
        judul="Temuan Pengawasan"
        keterangan="Register temuan lintas sumber: berita acara pemeriksaan dan telaah dokumen. Setiap temuan dikategorikan menurut tujuh tepat dan dilacak sampai dinyatakan selesai."
      />

      <div className="grid *:min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <StatCard
            label="Terbuka"
            nilai={f.angka(hitung.terbuka)}
            satuan="temuan"
            ikon="AlertTriangle"
            aksen="merah"
            keterangan="Belum ada tindak lanjut yang menanganinya"
          />
          <StatCard
            label="Ditindaklanjuti"
            nilai={f.angka(hitung.ditindaklanjuti)}
            satuan="temuan"
            ikon="Clock"
            aksen="jingga"
            keterangan="Rekomendasi sudah terbit, perbaikan berjalan"
          />
          <StatCard
            label="Selesai"
            nilai={f.angka(hitung.selesai)}
            satuan="temuan"
            ikon="CheckCircle2"
            aksen="hijau"
            keterangan="Perbaikan terverifikasi pengawas"
          />
          <StatCard
            label="Bertingkat berat"
            nilai={f.angka(hitung.berat)}
            satuan="temuan"
            ikon="Scale"
            aksen="ungu"
            keterangan="Berpotensi dieskalasi ke instansi lain"
          />
        </div>

        <PanelMetrik
          metrik={[
            {
              label: 'Total temuan',
              ikon: 'ClipboardList',
              nilai: f.angka(semua.length),
              satuan: 'temuan',
              keterangan: `Dari ${db.pemeriksaan.length} berita acara pemeriksaan`,
            },
            {
              label: 'Tuntas',
              ikon: 'CheckCircle2',
              nilai: f.persen(semua.length > 0 ? hitung.selesai / semua.length : 0, 0),
              keterangan: 'Bagian temuan yang lingkarannya sudah tertutup',
            },
          ]}
        />
      </div>

      {rekap.length > 0 ? (
        <Card>
          <CardHeader
            judul="Sebaran menurut tujuh tepat"
            keterangan="Kategori baku pengawasan pupuk bersubsidi — dipakai agar rekap antar periode bisa dibandingkan."
          />
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Aspek</Th>
                  <Th numerik>Total</Th>
                  <Th numerik>Belum tuntas</Th>
                  <Th numerik>Berat</Th>
                  <Th className="w-44">Porsi</Th>
                </tr>
              </thead>
              <tbody>
                {rekap.map((r) => (
                  <Tr key={r.aspek}>
                    <Td className="font-medium text-tinta">{LABEL_ASPEK[r.aspek]}</Td>
                    <Td numerik>{r.total}</Td>
                    <Td numerik>{r.belumTuntas}</Td>
                    <Td numerik>{r.berat > 0 ? r.berat : '—'}</Td>
                    <Td>
                      <BarRasio
                        rasio={r.total / maksimum}
                        nada={r.berat > 0 ? 'peringatan' : 'aksen'}
                      />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWadah>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'terbuka', label: 'Terbuka', jumlah: hitung.terbuka },
            {
              nilai: 'ditindaklanjuti',
              label: 'Ditindaklanjuti',
              jumlah: hitung.ditindaklanjuti,
            },
            { nilai: 'selesai', label: 'Selesai', jumlah: hitung.selesai },
            { nilai: 'semua', label: 'Semua', jumlah: semua.length },
          ]}
        />

        {tampil.length === 0 ? (
          <Kosong
            judul="Tidak ada temuan pada bagian ini"
            keterangan="Temuan lahir dari berita acara pemeriksaan dan telaah dokumen."
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Aspek</Th>
                  <Th>Uraian</Th>
                  <Th>Objek</Th>
                  <Th>Tingkat</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {tampil.map((t) => (
                  <Tr key={t.id}>
                    <Td>
                      <p className="font-medium text-tinta">{t.kode}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {f.tanggalSingkat(t.tanggal)}
                      </p>
                    </Td>
                    <Td>
                      <Badge tone="netral">{LABEL_ASPEK[t.aspek]}</Badge>
                    </Td>
                    <Td>
                      <p className="max-w-md leading-relaxed">{t.uraian}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {LABEL_SUMBER[t.sumber]}
                        {t.sumber === 'pemeriksaan' ? (
                          <>
                            {' · '}
                            <Link
                              href={`/kp3/pemeriksaan/${t.sumberId}`}
                              className="text-tinta hover:underline"
                            >
                              berita acara
                            </Link>
                          </>
                        ) : t.sumber === 'penapisan' ? (
                          <>
                            {' · '}
                            <Link
                              href={`/kp3/objek/${t.sumberId}`}
                              className="text-tinta hover:underline"
                            >
                              transaksi
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </Td>
                    <Td>
                      <p className="font-medium text-tinta">
                        {namaObjek(t.objekTipe, t.objekId)}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {LABEL_OBJEK[t.objekTipe]}
                      </p>
                    </Td>
                    <Td>
                      <Badge tone={NADA_TINGKAT[t.tingkat]}>
                        {LABEL_TINGKAT[t.tingkat]}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={NADA_STATUS_TEMUAN[t.status]}>
                        {LABEL_STATUS_TEMUAN[t.status]}
                      </Badge>
                      {t.tindakLanjutId ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          {db.tindakLanjut.find((x) => x.id === t.tindakLanjutId)?.kode}
                        </p>
                      ) : null}
                    </Td>
                    <Td>
                      {t.status === 'terbuka' ? (
                        <TombolTautan
                          href={`/kp3/tindak-lanjut/baru?temuan=${t.id}`}
                          ukuran="sm"
                        >
                          Tindak lanjuti
                        </TombolTautan>
                      ) : null}
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
