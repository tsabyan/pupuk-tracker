'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { TombolTautan } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader, StatCard } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import * as f from '@/lib/domain/format'
import {
  LABEL_KESIMPULAN,
  LABEL_OBJEK,
  NADA_KESIMPULAN,
} from '@/lib/domain/pengawasan'
import type { ObjekPengawasan } from '@/lib/domain/types'
import { useDb, usePencari } from '@/lib/hooks'

export default function DaftarPemeriksaan() {
  const db = useDb()
  const cari = usePencari()

  const namaObjek = (tipe: ObjekPengawasan, id: string) =>
    tipe === 'distributor'
      ? cari.namaDistributor(id)
      : tipe === 'pengecer'
        ? cari.namaPengecer(id)
        : tipe === 'poktan'
          ? cari.namaPoktan(id)
          : (db.petani.find((p) => p.id === id)?.nama ?? '—')

  const daftar = useMemo(
    () => [...db.pemeriksaan].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [db],
  )

  const bertemuan = daftar.filter((p) => p.kesimpulan !== 'sesuai').length

  return (
    <>
      <PageHeader
        langkah="Langkah 3"
        judul="Pemeriksaan Lapangan"
        keterangan="Kunjungan ke gudang distributor, kios resmi, kelompok tani, dan petani penerima. Setiap kunjungan menghasilkan berita acara: uji stok fisik, uji harga, verifikasi penerima, dan kelengkapan administrasi."
        aksi={
          <TombolTautan href="/kp3/pemeriksaan/baru" varian="utama">
            Catat pemeriksaan
          </TombolTautan>
        }
      />

      <div className="grid *:min-w-0 gap-4 sm:grid-cols-3">
        <StatCard
          label="Berita acara"
          nilai={f.angka(daftar.length)}
          satuan="dokumen"
          ikon="ClipboardCheck"
          aksen="biru"
          keterangan="Bertanda tangan pengawas dan pihak objek"
        />
        <StatCard
          label="Bertemuan"
          nilai={f.angka(bertemuan)}
          satuan={`dari ${daftar.length}`}
          ikon="AlertTriangle"
          aksen="merah"
          keterangan="Kesimpulan tidak sesuai atau sesuai sebagian"
        />
        <StatCard
          label="Objek diperiksa"
          nilai={f.angka(new Set(daftar.map((p) => `${p.objekTipe}:${p.objekId}`)).size)}
          satuan="objek"
          ikon="Store"
          aksen="ungu"
          keterangan="Distributor, kios, kelompok tani, petani"
        />
      </div>

      <Card>
        <CardHeader
          judul="Riwayat pemeriksaan"
          keterangan="Terbaru di atas. Buka satu baris untuk membaca berita acaranya."
        />
        {daftar.length === 0 ? (
          <Kosong
            judul="Belum ada pemeriksaan"
            aksi={
              <TombolTautan href="/kp3/pemeriksaan/baru" varian="utama" ukuran="sm">
                Catat pemeriksaan
              </TombolTautan>
            }
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>No. berita acara</Th>
                  <Th>Objek</Th>
                  <Th>Tanggal</Th>
                  <Th>Pengawas</Th>
                  <Th numerik>Temuan</Th>
                  <Th>Kesimpulan</Th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((p) => {
                  const jumlah = db.temuan.filter((t) => t.sumberId === p.id).length
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <Link
                          href={`/kp3/pemeriksaan/${p.id}`}
                          className="font-medium text-tinta hover:underline"
                        >
                          {p.noBeritaAcara}
                        </Link>
                        <p className="mt-0.5 text-xs text-neutral-500">{p.kode}</p>
                      </Td>
                      <Td>
                        <p className="font-medium text-tinta">
                          {namaObjek(p.objekTipe, p.objekId)}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {LABEL_OBJEK[p.objekTipe]}
                        </p>
                      </Td>
                      <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggal)}</Td>
                      <Td>
                        <p>{cari.namaPengawas(p.pengawasId)}</p>
                        {p.pendamping.length > 0 ? (
                          <p className="mt-0.5 text-xs text-neutral-500">
                            +{p.pendamping.length} instansi pendamping
                          </p>
                        ) : null}
                      </Td>
                      <Td numerik>{jumlah > 0 ? jumlah : '—'}</Td>
                      <Td>
                        <Badge tone={NADA_KESIMPULAN[p.kesimpulan]}>
                          {LABEL_KESIMPULAN[p.kesimpulan]}
                        </Badge>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Tabel>
          </TabelWadah>
        )}
      </Card>
    </>
  )
}
