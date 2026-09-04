'use client'

import { cn } from '@/lib/ui/cn'

export interface ItemTab<T extends string> {
  nilai: T
  label: string
  /** Angka kecil di samping label, mis. jumlah baris pada tabel. */
  jumlah?: number
}

/**
 * Pemisah isi halaman.
 *
 * Dipakai supaya satu layar tidak menumpuk beberapa tabel sekaligus:
 * pengguna memilih satu bagian, sisanya disembunyikan.
 */
export function Tabs<T extends string>({
  daftar,
  aktif,
  onPilih,
  className,
}: {
  daftar: Array<ItemTab<T>>
  aktif: T
  onPilih: (nilai: T) => void
  className?: string
}) {
  return (
    <div className={cn('gulir-halus flex gap-1 overflow-x-auto px-4 pt-4 sm:px-5', className)}>
      {daftar.map((t) => {
        const dipilih = t.nilai === aktif
        return (
          <button
            key={t.nilai}
            onClick={() => onPilih(t.nilai)}
            aria-current={dipilih ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150',
              dipilih
                ? 'bg-tinta text-white shadow-[0_1px_2px_rgba(16,24,40,0.16),0_8px_18px_-10px_rgba(16,24,40,0.4)]'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-tinta',
            )}
          >
            {t.label}
            {typeof t.jumlah === 'number' ? (
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[11px] tabular-nums',
                  dipilih ? 'bg-white/15 text-white/80' : 'bg-neutral-100 text-neutral-400',
                )}
              >
                {t.jumlah}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
