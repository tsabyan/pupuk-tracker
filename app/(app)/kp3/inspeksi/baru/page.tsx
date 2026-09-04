'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, RadioKartu, Select, Textarea } from '@/components/ui/field'
import { PageHeader, Peringatan, TautanKembali } from '@/components/ui/misc'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import type { KesesuaianInspeksi, LokasiInspeksi } from '@/lib/domain/types'
import { useDb, useSesi } from '@/lib/hooks'
import { useAksi } from '@/lib/hooks/aksi'

const TEMUAN_UMUM = [
  'Papan informasi HET tidak terpasang di kios',
  'Buku catatan penyaluran manual belum diperbarui',
  'Stok fisik sesuai dengan catatan sistem',
  'Kartu Tani sebagian anggota belum aktif',
  'Penyimpanan pupuk terkena rembesan air',
  'Penyaluran melebihi hak RDKK kelompok tani',
]

export default function FormInspeksi() {
  const db = useDb()
  const { pengawas } = useSesi()
  const router = useRouter()
  const { sibuk, galat, jalankan } = useAksi()

  const [lokasiTipe, setLokasiTipe] = useState<LokasiInspeksi>('pengecer')
  const [lokasiId, setLokasiId] = useState(db.pengecer[0]?.id ?? '')
  const [tanggal, setTanggal] = useState(f.hariIni())
  const [kesesuaian, setKesesuaian] = useState<KesesuaianInspeksi>('sesuai')
  const [temuan, setTemuan] = useState('')
  const [catatan, setCatatan] = useState('')

  const pilihanLokasi = lokasiTipe === 'pengecer' ? db.pengecer : db.kelompokTani

  const gantiTipe = (tipe: LokasiInspeksi) => {
    setLokasiTipe(tipe)
    setLokasiId(
      (tipe === 'pengecer' ? db.pengecer[0]?.id : db.kelompokTani[0]?.id) ?? '',
    )
  }

  const tambahTemuan = (t: string) =>
    setTemuan((lama) => (lama.trim() ? `${lama}\n${t}` : t))

  const simpan = () =>
    void jalankan(
      () =>
        repo.buatInspeksi({
          pengawasId: pengawas!.id,
          lokasiTipe,
          lokasiId,
          tanggal,
          temuan: temuan.split('\n'),
          kesesuaian,
          catatan,
        }),
      () => router.push('/kp3/inspeksi'),
    )

  if (!pengawas) return null

  return (
    <>
      <TautanKembali href="/kp3/inspeksi">Pengawasan Lapangan</TautanKembali>
      <PageHeader
        langkah="Langkah 4"
        judul="Catat Inspeksi Lapangan"
        keterangan="Rekam hasil kunjungan ke kios atau kelompok tani, termasuk temuan yang perlu ditindaklanjuti."
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit">
          <CardHeader judul="Lokasi & waktu" />
          <CardBody className="space-y-4">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                Jenis lokasi
              </span>
              <RadioKartu
                nilai={lokasiTipe}
                onPilih={gantiTipe}
                pilihan={[
                  { nilai: 'pengecer', label: 'Pengecer resmi' },
                  { nilai: 'poktan', label: 'Kelompok tani' },
                ]}
              />
            </div>

            <Field label="Lokasi" wajib>
              <Select value={lokasiId} onChange={(e) => setLokasiId(e.target.value)}>
                {pilihanLokasi.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tanggal inspeksi" wajib>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </Field>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                Kesimpulan kesesuaian
              </span>
              <RadioKartu
                nilai={kesesuaian}
                onPilih={setKesesuaian}
                pilihan={[
                  { nilai: 'sesuai', label: 'Sesuai' },
                  { nilai: 'sebagian', label: 'Sesuai sebagian' },
                  { nilai: 'tidak_sesuai', label: 'Tidak sesuai' },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              judul="Temuan"
              keterangan="Satu baris satu temuan. Klik contoh di bawah untuk menambahkan cepat."
            />
            <CardBody className="space-y-3">
              <Textarea
                value={temuan}
                onChange={(e) => setTemuan(e.target.value)}
                rows={6}
                placeholder="Contoh:&#10;Stok fisik sesuai dengan catatan sistem&#10;Papan informasi HET tidak terpasang"
              />
              <div className="flex flex-wrap gap-2">
                {TEMUAN_UMUM.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => tambahTemuan(t)}
                    className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                  >
                    + {t}
                  </button>
                ))}
              </div>

              <Field label="Catatan pengawas">
                <Textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: inspeksi rutin bulanan sesuai jadwal pengawasan KP3."
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
              disabled={sibuk || !temuan.trim()}
            >
              {sibuk ? 'Menyimpan…' : 'Simpan hasil inspeksi'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
