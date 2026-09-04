'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/field'
import { PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { EditorItemPupuk, type BatasItem } from '@/components/domain/item-pupuk'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import { totalKg } from '@/lib/domain/stok'
import type { ItemPupuk } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

export default function HalamanPengirimanBaru() {
  return (
    <Suspense fallback={null}>
      <FormPengiriman />
    </Suspense>
  )
}

function FormPengiriman() {
  const db = useDb()
  const { distributor } = useSesi()
  const cari = usePencari()
  const router = useRouter()
  const params = useSearchParams()
  const { sibuk, galat, jalankan } = useAksi()

  const alokasiAwal = params.get('alokasi') ?? ''

  const kiosBinaan = useMemo(
    () => db.pengecer.filter((p) => p.distributorId === distributor?.id),
    [db, distributor],
  )

  const [pengecerId, setPengecerId] = useState(kiosBinaan[0]?.id ?? '')
  const [alokasiId, setAlokasiId] = useState(alokasiAwal)
  const [tanggalKirim, setTanggalKirim] = useState(f.hariIni())
  const [items, setItems] = useState<ItemPupuk[]>([])

  const alokasiTersedia = useMemo(
    () =>
      db.alokasi.filter(
        (a) =>
          a.distributorId === distributor?.id &&
          a.rincian.some((r) => r.pengecerId === pengecerId),
      ),
    [db, distributor, pengecerId],
  )

  /**
   * Sisa alokasi = jatah kios pada rencana alokasi dikurangi yang sudah
   * pernah dikirim. Menjadi batas atas isian supaya pengiriman tidak
   * melampaui rencana.
   */
  const batas = useMemo<BatasItem[]>(() => {
    const alokasi = db.alokasi.find((a) => a.id === alokasiId)
    if (!alokasi) return []
    const jatah = alokasi.rincian.find((r) => r.pengecerId === pengecerId)
    if (!jatah) return []

    return db.jenisPupuk.map((jp) => {
      const rencana = jatah.items.find((i) => i.jenisPupukId === jp.id)?.jumlahKg ?? 0
      const sudah = db.pengiriman
        .filter(
          (p) =>
            p.alokasiId === alokasi.id &&
            p.pengecerId === pengecerId &&
            p.status !== 'ditolak',
        )
        .reduce(
          (t, p) => t + (p.items.find((i) => i.jenisPupukId === jp.id)?.jumlahKg ?? 0),
          0,
        )
      const sisa = Math.max(0, rencana - sudah)
      return {
        jenisPupukId: jp.id,
        maks: sisa,
        keterangan: `Sisa alokasi ${f.kg(sisa)} dari ${f.kg(rencana)}`,
      }
    })
  }, [db, alokasiId, pengecerId])

  const melebihiBatas = batas.some((b) => {
    const jumlah = items.find((i) => i.jenisPupukId === b.jenisPupukId)?.jumlahKg ?? 0
    return jumlah > b.maks
  })

  const isiSisaAlokasi = () =>
    setItems(
      batas
        .filter((b) => b.maks > 0)
        .map((b) => ({ jenisPupukId: b.jenisPupukId, jumlahKg: b.maks })),
    )

  const kirim = () =>
    void jalankan(
      () =>
        repo.buatPengiriman({
          distributorId: distributor!.id,
          pengecerId,
          alokasiId: alokasiId || undefined,
          tanggalKirim,
          items,
        }),
      (pengiriman) => router.push(`/distributor/pengiriman/${pengiriman.id}`),
    )

  if (!distributor) return null

  const kios = cari.pengecer(pengecerId)

  return (
    <>
      <TautanKembali href="/distributor/pengiriman">Pengiriman</TautanKembali>
      <PageHeader
        langkah="Langkah 3"
        judul="Pengiriman ke Pengecer"
        keterangan="Nomor faktur dan berita acara diterbitkan otomatis saat pengiriman disimpan. Kios tujuan langsung menerima notifikasi."
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader judul="Tujuan & dokumen" />
          <CardBody className="space-y-4">
            <Field label="Pengecer resmi tujuan" wajib>
              <Select
                value={pengecerId}
                onChange={(e) => {
                  setPengecerId(e.target.value)
                  setItems([])
                }}
              >
                {kiosBinaan.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} — {cari.namaDesa(k.desaId)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Dasar rencana alokasi"
              petunjuk="Pilih alokasi agar jumlah kiriman dibatasi sisa jatah kios."
            >
              <Select
                value={alokasiId}
                onChange={(e) => {
                  setAlokasiId(e.target.value)
                  setItems([])
                }}
              >
                <option value="">Tanpa acuan alokasi</option>
                {alokasiTersedia.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.kode} — Kec. {cari.namaKecamatan(a.kecamatanId)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tanggal kirim" wajib>
              <Input
                type="date"
                value={tanggalKirim}
                onChange={(e) => setTanggalKirim(e.target.value)}
              />
            </Field>

            {kios ? (
              <div className="rounded-lg bg-neutral-50 p-3 text-sm">
                <p className="font-medium text-neutral-900">{kios.nama}</p>
                <p className="mt-0.5 text-neutral-600">{kios.alamat}</p>
                <p className="mt-0.5 text-neutral-500">
                  {kios.pemilik} · {kios.telepon}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              judul="Muatan pengiriman"
              keterangan={
                alokasiId
                  ? 'Jumlah dibatasi sisa alokasi kios pada rencana yang dipilih'
                  : 'Tanpa acuan alokasi, jumlah bebas diisi'
              }
              aksi={
                alokasiId ? (
                  <Button varian="garis" ukuran="sm" onClick={isiSisaAlokasi}>
                    Isi sisa alokasi
                  </Button>
                ) : null
              }
            />
            <CardBody className="p-0 sm:p-0">
              <EditorItemPupuk
                jenisPupuk={db.jenisPupuk}
                nilai={items}
                onUbah={setItems}
                batas={alokasiId ? batas : undefined}
              />
            </CardBody>
          </Card>

          {melebihiBatas ? (
            <Peringatan nada="peringatan">
              Ada jumlah yang melebihi sisa alokasi kios. Kurangi jumlahnya atau kirim
              tanpa acuan alokasi.
            </Peringatan>
          ) : null}
          {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">
              Total muatan:{' '}
              <span className="font-semibold text-neutral-900">{f.kg(totalKg(items))}</span>
            </p>
            <div className="flex gap-2">
              <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
                Batal
              </Button>
              <Button
                varian="utama"
                onClick={kirim}
                disabled={sibuk || items.length === 0 || melebihiBatas}
              >
                {sibuk ? 'Mengirim…' : 'Kirim & terbitkan faktur'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
