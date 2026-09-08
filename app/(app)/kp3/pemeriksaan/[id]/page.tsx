'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import {
  BarisRingkas,
  Kosong,
  PageHeader,
  Peringatan,
  TautanKembali,
} from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import * as f from '@/lib/domain/format'
import {
  LABEL_ASPEK,
  LABEL_KESIMPULAN,
  LABEL_OBJEK,
  LABEL_TINGKAT,
  NADA_KESIMPULAN,
  NADA_TINGKAT,
} from '@/lib/domain/pengawasan'
import type { ObjekPengawasan } from '@/lib/domain/types'
import { useDb, usePencari } from '@/lib/hooks'

export default function BeritaAcaraPemeriksaan() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()

  const pemeriksaan = useMemo(() => db.pemeriksaan.find((p) => p.id === id), [db, id])
  const temuan = useMemo(
    () => db.temuan.filter((t) => t.sumberId === id),
    [db, id],
  )

  const namaObjek = (tipe: ObjekPengawasan, objekId: string) =>
    tipe === 'distributor'
      ? cari.namaDistributor(objekId)
      : tipe === 'pengecer'
        ? cari.namaPengecer(objekId)
        : tipe === 'poktan'
          ? cari.namaPoktan(objekId)
          : (db.petani.find((p) => p.id === objekId)?.nama ?? '—')

  if (!pemeriksaan) {
    return (
      <Card>
        <Kosong
          judul="Berita acara tidak ditemukan"
          aksi={
            <TombolTautan href="/kp3/pemeriksaan">Kembali ke daftar pemeriksaan</TombolTautan>
          }
        />
      </Card>
    )
  }

  const sampel = pemeriksaan.sampelPenyaluranIds
    .map((sid) => db.penyaluran.find((p) => p.id === sid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  const dokumenKurang = pemeriksaan.administrasi.filter((a) => !a.ada)

  return (
    <>
      <TautanKembali href="/kp3/pemeriksaan">Pemeriksaan Lapangan</TautanKembali>
      <PageHeader
        langkah="Langkah 3"
        judul={pemeriksaan.noBeritaAcara}
        meta={
          <>
            <span className="font-medium text-tinta">
              {namaObjek(pemeriksaan.objekTipe, pemeriksaan.objekId)}
            </span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>{LABEL_OBJEK[pemeriksaan.objekTipe]}</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>{f.tanggal(pemeriksaan.tanggal)}</span>
          </>
        }
        aksi={
          <Badge tone={NADA_KESIMPULAN[pemeriksaan.kesimpulan]}>
            {LABEL_KESIMPULAN[pemeriksaan.kesimpulan]}
          </Badge>
        }
      />

      <div className="grid *:min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {pemeriksaan.stok.length > 0 ? (
            <Card>
              <CardHeader
                judul="Uji stok fisik"
                keterangan="Angka sistem dihitung dari riwayat transaksi, bukan diketik ulang saat pemeriksaan."
              />
              <TabelWadah>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Jenis pupuk</Th>
                      <Th numerik>Sistem</Th>
                      <Th numerik>Fisik</Th>
                      <Th numerik>Selisih</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pemeriksaan.stok.map((st) => {
                      const selisih = st.fisikKg - st.sistemKg
                      return (
                        <Tr key={st.jenisPupukId}>
                          <Td className="font-medium text-tinta">
                            {cari.namaPupuk(st.jenisPupukId)}
                          </Td>
                          <Td numerik>{f.kg(st.sistemKg)}</Td>
                          <Td numerik>{f.kg(st.fisikKg)}</Td>
                          <Td numerik>
                            {selisih === 0 ? (
                              <span className="text-neutral-400">cocok</span>
                            ) : (
                              <span className="font-medium text-merah">
                                {selisih > 0 ? '+' : ''}
                                {f.kg(selisih)}
                              </span>
                            )}
                          </Td>
                        </Tr>
                      )
                    })}
                  </tbody>
                </Tabel>
              </TabelWadah>
            </Card>
          ) : null}

          {pemeriksaan.harga.length > 0 ? (
            <Card>
              <CardHeader
                judul="Uji harga"
                keterangan="Harga jual diisi dari keterangan petani dan pemeriksaan struk — bukan dari data transaksi, yang memang selalu mencatat HET."
              />
              <TabelWadah>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Jenis pupuk</Th>
                      <Th numerik>HET</Th>
                      <Th numerik>Harga jual</Th>
                      <Th numerik>Pungutan</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pemeriksaan.harga.map((h) => {
                      const lebih = h.hargaJual > h.het || h.biayaTambahan > 0
                      return (
                        <Tr key={h.jenisPupukId}>
                          <Td className="font-medium text-tinta">
                            {cari.namaPupuk(h.jenisPupukId)}
                            {h.keterangan ? (
                              <p className="mt-0.5 max-w-md text-xs leading-relaxed text-neutral-500">
                                {h.keterangan}
                              </p>
                            ) : null}
                          </Td>
                          <Td numerik>{f.rupiah(h.het)}</Td>
                          <Td numerik>{f.rupiah(h.hargaJual)}</Td>
                          <Td numerik>
                            {h.biayaTambahan > 0 ? f.rupiah(h.biayaTambahan) : '—'}
                          </Td>
                          <Td>
                            <Badge tone={lebih ? 'bahaya' : 'sukses'}>
                              {lebih ? 'Di atas HET' : 'Sesuai HET'}
                            </Badge>
                          </Td>
                        </Tr>
                      )
                    })}
                  </tbody>
                </Tabel>
              </TabelWadah>
            </Card>
          ) : null}

          {pemeriksaan.penerima.length > 0 ? (
            <Card>
              <CardHeader
                judul="Verifikasi penerima"
                keterangan="Kesesuaian penerima dengan RDKK musim tanam berjalan."
              />
              <TabelWadah>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>Kelompok tani</Th>
                      <Th>Petani</Th>
                      <Th>Terdaftar RDKK</Th>
                      <Th numerik>Hak</Th>
                      <Th numerik>Ditebus</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pemeriksaan.penerima.map((v, i) => (
                      <Tr key={`${v.poktanId}-${v.petaniId ?? i}`}>
                        <Td className="font-medium text-tinta">
                          {cari.namaPoktan(v.poktanId)}
                        </Td>
                        <Td>
                          {v.petaniId
                            ? (db.petani.find((p) => p.id === v.petaniId)?.nama ?? '—')
                            : 'Tingkat kelompok'}
                        </Td>
                        <Td>
                          <Badge tone={v.terdaftarRdkk ? 'sukses' : 'bahaya'}>
                            {v.terdaftarRdkk ? 'Terdaftar' : 'Tidak terdaftar'}
                          </Badge>
                        </Td>
                        <Td numerik>{f.kg(v.hakKg)}</Td>
                        <Td numerik>
                          <span
                            className={
                              v.ditebusKg > v.hakKg ? 'font-medium text-merah' : undefined
                            }
                          >
                            {f.kg(v.ditebusKg)}
                          </span>
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
              keterangan={
                dokumenKurang.length === 0
                  ? 'Seluruh butir tersedia saat pemeriksaan.'
                  : `${dokumenKurang.length} butir tidak dapat ditunjukkan.`
              }
            />
            <CardBody>
              <ul className="space-y-2">
                {pemeriksaan.administrasi.map((a) => (
                  <li key={a.butir} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={
                        a.ada
                          ? 'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-hijau text-[10px] text-white'
                          : 'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-merah text-[10px] text-white'
                      }
                      aria-hidden
                    >
                      {a.ada ? '✓' : '!'}
                    </span>
                    <span className={a.ada ? 'text-neutral-700' : 'font-medium text-merah'}>
                      {a.butir}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              judul={`Temuan (${temuan.length})`}
              keterangan="Diturunkan otomatis dari butir di atas, ditambah catatan pengawas."
              aksi={
                temuan.some((t) => t.status === 'terbuka') ? (
                  <TombolTautan
                    href={`/kp3/tindak-lanjut/baru?pemeriksaan=${pemeriksaan.id}`}
                    varian="utama"
                    ukuran="sm"
                  >
                    Terbitkan tindak lanjut
                  </TombolTautan>
                ) : undefined
              }
            />
            {temuan.length === 0 ? (
              <Kosong
                judul="Tidak ada temuan"
                keterangan="Seluruh butir pemeriksaan terpenuhi."
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
                      <span className="text-xs text-neutral-500">{t.kode}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                      {t.uraian}
                    </p>
                    {t.tindakLanjutId ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Ditangani{' '}
                        {db.tindakLanjut.find((x) => x.id === t.tindakLanjutId)?.kode}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {sampel.length > 0 ? (
            <Card>
              <CardHeader
                judul="Sampel uji petik"
                keterangan="Transaksi yang dokumennya diperiksa langsung di lokasi."
              />
              <TabelWadah>
                <Tabel>
                  <thead>
                    <tr>
                      <Th>No. transaksi</Th>
                      <Th>Kelompok tani</Th>
                      <Th>Tanggal</Th>
                      <Th numerik>Nilai</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampel.map((p) => (
                      <Tr key={p.id}>
                        <Td>
                          <Link
                            href={`/kp3/objek/${p.id}`}
                            className="font-medium text-tinta hover:underline"
                          >
                            {p.noTransaksi}
                          </Link>
                        </Td>
                        <Td>{cari.namaPoktan(p.poktanId)}</Td>
                        <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggal)}</Td>
                        <Td numerik>{f.rupiah(p.total)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Tabel>
              </TabelWadah>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card className="h-fit">
            <CardHeader judul="Keterangan berita acara" />
            <CardBody>
              <dl>
                <BarisRingkas label="No. berita acara">
                  {pemeriksaan.noBeritaAcara}
                </BarisRingkas>
                <BarisRingkas label="Kode">{pemeriksaan.kode}</BarisRingkas>
                <BarisRingkas label="Jenis objek">
                  {LABEL_OBJEK[pemeriksaan.objekTipe]}
                </BarisRingkas>
                <BarisRingkas label="Objek">
                  {namaObjek(pemeriksaan.objekTipe, pemeriksaan.objekId)}
                </BarisRingkas>
                <BarisRingkas label="Tanggal">{f.tanggal(pemeriksaan.tanggal)}</BarisRingkas>
                <BarisRingkas label="Pengawas">
                  {cari.namaPengawas(pemeriksaan.pengawasId)}
                </BarisRingkas>
              </dl>

              <div className="mt-3">
                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  Pendamping
                </p>
                {pemeriksaan.pendamping.length === 0 ? (
                  <p className="mt-1.5 text-sm text-neutral-500">
                    Tanpa instansi pendamping.
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-1">
                    {pemeriksaan.pendamping.map((x) => (
                      <li key={x} className="text-sm text-neutral-700">
                        {x}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {pemeriksaan.catatan ? (
                <div className="mt-3 rounded-2xl bg-neutral-50 p-3.5">
                  <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                    Catatan pengawas
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                    {pemeriksaan.catatan}
                  </p>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card className="h-fit">
            <CardHeader
              judul="Tanda tangan"
              keterangan="Berita acara mengikat dua pihak: pengawas dan pihak yang diperiksa."
            />
            <CardBody className="space-y-4">
              <Ttd label="Pengawas KP3" sumber={pemeriksaan.ttdPengawas} />
              <Ttd
                label={`Pihak ${LABEL_OBJEK[pemeriksaan.objekTipe].toLowerCase()}`}
                sumber={pemeriksaan.ttdObjek}
              />
              {!pemeriksaan.ttdObjek ? (
                <Peringatan nada="peringatan">
                  Pihak objek belum menandatangani. Berita acara tetap sah dengan
                  catatan penolakan tanda tangan.
                </Peringatan>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

function Ttd({ label, sumber }: { label: string; sumber?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-tinta">{label}</p>
      {sumber ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sumber}
          alt={label}
          className="block max-h-28 w-full rounded-xl bg-white object-contain ring-1 ring-black/[0.06]"
        />
      ) : (
        <p className="flex h-20 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-400">
          Belum ada
        </p>
      )}
    </div>
  )
}
