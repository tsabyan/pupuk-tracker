'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, RadioKartu, Select, Textarea } from '@/components/ui/field'
import { PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import type { JenisTindakLanjut, SasaranTindakLanjut } from '@/lib/domain/types'
import { useDb, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

export default function HalamanTindakLanjutBaru() {
  return (
    <Suspense fallback={null}>
      <FormTindakLanjut />
    </Suspense>
  )
}

function FormTindakLanjut() {
  const db = useDb()
  const { pengawas } = useSesi()
  const router = useRouter()
  const params = useSearchParams()
  const { sibuk, galat, jalankan } = useAksi()

  /** Datang dari halaman validasi: sasaran diisi dari kios pada transaksi. */
  const asalPenyaluran = useMemo(
    () => db.penyaluran.find((p) => p.id === params.get('penyaluran')),
    [db, params],
  )

  const [jenis, setJenis] = useState<JenisTindakLanjut>(
    asalPenyaluran ? 'teguran' : 'rekomendasi',
  )
  const [sasaranTipe, setSasaranTipe] = useState<SasaranTindakLanjut>('pengecer')
  const [sasaranId, setSasaranId] = useState(
    asalPenyaluran?.pengecerId ?? db.pengecer[0]?.id ?? '',
  )
  const [tanggal, setTanggal] = useState(f.hariIni())
  const [judul, setJudul] = useState(
    asalPenyaluran ? `Teguran atas penyaluran ${asalPenyaluran.noTransaksi}` : '',
  )
  const [isi, setIsi] = useState(
    asalPenyaluran?.validasi?.catatan
      ? `Hasil validasi: ${asalPenyaluran.validasi.catatan}`
      : '',
  )
  const [inspeksiId, setInspeksiId] = useState('')

  const pilihanSasaran =
    sasaranTipe === 'pengecer'
      ? db.pengecer
      : sasaranTipe === 'poktan'
        ? db.kelompokTani
        : db.distributor

  const gantiSasaranTipe = (tipe: SasaranTindakLanjut) => {
    setSasaranTipe(tipe)
    const daftar =
      tipe === 'pengecer' ? db.pengecer : tipe === 'poktan' ? db.kelompokTani : db.distributor
    setSasaranId(daftar[0]?.id ?? '')
  }

  const simpan = () =>
    void jalankan(
      () =>
        repo.buatTindakLanjut({
          pengawasId: pengawas!.id,
          jenis,
          sasaranTipe,
          sasaranId,
          judul,
          isi,
          tanggal,
          refTipe: inspeksiId ? 'inspeksi' : asalPenyaluran ? 'validasi' : undefined,
          refId: inspeksiId || asalPenyaluran?.id,
        }),
      () => router.push('/kp3/tindak-lanjut'),
    )

  if (!pengawas) return null

  return (
    <>
      <TautanKembali href="/kp3/tindak-lanjut">Tindak Lanjut</TautanKembali>
      <PageHeader
        langkah="Langkah 5"
        judul="Terbitkan Tindak Lanjut"
        keterangan="Teguran, rekomendasi perbaikan, atau penghargaan atas kepatuhan. Sasaran menerima notifikasi begitu diterbitkan."
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader judul="Sasaran" />
          <CardBody className="space-y-4">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                Jenis tindak lanjut
              </span>
              <RadioKartu
                nilai={jenis}
                onPilih={setJenis}
                pilihan={[
                  { nilai: 'teguran', label: 'Teguran' },
                  { nilai: 'rekomendasi', label: 'Rekomendasi' },
                  { nilai: 'penghargaan', label: 'Penghargaan' },
                ]}
              />
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                Jenis pihak
              </span>
              <RadioKartu
                nilai={sasaranTipe}
                onPilih={gantiSasaranTipe}
                pilihan={[
                  { nilai: 'pengecer', label: 'Pengecer resmi' },
                  { nilai: 'poktan', label: 'Kelompok tani' },
                  { nilai: 'distributor', label: 'Distributor' },
                ]}
              />
            </div>

            <Field label="Pihak yang dituju" wajib>
              <Select value={sasaranId} onChange={(e) => setSasaranId(e.target.value)}>
                {pilihanSasaran.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tanggal" wajib>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </Field>

            <Field label="Merujuk hasil inspeksi" petunjuk="Opsional.">
              <Select value={inspeksiId} onChange={(e) => setInspeksiId(e.target.value)}>
                <option value="">Tanpa rujukan inspeksi</option>
                {db.inspeksi.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.kode} — {f.tanggalSingkat(i.tanggal)}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <div className="space-y-4">
          {asalPenyaluran ? (
            <Peringatan nada="peringatan">
              Diterbitkan atas transaksi bermasalah {asalPenyaluran.noTransaksi}.
            </Peringatan>
          ) : null}

          <Card>
            <CardHeader judul="Isi tindak lanjut" />
            <CardBody className="space-y-4">
              <Field label="Judul" wajib>
                <Input
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Teguran tertulis: papan HET tidak terpasang"
                />
              </Field>
              <Field label="Uraian" wajib>
                <Textarea
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  rows={6}
                  placeholder="Uraikan temuan, dasar ketentuan, dan tindakan yang diminta beserta tenggat waktunya."
                />
              </Field>
            </CardBody>
          </Card>

          {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

          <div className="flex justify-end gap-2">
            <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
              Batal
            </Button>
            <Button
              varian="utama"
              onClick={simpan}
              disabled={sibuk || !judul.trim() || !isi.trim()}
            >
              {sibuk ? 'Menerbitkan…' : 'Terbitkan & kirim notifikasi'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
