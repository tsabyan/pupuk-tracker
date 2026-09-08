'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { BarRasio } from '@/components/ui/bar'
import { TombolTautan } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Kosong, PageHeader, PanelMetrik, StatCard } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import {
  LABEL_ASPEK,
  cakupanPengawasan,
  penandaPenapisan,
  penapisanPenyaluran,
} from '@/lib/domain/pengawasan'
import { penyaluranSelesai } from '@/lib/domain/status'
import type { Penyaluran } from '@/lib/domain/types'
import { useDb, usePencari } from '@/lib/hooks'

type Bagian = 'bertanda' | 'belum' | 'diperiksa'

interface BarisObjek {
  trx: Penyaluran
  penanda: string[]
}

export default function ObjekPengawasan() {
  const db = useDb()
  const cari = usePencari()
  const [bagian, setBagian] = useState<Bagian>('bertanda')

  const { bertanda, belum, diperiksa, cakupan } = useMemo(() => {
    const hariIni = f.hariIni()

    const baris: BarisObjek[] = db.penyaluran
      .filter((p) => penyaluranSelesai(p.status))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .map((trx) => ({
        trx,
        penanda: penandaPenapisan(
          penapisanPenyaluran(trx, {
            poktan: cari.poktan(trx.poktanId),
            rdkk: cari.rdkkPoktan(trx.poktanId),
            penyaluranPoktan: db.penyaluran.filter((x) => x.poktanId === trx.poktanId),
            het: (id) => cari.pupuk(id)?.het ?? 0,
            namaPupuk: cari.namaPupuk,
            hariIni,
          }),
        ).map((b) => LABEL_ASPEK[b.aspek]),
      }))

    return {
      bertanda: baris.filter((b) => b.penanda.length > 0 && !b.trx.pengawasan),
      belum: baris.filter((b) => b.penanda.length === 0 && !b.trx.pengawasan),
      diperiksa: baris.filter((b) => Boolean(b.trx.pengawasan)),
      cakupan: cakupanPengawasan(db.penyaluran),
    }
  }, [db, cari])

  const tampil =
    bagian === 'bertanda' ? bertanda : bagian === 'belum' ? belum : diperiksa

  return (
    <>
      <PageHeader
        langkah="Langkah 2"
        judul="Objek Pengawasan"
        keterangan="Sistem menapis seluruh transaksi selesai terhadap tujuh tepat, lalu menandai yang layak diperiksa. Pengawas memilih objeknya — transaksi tidak menunggu persetujuan siapa pun untuk sah."
        aksi={
          <TombolTautan href="/kp3/pemeriksaan/baru" varian="utama">
            Catat pemeriksaan
          </TombolTautan>
        }
      />

      <div className="grid *:min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <StatCard
            label="Bertanda penapisan"
            nilai={f.angka(bertanda.length)}
            satuan="transaksi"
            ikon="AlertTriangle"
            aksen="merah"
            keterangan="Ada butir tujuh tepat yang tidak terpenuhi"
          />
          <StatCard
            label="Disanggah kelompok tani"
            nilai={f.angka(db.penyaluran.filter((p) => p.status === 'disanggah').length)}
            satuan="transaksi"
            ikon="Scale"
            aksen="jingga"
            keterangan="Penerima menyatakan tidak sesuai"
          />
          <StatCard
            label="Sudah diperiksa"
            nilai={f.angka(cakupan.diperiksa)}
            satuan={`dari ${cakupan.selesai}`}
            ikon="ClipboardCheck"
            aksen="hijau"
            keterangan="Telaah dokumen atau uji petik lapangan"
          />
          <StatCard
            label="Temuan terbuka"
            nilai={f.angka(db.temuan.filter((t) => t.status === 'terbuka').length)}
            satuan="temuan"
            ikon="Megaphone"
            aksen="ungu"
            keterangan="Belum ada tindak lanjut yang menanganinya"
          />
        </div>

        <PanelMetrik
          metrik={[
            {
              label: 'Cakupan pengawasan',
              ikon: 'ScanSearch',
              nilai: f.persen(cakupan.rasio, 1),
              keterangan: 'Uji petik — angka di bawah 100% adalah hal wajar',
            },
            {
              label: 'Transaksi selesai',
              ikon: 'CheckCircle2',
              nilai: f.angka(cakupan.selesai),
              satuan: 'transaksi',
              keterangan: 'Tuntas antara kios dan kelompok tani',
            },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        <Tabs
          aktif={bagian}
          onPilih={setBagian}
          daftar={[
            { nilai: 'bertanda', label: 'Bertanda penapisan', jumlah: bertanda.length },
            { nilai: 'belum', label: 'Bersih, belum diperiksa', jumlah: belum.length },
            { nilai: 'diperiksa', label: 'Sudah diperiksa', jumlah: diperiksa.length },
          ]}
        />

        <p className="border-b border-garis px-5 py-3.5 text-sm leading-relaxed text-neutral-500 sm:px-6">
          {bagian === 'bertanda'
            ? 'Prioritas pemilihan objek: penanda muncul dari data sistem, bukan dari dugaan.'
            : bagian === 'belum'
              ? 'Lolos penapisan dan belum pernah masuk uji petik. Boleh saja tetap begitu sampai musim berakhir.'
              : 'Sudah tersentuh telaah dokumen atau menjadi sampel pemeriksaan lapangan.'}
        </p>

        {tampil.length === 0 ? (
          <Kosong
            judul="Tidak ada transaksi pada bagian ini"
            keterangan="Coba bagian lain, atau catat pemeriksaan lapangan atas objek yang dipilih sendiri."
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
                  <Th numerik>Jumlah</Th>
                  <Th>Penanda penapisan</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {tampil.slice(0, 40).map(({ trx, penanda }) => (
                  <Tr key={trx.id}>
                    <Td>
                      <Link
                        href={`/kp3/objek/${trx.id}`}
                        className="font-medium text-tinta hover:underline"
                      >
                        {trx.noTransaksi}
                      </Link>
                    </Td>
                    <Td>{cari.namaPengecer(trx.pengecerId)}</Td>
                    <Td>{cari.namaPoktan(trx.poktanId)}</Td>
                    <Td className="whitespace-nowrap">{f.tanggalSingkat(trx.tanggal)}</Td>
                    <Td numerik>{f.kg(trx.items.reduce((t, i) => t + i.jumlahKg, 0))}</Td>
                    <Td>
                      {penanda.length === 0 ? (
                        <span className="text-sm text-neutral-400">Bersih</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {penanda.map((label) => (
                            <Badge key={label} tone="bahaya" titik>
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-col items-start gap-1.5">
                        <BadgePenyaluran status={trx.status} />
                        {trx.pengawasan ? (
                          <Badge
                            tone={trx.pengawasan.hasil === 'sesuai' ? 'sukses' : 'bahaya'}
                          >
                            {trx.pengawasan.hasil === 'sesuai'
                              ? 'Diperiksa'
                              : 'Bertemuan'}
                          </Badge>
                        ) : null}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWadah>
        )}
      </Card>

      <Card>
        <div className="px-6 py-5 sm:px-7">
          <p className="text-sm font-medium text-tinta">Cakupan per musim tanam</p>
          <p className="mt-1 mb-3 text-sm leading-relaxed text-neutral-500">
            Yang dinilai pada pengawasan uji petik adalah kecukupan cakupan dan
            mutu pemeriksaannya, bukan habisnya antrian.
          </p>
          <BarRasio rasio={cakupan.rasio} />
        </div>
      </Card>
    </>
  )
}
