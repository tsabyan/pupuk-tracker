import * as f from '@/lib/domain/format'
import { cn } from '@/lib/ui/cn'

/**
 * Bilah proporsi sederhana. Cukup untuk memperlihatkan capaian serapan
 * tanpa menarik pustaka grafik ke dalam prototipe.
 */
export function BarRasio({
  rasio,
  label,
  nada = 'aksen',
  className,
}: {
  rasio: number
  label?: string
  nada?: 'aksen' | 'netral' | 'peringatan'
  className?: string
}) {
  const persen = Math.min(100, Math.max(0, rasio * 100))
  const warna = {
    aksen: 'bg-tinta',
    netral: 'bg-neutral-400',
    peringatan: 'bg-amber-500',
  }[nada]

  return (
    <div className={cn('min-w-28', className)}>
      <div className="flex items-baseline justify-between gap-2">
        {label ? <span className="text-xs text-neutral-500">{label}</span> : null}
        <span className="text-xs font-medium text-neutral-600 tabular-nums">
          {f.persen(rasio, 0)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div className={cn('h-full rounded-full', warna)} style={{ width: `${persen}%` }} />
      </div>
    </div>
  )
}
