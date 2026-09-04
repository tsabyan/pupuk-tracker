'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button, TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/field'
import {
  BarisRingkas,
  Kosong,
  PageHeader,
  Peringatan,
  TautanKembali,
} from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Alur, type Langkah } from '@/components/domain/alur'
import { BadgePengiriman } from '@/components/domain/status-badge'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import { pengirimanDiterima } from '@/lib/domain/status'
import { useDb, usePencari } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

export default function KonfirmasiPenerimaan() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()

  const pengiriman = useMemo(() => db.pengiriman.find((p) => p.id === id), [db, id])

  const [diterima, setDiterima] = useState<Record<string, number>>({})
  const [catatan, setCatatan] = useState('')
  const [modeTolak, setModeTolak] = useState(false)

  if (!pengiriman) {
    return (
      <Card>
        <Kosong
          judul="Pengiriman tidak ditemukan"
          aksi={<TombolTautan href="/pengecer/penerimaan">Kembali ke daftar</TombolTautan>}
        />
      </Card>
    )
  }

  const belumDitanggapi = pengiriman.status === 'dikirim'
  const jumlahDiterima = (jenisPupukId: string, bawaan: number) =>
    diterima[jenisPupukId] ?? bawaan

  const totalFaktur = pengiriman.items.reduce((t, i) => t + i.jumlahKg, 0)
  const totalDiterima = pengiriman.items.reduce(
    (t, i) => t + (belumDitanggapi ? jumlahDiterima(i.jenisPupukId, i.jumlahKg) : (i.jumlahDiterimaKg ?? 0)),
    0,
  )
  const adaSelisih = belumDitanggapi && totalDiterima !== totalFaktur

  const konfirmasi = (tolak: boolean) =>
    void jalankan(
      () =>
        repo.konfirmasiPengiriman(pengiriman.id, {
          tolak,
          catatan,
          diterima: pengiriman.items.map((i) => ({
            jenisPupukId: i.jenisPupukId,
            jumlahDiterimaKg: jumlahDiterima(i.jenisPupukId, i.jumlahKg),
          })),
        }),
      () => router.push('/pengecer/stok'),
    )

  const langkah: Langkah[] = [
    {
      label: 'Distributor mengirim pupuk',
      keterangan: `${cari.namaDistributor(pengiriman.distributorId)} · ${f.tanggal(pengiriman.tanggalKirim)}`,
      status: 'selesai',
    },
    {
      label: 'Pengecer mengecek dan mengonfirmasi',
      keterangan: pengiriman.tanggalKonfirmasi
        ? f.tanggal(pengiriman.tanggalKonfirmasi)
        : 'Menunggu tindakan Anda',
      status:
        pengiriman.status === 'ditolak'
          ? 'gagal'
          : pengirimanDiterima(pengiriman.status)
            ? 'selesai'
            : 'berjalan',
    },
    {
      label: 'Stok pengecer bertambah',
      keterangan: pengirimanDiterima(pengiriman.status)
        ? `${f.kg(totalDiterima)} tercatat di sistem`
        : 'Belum tercatat',
      status: pengiriman.status === 'ditolak'
        ? 'gagal'
        : pengirimanDiterima(pengiriman.status)
          ? 'selesai'
          : 'menunggu',
    },
    {
      label: 'Siap disalurkan ke kelompok tani',
      status: pengirimanDiterima(pengiriman.status) ? 'selesai' : 'menunggu',
    },
  ]

  return (
    <>
      <TautanKembali href="/pengecer/penerimaan">Konfirmasi Penerimaan</TautanKembali>
      <PageHeader
        langkah="Langkah 2"
        judul={pengiriman.noFaktur}
        keterangan={`Dari ${cari.namaDistributor(pengiriman.distributorId)} · Berita acara ${pengiriman.noBeritaAcara}`}
        aksi={<BadgePengiriman status={pengiriman.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              judul={belumDitanggapi ? 'Cek jumlah yang benar-benar diterima' : 'Rincian penerimaan'}
              keterangan={
                belumDitanggapi
                  ? 'Ubah angka bila jumlah fisik berbeda dari faktur. Selisih wajib disertai catatan.'
                  : undefined
              }
            />
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Jenis pupuk</Th>
                    <Th numerik>Faktur</Th>
                    <Th numerik className="w-40">
                      Diterima
                    </Th>
                    <Th numerik>Selisih</Th>
                  </tr>
                </thead>
                <tbody>
                  {pengiriman.items.map((i) => {
                    const terima = belumDitanggapi
                      ? jumlahDiterima(i.jenisPupukId, i.jumlahKg)
                      : (i.jumlahDiterimaKg ?? 0)
                    const beda = terima - i.jumlahKg
                    return (
                      <Tr key={i.jenisPupukId}>
                        <Td>{cari.namaPupuk(i.jenisPupukId)}</Td>
                        <Td numerik>{f.kg(i.jumlahKg)}</Td>
                        <Td numerik>
                          {belumDitanggapi ? (
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={i.jumlahKg}
                              step={25}
                              value={terima}
                              aria-label={`Jumlah diterima ${cari.namaPupuk(i.jenisPupukId)}`}
                              onChange={(e) =>
                                setDiterima((lama) => ({
                                  ...lama,
                                  [i.jenisPupukId]: Math.max(0, Number(e.target.value) || 0),
                                }))
                              }
                              className="text-right"
                            />
                          ) : (
                            f.kg(terima)
                          )}
                        </Td>
                        <Td
                          numerik
                          className={beda !== 0 ? 'font-medium text-rose-600' : 'text-neutral-400'}
                        >
                          {beda === 0 ? '—' : f.kg(beda)}
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50/80">
                    <Td className="font-semibold">Total</Td>
                    <Td numerik className="font-semibold">
                      {f.kg(totalFaktur)}
                    </Td>
                    <Td numerik className="font-semibold">
                      {f.kg(totalDiterima)}
                    </Td>
                    <Td numerik className="font-semibold">
                      {totalDiterima - totalFaktur === 0
                        ? '—'
                        : f.kg(totalDiterima - totalFaktur)}
                    </Td>
                  </tr>
                </tfoot>
              </Tabel>
            </TabelWadah>

            {belumDitanggapi ? (
              <CardBody className="space-y-4 border-t border-neutral-200">
                {adaSelisih ? (
                  <Peringatan nada="peringatan">
                    Jumlah yang Anda catat berbeda {f.kg(Math.abs(totalDiterima - totalFaktur))}{' '}
                    dari faktur. Kiriman akan ditandai &ldquo;diterima dengan selisih&rdquo; dan
                    distributor serta Pengawas KP3 mendapat pemberitahuan.
                  </Peringatan>
                ) : null}

                <Field
                  label={modeTolak ? 'Alasan penolakan' : 'Catatan penerimaan'}
                  wajib={modeTolak || adaSelisih}
                  petunjuk={
                    modeTolak
                      ? 'Jelaskan mengapa kiriman ditolak seluruhnya.'
                      : 'Kondisi kemasan, kualitas, atau penyebab selisih.'
                  }
                >
                  <Textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder={
                      modeTolak
                        ? 'Contoh: jenis pupuk tidak sesuai pesanan.'
                        : 'Contoh: barang diterima lengkap dan dalam kondisi baik.'
                    }
                  />
                </Field>

                {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

                <div className="flex flex-wrap gap-2">
                  {modeTolak ? (
                    <>
                      <Button
                        varian="bahaya"
                        onClick={() => konfirmasi(true)}
                        disabled={sibuk}
                      >
                        {sibuk ? 'Memproses…' : 'Tolak kiriman ini'}
                      </Button>
                      <Button varian="garis" onClick={() => setModeTolak(false)} disabled={sibuk}>
                        Batal
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button varian="utama" onClick={() => konfirmasi(false)} disabled={sibuk}>
                        {sibuk ? 'Menyimpan…' : 'Konfirmasi penerimaan'}
                      </Button>
                      <Button varian="garis" onClick={() => setModeTolak(true)} disabled={sibuk}>
                        Tolak kiriman
                      </Button>
                    </>
                  )}
                </div>
              </CardBody>
            ) : null}
          </Card>

          <Card>
            <CardHeader judul="Posisi pada alur distribusi" />
            <CardBody>
              <Alur langkah={langkah} />
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader judul="Dokumen" />
          <CardBody>
            <dl>
              <BarisRingkas label="No. faktur">{pengiriman.noFaktur}</BarisRingkas>
              <BarisRingkas label="No. berita acara">{pengiriman.noBeritaAcara}</BarisRingkas>
              <BarisRingkas label="Distributor">
                {cari.namaDistributor(pengiriman.distributorId)}
              </BarisRingkas>
              <BarisRingkas label="Tanggal kirim">
                {f.tanggal(pengiriman.tanggalKirim)}
              </BarisRingkas>
              {pengiriman.tanggalKonfirmasi ? (
                <BarisRingkas label="Dikonfirmasi">
                  {f.tanggal(pengiriman.tanggalKonfirmasi)}
                </BarisRingkas>
              ) : null}
            </dl>
            {pengiriman.catatanPengecer ? (
              <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                <p className="text-xs font-medium text-neutral-500">Catatan Anda</p>
                <p className="mt-1 text-sm text-neutral-700">{pengiriman.catatanPengecer}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
