'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, RadioKartu, Select, Textarea } from '@/components/ui/field'
import { PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { EditorItemPupuk, type BatasItem } from '@/components/domain/item-pupuk'
import { FotoUpload } from '@/components/domain/foto-upload'
import { TtdPad } from '@/components/domain/ttd-pad'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import { hitungSisaHak, hitungStokPengecer, totalKg } from '@/lib/domain/stok'
import type { ItemPupuk, MetodeBayar } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

export default function FormPenyaluran() {
  const db = useDb()
  const { pengecer } = useSesi()
  const cari = usePencari()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()

  const poktanBinaan = useMemo(
    () => db.kelompokTani.filter((k) => k.pengecerId === pengecer?.id),
    [db, pengecer],
  )

  const [poktanId, setPoktanId] = useState(poktanBinaan[0]?.id ?? '')
  const [tanggal, setTanggal] = useState(f.hariIni())
  const [metodeBayar, setMetodeBayar] = useState<MetodeBayar>('tunai')
  const [items, setItems] = useState<ItemPupuk[]>([])
  const [ttdPenerima, setTtdPenerima] = useState<string | undefined>()
  const [fotoStruk, setFotoStruk] = useState<string | undefined>()
  const [catatan, setCatatan] = useState('')

  /**
   * Batas isian = yang lebih kecil antara sisa hak RDKK kelompok tani dan
   * sisa stok kios. Dua pagar inilah yang membuat penyaluran tetap tepat
   * sasaran sekaligus tidak melebihi barang yang benar-benar ada.
   */
  const batas = useMemo<BatasItem[]>(() => {
    if (!pengecer || !poktanId) return []
    const rdkk = cari.rdkkPoktan(poktanId)
    const hak = hitungSisaHak(
      rdkk,
      db.penyaluran.filter((p) => p.poktanId === poktanId),
    )
    const stok = hitungStokPengecer(pengecer.id, db.pengiriman, db.penyaluran)

    return db.jenisPupuk.map((jp) => {
      const sisaHak = hak.find((h) => h.jenisPupukId === jp.id)?.sisaKg ?? 0
      const sisaStok = stok.find((s) => s.jenisPupukId === jp.id)?.sisaKg ?? 0
      return {
        jenisPupukId: jp.id,
        maks: Math.min(sisaHak, sisaStok),
        keterangan: `Sisa hak RDKK ${f.kg(sisaHak)} · stok kios ${f.kg(sisaStok)}`,
      }
    })
  }, [db, cari, pengecer, poktanId])

  const melebihiBatas = batas.some((b) => {
    const jumlah = items.find((i) => i.jenisPupukId === b.jenisPupukId)?.jumlahKg ?? 0
    return jumlah > b.maks
  })

  const total = items.reduce((t, i) => {
    const jp = cari.pupuk(i.jenisPupukId)
    return t + i.jumlahKg * (jp?.het ?? 0)
  }, 0)

  const poktan = cari.poktan(poktanId)
  const rdkk = cari.rdkkPoktan(poktanId)

  const simpan = () =>
    void jalankan(
      () =>
        repo.buatPenyaluran({
          pengecerId: pengecer!.id,
          poktanId,
          tanggal,
          metodeBayar,
          items,
          ttdPenerima,
          fotoStruk,
          catatan,
        }),
      (penyaluran) => router.push(`/pengecer/penyaluran/${penyaluran.id}`),
    )

  if (!pengecer) return null

  return (
    <>
      <TautanKembali href="/pengecer/penyaluran">Penyaluran</TautanKembali>
      <PageHeader
        langkah="Langkah 4 & 5"
        judul="Catat Penyaluran ke Kelompok Tani"
        keterangan="Jumlah dibatasi hak RDKK kelompok tani dan sisa stok kios. Bukti serah terima disimpan bersama transaksi."
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader judul="Penerima & transaksi" />
          <CardBody className="space-y-4">
            <Field label="Kelompok tani" wajib>
              <Select
                value={poktanId}
                onChange={(e) => {
                  setPoktanId(e.target.value)
                  setItems([])
                }}
              >
                {poktanBinaan.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} — {cari.namaDesa(k.desaId)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tanggal penyaluran" wajib>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </Field>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                Metode pembayaran
              </span>
              <RadioKartu
                nilai={metodeBayar}
                onPilih={setMetodeBayar}
                pilihan={[
                  { nilai: 'tunai', label: 'Tunai' },
                  { nilai: 'kartu_tani', label: 'Kartu Tani' },
                ]}
              />
            </div>

            {poktan ? (
              <div className="rounded-lg bg-neutral-50 p-3 text-sm">
                <p className="font-medium text-neutral-900">{poktan.nama}</p>
                <p className="mt-0.5 text-neutral-600">
                  Ketua: {poktan.ketua} · {poktan.jumlahAnggota} anggota
                </p>
                <p className="mt-0.5 text-neutral-500">
                  Desa {cari.namaDesa(poktan.desaId)} · {poktan.luasLahanHa} ha
                </p>
                {rdkk ? (
                  <p className="mt-1.5 text-xs text-neutral-500">RDKK {rdkk.kode}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-rose-600">
                    Belum ada RDKK — penyaluran tidak dapat dicatat.
                  </p>
                )}
              </div>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              judul="Pupuk yang disalurkan"
              keterangan="Harga mengikuti Harga Eceran Tertinggi yang berlaku"
            />
            <CardBody className="p-0 sm:p-0">
              <EditorItemPupuk
                jenisPupuk={db.jenisPupuk}
                nilai={items}
                onUbah={setItems}
                batas={batas}
                tampilkanHarga
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              judul="Bukti penyaluran"
              keterangan="Tanda tangan penerima dan foto struk menjadi dasar validasi Pengawas KP3"
            />
            <CardBody className="grid gap-5 sm:grid-cols-2">
              <TtdPad
                nilai={ttdPenerima}
                onUbah={setTtdPenerima}
                label="Tanda tangan penerima"
              />
              <FotoUpload
                nilai={fotoStruk}
                onUbah={setFotoStruk}
                label="Foto struk / serah terima"
                petunjuk="Opsional, tetapi sangat disarankan sebagai bukti."
              />
              <Field label="Catatan" className="sm:col-span-2">
                <Textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: diserahkan di kios, disaksikan pengurus kelompok."
                />
              </Field>
            </CardBody>
          </Card>

          {melebihiBatas ? (
            <Peringatan nada="peringatan">
              Ada jumlah yang melebihi hak RDKK atau sisa stok. Kurangi jumlahnya sebelum
              menyimpan.
            </Peringatan>
          ) : null}
          {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-neutral-600">
              <p>
                Total: <span className="font-semibold text-neutral-900">{f.kg(totalKg(items))}</span>
              </p>
              <p>
                Nilai transaksi:{' '}
                <span className="font-semibold text-neutral-900">{f.rupiah(total)}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
                Batal
              </Button>
              <Button
                varian="utama"
                onClick={simpan}
                disabled={sibuk || items.length === 0 || melebihiBatas || !rdkk}
              >
                {sibuk ? 'Menyimpan…' : 'Simpan penyaluran'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
