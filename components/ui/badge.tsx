import { cn } from '@/lib/ui/cn'
import type { Tone } from '@/lib/domain/status'

const TONE: Record<Tone, string> = {
  netral: 'bg-neutral-100 text-neutral-600 ring-neutral-200/60',
  info: 'bg-biru-lembut text-biru ring-biru/15',
  sukses: 'bg-hijau-lembut text-hijau ring-hijau/15',
  peringatan: 'bg-jingga-lembut text-jingga ring-jingga/20',
  bahaya: 'bg-merah-lembut text-merah ring-merah/15',
}

const TITIK: Record<Tone, string> = {
  netral: 'bg-neutral-400',
  info: 'bg-biru',
  sukses: 'bg-hijau',
  peringatan: 'bg-jingga',
  bahaya: 'bg-merah',
}

export function Badge({
  tone = 'netral',
  titik,
  className,
  children,
}: {
  tone?: Tone
  /** Tampilkan titik status kecil di depan label. */
  titik?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONE[tone],
        className,
      )}
    >
      {titik ? <span className={cn('size-1.5 rounded-full', TITIK[tone])} /> : null}
      {children}
    </span>
  )
}
