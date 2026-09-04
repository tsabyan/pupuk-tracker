'use client'

import { useCallback, useState } from 'react'
import { KesalahanAturan } from '@/lib/data'

/**
 * Pembungkus aksi tulis: menjaga status sibuk dan menampilkan pesan
 * kesalahan aturan bisnis apa adanya kepada pengguna.
 */
export function useAksi() {
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)

  const jalankan = useCallback(
    async <T,>(fn: () => Promise<T>, onSukses?: (hasil: T) => void) => {
      setSibuk(true)
      setGalat(null)
      try {
        const hasil = await fn()
        onSukses?.(hasil)
        return hasil
      } catch (e) {
        setGalat(
          e instanceof KesalahanAturan
            ? e.message
            : 'Terjadi kesalahan tak terduga. Coba ulangi.',
        )
        if (!(e instanceof KesalahanAturan)) console.error(e)
        return undefined
      } finally {
        setSibuk(false)
      }
    },
    [],
  )

  return { sibuk, galat, setGalat, jalankan }
}
