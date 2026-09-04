'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { TombolTautan } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Kosong, PageHeader, PanelMetrik } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import * as f from '@/lib/domain/format'
import { hitungStokPengecer, riwayatMutasi } from '@/lib/domain/stok'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

type Bagian = 'stok' | 'mutasi'

export default function HalamanStok() {
  const db = useDb()
  const { pengecer } = useSesi()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('stok')

  const { stok, mutasi } = useMemo(() => {
    if (!pengecer) return { stok: [], mutasi: [] }
    return {
      stok: hitungStokPengecer(pengecer.id, db.pengiriman, db.penyaluran),
      mutasi: riwayatMutasi(pengecer.id, db.pengiriman, db.penyaluran, cari.namaPoktan),
    }
  }, [db, pengecer, cari])

  if (!pengecer) return null

  const totalSisa = stok.reduce((t, b) => t + b.sisaKg, 0)
  const totalMasuk = stok.reduce((t, b) => t + b.masukKg, 0)
  const totalKeluar = stok.reduce((t, b) => t + b.keluarKg, 0)

  return (
    <>
      <PageHeader
        langkah="Langkah 3"
        judul="Stok Pengecer"
        keterangan="Stok tidak diinput manual. Angkanya dihitung dari riwayat: penerimaan yang dikonfirmasi dikurangi penyaluran ke kelompok tani."
        aksi={
          <TombolTautan href="/pengecer/penyaluran/baru" varian="utama">
            Catat penyaluran
          </TombolTautan>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[19rem_1fr]">
        <PanelMetrik
          metrik={[
            { label: 'Sisa stok', ikon: 'Boxes', nilai: f.angka(totalSisa), satuan: 'kg' },
            {
              label: 'Total masuk',
              ikon: 'PackageCheck',
              nilai: f.angka(totalMasuk),
              satuan: 'kg',
            },
            {
              label: 'Total keluar',
              ikon: 'Sprout',
              nilai: f.angka(totalKeluar),
              satuan: 'kg',
            },
          ]}
        />

        <Card className="overflow-hidden">
          <Tabs
            aktif={bagian}
            onPilih={setBagian}
            daftar={[
              { nilai: 'stok', label: 'Stok per jenis pupuk', jumlah: stok.length },
              { nilai: 'mutasi', label: 'Riwayat mutasi', jumlah: mutasi.length },
            ]}
          />

          {bagian === 'stok' ? (
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Jenis pupuk</Th>
                    <Th numerik>HET / kg</Th>
                    <Th numerik>Masuk</Th>
                    <Th numerik>Keluar</Th>
                    <Th numerik>Sisa</Th>
                    <Th>Ketersediaan</Th>
                  </tr>
                </thead>
                <tbody>
                  {stok.map((b) => {
                    const jp = cari.pupuk(b.jenisPupukId)
                    const rasio = b.masukKg > 0 ? b.sisaKg / b.masukKg : 0
                    return (
                      <Tr key={b.jenisPupukId}>
                        <Td>
                          <p className="font-medium text-tinta">{jp?.nama}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">{jp?.kode}</p>
                        </Td>
                        <Td numerik>{f.rupiah(jp?.het ?? 0)}</Td>
                        <Td numerik>{f.angka(b.masukKg)}</Td>
                        <Td numerik>{f.angka(b.keluarKg)}</Td>
                        <Td numerik className="font-medium">
                          {f.angka(b.sisaKg)}
                        </Td>
                        <Td>
                          {b.sisaKg === 0 ? (
                            <Badge tone="bahaya" titik>
                              Habis
                            </Badge>
                          ) : rasio < 0.2 ? (
                            <Badge tone="peringatan" titik>
                              Menipis
                            </Badge>
                          ) : (
                            <Badge tone="sukses" titik>
                              Aman
                            </Badge>
                          )}
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Tabel>
            </TabelWadah>
          ) : mutasi.length === 0 ? (
            <Kosong judul="Belum ada mutasi stok" />
          ) : (
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Tanggal</Th>
                    <Th>Keterangan</Th>
                    <Th>Jenis pupuk</Th>
                    <Th numerik>Perubahan</Th>
                  </tr>
                </thead>
                <tbody>
                  {mutasi.slice(0, 40).map((m, i) => (
                    <Tr key={`${m.refId}-${m.jenisPupukId}-${i}`}>
                      <Td className="whitespace-nowrap">{f.tanggalSingkat(m.tanggal)}</Td>
                      <Td>
                        <p className="text-tinta">{m.keterangan}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{m.refKode}</p>
                      </Td>
                      <Td className="text-neutral-600">{cari.namaPupuk(m.jenisPupukId)}</Td>
                      <Td
                        numerik
                        className={
                          m.tipe === 'masuk'
                            ? 'font-medium text-emerald-700'
                            : 'font-medium text-neutral-700'
                        }
                      >
                        {m.tipe === 'masuk' ? '+' : '−'}
                        {f.kg(m.jumlahKg)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabel>
            </TabelWadah>
          )}
        </Card>
      </div>
    </>
  )
}
