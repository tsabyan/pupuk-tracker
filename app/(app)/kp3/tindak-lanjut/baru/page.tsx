'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, RadioKartu, Select, Textarea } from '@/components/ui/field'
import { Kosong, PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import {
  LABEL_ASPEK,
  LABEL_OBJEK,
  LABEL_TINGKAT,
  NADA_TINGKAT,
} from '@/lib/domain/pengawasan'
import type {
  JenisTindakLanjut,
  ObjekPengawasan,
  SasaranTindakLanjut,
  Temuan,
} from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

/** Objek pengawasan yang bisa menjadi sasaran surat tindak lanjut. */
function sasaranDari(tipe: ObjekPengawasan): SasaranTindakLanjut {
  // Petani tidak berdiri sendiri sebagai penerima surat; suratnya ke kelompok.
  return tipe === 'petani' ? 'poktan' : tipe
}

export default function HalamanTindakLanjutBaru() {
  return (
    <Suspense fallback={null}>
      <FormTindakLanjut />
    </Suspense>
  )
}

function FormTindakLanjut() {
  const db = useDb()
  const cari = usePencari()
  const { pengawas } = useSesi()
  const router = useRouter()
  const params = useSearchParams()
  const { sibuk, galat, jalankan } = useAksi()

  /** Temuan terbuka, itulah bahan baku sebuah tindak lanjut. */
  const terbuka = useMemo(
    () =>
      db.temuan
        .filter((t) => t.status === 'terbuka')
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [db],
  )

  /** Datang dari register temuan atau dari sebuah berita acara. */
  const awal = useMemo(() => {
    const idTemuan = params.get('temuan')
    const idPemeriksaan = params.get('pemeriksaan')
    if (idTemuan) return terbuka.filter((t) => t.id === idTemuan)
    if (idPemeriksaan) return terbuka.filter((t) => t.sumberId === idPemeriksaan)
    return []
  }, [params, terbuka])

  const [dipilih, setDipilih] = useState<Record<string, boolean>>(
    Object.fromEntries(awal.map((t) => [t.id, true])),
  )
  const terpilih = terbuka.filter((t) => dipilih[t.id])

  const contoh = terpilih[0] ?? awal[0]
  const [jenis, setJenis] = useState<JenisTindakLanjut>(
    contoh?.tingkat === 'berat' ? 'teguran' : 'rekomendasi',
  )
  const [sasaranTipe, setSasaranTipe] = useState<SasaranTindakLanjut>(
    contoh ? sasaranDari(contoh.objekTipe) : 'pengecer',
  )
  const [sasaranId, setSasaranId] = useState(
    contoh?.objekTipe === 'petani'
      ? (db.petani.find((p) => p.id === contoh.objekId)?.poktanId ?? '')
      : (contoh?.objekId ?? db.pengecer[0]?.id ?? ''),
  )
  const [tanggal, setTanggal] = useState(f.hariIni())
  const [tenggat, setTenggat] = useState(f.geserHari(f.hariIni(), 14))
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')

  const pilihanSasaran =
    sasaranTipe === 'pengecer'
      ? db.pengecer
      : sasaranTipe === 'poktan'
        ? db.kelompokTani
        : db.distributor

  const gantiSasaranTipe = (tipe: SasaranTindakLanjut) => {
    setSasaranTipe(tipe)
    const daftar =
      tipe === 'pengecer'
        ? db.pengecer
        : tipe === 'poktan'
          ? db.kelompokTani
          : db.distributor
    setSasaranId(daftar[0]?.id ?? '')
  }

  /** Ringkas temuan terpilih menjadi draf uraian surat. */
  const susunDraf = () => {
    if (terpilih.length === 0) return
    setJudul(
      terpilih.length === 1
        ? `${jenis === 'teguran' ? 'Teguran' : 'Rekomendasi'}: ${LABEL_ASPEK[terpilih[0].aspek].toLowerCase()}`
        : `${jenis === 'teguran' ? 'Teguran' : 'Rekomendasi'} atas ${terpilih.length} temuan pengawasan`,
    )
    setIsi(
      [
        'Berdasarkan hasil pengawasan, dicatat hal berikut:',
        ...terpilih.map((t, i) => `${i + 1}. ${t.uraian}`),
        '',
        `Pihak yang bersangkutan diminta melakukan perbaikan dan menyampaikan laporannya kepada KP3 paling lambat ${f.tanggal(tenggat)}.`,
      ].join('\n'),
    )
  }

  const namaObjek = (t: Temuan) =>
    t.objekTipe === 'distributor'
      ? cari.namaDistributor(t.objekId)
      : t.objekTipe === 'pengecer'
        ? cari.namaPengecer(t.objekId)
        : t.objekTipe === 'poktan'
          ? cari.namaPoktan(t.objekId)
          : (db.petani.find((p) => p.id === t.objekId)?.nama ?? '—')

  const simpan = () =>
    void jalankan(
      () =>
        repo.buatTindakLanjut({
          pengawasId: pengawas!.id,
          jenis,
          sasaranTipe,
          sasaranId,
          temuanIds: terpilih.map((t) => t.id),
          judul,
          isi,
          tanggal,
          tenggat,
        }),
      () => router.push('/kp3/tindak-lanjut'),
    )

  if (!pengawas) return null

  const butuhTemuan = jenis !== 'penghargaan' && terpilih.length === 0

  return (
    <>
      <TautanKembali href="/kp3/tindak-lanjut">Tindak Lanjut</TautanKembali>
      <PageHeader
        langkah="Langkah 5"
        judul="Terbitkan Tindak Lanjut"
        keterangan="Satu surat dapat menutup beberapa temuan sekaligus. Tenggat wajib diisi supaya pelaksanaannya bisa diverifikasi, bukan hanya dikirim."
      />

      <div className="grid *:min-w-0 gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader judul="Sasaran & jadwal" />
          <CardBody className="space-y-4">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-tinta">
                Jenis tindak lanjut
              </span>
              <RadioKartu
                nilai={jenis}
                onPilih={setJenis}
                pilihan={[
                  {
                    nilai: 'teguran',
                    label: 'Teguran',
                    keterangan: 'Untuk pelanggaran ketentuan',
                  },
                  {
                    nilai: 'rekomendasi',
                    label: 'Rekomendasi',
                    keterangan: 'Perbaikan tata kelola',
                  },
                  {
                    nilai: 'pembinaan',
                    label: 'Pembinaan',
                    keterangan: 'Pendampingan, bukan sanksi',
                  },
                  {
                    nilai: 'penghargaan',
                    label: 'Penghargaan',
                    keterangan: 'Tanpa rujukan temuan',
                  },
                ]}
              />
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-tinta">
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

            <Field label="Tanggal terbit" wajib>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </Field>

            <Field
              label="Tenggat perbaikan"
              wajib
              petunjuk="Dipakai untuk menandai surat yang lewat tenggat dan perlu dieskalasi."
            >
              <Input
                type="date"
                min={tanggal}
                value={tenggat}
                onChange={(e) => setTenggat(e.target.value)}
              />
            </Field>
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              judul="Temuan yang ditangani"
              keterangan="Hanya temuan berstatus terbuka. Temuan yang dipilih ikut selesai saat surat ini dinyatakan tuntas."
              aksi={
                terpilih.length > 0 ? (
                  <Button ukuran="sm" onClick={susunDraf}>
                    Susun draf dari temuan
                  </Button>
                ) : undefined
              }
            />
            {terbuka.length === 0 ? (
              <Kosong
                judul="Tidak ada temuan terbuka"
                keterangan="Tindak lanjut tanpa rujukan temuan umumnya berupa penghargaan atas kepatuhan."
              />
            ) : (
              <ul className="divide-y divide-garis">
                {terbuka.map((t) => (
                  <li key={t.id} className="px-6 py-3.5 sm:px-7">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 shrink-0 accent-[var(--color-tinta)]"
                        checked={Boolean(dipilih[t.id])}
                        onChange={(e) =>
                          setDipilih((l) => ({ ...l, [t.id]: e.target.checked }))
                        }
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <Badge tone="netral">{LABEL_ASPEK[t.aspek]}</Badge>
                          <Badge tone={NADA_TINGKAT[t.tingkat]}>
                            {LABEL_TINGKAT[t.tingkat]}
                          </Badge>
                          <span className="text-xs text-neutral-500">{t.kode}</span>
                        </span>
                        <span className="mt-1 block leading-relaxed text-neutral-700">
                          {t.uraian}
                        </span>
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          {LABEL_OBJEK[t.objekTipe]} · {namaObjek(t)} ·{' '}
                          {f.tanggalSingkat(t.tanggal)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {butuhTemuan ? (
            <Peringatan nada="peringatan">
              Pilih minimal satu temuan, atau ubah jenisnya menjadi penghargaan.
              Surat koreksi tanpa temuan tidak bisa diverifikasi pelaksanaannya.
            </Peringatan>
          ) : null}

          <Card>
            <CardHeader judul="Isi surat" />
            <CardBody className="space-y-4">
              <Field label="Judul" wajib>
                <Input
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Teguran tertulis: penjualan di atas HET"
                />
              </Field>
              <Field label="Uraian" wajib>
                <Textarea
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  rows={8}
                  placeholder="Uraikan temuan, dasar ketentuan, dan tindakan yang diminta."
                />
              </Field>
            </CardBody>
          </Card>

          {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
              Batal
            </Button>
            <Button
              varian="utama"
              onClick={simpan}
              disabled={sibuk || !judul.trim() || !isi.trim() || butuhTemuan}
            >
              {sibuk ? 'Menerbitkan…' : 'Terbitkan & kirim notifikasi'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
