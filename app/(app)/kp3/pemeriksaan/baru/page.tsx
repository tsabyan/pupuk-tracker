'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, RadioKartu, Select, Textarea } from '@/components/ui/field'
import { PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { TtdPad } from '@/components/domain/ttd-pad'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import {
  LABEL_ASPEK,
  LABEL_KESIMPULAN,
  LABEL_OBJEK,
  LABEL_TINGKAT,
  NADA_KESIMPULAN,
  NADA_TINGKAT,
  kesimpulanOtomatis,
  temuanDariPemeriksaan,
} from '@/lib/domain/pengawasan'
import { hitungSisaHak, hitungStokPengecer } from '@/lib/domain/stok'
import {
  BUTIR_ADMINISTRASI,
  type AspekTepat,
  type ObjekPengawasan,
  type Pemeriksaan,
  type PeriksaHarga,
  type PeriksaPenerima,
  type PeriksaStok,
  type TingkatTemuan,
} from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

interface BarisTemuanManual {
  aspek: AspekTepat
  uraian: string
  tingkat: TingkatTemuan
}

const PENDAMPING_UMUM = [
  'Dinas Perdagangan Kabupaten Sampang',
  'Satgas Pangan Polres Sampang',
  'Penyuluh Pertanian Lapangan (PPL) wilayah setempat',
  'Bagian Hukum Sekretariat Daerah',
]

export default function HalamanPemeriksaanBaru() {
  return (
    <Suspense fallback={null}>
      <FormPemeriksaan />
    </Suspense>
  )
}

function FormPemeriksaan() {
  const db = useDb()
  const cari = usePencari()
  const { pengawas } = useSesi()
  const router = useRouter()
  const params = useSearchParams()
  const { sibuk, galat, jalankan } = useAksi()

  const awalTipe = (params.get('objek') as ObjekPengawasan | null) ?? 'pengecer'
  const awalId = params.get('id') ?? ''
  const awalSampel = params.get('sampel')

  const [objekTipe, setObjekTipe] = useState<ObjekPengawasan>(awalTipe)
  const [objekId, setObjekId] = useState(
    awalId ||
      (awalTipe === 'pengecer'
        ? (db.pengecer[0]?.id ?? '')
        : awalTipe === 'distributor'
          ? (db.distributor[0]?.id ?? '')
          : awalTipe === 'poktan'
            ? (db.kelompokTani[0]?.id ?? '')
            : (db.petani[0]?.id ?? '')),
  )
  const [tanggal, setTanggal] = useState(f.hariIni())
  const [pendamping, setPendamping] = useState('')
  const [catatan, setCatatan] = useState('')
  const [ttdPengawas, setTtdPengawas] = useState<string | undefined>()
  const [ttdObjek, setTtdObjek] = useState<string | undefined>()

  const [fisik, setFisik] = useState<Record<string, string>>({})
  const [harga, setHarga] = useState<Record<string, { jual: string; biaya: string }>>({})
  const [tidakTerdaftar, setTidakTerdaftar] = useState<Record<string, boolean>>({})
  const [dokumenTidakAda, setDokumenTidakAda] = useState<Record<string, boolean>>({})
  const [sampel, setSampel] = useState<Record<string, boolean>>(
    awalSampel ? { [awalSampel]: true } : {},
  )
  const [temuanManual, setTemuanManual] = useState<BarisTemuanManual[]>([])

  const pilihanObjek =
    objekTipe === 'pengecer'
      ? db.pengecer
      : objekTipe === 'distributor'
        ? db.distributor
        : objekTipe === 'poktan'
          ? db.kelompokTani
          : db.petani

  const gantiTipe = (tipe: ObjekPengawasan) => {
    setObjekTipe(tipe)
    const daftar =
      tipe === 'pengecer'
        ? db.pengecer
        : tipe === 'distributor'
          ? db.distributor
          : tipe === 'poktan'
            ? db.kelompokTani
            : db.petani
    setObjekId(daftar[0]?.id ?? '')
    setFisik({})
    setHarga({})
    setTidakTerdaftar({})
    setSampel({})
  }

  /** Kios yang stok dan transaksinya menjadi bahan pemeriksaan. */
  const pengecerId =
    objekTipe === 'pengecer'
      ? objekId
      : objekTipe === 'poktan'
        ? (cari.poktan(objekId)?.pengecerId ?? '')
        : objekTipe === 'petani'
          ? (cari.poktan(db.petani.find((p) => p.id === objekId)?.poktanId ?? '')
              ?.pengecerId ?? '')
          : ''

  /** Poktan yang penerimanya diverifikasi pada pemeriksaan ini. */
  const poktanDiperiksa = useMemo(() => {
    if (objekTipe === 'pengecer') {
      return db.kelompokTani.filter((k) => k.pengecerId === objekId)
    }
    if (objekTipe === 'poktan') {
      const k = cari.poktan(objekId)
      return k ? [k] : []
    }
    if (objekTipe === 'petani') {
      const k = cari.poktan(db.petani.find((p) => p.id === objekId)?.poktanId ?? '')
      return k ? [k] : []
    }
    return []
  }, [objekTipe, objekId, db, cari])

  const stokSistem = useMemo(() => {
    if (objekTipe !== 'pengecer' || !objekId) return []
    return hitungStokPengecer(objekId, db.pengiriman, db.penyaluran)
  }, [objekTipe, objekId, db])

  const transaksiObjek = useMemo(
    () =>
      db.penyaluran
        .filter(
          (p) =>
            p.status !== 'draft' &&
            p.status !== 'disalurkan' &&
            (objekTipe === 'poktan' || objekTipe === 'petani'
              ? poktanDiperiksa.some((k) => k.id === p.poktanId)
              : p.pengecerId === pengecerId),
        )
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, 8),
    [db, objekTipe, pengecerId, poktanDiperiksa],
  )

  /* --- Rakit butir pemeriksaan dari isian form --- */

  const butirStok: PeriksaStok[] = stokSistem.map((b) => ({
    jenisPupukId: b.jenisPupukId,
    sistemKg: b.sisaKg,
    fisikKg: fisik[b.jenisPupukId] === '' || fisik[b.jenisPupukId] === undefined
      ? b.sisaKg
      : Number(fisik[b.jenisPupukId]),
  }))

  const butirHarga: PeriksaHarga[] =
    objekTipe === 'distributor'
      ? []
      : db.jenisPupuk.map((jp) => ({
          jenisPupukId: jp.id,
          het: jp.het,
          hargaJual: harga[jp.id]?.jual ? Number(harga[jp.id].jual) : jp.het,
          biayaTambahan: harga[jp.id]?.biaya ? Number(harga[jp.id].biaya) : 0,
        }))

  const butirPenerima: PeriksaPenerima[] = poktanDiperiksa.map((k) => {
    const hak = hitungSisaHak(
      cari.rdkkPoktan(k.id),
      db.penyaluran.filter((p) => p.poktanId === k.id),
    )
    const total = hak.reduce(
      (t, h) => ({ hak: t.hak + h.hakKg, tebus: t.tebus + h.ditebusKg }),
      { hak: 0, tebus: 0 },
    )
    return {
      poktanId: k.id,
      petaniId: objekTipe === 'petani' ? objekId : undefined,
      terdaftarRdkk: !tidakTerdaftar[k.id],
      hakKg: total.hak,
      ditebusKg: total.tebus,
    }
  })

  const butirAdministrasi = BUTIR_ADMINISTRASI.map((butir) => ({
    butir,
    ada: !dokumenTidakAda[butir],
  }))

  const sampelIds = Object.keys(sampel).filter((id) => sampel[id])

  /* --- Pratinjau temuan: dihitung dengan fungsi domain yang sama --- */

  const pratinjau = useMemo(() => {
    const draf: Pemeriksaan = {
      id: 'pratinjau',
      kode: 'pratinjau',
      noBeritaAcara: 'pratinjau',
      pengawasId: pengawas?.id ?? '',
      pendamping: [],
      objekTipe,
      objekId,
      tanggal,
      sampelPenyaluranIds: sampelIds,
      stok: butirStok,
      harga: butirHarga,
      penerima: butirPenerima,
      administrasi: butirAdministrasi,
      kesimpulan: 'sesuai',
      dibuatPada: '',
    }
    const otomatis = temuanDariPemeriksaan(
      draf,
      cari.namaPupuk,
      (tipe, id) =>
        tipe === 'poktan'
          ? cari.namaPoktan(id)
          : tipe === 'pengecer'
            ? cari.namaPengecer(id)
            : tipe === 'distributor'
              ? cari.namaDistributor(id)
              : (db.petani.find((p) => p.id === id)?.nama ?? id),
    )
    const semua = [...otomatis, ...temuanManual.filter((t) => t.uraian.trim())]
    return { semua, kesimpulan: kesimpulanOtomatis(semua) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    objekTipe,
    objekId,
    tanggal,
    fisik,
    harga,
    tidakTerdaftar,
    dokumenTidakAda,
    temuanManual,
    sampel,
    db,
  ])

  const simpan = () =>
    void jalankan(
      () =>
        repo.buatPemeriksaan({
          pengawasId: pengawas!.id,
          objekTipe,
          objekId,
          tanggal,
          pendamping: pendamping.split('\n'),
          sampelPenyaluranIds: sampelIds,
          stok: butirStok,
          harga: butirHarga,
          penerima: butirPenerima,
          administrasi: butirAdministrasi,
          temuanTambahan: temuanManual.filter((t) => t.uraian.trim()),
          catatan,
          ttdPengawas,
          ttdObjek,
        }),
      (hasil) => router.push(`/kp3/pemeriksaan/${hasil.id}`),
    )

  if (!pengawas) return null

  return (
    <>
      <TautanKembali href="/kp3/pemeriksaan">Pemeriksaan Lapangan</TautanKembali>
      <PageHeader
        langkah="Langkah 3"
        judul="Catat Pemeriksaan Lapangan"
        keterangan="Isi butir yang benar-benar diperiksa di lokasi. Temuan dan kesimpulan berita acara tersusun sendiri dari angka yang Anda masukkan."
      />

      <div className="grid *:min-w-0 gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="h-fit">
            <CardHeader judul="Objek & waktu" />
            <CardBody className="space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-tinta">
                  Jenis objek
                </span>
                <RadioKartu
                  nilai={objekTipe}
                  onPilih={gantiTipe}
                  pilihan={(
                    ['pengecer', 'distributor', 'poktan', 'petani'] as ObjekPengawasan[]
                  ).map((t) => ({ nilai: t, label: LABEL_OBJEK[t] }))}
                />
              </div>

              <Field label="Objek yang diperiksa" wajib>
                <Select value={objekId} onChange={(e) => setObjekId(e.target.value)}>
                  {pilihanObjek.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nama}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Tanggal pemeriksaan" wajib>
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                />
              </Field>

              <Field
                label="Instansi pendamping"
                petunjuk="Satu baris satu instansi. Pengawasan KP3 dijalankan lintas instansi."
              >
                <Textarea
                  value={pendamping}
                  onChange={(e) => setPendamping(e.target.value)}
                  rows={3}
                  placeholder="Contoh:&#10;Dinas Perdagangan Kabupaten Sampang"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {PENDAMPING_UMUM.map((x) => (
                  <button
                    key={x}
                    type="button"
                    onClick={() =>
                      setPendamping((l) => (l.trim() ? `${l}\n${x}` : x))
                    }
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-tinta"
                  >
                    + {x}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="h-fit">
            <CardHeader
              judul="Pratinjau berita acara"
              keterangan="Temuan diturunkan dengan aturan yang sama seperti saat disimpan."
              aksi={
                <Badge tone={NADA_KESIMPULAN[pratinjau.kesimpulan]}>
                  {LABEL_KESIMPULAN[pratinjau.kesimpulan]}
                </Badge>
              }
            />
            <CardBody>
              {pratinjau.semua.length === 0 ? (
                <p className="text-sm leading-relaxed text-neutral-500">
                  Belum ada temuan dari isian saat ini.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {pratinjau.semua.map((t, i) => (
                    <li key={`${t.aspek}-${i}`} className="text-sm">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge tone="netral">{LABEL_ASPEK[t.aspek]}</Badge>
                        <Badge tone={NADA_TINGKAT[t.tingkat]}>
                          {LABEL_TINGKAT[t.tingkat]}
                        </Badge>
                      </span>
                      <span className="mt-1 block leading-relaxed text-neutral-700">
                        {t.uraian}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          {objekTipe === 'pengecer' ? (
            <Card>
              <CardHeader
                judul="Uji stok fisik"
                keterangan="Angka sistem dihitung dari riwayat transaksi. Isi hasil hitung fisik di gudang."
              />
              {stokSistem.length === 0 ? (
                <CardBody>
                  <p className="text-sm text-neutral-500">
                    Kios ini belum punya riwayat stok.
                  </p>
                </CardBody>
              ) : (
                <TabelWadah>
                  <Tabel>
                    <thead>
                      <tr>
                        <Th>Jenis pupuk</Th>
                        <Th numerik>Sistem</Th>
                        <Th className="w-32">Fisik (kg)</Th>
                        <Th numerik>Selisih</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {butirStok.map((b) => {
                        const selisih = b.fisikKg - b.sistemKg
                        return (
                          <Tr key={b.jenisPupukId}>
                            <Td className="font-medium text-tinta">
                              {cari.namaPupuk(b.jenisPupukId)}
                            </Td>
                            <Td numerik>{f.angka(b.sistemKg)}</Td>
                            <Td className="min-w-24">
                              <Input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={fisik[b.jenisPupukId] ?? String(b.sistemKg)}
                                onChange={(e) =>
                                  setFisik((l) => ({
                                    ...l,
                                    [b.jenisPupukId]: e.target.value,
                                  }))
                                }
                              />
                            </Td>
                            <Td numerik>
                              {selisih === 0 ? (
                                <span className="text-neutral-400">cocok</span>
                              ) : (
                                <span className="font-medium text-merah">
                                  {selisih > 0 ? '+' : ''}
                                  {f.angka(selisih)}
                                </span>
                              )}
                            </Td>
                          </Tr>
                        )
                      })}
                    </tbody>
                  </Tabel>
                </TabelWadah>
              )}
            </Card>
          ) : null}

          {objekTipe !== 'distributor' ? (
            <Card>
              <CardHeader
                judul="Uji harga"
                keterangan="Isi harga yang benar-benar dibayar petani. Data transaksi selalu mencatat HET, jadi pelanggaran harga hanya terbaca dari pemeriksaan seperti ini."
              />
              <TabelWadah>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Jenis pupuk</Th>
                      <Th numerik>HET</Th>
                      <Th className="w-32">Harga jual</Th>
                      <Th className="w-32">Pungutan</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.jenisPupuk.map((jp) => (
                      <Tr key={jp.id}>
                        <Td className="font-medium text-tinta">{jp.nama}</Td>
                        <Td numerik>{f.rupiah(jp.het)}</Td>
                        <Td className="min-w-24">
                          <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={harga[jp.id]?.jual ?? String(jp.het)}
                            onChange={(e) =>
                              setHarga((l) => ({
                                ...l,
                                [jp.id]: {
                                  jual: e.target.value,
                                  biaya: l[jp.id]?.biaya ?? '0',
                                },
                              }))
                            }
                          />
                        </Td>
                        <Td className="min-w-24">
                          <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={harga[jp.id]?.biaya ?? '0'}
                            onChange={(e) =>
                              setHarga((l) => ({
                                ...l,
                                [jp.id]: {
                                  jual: l[jp.id]?.jual ?? String(jp.het),
                                  biaya: e.target.value,
                                },
                              }))
                            }
                          />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Tabel>
              </TabelWadah>
            </Card>
          ) : null}

          {poktanDiperiksa.length > 0 ? (
            <Card>
              <CardHeader
                judul="Verifikasi penerima"
                keterangan="Hak dan penebusan diambil dari RDKK. Tandai bila penerima yang ditemui tidak tercantum di dalamnya."
              />
              <TabelWadah>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Kelompok tani</Th>
                      <Th numerik>Hak RDKK</Th>
                      <Th numerik>Ditebus</Th>
                      <Th>Tidak terdaftar</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {butirPenerima.map((v) => (
                      <Tr key={v.poktanId}>
                        <Td className="font-medium text-tinta">
                          {cari.namaPoktan(v.poktanId)}
                        </Td>
                        <Td numerik>{f.kg(v.hakKg)}</Td>
                        <Td numerik>{f.kg(v.ditebusKg)}</Td>
                        <Td>
                          <input
                            type="checkbox"
                            className="size-4 accent-[var(--color-tinta)]"
                            aria-label={`Penerima ${cari.namaPoktan(v.poktanId)} tidak terdaftar RDKK`}
                            checked={Boolean(tidakTerdaftar[v.poktanId])}
                            onChange={(e) =>
                              setTidakTerdaftar((l) => ({
                                ...l,
                                [v.poktanId]: e.target.checked,
                              }))
                            }
                          />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Tabel>
              </TabelWadah>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              judul="Kelengkapan administrasi"
              keterangan="Hilangkan tanda centang untuk butir yang tidak dapat ditunjukkan saat pemeriksaan."
            />
            <CardBody>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {BUTIR_ADMINISTRASI.map((butir) => (
                  <li key={butir}>
                    <label className="flex items-start gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-[var(--color-tinta)]"
                        checked={!dokumenTidakAda[butir]}
                        onChange={(e) =>
                          setDokumenTidakAda((l) => ({ ...l, [butir]: !e.target.checked }))
                        }
                      />
                      <span className="text-neutral-700">{butir}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          {transaksiObjek.length > 0 ? (
            <Card>
              <CardHeader
                judul="Sampel uji petik"
                keterangan="Pilih transaksi yang dokumennya diperiksa langsung di lokasi."
              />
              <CardBody>
                <ul className="space-y-2">
                  {transaksiObjek.map((p) => (
                    <li key={p.id}>
                      <label className="flex flex-wrap items-center gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 accent-[var(--color-tinta)]"
                          checked={Boolean(sampel[p.id])}
                          onChange={(e) =>
                            setSampel((l) => ({ ...l, [p.id]: e.target.checked }))
                          }
                        />
                        <span className="font-medium text-tinta">{p.noTransaksi}</span>
                        <span className="text-neutral-500">
                          {cari.namaPoktan(p.poktanId)} · {f.tanggalSingkat(p.tanggal)} ·{' '}
                          {f.kg(p.items.reduce((t, i) => t + i.jumlahKg, 0))}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              judul="Temuan tambahan"
              keterangan="Untuk hal yang tidak terbaca dari angka — mis. papan HET tidak terpasang, penyimpanan tidak layak."
              aksi={
                <Button
                  ukuran="sm"
                  onClick={() =>
                    setTemuanManual((l) => [
                      ...l,
                      { aspek: 'ketentuan', uraian: '', tingkat: 'ringan' },
                    ])
                  }
                >
                  Tambah temuan
                </Button>
              }
            />
            <CardBody className="space-y-3">
              {temuanManual.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Belum ada temuan tambahan.
                </p>
              ) : (
                temuanManual.map((t, i) => (
                  <div
                    key={i}
                    className="grid gap-2.5 rounded-2xl bg-neutral-50 p-3.5 sm:grid-cols-[10rem_minmax(0,1fr)_8rem_auto]"
                  >
                    <Select
                      value={t.aspek}
                      onChange={(e) =>
                        setTemuanManual((l) =>
                          l.map((x, j) =>
                            j === i ? { ...x, aspek: e.target.value as AspekTepat } : x,
                          ),
                        )
                      }
                    >
                      {(Object.keys(LABEL_ASPEK) as AspekTepat[]).map((a) => (
                        <option key={a} value={a}>
                          {LABEL_ASPEK[a]}
                        </option>
                      ))}
                    </Select>
                    <Input
                      value={t.uraian}
                      placeholder="Uraikan temuannya"
                      onChange={(e) =>
                        setTemuanManual((l) =>
                          l.map((x, j) => (j === i ? { ...x, uraian: e.target.value } : x)),
                        )
                      }
                    />
                    <Select
                      value={t.tingkat}
                      onChange={(e) =>
                        setTemuanManual((l) =>
                          l.map((x, j) =>
                            j === i
                              ? { ...x, tingkat: e.target.value as TingkatTemuan }
                              : x,
                          ),
                        )
                      }
                    >
                      {(Object.keys(LABEL_TINGKAT) as TingkatTemuan[]).map((x) => (
                        <option key={x} value={x}>
                          {LABEL_TINGKAT[x]}
                        </option>
                      ))}
                    </Select>
                    <Button
                      varian="polos"
                      ukuran="sm"
                      onClick={() => setTemuanManual((l) => l.filter((_, j) => j !== i))}
                    >
                      Hapus
                    </Button>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              judul="Penutup berita acara"
              keterangan="Berita acara mengikat dua pihak. Bila pihak objek menolak menandatangani, catat penolakannya."
            />
            <CardBody className="space-y-4">
              <Field label="Catatan pengawas">
                <Textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={4}
                  placeholder="Contoh: hitung fisik disaksikan pemilik kios; keterangan tiga petani penerima seragam soal harga."
                />
              </Field>
              <div className="grid *:min-w-0 gap-4 sm:grid-cols-2">
                <TtdPad
                  nilai={ttdPengawas}
                  onUbah={setTtdPengawas}
                  label="Tanda tangan pengawas"
                />
                <TtdPad
                  nilai={ttdObjek}
                  onUbah={setTtdObjek}
                  label={`Tanda tangan pihak ${LABEL_OBJEK[objekTipe].toLowerCase()}`}
                />
              </div>
            </CardBody>
          </Card>

          {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
              Batal
            </Button>
            <Button varian="utama" onClick={simpan} disabled={sibuk || !objekId}>
              {sibuk ? 'Menyimpan…' : 'Terbitkan berita acara'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
