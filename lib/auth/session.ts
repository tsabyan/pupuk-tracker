'use client'

/**
 * Sesi palsu untuk demo.
 *
 * Cukup menyimpan id pengguna aktif. Tidak ada kata sandi, tidak ada token:
 * prototype ini dipakai untuk menelusuri alur, bukan menguji keamanan.
 * Pada implementasi produksi, seluruh berkas ini diganti autentikasi nyata.
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const KUNCI_SESI = 'pupuk-tracker/sesi'

interface SesiState {
  userId: string | null
  hydrated: boolean
  masuk: (userId: string) => void
  keluar: () => void
  tandaiHydrated: () => void
}

export const useSesiStore = create<SesiState>()(
  persist(
    (set) => ({
      userId: null,
      hydrated: false,
      masuk: (userId) => set({ userId }),
      keluar: () => set({ userId: null }),
      tandaiHydrated: () => set({ hydrated: true }),
    }),
    {
      name: KUNCI_SESI,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ userId: state.userId }),
      skipHydration: true,
    },
  ),
)
