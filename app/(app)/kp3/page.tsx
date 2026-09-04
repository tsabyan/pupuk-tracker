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
import { BadgePengiriman, BadgePenyaluran } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import { ringkasanDistribusi, serapanPerKecamatan } from '@/lib/domain/laporan'
import { useDb, usePencari, useSesi } from '@/lib/hooks'

type Bagian = 'perhatian' | 'kecamatan' | 'aktivitas'

export default function MonitoringKp3() {
  const db = useDb()
  const { pengawas } = useSesi()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('perhatian')

  const { ringkas, kecamatan, aktivitas, anomali } = useMemo(() => {
    const penyaluran = db.penyaluran.map((p) => ({
      tipe: 'penyaluran' as const,
      id: p.id,
      tanggal: p.tanggal,
      data: p,
    }))
    const pengiriman = db.pengiriman.map((p) => ({
      tipe: 'pengiriman' as const,
      id: p.id,
      tanggal: p.tanggalKirim,
      data: p,
    }))

    return {
      ringkas: ringkasanDistribusi(db),
      kecamatan: serapanPerKecamatan(db),
      aktivitas: [...penyaluran, ...pengiriman]
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, 10),
      anomali: db.penyaluran
        .filter((p) => p.status === 'bermasalah' || p.konfirmasi?.kesesuaian === 'tidak_sesuai')
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    }
  }, [db])

  if (!pengawas) return null

  return (
    <>
      <PageHeader
        langkah="Langkah 1"
        judul="Monitoring Real-time"
        meta={
          <>
            <span className="font-medium text-tinta">{pengawas.instansi}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>{pengawas.jabatan}</span>
          </>
        }
        aksi={
          <>
            <TombolTautan href="/kp3/laporan">Laporan</TombolTautan>
            <TombolTautan href="/kp3/validasi" varian="utama">
              Antrian validasi
            </TombolTautan>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <StatCard
            label="Menunggu validasi"
            nilai={f.angka(ringkas.menungguValidasi)}
            satuan="transaksi"
            ikon="ShieldCheck"
            aksen="biru"
            keterangan="Sudah dikonfirmasi kelompok tani"
          />
          <StatCard
            label="Transaksi bermasalah"
            nilai={f.angka(ringkas.bermasalah)}
            satuan="transaksi"
            ikon="AlertTriangle"
            aksen="merah"
            keterangan={
              ringkas.bermasalah > 0 ? 'Perlu tindak lanjut' : 'Tidak ada temuan aktif'
            }
          />
          <StatCard
            label="Kiriman belum dikonfirmasi kios"
            nilai={f.angka(ringkas.menungguKonfirmasiKios)}
            satuan="faktur"
            ikon="Truck"
            aksen="jingga"
            keterangan="Barang belum tercatat masuk gudang"
          />
          <StatCard
            label="Selisih penerimaan"
            nilai={f.angka(db.pengiriman.filter((p) => p.status === 'selisih').length)}
            satuan="faktur"
            ikon="Scale"
            aksen="ungu"
            keterangan="Jumlah terima berbeda dari faktur"
          />
        </div>

        <PanelMetrik
          metrik={[
            {
              label: 'Total alokasi',
              ikon: 'ClipboardList',
              nilai: f.angka(ringkas.alokasiKg),
              satuan: 'kg',
            },
            {
              label: 'Tersalur ke kelompok tani',
              ikon: 'Sprout',
              nilai: f.angka(ringkas.disalurkanKg),
              satuan: 'kg',
              keterangan: `Serapan ${f.persen(ringkas.rasioSerapan, 1)}`,
            },
            {
              label: 'Stok tertahan di kios',
              ikon: 'Boxes',
              nilai: f.angka(ringkas.sisaStokKg),
              satuan: 'kg',
              keterangan: 'Belum sampai ke petani',
            },
          ]}
        />
      </div>

      <KartuTren
        penyaluran={db.penyaluran}
        keterangan="Penyaluran seluruh kios di wilayah pengawasan, 30 hari terakhir"
      />

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'perhatian', label: 'Perlu perhatian', jumlah: anomali.length },
            { nilai: 'kecamatan', label: 'Serapan kecamatan', jumlah: kecamatan.length },
            { nilai: 'aktivitas', label: 'Aktivitas terbaru', jumlah: aktivitas.length },
          ]}
        />

        {bagian === 'perhatian' ? (
          anomali.length === 0 ? (
            <Kosong
              judul="Tidak ada transaksi bermasalah"
              keterangan="Semua penyaluran sesuai dan tidak ada keberatan dari kelompok tani."
            />
          ) : (
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>No. transaksi</Th>
                    <Th>Kios</Th>
                    <Th>Kelompok tani</Th>
                    <Th>Tanggal</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {anomali.map((p) => (
                    <Tr key={p.id}>
                      <Td>
                        <Link
                          href={`/kp3/validasi/${p.id}`}
                          className="font-medium text-tinta hover:underline"
                        >
                          {p.noTransaksi}
                        </Link>
                      </Td>
                      <Td>{cari.namaPengecer(p.pengecerId)}</Td>
                      <Td>{cari.namaPoktan(p.poktanId)}</Td>
                      <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggal)}</Td>
                      <Td>
                        <BadgePenyaluran status={p.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabel>
            </TabelWadah>
          )
        ) : null}

        {bagian === 'kecamatan' ? (
          <>
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Kecamatan</Th>
                    <Th numerik>Poktan</Th>
                    <Th numerik>Alokasi</Th>
                    <Th numerik>Tersalur</Th>
                    <Th className="w-44">Serapan</Th>
                  </tr>
                </thead>
                <tbody>
                  {kecamatan.map((k) => (
                    <Tr key={k.kecamatanId}>
                      <Td className="font-medium text-tinta">
                        {cari.namaKecamatan(k.kecamatanId)}
                      </Td>
                      <Td numerik>{k.jumlahPoktan}</Td>
                      <Td numerik>{f.angka(k.alokasiKg)}</Td>
                      <Td numerik>{f.angka(k.disalurkanKg)}</Td>
                      <Td>
                        <BarRasio rasio={k.rasioSerapan} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Tabel>
            </TabelWadah>
            <KakiKartu>
              <Link
                href="/kp3/laporan"
                className="text-sm font-medium text-tinta hover:underline"
              >
                Laporan lengkap
              </Link>
            </KakiKartu>
          </>
        ) : null}

        {bagian === 'aktivitas' ? (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Kegiatan</Th>
                  <Th>Pihak</Th>
                  <Th numerik>Jumlah</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {aktivitas.map((a) => (
                  <Tr key={`${a.tipe}-${a.id}`}>
                    <Td className="whitespace-nowrap">{f.tanggalSingkat(a.tanggal)}</Td>
                    <Td>
                      <p className="text-tinta">
                        {a.tipe === 'pengiriman'
                          ? 'Pengiriman ke kios'
                          : 'Penyaluran ke kelompok tani'}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {a.tipe === 'pengiriman' ? a.data.noFaktur : a.data.noTransaksi}
                      </p>
                    </Td>
                    <Td className="text-neutral-600">
                      {a.tipe === 'pengiriman'
                        ? `${cari.namaDistributor(a.data.distributorId)} → ${cari.namaPengecer(a.data.pengecerId)}`
                        : `${cari.namaPengecer(a.data.pengecerId)} → ${cari.namaPoktan(a.data.poktanId)}`}
                    </Td>
                    <Td numerik>{f.kg(a.data.items.reduce((t, i) => t + i.jumlahKg, 0))}</Td>
                    <Td>
                      {a.tipe === 'pengiriman' ? (
                        <BadgePengiriman status={a.data.status} />
                      ) : (
                        <BadgePenyaluran status={a.data.status} />
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWadah>
        ) : null}
      </Card>
    </>
  )
}
