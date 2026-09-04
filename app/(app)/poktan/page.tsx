'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BarRasio } from '@/components/ui/bar'
import { TombolTautan } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KakiKartu, Kosong, PageHeader, PanelMetrik, StatCard } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import { hitungSisaHak } from '@/lib/domain/stok'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

type Bagian = 'hak' | 'riwayat'

export default function DashboardPoktan() {
  const db = useDb()
  const { poktan } = useSesi()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('hak')

  const { hak, penyaluran, menunggu } = useMemo(() => {
    if (!poktan) return { hak: [], penyaluran: [], menunggu: [] }
    const milik = db.penyaluran
      .filter((p) => p.poktanId === poktan.id)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return {
      hak: hitungSisaHak(cari.rdkkPoktan(poktan.id), milik),
      penyaluran: milik,
      menunggu: milik.filter((p) => p.status === 'disalurkan'),
    }
  }, [db, poktan, cari])

  if (!poktan) return null

  const totalHak = hak.reduce((t, h) => t + h.hakKg, 0)
  const totalTebus = hak.reduce((t, h) => t + h.ditebusKg, 0)
  const kios = cari.pengecer(poktan.pengecerId)

  return (
    <>
      <PageHeader
        judul="Dashboard"
        meta={
          <>
            <span className="font-medium text-tinta">{poktan.nama}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>Ketua {poktan.ketua}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>
              {poktan.jumlahAnggota} anggota · {poktan.luasLahanHa} ha
            </span>
          </>
        }
        aksi={
          <TombolTautan href="/poktan/pemanfaatan/baru" varian="utama">
            Lapor pemanfaatan
          </TombolTautan>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <StatCard
            label="Menunggu konfirmasi Anda"
            nilai={f.angka(menunggu.length)}
            satuan="transaksi"
            ikon="ClipboardCheck"
            aksen="jingga"
            keterangan={
              menunggu.length > 0
                ? 'Cek pupuk lalu tanda tangani penerimaan'
                : 'Tidak ada penerimaan tertunda'
            }
          />
          <StatCard
            label="Kios langganan"
            ikon="Store"
            aksen="biru"
            nilai={kios?.nama ?? '—'}
            keterangan={kios ? `${kios.kode} · ${kios.pemilik}` : undefined}
          />
          <StatCard
            label="Riwayat penerimaan"
            nilai={f.angka(penyaluran.length)}
            satuan="transaksi"
            ikon="PackageCheck"
            aksen="hijau"
            keterangan="Sepanjang musim tanam berjalan"
          />
          <StatCard
            label="Laporan pemanfaatan"
            ikon="Sprout"
            aksen="ungu"
            nilai={f.angka(
              db.laporanPemanfaatan.filter((l) => l.poktanId === poktan.id).length,
            )}
            satuan="laporan"
            keterangan="Penggunaan pupuk di lahan"
          />
        </div>

        <PanelMetrik
          metrik={[
            {
              label: 'Hak RDKK musim ini',
              ikon: 'Scale',
              nilai: f.angka(totalHak),
              satuan: 'kg',
              keterangan: cari.rdkkPoktan(poktan.id)?.kode,
            },
            {
              label: 'Sudah ditebus',
              ikon: 'PackageCheck',
              nilai: f.angka(totalTebus),
              satuan: 'kg',
            },
            {
              label: 'Sisa hak tebus',
              ikon: 'Wallet',
              nilai: f.angka(totalHak - totalTebus),
              satuan: 'kg',
              keterangan: `${f.persen(totalHak > 0 ? totalTebus / totalHak : 0, 0)} sudah terpakai`,
            },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'hak', label: 'Hak tebus RDKK', jumlah: hak.length },
            { nilai: 'riwayat', label: 'Riwayat penerimaan', jumlah: penyaluran.length },
          ]}
        />

        {bagian === 'hak' ? (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Jenis pupuk</Th>
                  <Th numerik>Hak RDKK</Th>
                  <Th numerik>Sudah ditebus</Th>
                  <Th numerik>Sisa</Th>
                  <Th className="w-44">Penebusan</Th>
                </tr>
              </thead>
              <tbody>
                {hak.map((h) => (
                  <Tr key={h.jenisPupukId}>
                    <Td className="font-medium text-tinta">
                      {cari.namaPupuk(h.jenisPupukId)}
                    </Td>
                    <Td numerik>{f.angka(h.hakKg)}</Td>
                    <Td numerik>{f.angka(h.ditebusKg)}</Td>
                    <Td numerik className="font-medium">
                      {f.angka(h.sisaKg)}
                    </Td>
                    <Td>
                      <BarRasio rasio={h.hakKg > 0 ? h.ditebusKg / h.hakKg : 0} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWadah>
        ) : penyaluran.length === 0 ? (
          <Kosong judul="Belum ada penerimaan pupuk" />
        ) : (
          <>
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>No. transaksi</Th>
                    <Th>Tanggal</Th>
                    <Th numerik>Jumlah</Th>
                    <Th numerik>Nilai</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {penyaluran.slice(0, 8).map((p) => (
                    <Tr key={p.id}>
                      <Td>
                        <Link
                          href={`/poktan/penerimaan/${p.id}`}
                          className="font-medium text-tinta hover:underline"
                        >
                          {p.noTransaksi}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggal)}</Td>
                      <Td numerik>{f.kg(p.items.reduce((t, i) => t + i.jumlahKg, 0))}</Td>
                      <Td numerik>{f.rupiah(p.total)}</Td>
                      <Td>
                        <BadgePenyaluran status={p.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabel>
            </TabelWadah>
            <KakiKartu>
              <Link
                href="/poktan/penerimaan"
                className="text-sm font-medium text-tinta hover:underline"
              >
                Lihat semua penerimaan
              </Link>
            </KakiKartu>
          </>
        )}
      </Card>
    </>
  )
}
