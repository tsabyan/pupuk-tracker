'use client'

import Link from 'next/link'
import { forwardRef } from 'react'
import { cn } from '@/lib/ui/cn'

type Varian = 'utama' | 'garis' | 'halus' | 'bahaya' | 'polos'
type Ukuran = 'sm' | 'md' | 'lg'

const VARIAN: Record<Varian, string> = {
  utama:
    'bg-tinta text-white shadow-[0_1px_2px_rgba(16,24,40,0.18),0_8px_20px_-10px_rgba(16,24,40,0.45)] ' +
    'hover:bg-tinta-lembut hover:shadow-[0_2px_4px_rgba(16,24,40,0.2),0_12px_26px_-12px_rgba(16,24,40,0.55)]',
  garis:
    'bg-white text-tinta ring-1 ring-black/[0.07] shadow-[0_1px_2px_rgba(16,24,40,0.05)] ' +
    'hover:bg-neutral-50 hover:ring-black/[0.12]',
  halus: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
  bahaya:
    'bg-merah text-white shadow-[0_1px_2px_rgba(224,72,79,0.25),0_8px_20px_-10px_rgba(224,72,79,0.55)] hover:brightness-95',
  polos: 'text-neutral-500 hover:bg-neutral-100 hover:text-tinta',
}

const UKURAN: Record<Ukuran, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-sm',
}

const DASAR =
  'inline-flex shrink-0 items-center justify-center rounded-xl font-medium ' +
  'transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: Varian
  ukuran?: Ukuran
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { varian = 'garis', ukuran = 'md', className, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(DASAR, VARIAN[varian], UKURAN[ukuran], className)} {...props} />
  )
})

/** Tautan yang tampil sebagai tombol — untuk aksi yang berpindah halaman. */
export function TombolTautan({
  href,
  varian = 'garis',
  ukuran = 'md',
  className,
  children,
}: {
  href: string
  varian?: Varian
  ukuran?: Ukuran
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className={cn(DASAR, VARIAN[varian], UKURAN[ukuran], className)}>
      {children}
    </Link>
  )
}
