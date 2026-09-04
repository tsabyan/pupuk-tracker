import { cn } from '@/lib/ui/cn'

export type StatusLangkah = 'selesai' | 'berjalan' | 'menunggu' | 'gagal'

export interface Langkah {
  label: string
  keterangan?: string
  status: StatusLangkah
}

const TITIK: Record<StatusLangkah, string> = {
  selesai: 'border-emerald-500 bg-emerald-500 text-white',
  berjalan: 'border-[var(--aksen,#1a1d1a)] bg-white text-[var(--aksen,#1a1d1a)]',
  menunggu: 'border-neutral-300 bg-white text-neutral-400',
  gagal: 'border-rose-500 bg-rose-500 text-white',
}

/**
 * Rantai langkah satu transaksi. Memperlihatkan posisi transaksi pada alur
 * Distributor → Pengecer → Kelompok Tani → Pengawas KP3.
 */
export function Alur({ langkah }: { langkah: Langkah[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {langkah.map((l, i) => {
        const terakhir = i === langkah.length - 1
        return (
          <li key={l.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold',
                  TITIK[l.status],
                )}
              >
                {l.status === 'selesai' ? '✓' : l.status === 'gagal' ? '!' : i + 1}
              </span>
              {!terakhir ? (
                <span
                  className={cn(
                    'w-0.5 flex-1',
                    l.status === 'selesai' ? 'bg-emerald-300' : 'bg-neutral-200',
                  )}
                />
              ) : null}
            </div>
            <div className={cn('min-w-0 pb-4', terakhir && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  l.status === 'menunggu' ? 'text-neutral-400' : 'text-neutral-900',
                )}
              >
                {l.label}
              </p>
              {l.keterangan ? (
                <p className="mt-0.5 text-xs text-neutral-500">{l.keterangan}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
