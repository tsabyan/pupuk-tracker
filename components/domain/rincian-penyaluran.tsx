'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { BarisRingkas } from '@/components/ui/misc'
import { Alur, type Langkah } from '@/components/domain/alur'
import { DaftarItemPupuk } from '@/components/domain/item-pupuk'
import * as f from '@/lib/domain/format'
import type { Penyaluran } from '@/lib/domain/types'
import { usePencari } from '@/lib/hooks'

/**
 * Rincian satu transaksi penyaluran.
 *
 * Dipakai oleh pengecer, kelompok tani, dan pengawas KP3 — ketiganya
 * melihat transaksi yang sama, jadi tampilannya pun satu.
 */
export function RincianPenyaluran({
  penyaluran,
  tambahan,
}: {
  penyaluran: Penyaluran
  /** Blok aksi khusus peran, disisipkan di bawah rincian. */
  tambahan?: React.ReactNode
}) {
  const cari = usePencari()
  const poktan = cari.poktan(penyaluran.poktanId)
  const kios = cari.pengecer(penyaluran.pengecerId)

  const sudahKonfirmasi = Boolean(penyaluran.konfirmasi)
  const sudahValidasi = penyaluran.status === 'divalidasi'
  const bermasalah = penyaluran.status === 'bermasalah'

  const langkah: Langkah[] = [
    {
      label: 'Pengecer menyalurkan pupuk',
      keterangan: `${kios?.nama} · ${f.tanggal(penyaluran.tanggal)}`,
      status: 'selesai',
    },
    {
      label: 'Bukti penyaluran tersimpan',
      keterangan: penyaluran.bukti?.ttdPenerima
        ? 'Tanda tangan penerima terekam'
        : 'Belum ada tanda tangan penerima',
      status: penyaluran.bukti?.ttdPenerima ? 'selesai' : 'menunggu',
    },
    {
      label: 'Kelompok tani mengonfirmasi penerimaan',
      keterangan: penyaluran.konfirmasi
        ? `${f.tanggal(penyaluran.konfirmasi.tanggal)} · ${
            penyaluran.konfirmasi.kesesuaian === 'sesuai' ? 'Sesuai' : 'Tidak sesuai'
          }`
        : 'Menunggu tanda tangan ketua kelompok tani',
      status: sudahKonfirmasi ? 'selesai' : 'berjalan',
    },
    {
      label: 'Pengawas KP3 memvalidasi',
      keterangan: penyaluran.validasi
        ? `${f.tanggal(penyaluran.validasi.tanggal)} · ${cari.namaPengawas(penyaluran.validasi.pengawasId)}`
        : 'Menunggu antrian validasi',
      status: bermasalah ? 'gagal' : sudahValidasi ? 'selesai' : sudahKonfirmasi ? 'berjalan' : 'menunggu',
    },
  ]

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <Card>
          <CardHeader
            judul="Rincian pupuk"
            keterangan={`Harga mengikuti HET · metode ${penyaluran.metodeBayar === 'tunai' ? 'tunai' : 'Kartu Tani'}`}
          />
          <CardBody className="p-0 sm:p-0">
            <DaftarItemPupuk
              items={penyaluran.items}
              namaPupuk={cari.namaPupuk}
              kolomHarga
            />
          </CardBody>
        </Card>

        {tambahan}

        <Card>
          <CardHeader judul="Bukti dan konfirmasi" />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <BuktiGambar
              label="Tanda tangan penerima"
              sumber={penyaluran.bukti?.ttdPenerima}
              catatan={penyaluran.bukti?.catatan}
            />
            <BuktiGambar
              label="Foto struk / serah terima"
              sumber={penyaluran.bukti?.fotoStruk}
            />
            <BuktiGambar
              label="Tanda tangan ketua kelompok tani"
              sumber={penyaluran.konfirmasi?.ttdKetua}
              catatan={penyaluran.konfirmasi?.catatan}
            />
            <BuktiGambar
              label="Foto penerimaan kelompok tani"
              sumber={penyaluran.konfirmasi?.fotoTerima}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader judul="Posisi pada alur distribusi" />
          <CardBody>
            <Alur langkah={langkah} />
          </CardBody>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader judul="Keterangan transaksi" />
        <CardBody>
          <dl>
            <BarisRingkas label="No. transaksi">{penyaluran.noTransaksi}</BarisRingkas>
            <BarisRingkas label="Pengecer">{kios?.nama ?? '—'}</BarisRingkas>
            <BarisRingkas label="Kelompok tani">{poktan?.nama ?? '—'}</BarisRingkas>
            <BarisRingkas label="Ketua">{poktan?.ketua ?? '—'}</BarisRingkas>
            <BarisRingkas label="Desa">
              {poktan ? cari.namaDesa(poktan.desaId) : '—'}
            </BarisRingkas>
            <BarisRingkas label="Acuan RDKK">
              {cari.rdkkPoktan(penyaluran.poktanId)?.kode ?? '—'}
            </BarisRingkas>
            <BarisRingkas label="Tanggal">{f.tanggal(penyaluran.tanggal)}</BarisRingkas>
            <BarisRingkas label="Nilai transaksi">{f.rupiah(penyaluran.total)}</BarisRingkas>
            {penyaluran.konfirmasi ? (
              <BarisRingkas label="Kesesuaian">
                <Badge
                  tone={penyaluran.konfirmasi.kesesuaian === 'sesuai' ? 'sukses' : 'bahaya'}
                >
                  {penyaluran.konfirmasi.kesesuaian === 'sesuai' ? 'Sesuai' : 'Tidak sesuai'}
                </Badge>
              </BarisRingkas>
            ) : null}
          </dl>

          {penyaluran.validasi ? (
            <div className="mt-3 rounded-lg bg-neutral-50 p-3">
              <p className="text-xs font-medium text-neutral-500">Hasil validasi KP3</p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {penyaluran.validasi.hasil === 'valid'
                  ? 'Valid'
                  : penyaluran.validasi.hasil === 'perlu_verifikasi'
                    ? 'Perlu verifikasi lapangan'
                    : 'Tidak valid'}
              </p>
              {penyaluran.validasi.catatan ? (
                <p className="mt-1 text-sm text-neutral-700">{penyaluran.validasi.catatan}</p>
              ) : null}
              <p className="mt-1 text-xs text-neutral-500">
                {cari.namaPengawas(penyaluran.validasi.pengawasId)} ·{' '}
                {f.tanggal(penyaluran.validasi.tanggal)}
              </p>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}

function BuktiGambar({
  label,
  sumber,
  catatan,
}: {
  label: string
  sumber?: string
  catatan?: string
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-neutral-800">{label}</p>
      {sumber ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sumber}
          alt={label}
          className="block max-h-40 w-full rounded-lg border border-neutral-200 bg-white object-contain"
        />
      ) : (
        <p className="flex h-20 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-400">
          Belum ada
        </p>
      )}
      {catatan ? <p className="mt-1.5 text-xs text-neutral-600">{catatan}</p> : null}
    </div>
  )
}
