import { cn } from '@/lib/ui/cn'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-white shadow-kartu ring-1 ring-black/[0.04]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  judul,
  keterangan,
  aksi,
  className,
}: {
  judul: React.ReactNode
  keterangan?: React.ReactNode
  aksi?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 px-6 py-5 sm:px-7',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-tinta">{judul}</h2>
        {keterangan ? (
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">{keterangan}</p>
        ) : null}
      </div>
      {aksi ? <div className="flex shrink-0 items-center gap-2">{aksi}</div> : null}
    </div>
  )
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pb-6 sm:px-7 sm:pb-7', className)} {...props} />
}
