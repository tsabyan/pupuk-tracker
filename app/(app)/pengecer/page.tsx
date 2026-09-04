'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { TombolTautan } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KakiKartu, Kosong, PageHeader, PanelMetrik, StatCard } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { KartuTren } from '@/components/domain/kartu-tren'
import { BadgePengiriman, BadgePenyaluran } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import { hitungStokPengecer } from '@/lib/domain/stok'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

type Bagian = 'masuk' | 'stok' | 'penyaluran'

export default function DashboardPengecer() {
  const db = useDb()
  const { pengecer } = useSesi()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('masuk')

  const { stok, masuk, penyaluran, menungguPoktan } = useMemo(() => {
    if (!pengecer) {
      return { stok: [], masuk: [], penyaluran: [], menungguPoktan: 0 }
    }
    const milik = db.penyaluran.filter((p) => p.pengecerId === pengecer.id)
    return {
      stok: hitungStokPengecer(pengecer.id, db.pengiriman, db.penyaluran),
      masuk: db.pengiriman
        .filter((p) => p.pengecerId === pengecer.id && p.status === 'dikirim')
        .sort((a, b) => b.tanggalKirim.localeCompare(a.tanggalKirim)),
      penyaluran: [...milik]
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, 8),
      menungguPoktan: milik.filter((p) => p.status === 'disalurkan').length,
    }
  }, [db, pengecer])

  if (!pengecer) return null

  const totalStok = stok.reduce((t, b) => t + b.sisaKg, 0)

  return (
    <>
      <PageHeader
        judul="Dashboard"
        meta={
          <>
            <span className="font-medium text-tinta">{pengecer.nama}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>Desa {cari.namaDesa(pengecer.desaId)}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>{cari.namaDistributor(pengecer.distributorId)}</span>
          </>
        }
        aksi={
          <TombolTautan href="/pengecer/penyaluran/baru" varian="utama">
            Catat penyaluran
          </TombolTautan>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <StatCard
            label="Kiriman menunggu konfirmasi"
            nilai={f.angka(masuk.length)}
            satuan="faktur"
            ikon="Truck"
            aksen="jingga"
            keterangan={
              masuk.length > 0
                ? 'Konfirmasi agar stok tercatat masuk'
                : 'Tidak ada kiriman tertunda'
            }
          />
          <StatCard
            label="Menunggu konfirmasi poktan"
            nilai={f.angka(menungguPoktan)}
            satuan="transaksi"
            ikon="Clock"
            aksen="biru"
            keterangan="Kelompok tani belum menandatangani"
          />
          <StatCard
            label="Jenis pupuk tersedia"
            ikon="Package"
            aksen="ungu"
            nilai={f.angka(stok.filter((s) => s.sisaKg > 0).length)}
            satuan={`dari ${stok.length}`}
            keterangan="Jenis yang stoknya masih ada"
          />
          <StatCard
            label="Total penyaluran"
            ikon="Share2"
            aksen="hijau"
            nilai={f.angka(db.penyaluran.filter((p) => p.pengecerId === pengecer.id).length)}
            satuan="transaksi"
            keterangan="Sepanjang musim tanam berjalan"
          />
        </div>

        <PanelMetrik
          metrik={[
            { label: 'Stok tersedia', ikon: 'Boxes', nilai: f.angka(totalStok), satuan: 'kg' },
            {
              label: 'Total masuk',
              ikon: 'PackageCheck',
              nilai: f.angka(stok.reduce((t, b) => t + b.masukKg, 0)),
              satuan: 'kg',
              keterangan: 'Penerimaan yang sudah dikonfirmasi',
            },
            {
              label: 'Total keluar',
              ikon: 'Sprout',
              nilai: f.angka(stok.reduce((t, b) => t + b.keluarKg, 0)),
              satuan: 'kg',
              keterangan: 'Tersalur ke kelompok tani',
            },
          ]}
        />
      </div>

      <KartuTren
        penyaluran={db.penyaluran.filter((p) => p.pengecerId === pengecer.id)}
        keterangan="Penyaluran kios Anda ke kelompok tani, 30 hari terakhir"
      />

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'masuk', label: 'Kiriman masuk', jumlah: masuk.length },
            { nilai: 'stok', label: 'Stok pupuk', jumlah: stok.length },
            { nilai: 'penyaluran', label: 'Penyaluran terbaru', jumlah: penyaluran.length },
          ]}
        />

        {bagian === 'masuk' ? (
          masuk.length === 0 ? (
            <Kosong
              judul="Tidak ada kiriman tertunda"
              keterangan="Semua pengiriman dari distributor sudah Anda tanggapi."
            />
          ) : (
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Faktur</Th>
                    <Th>Distributor</Th>
                    <Th>Tanggal kirim</Th>
                    <Th numerik>Jumlah</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {masuk.map((p) => (
                    <Tr key={p.id}>
                      <Td>
                        <Link
                          href={`/pengecer/penerimaan/${p.id}`}
                          className="font-medium text-tinta hover:underline"
                        >
                          {p.noFaktur}
                        </Link>
                      </Td>
                      <Td>{cari.namaDistributor(p.distributorId)}</Td>
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
          )
        ) : null}

        {bagian === 'stok' ? (
          <>
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Jenis pupuk</Th>
                    <Th numerik>Masuk</Th>
                    <Th numerik>Keluar</Th>
                    <Th numerik>Sisa</Th>
                  </tr>
                </thead>
                <tbody>
                  {stok.map((b) => (
                    <Tr key={b.jenisPupukId}>
                      <Td className="font-medium text-tinta">
                        {cari.namaPupuk(b.jenisPupukId)}
                      </Td>
                      <Td numerik>{f.angka(b.masukKg)}</Td>
                      <Td numerik>{f.angka(b.keluarKg)}</Td>
                      <Td numerik className="font-medium">
                        {f.angka(b.sisaKg)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabel>
            </TabelWadah>
            <KakiKartu>
              <Link
                href="/pengecer/stok"
                className="text-sm font-medium text-tinta hover:underline"
              >
                Rincian stok & riwayat mutasi
              </Link>
            </KakiKartu>
          </>
        ) : null}

        {bagian === 'penyaluran' ? (
          penyaluran.length === 0 ? (
            <Kosong judul="Belum ada penyaluran" />
          ) : (
            <>
              <TabelWadah>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Kelompok tani</Th>
                      <Th>No. transaksi</Th>
                      <Th>Tanggal</Th>
                      <Th numerik>Jumlah</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {penyaluran.map((p) => (
                      <Tr key={p.id}>
                        <Td>
                          <Link
                            href={`/pengecer/penyaluran/${p.id}`}
                            className="font-medium text-tinta hover:underline"
                          >
                            {cari.namaPoktan(p.poktanId)}
                          </Link>
                        </Td>
                        <Td className="text-neutral-500">{p.noTransaksi}</Td>
                        <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggal)}</Td>
                        <Td numerik>{f.kg(p.items.reduce((t, i) => t + i.jumlahKg, 0))}</Td>
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
                  href="/pengecer/penyaluran"
                  className="text-sm font-medium text-tinta hover:underline"
                >
                  Lihat semua penyaluran
                </Link>
              </KakiKartu>
            </>
          )
        ) : null}
      </Card>
    </>
  )
}
