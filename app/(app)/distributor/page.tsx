'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BarRasio } from '@/components/ui/bar'
import { TombolTautan } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KakiKartu, Kosong, PageHeader, PanelMetrik, StatCard } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { KartuTren } from '@/components/domain/kartu-tren'
import { BadgePengiriman } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import { ringkasanDistribusi, serapanPerPengecer } from '@/lib/domain/laporan'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

type Bagian = 'serapan' | 'pengiriman'

export default function DashboardDistributor() {
  const db = useDb()
  const { distributor } = useSesi()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('serapan')

  const { ringkas, serapan, pengiriman } = useMemo(() => {
    const filter = { distributorId: distributor?.id }
    return {
      ringkas: ringkasanDistribusi(db, filter),
      serapan: serapanPerPengecer(db, filter),
      pengiriman: db.pengiriman
        .filter((p) => p.distributorId === distributor?.id)
        .sort((a, b) => b.tanggalKirim.localeCompare(a.tanggalKirim))
        .slice(0, 8),
    }
  }, [db, distributor])

  if (!distributor) return null

  return (
    <>
      <PageHeader
        judul="Dashboard"
        meta={
          <>
            <span className="font-medium text-tinta">{distributor.nama}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>{distributor.kecamatanIds.map(cari.namaKecamatan).join(', ')}</span>
          </>
        }
        aksi={
          <>
            <TombolTautan href="/distributor/alokasi/baru">Buat alokasi</TombolTautan>
            <TombolTautan href="/distributor/pengiriman/baru" varian="utama">
              Kirim pupuk
            </TombolTautan>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <StatCard
            label="Alokasi periode berjalan"
            nilai={f.angka(ringkas.alokasiKg)}
            satuan="kg"
            ikon="ClipboardList"
            aksen="biru"
            keterangan="Rencana penyaluran ke kios binaan"
          />
          <StatCard
            label="Sudah diterima kios"
            nilai={f.angka(ringkas.diterimaKg)}
            satuan="kg"
            ikon="PackageCheck"
            aksen="hijau"
            keterangan={`${f.persen(ringkas.alokasiKg > 0 ? ringkas.diterimaKg / ringkas.alokasiKg : 0, 0)} dari alokasi`}
          />
          <StatCard
            label="Menunggu konfirmasi kios"
            nilai={f.angka(ringkas.menungguKonfirmasiKios)}
            satuan="pengiriman"
            ikon="Clock"
            aksen="jingga"
            keterangan={
              ringkas.menungguKonfirmasiKios > 0
                ? 'Stok kios belum bertambah'
                : 'Semua kiriman sudah ditanggapi'
            }
          />
          <StatCard
            label="Sisa stok di kios"
            nilai={f.angka(ringkas.sisaStokKg)}
            satuan="kg"
            ikon="Boxes"
            aksen="ungu"
            keterangan="Belum sampai ke kelompok tani"
          />
        </div>

        <PanelMetrik
          metrik={[
            {
              label: 'Tersalur ke kelompok tani',
              nilai: f.angka(ringkas.disalurkanKg),
              satuan: 'kg',
              ikon: 'Sprout',
            },
            {
              label: 'Serapan alokasi',
              ikon: 'Activity',
              nilai: f.persen(ringkas.rasioSerapan, 1),
              keterangan: 'Tersalur dibanding rencana alokasi',
            },
            {
              label: 'Kios binaan',
              ikon: 'Store',
              nilai: f.angka(serapan.length),
              satuan: 'kios',
            },
          ]}
        />
      </div>

      <KartuTren
        penyaluran={db.penyaluran.filter((p) =>
          serapan.some((s) => s.pengecerId === p.pengecerId),
        )}
        keterangan="Jumlah pupuk yang sampai ke petani lewat kios binaan, 30 hari terakhir"
      />

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'serapan', label: 'Serapan per pengecer', jumlah: serapan.length },
            { nilai: 'pengiriman', label: 'Pengiriman terbaru', jumlah: pengiriman.length },
          ]}
        />

        {bagian === 'serapan' ? (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Pengecer</Th>
                  <Th numerik>Alokasi</Th>
                  <Th numerik>Diterima</Th>
                  <Th numerik>Tersalur</Th>
                  <Th className="w-44">Serapan</Th>
                </tr>
              </thead>
              <tbody>
                {serapan.map((s) => {
                  const kios = cari.pengecer(s.pengecerId)
                  return (
                    <Tr key={s.pengecerId}>
                      <Td>
                        <p className="font-medium text-tinta">{kios?.nama}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {kios?.kode} · Desa {cari.namaDesa(kios?.desaId ?? '')}
                        </p>
                      </Td>
                      <Td numerik>{f.kg(s.alokasiKg)}</Td>
                      <Td numerik>{f.kg(s.diterimaKg)}</Td>
                      <Td numerik>{f.kg(s.disalurkanKg)}</Td>
                      <Td>
                        <BarRasio rasio={s.rasioSerapan} />
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Tabel>
          </TabelWadah>
        ) : pengiriman.length === 0 ? (
          <Kosong
            judul="Belum ada pengiriman"
            keterangan="Buat rencana alokasi lebih dulu, lalu kirim pupuk ke kios resmi."
          />
        ) : (
          <>
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Faktur</Th>
                    <Th>Pengecer</Th>
                    <Th>Tanggal kirim</Th>
                    <Th numerik>Jumlah</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {pengiriman.map((p) => (
                    <Tr key={p.id}>
                      <Td>
                        <Link
                          href={`/distributor/pengiriman/${p.id}`}
                          className="font-medium text-tinta hover:underline"
                        >
                          {p.noFaktur}
                        </Link>
                      </Td>
                      <Td>{cari.namaPengecer(p.pengecerId)}</Td>
                      <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggalKirim)}</Td>
                      <Td numerik>{f.kg(p.items.reduce((t, i) => t + i.jumlahKg, 0))}</Td>
                      <Td>
                        <BadgePengiriman status={p.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabel>
            </TabelWadah>
            <KakiKartu>
              <Link
                href="/distributor/pengiriman"
                className="text-sm font-medium text-tinta hover:underline"
              >
                Lihat semua pengiriman
              </Link>
            </KakiKartu>
          </>
        )}
      </Card>
    </>
  )
}
