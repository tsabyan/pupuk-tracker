'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button, TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, RadioKartu, Select, Textarea } from '@/components/ui/field'
import { Kosong, PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { RincianPenyaluran } from '@/components/domain/rincian-penyaluran'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import {
  LABEL_ASPEK,
  LABEL_TINGKAT,
  penapisanPenyaluran,
} from '@/lib/domain/pengawasan'
import { penyaluranSelesai } from '@/lib/domain/status'
import type { AspekTepat, TingkatTemuan } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

type HasilTelaah = 'sesuai' | 'temuan'

export default function TelaahObjek() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()
  const { pengawas } = useSesi()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()

  const penyaluran = useMemo(() => db.penyaluran.find((p) => p.id === id), [db, id])

  const penapisan = useMemo(() => {
    if (!penyaluran) return []
    return penapisanPenyaluran(penyaluran, {
      poktan: cari.poktan(penyaluran.poktanId),
      rdkk: cari.rdkkPoktan(penyaluran.poktanId),
      penyaluranPoktan: db.penyaluran.filter((p) => p.poktanId === penyaluran.poktanId),
      het: (jenisPupukId) => cari.pupuk(jenisPupukId)?.het ?? 0,
      namaPupuk: cari.namaPupuk,
      hariIni: f.hariIni(),
    })
  }, [penyaluran, db, cari])

  const bertanda = penapisan.filter((b) => !b.lolos)

  const [hasil, setHasil] = useState<HasilTelaah>(
    bertanda.length > 0 ? 'temuan' : 'sesuai',
  )
  const [catatan, setCatatan] = useState('')
  const [tingkat, setTingkat] = useState<Record<string, TingkatTemuan>>({})
  const [dipilih, setDipilih] = useState<Record<string, boolean>>({})

  if (!penyaluran) {
    return (
      <Card>
        <Kosong
          judul="Transaksi tidak ditemukan"
          aksi={<TombolTautan href="/kp3/objek">Kembali ke daftar objek</TombolTautan>}
        />
      </Card>
    )
  }

  const sudahTuntas = penyaluranSelesai(penyaluran.status)
  const sudahDitelaah = Boolean(penyaluran.pengawasan)

  // Butir bertanda dipilih semua secara baku: itu alasan transaksi ini muncul.
  const terpilih = (aspek: AspekTepat) => dipilih[aspek] ?? true

  const simpan = () =>
    void jalankan(
      () =>
        repo.telaahPenyaluran(penyaluran.id, {
          pengawasId: pengawas!.id,
          hasil,
          catatan,
          temuan:
            hasil === 'temuan'
              ? bertanda
                  .filter((b) => terpilih(b.aspek))
                  .map((b) => ({
                    aspek: b.aspek,
                    uraian: `${b.label}: ${b.keterangan ?? 'tidak terpenuhi'}`,
                    tingkat: tingkat[b.aspek] ?? 'sedang',
                  }))
              : undefined,
        }),
      () => router.push('/kp3/objek'),
    )

  const jumlahTemuan = hasil === 'temuan' ? bertanda.filter((b) => terpilih(b.aspek)).length : 0

  const panelTelaah = (
    <Card>
      <CardHeader
        judul="Penapisan tujuh tepat"
        keterangan="Dijalankan otomatis dari data transaksi. Butir yang tidak terpenuhi adalah alasan memilih objek, bukan pembatalan transaksi."
      />
      <CardBody className="space-y-5">
        <ul className="space-y-2.5">
          {penapisan.map((b) => (
            <li key={b.aspek} className="flex items-start gap-2.5 text-sm">
              <span
                className={
                  b.lolos
                    ? 'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-hijau text-[10px] text-white'
                    : 'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-merah text-[10px] text-white'
                }
                aria-hidden
              >
                {b.lolos ? '✓' : '!'}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={b.lolos ? 'text-neutral-700' : 'font-medium text-merah'}
                  >
                    {b.label}
                  </span>
                  <Badge tone={b.lolos ? 'netral' : 'bahaya'}>
                    {LABEL_ASPEK[b.aspek]}
                  </Badge>
                </span>
                {b.keterangan ? (
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                    {b.keterangan}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        {!sudahTuntas ? (
          <Peringatan nada="info">
            Kelompok tani belum menyatakan sikapnya, jadi belum ada yang bisa
            ditelaah. Transaksi ini pun tidak sedang menunggu pengawas.
          </Peringatan>
        ) : sudahDitelaah ? (
          <Peringatan nada="sukses">
            Sudah ditelaah{' '}
            {cari.namaPengawas(penyaluran.pengawasan!.pengawasId)} pada{' '}
            {f.tanggal(penyaluran.pengawasan!.tanggal)}. Lihat panel jejak
            pengawasan di samping.
          </Peringatan>
        ) : (
          <>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-tinta">
                Hasil telaah dokumen
              </span>
              <RadioKartu
                nilai={hasil}
                onPilih={setHasil}
                pilihan={[
                  {
                    nilai: 'sesuai',
                    label: 'Sesuai',
                    keterangan: 'Dokumen dan angka konsisten, tidak perlu ditindaklanjuti',
                  },
                  {
                    nilai: 'temuan',
                    label: 'Ada temuan',
                    keterangan: 'Catat sebagai temuan yang dilacak sampai tuntas',
                  },
                ]}
              />
            </div>

            {hasil === 'temuan' ? (
              bertanda.length === 0 ? (
                <Peringatan nada="peringatan">
                  Penapisan tidak menemukan butir yang gagal. Bila tetap ada
                  temuan, catat lewat pemeriksaan lapangan agar ada berita
                  acaranya.
                </Peringatan>
              ) : (
                <div className="space-y-2.5">
                  <span className="block text-sm font-medium text-tinta">
                    Temuan yang dicatat
                  </span>
                  {bertanda.map((b) => (
                    <div
                      key={b.aspek}
                      className="flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 px-3.5 py-3"
                    >
                      <label className="flex min-w-0 flex-1 items-start gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 shrink-0 accent-[var(--color-tinta)]"
                          checked={terpilih(b.aspek)}
                          onChange={(e) =>
                            setDipilih((l) => ({ ...l, [b.aspek]: e.target.checked }))
                          }
                        />
                        <span className="min-w-0">
                          <span className="font-medium text-tinta">
                            {LABEL_ASPEK[b.aspek]}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                            {b.keterangan ?? b.label}
                          </span>
                        </span>
                      </label>
                      <Select
                        className="w-36 shrink-0"
                        value={tingkat[b.aspek] ?? 'sedang'}
                        onChange={(e) =>
                          setTingkat((l) => ({
                            ...l,
                            [b.aspek]: e.target.value as TingkatTemuan,
                          }))
                        }
                        disabled={!terpilih(b.aspek)}
                      >
                        {(Object.keys(LABEL_TINGKAT) as TingkatTemuan[]).map((t) => (
                          <option key={t} value={t}>
                            {LABEL_TINGKAT[t]}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              )
            ) : null}

            <Field
              label="Catatan telaah"
              petunjuk="Tersimpan pada jejak pengawasan transaksi dan terlihat oleh kios serta kelompok tani."
            >
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: bukti dua pihak lengkap, penebusan masih dalam batas RDKK."
              />
            </Field>

            {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

            <div className="flex flex-wrap gap-2">
              <Button
                varian="utama"
                onClick={simpan}
                disabled={sibuk || (hasil === 'temuan' && jumlahTemuan === 0)}
              >
                {sibuk ? 'Menyimpan…' : 'Simpan hasil telaah'}
              </Button>
              <TombolTautan
                href={`/kp3/pemeriksaan/baru?objek=pengecer&id=${penyaluran.pengecerId}&sampel=${penyaluran.id}`}
              >
                Jadikan objek pemeriksaan lapangan
              </TombolTautan>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )

  return (
    <>
      <TautanKembali href="/kp3/objek">Objek Pengawasan</TautanKembali>
      <PageHeader
        langkah="Langkah 2"
        judul={penyaluran.noTransaksi}
        keterangan={`${cari.namaPengecer(penyaluran.pengecerId)} → ${cari.namaPoktan(penyaluran.poktanId)}`}
        aksi={<BadgePenyaluran status={penyaluran.status} />}
      />

      {penyaluran.status === 'disanggah' ? (
        <Peringatan nada="bahaya">
          Kelompok tani menyanggah penerimaan ini.{' '}
          {penyaluran.konfirmasi?.catatan ?? ''} Transaksi tetap tercatat — yang
          diperiksa adalah sebabnya.
        </Peringatan>
      ) : null}

      <RincianPenyaluran penyaluran={penyaluran} tambahan={panelTelaah} />
    </>
  )
}
