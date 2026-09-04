'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSesi } from '@/lib/hooks'
import { TEMA } from '@/lib/ui/tema'

/** Titik masuk: arahkan ke dashboard peran, atau ke halaman login. */
export default function Beranda() {
  const { role } = useSesi()
  const router = useRouter()

  useEffect(() => {
    router.replace(role ? TEMA[role].beranda : '/login')
  }, [role, router])

  return null
}
