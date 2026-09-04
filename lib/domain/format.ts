/**
 * Formatter tampilan berbahasa Indonesia.
 *
 * Sengaja tidak memakai `Intl` supaya hasilnya identik antara render di
 * server dan di browser — data ICU Node bisa berbeda dan memicu hydration
 * mismatch. Semua fungsi di sini deterministik.
 */

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const NAMA_BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

/** 1250000 → "1.250.000" */
export function angka(nilai: number): string {
  const bulat = Math.round(nilai)
  const negatif = bulat < 0
  const digit = Math.abs(bulat).toString()
  let hasil = ''
  for (let i = 0; i < digit.length; i++) {
    if (i > 0 && (digit.length - i) % 3 === 0) hasil += '.'
    hasil += digit[i]
  }
  return negatif ? `-${hasil}` : hasil
}

/** 1250 → "1.250 kg" */
export function kg(nilai: number): string {
  return `${angka(nilai)} kg`
}

/** 2250000 → "Rp 2.250.000" */
export function rupiah(nilai: number): string {
  return `Rp ${angka(nilai)}`
}

/** 0.734 → "73,4%" — masukkan rasio 0..1, bukan persen. */
export function persen(rasio: number, desimal = 1): string {
  if (!Number.isFinite(rasio)) return '0%'
  const nilai = (rasio * 100).toFixed(desimal)
  return `${nilai.replace('.', ',')}%`
}

function pecahTanggal(iso: string): { d: number; m: number; y: number } | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!cocok) return null
  return { y: Number(cocok[1]), m: Number(cocok[2]), d: Number(cocok[3]) }
}

/** "2026-09-03" → "3 September 2026" */
export function tanggal(iso: string): string {
  const t = pecahTanggal(iso)
  if (!t) return iso
  return `${t.d} ${NAMA_BULAN[t.m - 1]} ${t.y}`
}

/** "2026-09-03" → "3 Sep 2026" */
export function tanggalSingkat(iso: string): string {
  const t = pecahTanggal(iso)
  if (!t) return iso
  return `${t.d} ${NAMA_BULAN_SINGKAT[t.m - 1]} ${t.y}`
}

/** "2026-09-03T08:15:00.000Z" → "3 Sep 2026, 08:15" */
export function tanggalWaktu(iso: string): string {
  const jam = /T(\d{2}):(\d{2})/.exec(iso)
  const dasar = tanggalSingkat(iso)
  return jam ? `${dasar}, ${jam[1]}:${jam[2]}` : dasar
}

/** Tanggal hari ini dalam format "YYYY-MM-DD". */
export function hariIni(): string {
  return new Date().toISOString().slice(0, 10)
}
