'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { BarRasio } from '@/components/ui/bar'
import { KartuTren } from '@/components/domain/kartu-tren'
import { Card } from '@/components/ui/card'
import { PageHeader, PanelMetrik, StatCard } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import * as f from '@/lib/domain/format'
import {
  kepatuhanPengecer,
  ringkasanDistribusi,
  serapanPerJenisPupuk,
  serapanPerKecamatan,
} from '@/lib/domain/laporan'
import { useDb, usePencari } from '@/lib/hooks'
import { MUSIM_TANAM, TAHUN_MUSIM } from '@/lib/seed'

type Bagian = 'kecamatan' | 'pupuk' | 'kepatuhan'

export default function LaporanKp3() {
  const db = useDb()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('kecamatan')

  const { ringkas, kecamatan, pupuk, kepatuhan } = useMemo(
    () => ({
      ringkas: ringkasanDistribusi(db),
      kecamatan: serapanPerKecamatan(db),
      pupuk: serapanPerJenisPupuk(db),
      kepatuhan: kepatuhanPengecer(db),
    }),
    [db],
  )

  const perluPerhatian = kepatuhan.filter((k) => k.rasioKepatuhan < 1).length

  return (
    <>
      <PageHeader
        langkah="Langkah 3"
        judul="Laporan & Analitik"
        keterangan={`Rekap distribusi, serapan, dan kepatuhan pengecer resmi untuk musim tanam ${MUSIM_TANAM} ${TAHUN_MUSIM}.`}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <StatCard
            label="Alokasi"
            nilai={f.angka(ringkas.alokasiKg)}
            satuan="kg"
            ikon="ClipboardList"
            aksen="biru"
          />
          <StatCard
            label="Diterima kios"
            nilai={f.angka(ringkas.diterimaKg)}
            satuan="kg"
            ikon="PackageCheck"
            aksen="hijau"
          />
          <StatCard
            label="Kelompok tani terlayani"
            ikon="Users"
            aksen="ungu"
            nilai={f.angka(new Set(db.penyaluran.map((p) => p.poktanId)).size)}
            satuan={`dari ${db.kelompokTani.length}`}
          />
          <StatCard
            label="Kios perlu perhatian"
            ikon="AlertTriangle"
            aksen="merah"
            nilai={f.angka(perluPerhatian)}
            satuan={`dari ${kepatuhan.length}`}
            keterangan="Kepatuhan belum 100%"
          />
        </div>

        <PanelMetrik
          metrik={[
            {
              label: 'Tersalur ke petani',
              ikon: 'Sprout',
              nilai: f.angka(ringkas.disalurkanKg),
              satuan: 'kg',
            },
            {
              label: 'Serapan',
              ikon: 'Activity',
              nilai: f.persen(ringkas.rasioSerapan, 1),
              keterangan: 'Tersalur dibanding alokasi',
            },
            {
              label: 'Stok kios',
              ikon: 'Boxes',
              nilai: f.angka(ringkas.sisaStokKg),
              satuan: 'kg',
            },
          ]}
        />
      </div>

      <KartuTren penyaluran={db.penyaluran} />

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'kecamatan', label: 'Per kecamatan', jumlah: kecamatan.length },
            { nilai: 'pupuk', label: 'Per jenis pupuk', jumlah: pupuk.length },
            { nilai: 'kepatuhan', label: 'Kepatuhan pengecer', jumlah: kepatuhan.length },
          ]}
        />

        {bagian === 'kecamatan' ? (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kecamatan</Th>
                  <Th numerik>Kelompok tani</Th>
                  <Th numerik>Alokasi</Th>
                  <Th numerik>Tersalur</Th>
                  <Th numerik>Stok kios</Th>
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
                    <Td numerik>{f.angka(k.sisaStokKg)}</Td>
                    <Td>
                      <BarRasio rasio={k.rasioSerapan} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50">
                  <Td className="font-semibold text-tinta">Total</Td>
                  <Td numerik className="font-semibold">
                    {db.kelompokTani.length}
                  </Td>
                  <Td numerik className="font-semibold">
                    {f.angka(ringkas.alokasiKg)}
                  </Td>
                  <Td numerik className="font-semibold">
                    {f.angka(ringkas.disalurkanKg)}
                  </Td>
                  <Td numerik className="font-semibold">
                    {f.angka(ringkas.sisaStokKg)}
                  </Td>
                  <Td className="font-semibold">{f.persen(ringkas.rasioSerapan, 0)}</Td>
                </tr>
              </tfoot>
            </Tabel>
          </TabelWadah>
        ) : null}

        {bagian === 'pupuk' ? (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Jenis pupuk</Th>
                  <Th numerik>Hak RDKK</Th>
                  <Th numerik>Alokasi</Th>
                  <Th numerik>Tersalur</Th>
                  <Th numerik>Stok kios</Th>
                  <Th className="w-44">Realisasi thd RDKK</Th>
                </tr>
              </thead>
              <tbody>
                {pupuk.map((p) => (
                  <Tr key={p.jenisPupukId}>
                    <Td>
                      <p className="font-medium text-tinta">
                        {cari.namaPupuk(p.jenisPupukId)}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        HET {f.rupiah(cari.pupuk(p.jenisPupukId)?.het ?? 0)} / kg
                      </p>
                    </Td>
                    <Td numerik>{f.angka(p.hakRdkkKg)}</Td>
                    <Td numerik>{f.angka(p.alokasiKg)}</Td>
                    <Td numerik>{f.angka(p.disalurkanKg)}</Td>
                    <Td numerik>{f.angka(p.sisaStokKg)}</Td>
                    <Td>
                      <BarRasio rasio={p.hakRdkkKg > 0 ? p.disalurkanKg / p.hakRdkkKg : 0} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWadah>
        ) : null}

        {bagian === 'kepatuhan' ? (
          <>
            <p className="border-b border-garis px-5 py-3.5 text-sm text-neutral-500 sm:px-6">
              Diurutkan dari yang paling perlu perhatian. Patuh = penyaluran punya bukti
              serah terima dan konfirmasi kelompok tani.
            </p>
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Pengecer</Th>
                    <Th numerik>Penyaluran</Th>
                    <Th numerik>Dikonfirmasi</Th>
                    <Th numerik>Tervalidasi</Th>
                    <Th>Temuan</Th>
                    <Th className="w-44">Kepatuhan</Th>
                  </tr>
                </thead>
                <tbody>
                  {kepatuhan.map((k) => {
                    const kios = cari.pengecer(k.pengecerId)
                    return (
                      <Tr key={k.pengecerId}>
                        <Td>
                          <p className="font-medium text-tinta">{kios?.nama}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {kios?.kode} · Desa {cari.namaDesa(kios?.desaId ?? '')}
                          </p>
                        </Td>
                        <Td numerik>{k.totalPenyaluran}</Td>
                        <Td numerik>{k.dikonfirmasiPoktan}</Td>
                        <Td numerik>{k.tervalidasi}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-1.5">
                            {k.bermasalah > 0 ? (
                              <Badge tone="bahaya" titik>
                                {k.bermasalah} bermasalah
                              </Badge>
                            ) : null}
                            {k.selisihPenerimaan > 0 ? (
                              <Badge tone="peringatan" titik>
                                {k.selisihPenerimaan} selisih
                              </Badge>
                            ) : null}
                            {k.bermasalah === 0 && k.selisihPenerimaan === 0 ? (
                              <span className="text-sm text-neutral-400">—</span>
                            ) : null}
                          </div>
                        </Td>
                        <Td>
                          <BarRasio
                            rasio={k.rasioKepatuhan}
                            nada={k.rasioKepatuhan < 0.9 ? 'peringatan' : 'aksen'}
                          />
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Tabel>
            </TabelWadah>
          </>
        ) : null}
      </Card>
    </>
  )
}
