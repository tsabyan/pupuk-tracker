import { cn } from '@/lib/ui/cn'

/** Pembungkus tabel: lebar berlebih digulir di dalam kartu, bukan di halaman. */
export function TabelWadah({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('w-full overflow-x-auto', className)} {...props} />
}

export function Tabel({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn('w-full min-w-full border-collapse text-sm', className)}
      {...props}
    />
  )
}

export function Th({
  className,
  numerik,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numerik?: boolean }) {
  return (
    <th
      className={cn(
        'border-y border-garis bg-neutral-50/70 px-4 py-3 text-[11px] font-semibold tracking-[0.06em] text-neutral-400 uppercase first:pl-6 last:pr-6 sm:first:pl-7 sm:last:pr-7',
        numerik ? 'text-right' : 'text-left',
        className,
      )}
      {...props}
    />
  )
}

export function Td({
  className,
  numerik,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numerik?: boolean }) {
  return (
    <td
      className={cn(
        'border-b border-garis/70 px-4 py-4 align-middle text-neutral-700 first:pl-6 last:pr-6 sm:first:pl-7 sm:last:pr-7',
        numerik ? 'text-right tabular-nums' : 'text-left',
        className,
      )}
      {...props}
    />
  )
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors duration-150 hover:bg-neutral-50/80', className)}
      {...props}
    />
  )
}
