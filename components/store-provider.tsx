'use client'

import { useEffect, useState } from 'react'
import { useSesiStore } from '@/lib/auth/session'
import { useDbStore } from '@/lib/data/store'

/**
 * Membaca data localStorage setelah komponen terpasang di browser.
 *
 * Rehydrate sengaja tidak otomatis: render pertama di browser harus sama
 * persis dengan render di server, jika tidak React akan melaporkan
 * hydration mismatch. Anak komponen baru dirender setelah data siap.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [siap, setSiap] = useState(false)

  useEffect(() => {
    let batal = false

    Promise.all([
      useDbStore.persist.rehydrate(),
      useSesiStore.persist.rehydrate(),
    ]).finally(() => {
      if (batal) return
      useDbStore.getState().tandaiHydrated()
      useSesiStore.getState().tandaiHydrated()
      setSiap(true)
    })

    return () => {
      batal = true
    }
  }, [])

  if (!siap) return <MuatAwal />
  return <>{children}</>
}

function MuatAwal() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-kertas">
      <div className="flex flex-col items-center gap-3 text-neutral-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-pengecer" />
        <p className="text-sm">Menyiapkan data…</p>
      </div>
    </div>
  )
}
