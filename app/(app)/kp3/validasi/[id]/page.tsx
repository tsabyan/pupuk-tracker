'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button, TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, RadioKartu, Textarea } from '@/components/ui/field'
import { Kosong, PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { RincianPenyaluran } from '@/components/domain/rincian-penyaluran'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import { repo } from '@/lib/data'
import { hitungSisaHak } from '@/lib/domain/stok'
import type { HasilValidasi } from '@/lib/domain/types'
import { useDb, usePencari, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

export default function ValidasiPenyaluran() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()
  const { pengawas } = useSesi()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()

  const penyaluran = useMemo(() => db.penyaluran.find((p) => p.id === id), [db, id])

  const [hasil, setHasil] = useState<HasilValidasi>('valid')
  const [catatan, setCatatan] = useState('')

  /** Pemeriksaan otomatis yang biasanya dilakukan pengawas secara manual. */
  const pemeriksaan = useMemo(() => {
    if (!penyaluran) return []
    const hak = hitungSisaHak(
      cari.rdkkPoktan(penyaluran.poktanId),
      db.penyaluran.filter((p) => p.poktanId === penyaluran.poktanId),
    )
    const melebihiHak = hak.some((h) => h.ditebusKg > h.hakKg)

    return [
      {
        label: 'Tanda tangan penerima di kios',
        lolos: Boolean(penyaluran.bukti?.ttdPenerima),
      },
      {
        label: 'Tanda tangan ketua kelompok tani',
        lolos: Boolean(penyaluran.konfirmasi?.ttdKetua),
      },
      {
        label: 'Kelompok tani menyatakan sesuai',
        lolos: penyaluran.konfirmasi?.kesesuaian === 'sesuai',
      },
      { label: 'Penebusan tidak melebihi hak RDKK', lolos: !melebihiHak },
      {
        label: 'Harga mengikuti HET',
        lolos: penyaluran.items.every((i) => i.het === cari.pupuk(i.jenisPupukId)?.het),
      },
    ]
  }, [penyaluran, db, cari])

  if (!penyaluran) {
    return (
      <Card>
        <Kosong
          judul="Transaksi tidak ditemukan"
          aksi={<TombolTautan href="/kp3/validasi">Kembali ke antrian</TombolTautan>}
        />
      </Card>
    )
  }

  const dapatDivalidasi = penyaluran.status === 'dikonfirmasi'
  const temuanOtomatis = pemeriksaan.filter((p) => !p.lolos)

  const simpan = () =>
    void jalankan(
      () =>
        repo.validasiPenyaluran(penyaluran.id, {
          pengawasId: pengawas!.id,
          hasil,
          catatan,
        }),
      () => router.push('/kp3/validasi'),
    )

  const formValidasi = (
    <Card>
      <CardHeader
        judul="Hasil pemeriksaan"
        keterangan="Pemeriksaan kelengkapan dijalankan otomatis dari data transaksi"
      />
      <CardBody className="space-y-5">
        <ul className="space-y-2">
          {pemeriksaan.map((p) => (
            <li key={p.label} className="flex items-start gap-2 text-sm">
              <span
                className={
                  p.lolos
                    ? 'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white'
                    : 'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white'
                }
                aria-hidden
              >
                {p.lolos ? '✓' : '!'}
              </span>
              <span className={p.lolos ? 'text-neutral-700' : 'font-medium text-rose-700'}>
                {p.label}
              </span>
            </li>
          ))}
        </ul>

        {dapatDivalidasi ? (
          <>
            {temuanOtomatis.length > 0 ? (
              <Peringatan nada="peringatan">
                {temuanOtomatis.length} butir pemeriksaan tidak terpenuhi. Pertimbangkan
                verifikasi lapangan sebelum menyatakan valid.
              </Peringatan>
            ) : null}

            <div>
              <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                Keputusan validasi
              </span>
              <RadioKartu
                nilai={hasil}
                onPilih={setHasil}
                pilihan={[
                  {
                    nilai: 'valid',
                    label: 'Valid',
                    keterangan: 'Bukti lengkap dan sesuai ketentuan',
                  },
                  {
                    nilai: 'perlu_verifikasi',
                    label: 'Perlu verifikasi lapangan',
                    keterangan: 'Status transaksi tidak berubah, dijadwalkan inspeksi',
                  },
                  {
                    nilai: 'tidak_valid',
                    label: 'Tidak valid',
                    keterangan: 'Ditandai bermasalah dan diteruskan ke tindak lanjut',
                  },
                ]}
              />
            </div>

            <Field
              label="Catatan validasi"
              wajib={hasil === 'tidak_valid'}
              petunjuk="Tersimpan pada riwayat validasi dan terlihat oleh kios serta kelompok tani."
            >
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: dokumen dan bukti penyaluran lengkap serta sesuai RDKK."
              />
            </Field>

            {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

            <div className="flex flex-wrap gap-2">
              <Button varian="utama" onClick={simpan} disabled={sibuk}>
                {sibuk ? 'Menyimpan…' : 'Simpan hasil validasi'}
              </Button>
              <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
                Batal
              </Button>
            </div>
          </>
        ) : (
          <Peringatan nada="info">
            {penyaluran.status === 'disalurkan'
              ? 'Transaksi belum dikonfirmasi kelompok tani, jadi belum bisa divalidasi.'
              : 'Transaksi ini sudah pernah diputuskan. Lihat hasilnya pada panel keterangan.'}
          </Peringatan>
        )}
      </CardBody>
    </Card>
  )

  return (
    <>
      <TautanKembali href="/kp3/validasi">Validasi & Verifikasi</TautanKembali>
      <PageHeader
        langkah="Langkah 2"
        judul={penyaluran.noTransaksi}
        keterangan={`${cari.namaPengecer(penyaluran.pengecerId)} → ${cari.namaPoktan(penyaluran.poktanId)}`}
        aksi={<BadgePenyaluran status={penyaluran.status} />}
      />

      {penyaluran.status === 'bermasalah' ? (
        <Peringatan nada="bahaya">
          Transaksi ditandai bermasalah.{' '}
          <TombolTautan
            href={`/kp3/tindak-lanjut/baru?penyaluran=${penyaluran.id}`}
            varian="bahaya"
            ukuran="sm"
            className="ml-2"
          >
            Terbitkan tindak lanjut
          </TombolTautan>
        </Peringatan>
      ) : null}

      <RincianPenyaluran penyaluran={penyaluran} tambahan={formValidasi} />
    </>
  )
}
