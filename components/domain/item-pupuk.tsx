'use client'

import { Input } from '@/components/ui/field'
import { Tabel, TabelWadah, Td, Th, Tr } from '@/components/ui/table'
import * as f from '@/lib/domain/format'
import type { ItemPupuk, JenisPupuk } from '@/lib/domain/types'
import { cn } from '@/lib/ui/cn'

export interface BatasItem {
  jenisPupukId: string
  /** Jumlah maksimum yang boleh diisi. */
  maks: number
  /** Penjelasan batas, mis. "sisa hak 250 kg · stok 1.200 kg". */
  keterangan: string
}

/**
 * Editor jumlah pupuk per jenis. Dipakai di form alokasi, pengiriman,
 * penyaluran, dan laporan pemanfaatan.
 */
export function EditorItemPupuk({
  jenisPupuk,
  nilai,
  onUbah,
  batas,
  tampilkanHarga,
}: {
  jenisPupuk: JenisPupuk[]
  nilai: ItemPupuk[]
  onUbah: (items: ItemPupuk[]) => void
  batas?: BatasItem[]
  tampilkanHarga?: boolean
}) {
  const jumlahDari = (id: string) =>
    nilai.find((i) => i.jenisPupukId === id)?.jumlahKg ?? 0

  const set = (id: string, jumlahKg: number) => {
    const lain = nilai.filter((i) => i.jenisPupukId !== id)
    onUbah(jumlahKg > 0 ? [...lain, { jenisPupukId: id, jumlahKg }] : lain)
  }

  const total = nilai.reduce((t, i) => t + i.jumlahKg, 0)
  const totalRupiah = nilai.reduce((t, i) => {
    const jp = jenisPupuk.find((j) => j.id === i.jenisPupukId)
    return t + i.jumlahKg * (jp?.het ?? 0)
  }, 0)

  return (
    <TabelWadah>
      <Tabel>
        <thead>
          <tr>
            <Th>Jenis pupuk</Th>
            {tampilkanHarga ? <Th numerik>HET / kg</Th> : null}
            <Th numerik className="w-40">
              Jumlah (kg)
            </Th>
            {tampilkanHarga ? <Th numerik>Subtotal</Th> : null}
          </tr>
        </thead>
        <tbody>
          {jenisPupuk.map((jp) => {
            const b = batas?.find((x) => x.jenisPupukId === jp.id)
            const jumlah = jumlahDari(jp.id)
            const lebih = b ? jumlah > b.maks : false

            return (
              <Tr key={jp.id}>
                <Td>
                  <p className="font-medium text-neutral-900">{jp.nama}</p>
                  {b ? (
                    <p className={cn('text-xs', lebih ? 'text-rose-600' : 'text-neutral-500')}>
                      {b.keterangan}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500">{jp.kode}</p>
                  )}
                </Td>
                {tampilkanHarga ? <Td numerik>{f.rupiah(jp.het)}</Td> : null}
                <Td numerik>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={b?.maks}
                    step={25}
                    value={jumlah || ''}
                    placeholder="0"
                    aria-label={`Jumlah ${jp.nama}`}
                    onChange={(e) => set(jp.id, Math.max(0, Number(e.target.value) || 0))}
                    className={cn('text-right', lebih && 'border-rose-400 text-rose-700')}
                  />
                </Td>
                {tampilkanHarga ? (
                  <Td numerik className="font-medium">
                    {jumlah > 0 ? f.rupiah(jumlah * jp.het) : '—'}
                  </Td>
                ) : null}
              </Tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-50/80">
            <Td className="font-semibold">Total</Td>
            {tampilkanHarga ? <Td /> : null}
            <Td numerik className="font-semibold">
              {f.kg(total)}
            </Td>
            {tampilkanHarga ? (
              <Td numerik className="font-semibold">
                {f.rupiah(totalRupiah)}
              </Td>
            ) : null}
          </tr>
        </tfoot>
      </Tabel>
    </TabelWadah>
  )
}

/** Tampilan baca-saja daftar item pupuk. */
export function DaftarItemPupuk({
  items,
  namaPupuk,
  kolomHarga,
}: {
  items: Array<{ jenisPupukId: string; jumlahKg: number; het?: number; subtotal?: number }>
  namaPupuk: (id: string) => string
  kolomHarga?: boolean
}) {
  const total = items.reduce((t, i) => t + i.jumlahKg, 0)
  const totalRupiah = items.reduce((t, i) => t + (i.subtotal ?? 0), 0)

  return (
    <TabelWadah>
      <Tabel>
        <thead>
          <tr>
            <Th>Jenis pupuk</Th>
            <Th numerik>Jumlah</Th>
            {kolomHarga ? <Th numerik>HET</Th> : null}
            {kolomHarga ? <Th numerik>Subtotal</Th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <Tr key={i.jenisPupukId}>
              <Td>{namaPupuk(i.jenisPupukId)}</Td>
              <Td numerik>{f.kg(i.jumlahKg)}</Td>
              {kolomHarga ? <Td numerik>{f.rupiah(i.het ?? 0)}</Td> : null}
              {kolomHarga ? <Td numerik>{f.rupiah(i.subtotal ?? 0)}</Td> : null}
            </Tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-50/80">
            <Td className="font-semibold">Total</Td>
            <Td numerik className="font-semibold">
              {f.kg(total)}
            </Td>
            {kolomHarga ? <Td /> : null}
            {kolomHarga ? (
              <Td numerik className="font-semibold">
                {f.rupiah(totalRupiah)}
              </Td>
            ) : null}
          </tr>
        </tfoot>
      </Tabel>
    </TabelWadah>
  )
}
