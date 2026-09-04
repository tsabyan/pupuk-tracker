'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Ikon } from './ikon'
import { LonceNotifikasi } from './lonceng'
import { PemilihRole } from './pemilih-role'
import type { Role } from '@/lib/domain/types'
import { useSesi } from '@/lib/hooks'
import { NAVIGASI, NAVIGASI_UMUM, menuAktif, type ItemNav } from '@/lib/ui/navigasi'
import { TEMA } from '@/lib/ui/tema'
import { cn } from '@/lib/ui/cn'
import { KABUPATEN, MUSIM_TANAM, PROVINSI, TAHUN_MUSIM } from '@/lib/seed'

/**
 * Kerangka layar untuk seluruh peran.
 *
 * Tata letak dashboard baku: sidebar terang tetap di kiri, bilah atas
 * untuk identitas dan akun, isi halaman di tengah dengan lebar terbatas.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, namaEntitas } = useSesi()
  const router = useRouter()
  const [menuTerbuka, setMenuTerbuka] = useState(false)

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user || !role) return null

  const tema = TEMA[role]

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar
        role={role}
        menu={NAVIGASI[role]}
        peran={tema.label}
        entitas={namaEntitas}
        terbuka={menuTerbuka}
        onTutup={() => setMenuTerbuka(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-black/[0.05] bg-white/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              className="-ml-1 rounded-xl p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-tinta lg:hidden"
              onClick={() => setMenuTerbuka(true)}
              aria-label="Buka menu"
            >
              <Menu className="size-5" aria-hidden />
            </button>

            <div className="min-w-0 lg:hidden">
              <p className="truncate text-sm font-semibold text-tinta">{tema.label}</p>
              <p className="truncate text-xs text-neutral-500">{namaEntitas}</p>
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-white px-3.5 py-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-black/[0.05] lg:flex">
              <span className="size-1.5 rounded-full bg-hijau" />
              <span className="text-sm text-neutral-500">
                Musim tanam{' '}
                <span className="font-medium text-tinta">
                  {MUSIM_TANAM} {TAHUN_MUSIM}
                </span>
              </span>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <LonceNotifikasi />
              <span className="mx-1.5 hidden h-6 w-px bg-black/[0.07] sm:block" />
              <PemilihRole />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 pb-20 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function Sidebar({
  role,
  menu,
  peran,
  entitas,
  terbuka,
  onTutup,
}: {
  role: Role
  menu: ItemNav[]
  peran: string
  entitas: string
  terbuka: boolean
  onTutup: () => void
}) {
  const pathname = usePathname()
  const hrefAktif = menuAktif(role, pathname)

  const tautan = (item: ItemNav, tampilkanLangkah = true) => {
    const aktif = item.href === hrefAktif
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onTutup}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
          aktif
            ? 'bg-white font-medium text-tinta shadow-[0_1px_2px_rgba(16,24,40,0.06),0_6px_16px_-10px_rgba(16,24,40,0.3)] ring-1 ring-black/[0.05]'
            : 'text-neutral-500 hover:bg-white/70 hover:text-tinta',
        )}
      >
        <Ikon
          nama={item.ikon}
          className={cn('size-[18px] shrink-0', aktif ? 'text-tinta' : 'text-neutral-400')}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {tampilkanLangkah && item.langkah ? (
          <span
            className={cn(
              'shrink-0 text-[11px] tabular-nums',
              aktif ? 'text-neutral-400' : 'text-neutral-300',
            )}
          >
            {item.langkah}
          </span>
        ) : null}
      </Link>
    )
  }

  const isi = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-tinta-lembut to-tinta text-sm font-bold text-white shadow-[0_2px_6px_rgba(16,24,40,0.28)]">
          P
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-tinta">Pengawasan Pupuk</p>
          <p className="truncate text-xs text-neutral-400">Bersubsidi Terintegrasi</p>
        </div>
        <button
          onClick={onTutup}
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 lg:hidden"
          aria-label="Tutup menu"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mx-3 rounded-2xl bg-white/70 px-4 py-3.5 ring-1 ring-black/[0.04]">
        <p className="text-[11px] tracking-[0.08em] text-neutral-400 uppercase">
          Masuk sebagai
        </p>
        <p className="mt-1 text-sm font-semibold text-tinta">{peran}</p>
        <p className="mt-0.5 text-xs leading-snug text-neutral-500">{entitas}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pt-3 pb-1.5 text-[11px] font-medium tracking-[0.08em] text-neutral-400 uppercase">
          Alur kerja
        </p>
        {menu.map((item) => tautan(item))}

        <p className="px-3 pt-5 pb-1.5 text-[11px] font-medium tracking-[0.08em] text-neutral-400 uppercase">
          Lainnya
        </p>
        {NAVIGASI_UMUM.map((item) => tautan(item, false))}
      </nav>

      <div className="shrink-0 px-5 py-4">
        <p className="text-xs text-neutral-400">
          {KABUPATEN} · {PROVINSI}
        </p>
        <p className="mt-0.5 text-xs text-neutral-300">Prototipe · data sintetis</p>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden w-[17rem] shrink-0 border-r border-black/[0.05] bg-white/45 backdrop-blur-xl lg:block">
        <div className="sticky top-0 h-dvh">{isi}</div>
      </aside>

      {terbuka ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-tinta/30 backdrop-blur-sm"
            onClick={onTutup}
          />
          <div className="relative h-full w-[17rem] max-w-[85%] bg-kertas shadow-2xl">{isi}</div>
        </div>
      ) : null}
    </>
  )
}
