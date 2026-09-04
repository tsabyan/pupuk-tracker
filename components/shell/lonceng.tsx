'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { repo } from '@/lib/data'
import * as f from '@/lib/domain/format'
import { useNotifikasi, useSesi } from '@/lib/hooks'
import { cn } from '@/lib/ui/cn'

export function LonceNotifikasi() {
  const { daftar, belumDibaca } = useNotifikasi()
  const { user } = useSesi()
  const [terbuka, setTerbuka] = useState(false)
  const wadahRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!terbuka) return
    const onKlik = (e: MouseEvent) => {
      if (!wadahRef.current?.contains(e.target as Node)) setTerbuka(false)
    }
    document.addEventListener('mousedown', onKlik)
    return () => document.removeEventListener('mousedown', onKlik)
  }, [terbuka])

  const terbaru = daftar.slice(0, 6)

  return (
    <div className="relative" ref={wadahRef}>
      <button
        onClick={() => setTerbuka((v) => !v)}
        className="relative rounded-full bg-white p-2.5 text-neutral-500 shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-black/[0.05] transition-colors hover:text-tinta"
        aria-label={`Notifikasi${belumDibaca > 0 ? `, ${belumDibaca} belum dibaca` : ''}`}
      >
        <Bell className="size-5" aria-hidden />
        {belumDibaca > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-merah px-1 text-[10px] font-semibold text-white ring-2 ring-white tabular-nums">
            {belumDibaca > 9 ? '9+' : belumDibaca}
          </span>
        ) : null}
      </button>

      {terbuka ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-white shadow-[0_8px_16px_-8px_rgba(16,24,40,0.2),0_24px_48px_-24px_rgba(16,24,40,0.4)] ring-1 ring-black/[0.06]">
          <div className="flex items-center justify-between border-b border-garis px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">Notifikasi</p>
            {belumDibaca > 0 && user ? (
              <button
                className="text-xs text-neutral-500 hover:text-neutral-800"
                onClick={() => void repo.tandaiSemuaNotifikasiDibaca(user.id)}
              >
                Tandai semua dibaca
              </button>
            ) : null}
          </div>

          {terbaru.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">
              Belum ada notifikasi.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {terbaru.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.tautan}
                    onClick={() => {
                      void repo.tandaiNotifikasiDibaca(n.id)
                      setTerbuka(false)
                    }}
                    className={cn(
                      'block border-b border-garis/70 px-4 py-3.5 transition-colors hover:bg-neutral-50',
                      !n.dibaca && 'bg-biru-lembut/50',
                    )}
                  >
                    <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                      {!n.dibaca ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-biru" />
                      ) : null}
                      {n.judul}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600">{n.pesan}</p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      {f.tanggalWaktu(n.dibuatPada)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/notifikasi"
            onClick={() => setTerbuka(false)}
            className="block bg-neutral-50 px-4 py-3 text-center text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-tinta"
          >
            Lihat semua notifikasi
          </Link>
        </div>
      ) : null}
    </div>
  )
}
