'use client'

import { localRepo } from './local-repo'
import type { DataRepo } from './repository'

/**
 * Pemilihan adapter data. Prototype selalu memakai penyimpanan lokal;
 * nilai lain disiapkan untuk backend nyata di kemudian hari.
 */
const ADAPTER = process.env.NEXT_PUBLIC_DATA_ADAPTER ?? 'lokal'

export const repo: DataRepo = (() => {
  switch (ADAPTER) {
    case 'lokal':
      return localRepo
    default:
      console.warn(
        `Adapter data "${ADAPTER}" belum tersedia, memakai penyimpanan lokal.`,
      )
      return localRepo
  }
})()

export * from './repository'
