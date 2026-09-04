'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { Kosong, PageHeader } from '@/components/ui/misc'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import { BadgePenyaluran } from '@/components/domain/status-badge'
import * as f from '@/lib/domain/format'
import { useDb, usePencari } from '@/lib/hooks'

export default function AntrianValidasi() {
  const db = useDb()
  const cari = usePencari()

  const { antrian, riwayat } = useMemo(() => {
    const urut = [...db.penyaluran].sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    return {
      antrian: urut.filter((p) => p.status === 'dikonfirmasi'),
      riwayat: db.validasi
        .slice()
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, 25),
    }
  }, [db])

  return (
    <>
      <PageHeader
        langkah="Langkah 2"
        judul="Validasi & Verifikasi"
        keterangan="Periksa kelengkapan bukti dan kesesuaian penyaluran terhadap RDKK. Transaksi yang meragukan dapat ditandai untuk verifikasi lapangan."
      />

      <Card>
        <CardHeader
          judul="Antrian validasi"
          keterangan={`${antrian.length} penyaluran sudah dikonfirmasi kelompok tani dan menunggu validasi`}
        />
        {antrian.length === 0 ? (
          <Kosong
            judul="Antrian kosong"
            keterangan="Semua penyaluran yang dikonfirmasi kelompok tani sudah divalidasi."
          />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>No. transaksi</Th>
                  <Th>Kios</Th>
                  <Th>Kelompok tani</Th>
                  <Th>Tanggal</Th>
                  <Th numerik>Jumlah</Th>
                  <Th>Kesesuaian</Th>
                  <Th>Bukti</Th>
                </tr>
              </thead>
              <tbody>
                {antrian.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <Link
                        href={`/kp3/validasi/${p.id}`}
                        className="font-medium text-[var(--aksen)] hover:underline"
                      >
                        {p.noTransaksi}
                      </Link>
                    </Td>
                    <Td>{cari.namaPengecer(p.pengecerId)}</Td>
                    <Td>{cari.namaPoktan(p.poktanId)}</Td>
                    <Td className="whitespace-nowrap">{f.tanggalSingkat(p.tanggal)}</Td>
                    <Td numerik>{f.kg(p.items.reduce((t, i) => t + i.jumlahKg, 0))}</Td>
                    <Td>
                      <Badge
                        tone={p.konfirmasi?.kesesuaian === 'sesuai' ? 'sukses' : 'bahaya'}
                      >
                        {p.konfirmasi?.kesesuaian === 'sesuai' ? 'Sesuai' : 'Tidak sesuai'}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-neutral-600">
                      {p.bukti?.ttdPenerima ? '✓ TTD kios' : '— TTD kios'}
                      <br />
                      {p.konfirmasi?.ttdKetua ? '✓ TTD ketua' : '— TTD ketua'}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          </TabelWadah>
        )}
      </Card>

      <Card>
        <CardHeader judul="Riwayat validasi" keterangan="25 tindakan validasi terakhir" />
        {riwayat.length === 0 ? (
          <Kosong judul="Belum ada riwayat validasi" />
        ) : (
          <TabelWadah>
            <Tabel>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Transaksi</Th>
                  <Th>Pengawas</Th>
                  <Th>Tanggal</Th>
                  <Th>Hasil</Th>
                  <Th>Status transaksi</Th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((v) => {
                  const target = db.penyaluran.find((p) => p.id === v.targetId)
                  return (
                    <Tr key={v.id}>
                      <Td className="font-medium text-neutral-900">{v.kode}</Td>
                      <Td>
                        {target ? (
                          <Link
                            href={`/kp3/validasi/${target.id}`}
                            className="text-[var(--aksen)] hover:underline"
                          >
                            {target.noTransaksi}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td>{cari.namaPengawas(v.pengawasId)}</Td>
                      <Td className="whitespace-nowrap">{f.tanggalSingkat(v.tanggal)}</Td>
                      <Td>
                        <Badge
                          tone={
                            v.hasil === 'valid'
                              ? 'sukses'
                              : v.hasil === 'perlu_verifikasi'
                                ? 'peringatan'
                                : 'bahaya'
                          }
                        >
                          {v.hasil === 'valid'
                            ? 'Valid'
                            : v.hasil === 'perlu_verifikasi'
                              ? 'Perlu verifikasi'
                              : 'Tidak valid'}
                        </Badge>
                      </Td>
                      <Td>{target ? <BadgePenyaluran status={target.status} /> : '—'}</Td>
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
