'use client'

import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button, TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, RadioKartu, Textarea } from '@/components/ui/field'
import { Kosong, PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { FotoUpload } from '@/components/domain/foto-upload'
import { RincianPenyaluran } from '@/components/domain/rincian-penyaluran'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import { TtdPad } from '@/components/domain/ttd-pad'
import { repo } from '@/lib/data'
import type { Kesesuaian } from '@/lib/domain/types'
import { useDb, usePencari } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

export default function KonfirmasiPenerimaanPoktan() {
  const { id } = useParams<{ id: string }>()
  const db = useDb()
  const cari = usePencari()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()

  const penyaluran = useMemo(() => db.penyaluran.find((p) => p.id === id), [db, id])

  const [ttdKetua, setTtdKetua] = useState<string | undefined>()
  const [fotoTerima, setFotoTerima] = useState<string | undefined>()
  const [kesesuaian, setKesesuaian] = useState<Kesesuaian>('sesuai')
  const [catatan, setCatatan] = useState('')

  if (!penyaluran) {
    return (
      <Card>
        <Kosong
          judul="Penerimaan tidak ditemukan"
          aksi={<TombolTautan href="/poktan/penerimaan">Kembali ke daftar</TombolTautan>}
        />
      </Card>
    )
  }

  const perluKonfirmasi = penyaluran.status === 'disalurkan'
  const poktan = cari.poktan(penyaluran.poktanId)

  const konfirmasi = () =>
    void jalankan(
      () =>
        repo.konfirmasiPenyaluran(penyaluran.id, {
          ttdKetua: ttdKetua ?? '',
          fotoTerima,
          kesesuaian,
          catatan,
        }),
      () => router.push('/poktan/penerimaan'),
    )

  const formKonfirmasi = perluKonfirmasi ? (
    <Card>
      <CardHeader
        judul="Konfirmasi penerimaan"
        keterangan="Tanda tangan ketua kelompok tani menjadi bukti serah terima dan membuka antrian validasi Pengawas KP3."
      />
      <CardBody className="space-y-5">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-neutral-800">
            Kesesuaian pupuk yang diterima
          </span>
          <RadioKartu
            nilai={kesesuaian}
            onPilih={setKesesuaian}
            pilihan={[
              {
                nilai: 'sesuai',
                label: 'Sesuai',
                keterangan: 'Jenis, jumlah, dan kualitas sesuai transaksi',
              },
              {
                nilai: 'tidak_sesuai',
                label: 'Tidak sesuai',
                keterangan: 'Ada selisih jumlah atau masalah kualitas',
              },
            ]}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TtdPad
            nilai={ttdKetua}
            onUbah={setTtdKetua}
            label={`Tanda tangan ${poktan?.ketua ?? 'ketua kelompok tani'}`}
          />
          <FotoUpload
            nilai={fotoTerima}
            onUbah={setFotoTerima}
            label="Foto pupuk yang diterima"
            petunjuk="Opsional. Membantu pengawas saat verifikasi."
          />
        </div>

        <Field
          label="Catatan"
          wajib={kesesuaian === 'tidak_sesuai'}
          petunjuk={
            kesesuaian === 'tidak_sesuai'
              ? 'Jelaskan ketidaksesuaian yang ditemukan.'
              : 'Opsional, mis. kondisi kemasan.'
          }
        >
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: jenis dan jumlah pupuk sesuai, kondisi kemasan baik."
          />
        </Field>

        {kesesuaian === 'tidak_sesuai' ? (
          <Peringatan nada="peringatan">
            Penerimaan tetap tercatat, tetapi ditandai tidak sesuai. Pengawas KP3 akan
            melihatnya di antrian validasi.
          </Peringatan>
        ) : null}
        {galat ? <Peringatan nada="bahaya">{galat}</Peringatan> : null}

        <div className="flex flex-wrap gap-2">
          <Button varian="utama" onClick={konfirmasi} disabled={sibuk || !ttdKetua}>
            {sibuk ? 'Menyimpan…' : 'Konfirmasi penerimaan'}
          </Button>
          <Button varian="garis" onClick={() => router.back()} disabled={sibuk}>
            Nanti dulu
          </Button>
        </div>
        {!ttdKetua ? (
          <p className="text-xs text-neutral-500">
            Tanda tangan ketua kelompok tani wajib diisi sebelum konfirmasi.
          </p>
        ) : null}
      </CardBody>
    </Card>
  ) : null

  return (
    <>
      <TautanKembali href="/poktan/penerimaan">Terima Pupuk</TautanKembali>
      <PageHeader
        langkah={perluKonfirmasi ? 'Langkah 2 & 3' : undefined}
        judul={penyaluran.noTransaksi}
        keterangan={`Dari ${cari.namaPengecer(penyaluran.pengecerId)}`}
        aksi={<BadgePenyaluran status={penyaluran.status} />}
      />

      {perluKonfirmasi ? (
        <Peringatan nada="info">
          Cek jenis, jumlah, dan kualitas pupuk sebelum menandatangani. Setelah
          dikonfirmasi, transaksi masuk antrian validasi Pengawas KP3.
        </Peringatan>
      ) : null}

      <RincianPenyaluran penyaluran={penyaluran} tambahan={formKonfirmasi} />
    </>
  )
}
