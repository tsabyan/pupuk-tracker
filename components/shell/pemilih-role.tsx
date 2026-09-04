'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, RotateCcw } from 'lucide-react'
import { useSesiStore } from '@/lib/auth/session'
import { repo } from '@/lib/data'
import { namaPanggilan, useDb, useSesi } from '@/lib/hooks'
import { AKUN_DEMO } from '@/lib/seed'
import { TEMA, URUTAN_ROLE } from '@/lib/ui/tema'
import { cn } from '@/lib/ui/cn'

/**
 * Pindah peran tanpa keluar-masuk aplikasi.
 *
 * Ada khusus untuk demo: satu alur distribusi melibatkan empat peran, dan
 * presentasi jadi tersendat kalau harus logout setiap ganti sudut pandang.
 */
export function PemilihRole() {
  const { user, role } = useSesi()
  const db = useDb()
  const masuk = useSesiStore((s) => s.masuk)
  const keluar = useSesiStore((s) => s.keluar)
  const router = useRouter()
  const [terbuka, setTerbuka] = useState(false)
  const [konfirmasiReset, setKonfirmasiReset] = useState(false)
  const wadahRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!terbuka) return
    const onKlik = (e: MouseEvent) => {
      if (!wadahRef.current?.contains(e.target as Node)) {
        setTerbuka(false)
        setKonfirmasiReset(false)
      }
    }
    document.addEventListener('mousedown', onKlik)
    return () => document.removeEventListener('mousedown', onKlik)
  }, [terbuka])

  if (!user || !role) return null

  const inisial = user.nama
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0])
    .join('')
    .toUpperCase()

  return (
    <div className="relative" ref={wadahRef}>
      <button
        onClick={() => setTerbuka((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-white py-1 pr-2.5 pl-1 shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-black/[0.05] transition-shadow hover:shadow-[0_2px_6px_rgba(16,24,40,0.1)]"
        aria-label="Ganti peran"
        aria-expanded={terbuka}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-tinta-lembut to-tinta text-xs font-semibold text-white">
          {inisial}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium text-tinta sm:block">
          {namaPanggilan(user.nama)}
        </span>
        <ChevronDown className="size-4 text-neutral-400" aria-hidden />
      </button>

      {terbuka ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-white shadow-[0_8px_16px_-8px_rgba(16,24,40,0.2),0_24px_48px_-24px_rgba(16,24,40,0.4)] ring-1 ring-black/[0.06]">
          <div className="border-b border-garis px-4 py-3.5">
            <p className="text-sm font-semibold text-neutral-900">{user.nama}</p>
            <p className="text-xs text-neutral-500">
              {user.jabatan} · {TEMA[role].label}
            </p>
          </div>

          <div className="p-1.5">
            <p className="px-2.5 pt-1.5 pb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">
              Lihat sebagai
            </p>
            {URUTAN_ROLE.map((r) => {
              const akun = db.users.find((u) => u.id === AKUN_DEMO[r])
              if (!akun) return null
              const aktif = r === role

              return (
                <button
                  key={r}
                  onClick={() => {
                    masuk(akun.id)
                    setTerbuka(false)
                    router.push(TEMA[r].beranda)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-neutral-100',
                    aktif && 'bg-neutral-100',
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                    {TEMA[r].singkatan}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-neutral-900">{TEMA[r].label}</span>
                    <span className="block truncate text-xs text-neutral-500">{akun.nama}</span>
                  </span>
                  {aktif ? <span className="text-xs text-neutral-400">aktif</span> : null}
                </button>
              )
            })}
          </div>

          <div className="border-t border-garis p-1.5">
            {konfirmasiReset ? (
              <div className="px-2.5 py-2">
                <p className="text-sm text-neutral-700">
                  Kembalikan seluruh data demo ke kondisi awal? Semua transaksi yang
                  Anda input di sesi ini akan hilang.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="rounded-lg bg-merah px-3 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-95"
                    onClick={() => {
                      void repo.resetDemo()
                      setKonfirmasiReset(false)
                      setTerbuka(false)
                      router.refresh()
                    }}
                  >
                    Ya, reset
                  </button>
                  <button
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                    onClick={() => setKonfirmasiReset(false)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setKonfirmasiReset(true)}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-tinta"
              >
                <RotateCcw className="size-4 text-neutral-400" aria-hidden />
                Reset data demo
              </button>
            )}

            <button
              onClick={() => {
                keluar()
                router.replace('/login')
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-tinta"
            >
              <LogOut className="size-4 text-neutral-400" aria-hidden />
              Keluar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
