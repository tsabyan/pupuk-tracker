'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button, TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, RadioKartu, Select, Textarea } from '@/components/ui/field'
import {
  BarisRingkas,
  Kosong,
  PageHeader,
  Peringatan,
  TautanKembali,
} from '@/components/ui/misc'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import {
  LABEL_ASPEK,
  LABEL_STATUS_TEMUAN,
  LABEL_TINGKAT,
  NADA_STATUS_TEMUAN,
  NADA_TINGKAT,
} from '@/lib/domain/pengawasan'
import {
  STATUS_TINDAK_LANJUT,
  TRANSISI_TINDAK_LANJUT,
  tindakLanjutTerlambat,
} from '@/lib/domain/status'
import type { EskalasiKe, StatusTindakLanjut } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

const LABEL_ESKALASI: Record<EskalasiKe, string> = {
  dinas: 'Dinas Pertanian dan Ketahanan Pangan',
  satgas_pangan: 'Satgas Pangan',
  aparat_penegak_hukum: 'Aparat penegak hukum',
}

export default function RincianTindakLanjut() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()
  const { pengawas } = useSesi()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()
  const hariIni = f.hariIni()

  const tindak = useMemo(() => db.tindakLanjut.find((t) => t.id === id), [db, id])
  const temuan = useMemo(
    () => db.temuan.filter((t) => tindak?.temuanIds.includes(t.id)),
    [db, tindak],
  )

  const lanjutan: StatusTindakLanjut[] = tindak
    ? TRANSISI_TINDAK_LANJUT[tindak.status]
    : []

  const [status, setStatus] = useState<StatusTindakLanjut>(lanjutan[0] ?? 'selesai')
  const [bukti, setBukti] = useState('')
  const [eskalasiKe, setEskalasiKe] = useState<EskalasiKe>('satgas_pangan')

  if (!tindak) {
    return (
      <Card>
        <Kosong
          judul="Tindak lanjut tidak ditemukan"
          aksi={<TombolTautan href="/kp3/tindak-lanjut">Kembali ke daftar</TombolTautan>}
        />
      </Card>
    )
  }

  const namaSasaran =
    tindak.sasaranTipe === 'pengecer'
      ? cari.namaPengecer(tindak.sasaranId)
      : tindak.sasaranTipe === 'poktan'
        ? cari.namaPoktan(tindak.sasaranId)
        : cari.namaDistributor(tindak.sasaranId)

  const meta = STATUS_TINDAK_LANJUT[tindak.status]
  const lewat = tindakLanjutTerlambat(tindak.status, tindak.tenggat, hariIni)

  const simpan = () =>
    void jalankan(
      () =>
        repo.perbaruiTindakLanjut(tindak.id, {
          status,
          buktiPelaksanaan: bukti,
          eskalasiKe: status === 'eskalasi' ? eskalasiKe : undefined,
        }),
      () => router.push('/kp3/tindak-lanjut'),
    )

  return (
    <>
      <TautanKembali href="/kp3/tindak-lanjut">Tindak Lanjut</TautanKembali>
      <PageHeader
        langkah="Langkah 5"
        judul={tindak.judul}
        meta={
          <>
            <span className="font-medium text-tinta">{tindak.kode}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>{namaSasaran}</span>
          </>
        }
        aksi={
          <>
            <Badge tone={meta.tone} titik>
              {meta.label}
            </Badge>
            {lewat ? <Badge tone="bahaya">Lewat tenggat</Badge> : null}
          </>
        }
      />

      {lewat ? (
        <Peringatan nada="peringatan">
          Tenggat {f.tanggal(tindak.tenggat)} sudah terlampaui dan perbaikannya
          belum dinyatakan selesai. Bila memang tidak ditindaklanjuti,
          eskalasikan ke instansi yang berwenang.
        </Peringatan>
      ) : null}

      <div className="grid *:min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader judul="Isi tindak lanjut" />
            <CardBody>
              <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-700">
                {tindak.isi}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              judul={`Temuan yang ditangani (${temuan.length})`}
              keterangan="Temuan ikut dinyatakan selesai begitu tindak lanjut ini tuntas."
            />
            {temuan.length === 0 ? (
              <Kosong
                judul="Tanpa rujukan temuan"
                keterangan="Umumnya penghargaan atas kepatuhan, bukan koreksi atas penyimpangan."
              />
            ) : (
              <ul className="divide-y divide-garis">
                {temuan.map((t) => (
                  <li key={t.id} className="px-6 py-4 sm:px-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="netral">{LABEL_ASPEK[t.aspek]}</Badge>
                      <Badge tone={NADA_TINGKAT[t.tingkat]}>
                        {LABEL_TINGKAT[t.tingkat]}
                      </Badge>
                      <Badge tone={NADA_STATUS_TEMUAN[t.status]}>
                        {LABEL_STATUS_TEMUAN[t.status]}
                      </Badge>
                      {t.sumber === 'pemeriksaan' ? (
                        <Link
                          href={`/kp3/pemeriksaan/${t.sumberId}`}
                          className="text-xs text-tinta hover:underline"
                        >
                          berita acara
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                      {t.uraian}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {lanjutan.length === 0 ? (
            <Peringatan nada="sukses">
              Tindak lanjut ini sudah tuntas pada{' '}
              {tindak.tanggalSelesai ? f.tanggal(tindak.tanggalSelesai) : '—'}. Tidak
              ada perpindahan status lain yang tersisa.
            </Peringatan>
          ) : (
            <Card>
              <CardHeader
                judul="Perbarui status pelaksanaan"
                keterangan="Inilah yang menutup lingkaran pengawasan: rekomendasi → pelaksanaan → verifikasi."
              />
              <CardBody className="space-y-4">
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-tinta">
                    Status berikutnya
                  </span>
                  <RadioKartu
                    nilai={status}
                    onPilih={setStatus}
                    pilihan={lanjutan.map((s) => ({
                      nilai: s,
                      label: STATUS_TINDAK_LANJUT[s].label,
                      keterangan: STATUS_TINDAK_LANJUT[s].deskripsi,
                    }))}
                  />
                </div>

                {status === 'eskalasi' ? (
                  <Field label="Diteruskan kepada" wajib>
                    <Select
                      value={eskalasiKe}
                      onChange={(e) => setEskalasiKe(e.target.value as EskalasiKe)}
                    >
                      {(Object.keys(LABEL_ESKALASI) as EskalasiKe[]).map((k) => (
                        <option key={k} value={k}>
                          {LABEL_ESKALASI[k]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}

                <Field
                  label="Keterangan pelaksanaan"
                  wajib={status === 'selesai'}
                  petunjuk="Untuk status selesai, isi bukti yang diverifikasi pengawas."
                >
                  <Textarea
                    value={bukti}
                    onChange={(e) => setBukti(e.target.value)}
                    rows={4}
                    placeholder="Contoh: papan HET sudah terpasang, selisih harga dikembalikan kepada 12 petani, dicek langsung pada 3 September."
                  />
                </Field>

                {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    varian="utama"
                    onClick={simpan}
                    disabled={sibuk || !pengawas}
                  >
                    {sibuk ? 'Menyimpan…' : 'Simpan perkembangan'}
                  </Button>
                  <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
                    Batal
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader judul="Keterangan surat" />
          <CardBody>
            <dl>
              <BarisRingkas label="Kode">{tindak.kode}</BarisRingkas>
              <BarisRingkas label="Sasaran">{namaSasaran}</BarisRingkas>
              <BarisRingkas label="Terbit">{f.tanggal(tindak.tanggal)}</BarisRingkas>
              <BarisRingkas label="Tenggat">{f.tanggal(tindak.tenggat)}</BarisRingkas>
              <BarisRingkas label="Pengawas">
                {cari.namaPengawas(tindak.pengawasId)}
              </BarisRingkas>
              {tindak.tanggalSelesai ? (
                <BarisRingkas label="Selesai">
                  {f.tanggal(tindak.tanggalSelesai)}
                </BarisRingkas>
              ) : null}
              {tindak.eskalasiKe ? (
                <BarisRingkas label="Eskalasi">
                  {LABEL_ESKALASI[tindak.eskalasiKe]}
                </BarisRingkas>
              ) : null}
            </dl>

            {tindak.buktiPelaksanaan ? (
              <div className="mt-3 rounded-2xl bg-neutral-50 p-3.5">
                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  Keterangan pelaksanaan
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                  {tindak.buktiPelaksanaan}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
