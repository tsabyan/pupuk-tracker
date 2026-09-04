/**
 * PRNG ber-seed tetap (mulberry32).
 *
 * Data demo harus reproducible: tombol "Reset Data Demo" wajib
 * menghasilkan basis data yang persis sama setiap kali dijalankan.
 */

export interface Rng {
  /** Bilangan pecahan 0..1. */
  next: () => number
  /** Bilangan bulat dalam rentang [min, max]. */
  int: (min: number, max: number) => number
  /** Kelipatan `kelipatan` dalam rentang [min, max]. */
  bulat: (min: number, max: number, kelipatan: number) => number
  /** Satu elemen acak dari daftar. */
  pilih: <T>(daftar: readonly T[]) => T
  /** true dengan peluang `peluang` (0..1). */
  peluang: (peluang: number) => boolean
}

export function buatRng(seed: number): Rng {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))

  return {
    next,
    int,
    bulat: (min, max, kelipatan) =>
      Math.max(kelipatan, Math.round(int(min, max) / kelipatan) * kelipatan),
    pilih: <T>(daftar: readonly T[]) => daftar[int(0, daftar.length - 1)],
    peluang: (p) => next() < p,
  }
}

/** Geser tanggal ISO (YYYY-MM-DD) sejumlah hari. */
export function geserHari(iso: string, hari: number): string {
  const t = new Date(`${iso}T00:00:00.000Z`)
  t.setUTCDate(t.getUTCDate() + hari)
  return t.toISOString().slice(0, 10)
}

/** Ubah tanggal ISO jadi timestamp lengkap pada jam kerja. */
export function jamKerja(iso: string, rng: Rng): string {
  const jam = String(rng.int(8, 16)).padStart(2, '0')
  const menit = String(rng.int(0, 59)).padStart(2, '0')
  return `${iso}T${jam}:${menit}:00.000Z`
}
