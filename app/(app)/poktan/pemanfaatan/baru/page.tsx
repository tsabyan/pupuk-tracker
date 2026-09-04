'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { EditorItemPupuk } from '@/components/domain/item-pupuk'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import { penyaluranKeluar } from '@/lib/domain/status'
import type { ItemPupuk } from '@/lib/domain/types'
import { useDb, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'
import { MUSIM_TANAM, TAHUN_MUSIM } from '@/lib/seed'

const KOMODITAS = [
  'Padi Sawah',
  'Jagung',
  'Cabai Merah',
  'Kedelai',
  'Bawang Merah',
  'Ubi Kayu',
]

export default function FormPemanfaatan() {
  const db = useDb()
  const { poktan } = useSesi()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()

  const penyaluranPoktan = useMemo(
    () =>
      db.penyaluran
        .filter((p) => p.poktanId === poktan?.id && penyaluranKeluar(p.status))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [db, poktan],
  )

  const [penyaluranId, setPenyaluranId] = useState('')
  const [komoditas, setKomoditas] = useState(KOMODITAS[0])
  const [luasTanamHa, setLuasTanamHa] = useState(poktan ? poktan.luasLahanHa * 0.5 : 0)
  const [tanggalAplikasi, setTanggalAplikasi] = useState(f.hariIni())
  const [dipakai, setDipakai] = useState<ItemPupuk[]>([])
  const [catatan, setCatatan] = useState('')

  /** Salin jumlah dari transaksi penebusan agar tidak perlu diketik ulang. */
  const isiDariPenyaluran = (id: string) => {
    setPenyaluranId(id)
    const trx = db.penyaluran.find((p) => p.id === id)
    setDipakai(
      trx
        ? trx.items.map((i) => ({ jenisPupukId: i.jenisPupukId, jumlahKg: i.jumlahKg }))
        : [],
    )
  }

  const simpan = () =>
    void jalankan(
      () =>
        repo.buatPemanfaatan({
          poktanId: poktan!.id,
          penyaluranId: penyaluranId || undefined,
          periode: `${MUSIM_TANAM} ${TAHUN_MUSIM}`,
          komoditas,
          luasTanamHa,
          dipakai,
          tanggalAplikasi,
          catatan,
        }),
      () => router.push('/poktan/pemanfaatan'),
    )

  if (!poktan) return null

  return (
    <>
      <TautanKembali href="/poktan/pemanfaatan">Pemanfaatan</TautanKembali>
      <PageHeader
        langkah="Langkah 4"
        judul="Laporan Pemanfaatan Pupuk"
        keterangan="Catat penggunaan pupuk bersubsidi di lahan kelompok tani sesuai rekomendasi pemupukan."
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader judul="Data tanam" />
          <CardBody className="space-y-4">
            <Field
              label="Berdasarkan penebusan"
              petunjuk="Opsional. Memilih transaksi akan mengisi jumlah pupuk otomatis."
            >
              <Select
                value={penyaluranId}
                onChange={(e) => isiDariPenyaluran(e.target.value)}
              >
                <option value="">Tanpa acuan transaksi</option>
                {penyaluranPoktan.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.noTransaksi} — {f.tanggalSingkat(p.tanggal)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Komoditas" wajib>
              <Select value={komoditas} onChange={(e) => setKomoditas(e.target.value)}>
                {KOMODITAS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Luas tanam (ha)" wajib petunjuk={`Luas lahan kelompok: ${poktan.luasLahanHa} ha`}>
              <Input
                type="number"
                inputMode="decimal"
                min={0.1}
                step={0.1}
                value={luasTanamHa || ''}
                onChange={(e) => setLuasTanamHa(Number(e.target.value) || 0)}
              />
            </Field>

            <Field label="Tanggal aplikasi" wajib>
              <Input
                type="date"
                value={tanggalAplikasi}
                onChange={(e) => setTanggalAplikasi(e.target.value)}
              />
            </Field>

            <Field label="Catatan">
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: pemupukan susulan tahap pertama, kondisi tanaman baik."
              />
            </Field>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              judul="Pupuk yang dipakai"
              keterangan={
                penyaluranId
                  ? 'Disalin dari transaksi penebusan, boleh disesuaikan'
                  : 'Isi jumlah pupuk yang benar-benar diaplikasikan di lahan'
              }
            />
            <CardBody className="p-0 sm:p-0">
              <EditorItemPupuk
                jenisPupuk={db.jenisPupuk}
                nilai={dipakai}
                onUbah={setDipakai}
              />
            </CardBody>
          </Card>

          {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">
              Dosis rata-rata:{' '}
              <span className="font-semibold text-neutral-900">
                {luasTanamHa > 0
                  ? `${f.angka(dipakai.reduce((t, i) => t + i.jumlahKg, 0) / luasTanamHa)} kg/ha`
                  : '—'}
              </span>
            </p>
            <div className="flex gap-2">
              <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
                Batal
              </Button>
              <Button
                varian="utama"
                onClick={simpan}
                disabled={sibuk || dipakai.length === 0 || luasTanamHa <= 0}
              >
                {sibuk ? 'Menyimpan…' : 'Simpan laporan'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
