'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { Kosong, PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import { useAksi } from '@/lib/hooks/aksi'
import { useDb, usePencari, useSesi } from '@/lib/hooks'
import { MUSIM_TANAM, PERIODE_MULAI, PERIODE_SELESAI, TAHUN_MUSIM } from '@/lib/seed'

/** Kunci "<pengecerId>|<jenisPupukId>" → jumlah kg. */
type Rincian = Record<string, number>

export default function FormAlokasi() {
  const db = useDb()
  const { distributor } = useSesi()
  const cari = usePencari()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()

  const kecamatanTersedia = useMemo(
    () => db.kecamatan.filter((k) => distributor?.kecamatanIds.includes(k.id)),
    [db, distributor],
  )

  const [kecamatanId, setKecamatanId] = useState(kecamatanTersedia[0]?.id ?? '')
  const [musimTanam, setMusimTanam] = useState(MUSIM_TANAM)
  const [tahun, setTahun] = useState(TAHUN_MUSIM)
  const [periodeMulai, setPeriodeMulai] = useState(PERIODE_MULAI)
  const [periodeSelesai, setPeriodeSelesai] = useState(PERIODE_SELESAI)
  const [catatan, setCatatan] = useState('')
  const [rincian, setRincian] = useState<Rincian>({})

  const kiosSasaran = useMemo(
    () =>
      db.pengecer.filter((p) => {
        if (p.distributorId !== distributor?.id) return false
        return cari.desa(p.desaId)?.kecamatanId === kecamatanId
      }),
    [db, distributor, cari, kecamatanId],
  )

  const set = (pengecerId: string, jenisPupukId: string, jumlah: number) =>
    setRincian((lama) => ({ ...lama, [`${pengecerId}|${jenisPupukId}`]: jumlah }))

  const ambil = (pengecerId: string, jenisPupukId: string) =>
    rincian[`${pengecerId}|${jenisPupukId}`] ?? 0

  const totalPerPupuk = (jenisPupukId: string) =>
    kiosSasaran.reduce((t, k) => t + ambil(k.id, jenisPupukId), 0)

  const totalKeseluruhan = db.jenisPupuk.reduce((t, jp) => t + totalPerPupuk(jp.id), 0)

  /** Sarankan alokasi dari rekap RDKK kelompok tani binaan masing-masing kios. */
  const isiDariRdkk = () => {
    const baru: Rincian = {}
    for (const kios of kiosSasaran) {
      const poktan = db.kelompokTani.filter((k) => k.pengecerId === kios.id)
      for (const jp of db.jenisPupuk) {
        const jumlah = poktan.reduce((t, p) => {
          const rdkk = cari.rdkkPoktan(p.id)
          return t + (rdkk?.items.find((i) => i.jenisPupukId === jp.id)?.jumlahKg ?? 0)
        }, 0)
        baru[`${kios.id}|${jp.id}`] = Math.round(jumlah / 25) * 25
      }
    }
    setRincian(baru)
  }

  const simpan = () =>
    void jalankan(
      () =>
        repo.buatAlokasi({
          distributorId: distributor!.id,
          kecamatanId,
          musimTanam,
          tahun,
          periodeMulai,
          periodeSelesai,
          catatan: catatan.trim() || undefined,
          rincian: kiosSasaran.map((kios) => ({
            pengecerId: kios.id,
            items: db.jenisPupuk
              .map((jp) => ({ jenisPupukId: jp.id, jumlahKg: ambil(kios.id, jp.id) }))
              .filter((i) => i.jumlahKg > 0),
          })),
        }),
      (alokasi) => router.push(`/distributor/alokasi/${alokasi.id}`),
    )

  if (!distributor) return null

  return (
    <>
      <TautanKembali href="/distributor/alokasi">Rencana Alokasi</TautanKembali>
      <PageHeader
        langkah="Langkah 2"
        judul="Buat Rencana Alokasi"
        keterangan="Tentukan wilayah dan periode, lalu bagikan jumlah per jenis pupuk ke setiap kios resmi binaan."
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader judul="Wilayah & periode" />
          <CardBody className="space-y-4">
            <Field label="Kecamatan" wajib>
              <Select value={kecamatanId} onChange={(e) => setKecamatanId(e.target.value)}>
                {kecamatanTersedia.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Musim tanam" wajib>
                <Select value={musimTanam} onChange={(e) => setMusimTanam(e.target.value)}>
                  <option value="MT-1">MT-1</option>
                  <option value="MT-2">MT-2</option>
                  <option value="MT-3">MT-3</option>
                </Select>
              </Field>
              <Field label="Tahun" wajib>
                <Input
                  type="number"
                  value={tahun}
                  min={2024}
                  max={2030}
                  onChange={(e) => setTahun(Number(e.target.value) || TAHUN_MUSIM)}
                />
              </Field>
            </div>

            <Field label="Periode mulai" wajib>
              <Input
                type="date"
                value={periodeMulai}
                onChange={(e) => setPeriodeMulai(e.target.value)}
              />
            </Field>
            <Field label="Periode selesai" wajib>
              <Input
                type="date"
                value={periodeSelesai}
                onChange={(e) => setPeriodeSelesai(e.target.value)}
              />
            </Field>
            <Field label="Catatan" petunjuk="Opsional, tampil di detail alokasi.">
              <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} />
            </Field>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              judul="Pembagian ke pengecer resmi"
              keterangan={`${kiosSasaran.length} kios di Kecamatan ${cari.namaKecamatan(kecamatanId)}`}
              aksi={
                kiosSasaran.length > 0 ? (
                  <Button varian="garis" ukuran="sm" onClick={isiDariRdkk}>
                    Isi dari rekap RDKK
                  </Button>
                ) : null
              }
            />

            {kiosSasaran.length === 0 ? (
              <Kosong
                judul="Tidak ada kios binaan di kecamatan ini"
                keterangan="Pilih kecamatan lain dalam wilayah kerja Anda."
              />
            ) : (
              <TabelWadah>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Pengecer</Th>
                      {db.jenisPupuk.map((jp) => (
                        <Th key={jp.id} numerik className="w-28">
                          {jp.kode} <span className="font-normal normal-case">(kg)</span>
                        </Th>
                      ))}
                      <Th numerik>Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {kiosSasaran.map((kios) => {
                      const totalKios = db.jenisPupuk.reduce(
                        (t, jp) => t + ambil(kios.id, jp.id),
                        0,
                      )
                      return (
                        <Tr key={kios.id}>
                          <Td>
                            <p className="font-medium text-neutral-900">{kios.nama}</p>
                            <p className="text-xs text-neutral-500">
                              {kios.kode} · Desa {cari.namaDesa(kios.desaId)}
                            </p>
                          </Td>
                          {db.jenisPupuk.map((jp) => (
                            <Td key={jp.id} numerik>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={25}
                                placeholder="0"
                                aria-label={`${jp.nama} untuk ${kios.nama}`}
                                value={ambil(kios.id, jp.id) || ''}
                                onChange={(e) =>
                                  set(kios.id, jp.id, Math.max(0, Number(e.target.value) || 0))
                                }
                                className="text-right"
                              />
                            </Td>
                          ))}
                          <Td numerik className="font-medium">
                            {f.angka(totalKios)}
                          </Td>
                        </Tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-50/80">
                      <Td className="font-semibold">Total</Td>
                      {db.jenisPupuk.map((jp) => (
                        <Td key={jp.id} numerik className="font-semibold">
                          {f.angka(totalPerPupuk(jp.id))}
                        </Td>
                      ))}
                      <Td numerik className="font-semibold">
                        {f.angka(totalKeseluruhan)}
                      </Td>
                    </tr>
                  </tfoot>
                </Tabel>
              </TabelWadah>
            )}
          </Card>

          {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">
              Total rencana alokasi:{' '}
              <span className="font-semibold text-neutral-900">{f.kg(totalKeseluruhan)}</span>
            </p>
            <div className="flex gap-2">
              <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
                Batal
              </Button>
              <Button
                varian="utama"
                onClick={simpan}
                disabled={sibuk || totalKeseluruhan === 0}
              >
                {sibuk ? 'Menyimpan…' : 'Simpan rencana alokasi'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
