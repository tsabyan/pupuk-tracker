'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { BarisRingkas, Kosong, PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { Alur, type Langkah } from '@/components/domain/alur'
import { BadgePengiriman } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import { pengirimanDiterima } from '@/lib/domain/status'
import { useDb, usePencari } from '@/lib/hooks'

export default function DetailPengiriman() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()

  const pengiriman = useMemo(() => db.pengiriman.find((p) => p.id === id), [db, id])

  if (!pengiriman) {
    return (
      <Card>
        <Kosong
          judul="Pengiriman tidak ditemukan"
          aksi={<TombolTautan href="/distributor/pengiriman">Kembali ke daftar</TombolTautan>}
        />
      </Card>
    )
  }

  const kios = cari.pengecer(pengiriman.pengecerId)
  const dikirim = pengiriman.items.reduce((t, i) => t + i.jumlahKg, 0)
  const diterima = pengiriman.items.reduce((t, i) => t + (i.jumlahDiterimaKg ?? 0), 0)
  const diterimaKios = pengirimanDiterima(pengiriman.status)

  const langkah: Langkah[] = [
    {
      label: 'Distributor mengirim pupuk',
      keterangan: `${f.tanggal(pengiriman.tanggalKirim)} · faktur ${pengiriman.noFaktur}`,
      status: 'selesai',
    },
    {
      label: 'Notifikasi diterima pengecer',
      keterangan: `${kios?.nama} mendapat pemberitahuan pengiriman`,
      status: 'selesai',
    },
    {
      label:
        pengiriman.status === 'ditolak'
          ? 'Pengecer menolak kiriman'
          : 'Pengecer mengonfirmasi penerimaan',
      keterangan: pengiriman.tanggalKonfirmasi
        ? f.tanggal(pengiriman.tanggalKonfirmasi)
        : 'Menunggu tanggapan kios',
      status:
        pengiriman.status === 'ditolak'
          ? 'gagal'
          : diterimaKios
            ? 'selesai'
            : 'berjalan',
    },
    {
      label: 'Stok pengecer bertambah',
      keterangan: diterimaKios
        ? `${f.kg(diterima)} tercatat masuk ke stok kios`
        : 'Stok belum bertambah sampai kiriman dikonfirmasi',
      status: pengiriman.status === 'ditolak' ? 'gagal' : diterimaKios ? 'selesai' : 'menunggu',
    },
  ]

  return (
    <>
      <TautanKembali href="/distributor/pengiriman">Pengiriman</TautanKembali>
      <PageHeader
        judul={pengiriman.noFaktur}
        keterangan={`Tujuan: ${kios?.nama} · Desa ${cari.namaDesa(kios?.desaId ?? '')}`}
        aksi={<BadgePengiriman status={pengiriman.status} />}
      />

      {pengiriman.status === 'selisih' ? (
        <Peringatan nada="peringatan">
          Kios menerima kiriman ini dengan selisih {f.kg(dikirim - diterima)} dari faktur.
          {pengiriman.catatanPengecer ? ` Catatan kios: ${pengiriman.catatanPengecer}` : ''}
        </Peringatan>
      ) : null}
      {pengiriman.status === 'ditolak' ? (
        <Peringatan nada="bahaya">
          Kiriman ditolak kios.
          {pengiriman.catatanPengecer ? ` Alasan: ${pengiriman.catatanPengecer}` : ''}
        </Peringatan>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              judul="Rincian muatan"
              keterangan={
                diterimaKios
                  ? 'Perbandingan jumlah pada faktur dengan jumlah yang dikonfirmasi kios'
                  : 'Jumlah sesuai faktur pengiriman'
              }
            />
            <TabelWadah>
              <Tabel>
                <thead>
                  <tr>
                    <Th>Jenis pupuk</Th>
                    <Th numerik>Faktur</Th>
                    {diterimaKios ? <Th numerik>Diterima</Th> : null}
                    {diterimaKios ? <Th numerik>Selisih</Th> : null}
                  </tr>
                </thead>
                <tbody>
                  {pengiriman.items.map((i) => {
                    const terima = i.jumlahDiterimaKg ?? 0
                    const beda = terima - i.jumlahKg
                    return (
                      <Tr key={i.jenisPupukId}>
                        <Td>{cari.namaPupuk(i.jenisPupukId)}</Td>
                        <Td numerik>{f.kg(i.jumlahKg)}</Td>
                        {diterimaKios ? <Td numerik>{f.kg(terima)}</Td> : null}
                        {diterimaKios ? (
                          <Td
                            numerik
                            className={beda !== 0 ? 'font-medium text-rose-600' : 'text-neutral-400'}
                          >
                            {beda === 0 ? '—' : f.kg(beda)}
                          </Td>
                        ) : null}
                      </Tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50/80">
                    <Td className="font-semibold">Total</Td>
                    <Td numerik className="font-semibold">
                      {f.kg(dikirim)}
                    </Td>
                    {diterimaKios ? (
                      <Td numerik className="font-semibold">
                        {f.kg(diterima)}
                      </Td>
                    ) : null}
                    {diterimaKios ? (
                      <Td numerik className="font-semibold">
                        {diterima - dikirim === 0 ? '—' : f.kg(diterima - dikirim)}
                      </Td>
                    ) : null}
                  </tr>
                </tfoot>
              </Tabel>
            </TabelWadah>
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
              <BarisRingkas label="Pengecer">{kios?.nama ?? '—'}</BarisRingkas>
              <BarisRingkas label="Tanggal kirim">
                {f.tanggal(pengiriman.tanggalKirim)}
              </BarisRingkas>
              {pengiriman.tanggalKonfirmasi ? (
                <BarisRingkas label="Tanggal konfirmasi">
                  {f.tanggal(pengiriman.tanggalKonfirmasi)}
                </BarisRingkas>
              ) : null}
              {pengiriman.alokasiId ? (
                <BarisRingkas label="Dasar alokasi">
                  {db.alokasi.find((a) => a.id === pengiriman.alokasiId)?.kode ?? '—'}
                </BarisRingkas>
              ) : null}
            </dl>
            {pengiriman.catatanPengecer ? (
              <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                <p className="text-xs font-medium text-neutral-500">Catatan pengecer</p>
                <p className="mt-1 text-sm text-neutral-700">{pengiriman.catatanPengecer}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
