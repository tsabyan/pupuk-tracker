'use client'

/**
 * Penyimpanan prototype: satu objek `Database` di localStorage.
 *
 * Hanya store ini yang tahu soal zustand. Logika bisnis tinggal di
 * `lib/domain/`, dan UI mengaksesnya lewat `DataRepo`.
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Database } from '@/lib/domain/types'
import { VERSI_DATA, buatDatabase } from '@/lib/seed'

export const KUNCI_PENYIMPANAN = 'pupuk-tracker/db'

interface StoreState {
  db: Database
  hydrated: boolean
  /** Ubah basis data lewat fungsi yang memutasi salinan dalam. */
  terapkan: (ubah: (db: Database) => void) => void
  resetDemo: () => void
  tandaiHydrated: () => void
}

export const useDbStore = create<StoreState>()(
  persist(
    (set) => ({
      db: buatDatabase(),
      hydrated: false,
      terapkan: (ubah) =>
        set((state) => {
          const salinan = structuredClone(state.db)
          ubah(salinan)
          return { db: salinan }
        }),
      resetDemo: () => set({ db: buatDatabase() }),
      tandaiHydrated: () => set({ hydrated: true }),
    }),
    {
      name: KUNCI_PENYIMPANAN,
      version: VERSI_DATA,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ db: state.db }),
      // Rehydrate dijalankan manual di StoreProvider supaya render server
      // dan render pertama di browser identik (tidak ada hydration mismatch).
      skipHydration: true,
      // Prototipe tidak punya jalur migrasi data: kalau bentuk `Database`
      // berubah, data demo lama dibuang dan diganti seed baru. Pada backend
      // nyata hal ini digantikan migration basis data.
      migrate: () => ({ db: buatDatabase() }),
    },
  ),
)

/** Basis data saat ini, di luar konteks React. */
export const ambilDb = () => useDbStore.getState().db
