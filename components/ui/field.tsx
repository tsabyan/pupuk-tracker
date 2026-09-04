'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/ui/cn'

const KONTROL =
  'w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-tinta ring-1 ring-black/[0.08] ' +
  'shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow ' +
  'placeholder:text-neutral-400 hover:ring-black/[0.14] focus:ring-2 focus:ring-tinta focus:outline-none ' +
  'disabled:bg-neutral-50 disabled:text-neutral-400'

export function Field({
  label,
  petunjuk,
  galat,
  wajib,
  children,
  className,
}: {
  label: string
  petunjuk?: string
  galat?: string
  wajib?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-tinta">
        {label}
        {wajib ? <span className="text-merah">*</span> : null}
      </span>
      {children}
      {petunjuk && !galat ? (
        <span className="mt-1.5 block text-xs leading-relaxed text-neutral-500">{petunjuk}</span>
      ) : null}
      {galat ? <span className="mt-1.5 block text-xs text-merah">{galat}</span> : null}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(KONTROL, className)} {...props} />
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} rows={3} className={cn(KONTROL, 'resize-y', className)} {...props} />
})

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn(KONTROL, 'pr-8', className)} {...props} />
})

export function RadioKartu<T extends string>({
  nilai,
  pilihan,
  onPilih,
  nama,
}: {
  nilai: T
  pilihan: Array<{ nilai: T; label: string; keterangan?: string }>
  onPilih: (n: T) => void
  nama?: string
}) {
  const id = useId()
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {pilihan.map((p) => {
        const aktif = p.nilai === nilai
        return (
          <label
            key={p.nilai}
            className={cn(
              'cursor-pointer rounded-xl p-3.5 ring-1 transition-all duration-150',
              aktif
                ? 'bg-tinta ring-tinta shadow-[0_1px_2px_rgba(16,24,40,0.16),0_8px_18px_-10px_rgba(16,24,40,0.4)]'
                : 'bg-white ring-black/[0.08] hover:ring-black/[0.16]',
            )}
          >
            <input
              type="radio"
              name={nama ?? id}
              className="sr-only"
              checked={aktif}
              onChange={() => onPilih(p.nilai)}
            />
            <span className={cn('block text-sm font-medium', aktif ? 'text-white' : 'text-tinta')}>
              {p.label}
            </span>
            {p.keterangan ? (
              <span
                className={cn(
                  'mt-0.5 block text-xs leading-relaxed',
                  aktif ? 'text-white/65' : 'text-neutral-500',
                )}
              >
                {p.keterangan}
              </span>
            ) : null}
          </label>
        )
      })}
    </div>
  )
}
