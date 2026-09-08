import type { Role } from '@/lib/domain/types'

export interface ItemNav {
  href: string
  label: string
  /** Nomor langkah pada diagram alur aplikasi. */
  langkah?: number
  ikon: string
}

/**
 * Menu per peran. Urutannya sengaja mengikuti diagram alur dari atas ke
 * bawah supaya navigasi terasa seperti menelusuri prosesnya.
 */
export const NAVIGASI: Record<Role, ItemNav[]> = {
  distributor: [
    { href: '/distributor', label: 'Dashboard', ikon: 'LayoutDashboard' },
    { href: '/distributor/alokasi', label: 'Rencana Alokasi', langkah: 2, ikon: 'ClipboardList' },
    { href: '/distributor/pengiriman', label: 'Pengiriman', langkah: 3, ikon: 'Truck' },
  ],
  pengecer: [
    { href: '/pengecer', label: 'Dashboard', ikon: 'LayoutDashboard' },
    { href: '/pengecer/penerimaan', label: 'Penerimaan', langkah: 2, ikon: 'PackageCheck' },
    { href: '/pengecer/stok', label: 'Stok Pengecer', langkah: 3, ikon: 'Boxes' },
    { href: '/pengecer/penyaluran', label: 'Penyaluran', langkah: 4, ikon: 'Share2' },
  ],
  poktan: [
    { href: '/poktan', label: 'Dashboard', ikon: 'LayoutDashboard' },
    { href: '/poktan/penerimaan', label: 'Terima Pupuk', langkah: 2, ikon: 'ClipboardCheck' },
    { href: '/poktan/pemanfaatan', label: 'Pemanfaatan', langkah: 4, ikon: 'Sprout' },
  ],
  // Urutannya mengikuti rantai SOP pengawasan: pantau → pilih objek →
  // periksa → catat temuan → tindak lanjuti → laporkan.
  kp3: [
    { href: '/kp3', label: 'Monitoring', langkah: 1, ikon: 'Activity' },
    { href: '/kp3/objek', label: 'Objek Pengawasan', langkah: 2, ikon: 'ScanSearch' },
    { href: '/kp3/pemeriksaan', label: 'Pemeriksaan', langkah: 3, ikon: 'ClipboardCheck' },
    { href: '/kp3/temuan', label: 'Temuan', langkah: 4, ikon: 'AlertTriangle' },
    { href: '/kp3/tindak-lanjut', label: 'Tindak Lanjut', langkah: 5, ikon: 'Megaphone' },
    { href: '/kp3/laporan', label: 'Laporan', langkah: 6, ikon: 'FileBarChart' },
  ],
}

/** Menu yang sama untuk semua peran, ditempatkan di bawah pemisah. */
export const NAVIGASI_UMUM: ItemNav[] = [
  { href: '/notifikasi', label: 'Notifikasi', ikon: 'Bell' },
  { href: '/petunjuk', label: 'Petunjuk uji coba', ikon: 'BookOpen' },
]

/**
 * Menu mana yang disorot untuk sebuah alamat.
 *
 * Dipilih yang paling spesifik, bukan setiap menu yang cocok awalannya:
 * tanpa aturan ini `/distributor/pengiriman` ikut menyalakan Dashboard
 * karena sama-sama berawalan `/distributor`.
 */
export function menuAktif(role: Role, pathname: string): string | undefined {
  return [...NAVIGASI[role], ...NAVIGASI_UMUM]
    .map((m) => m.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0]
}

/**
 * Peran yang memiliki sebuah alamat, atau `null` bila alamat itu umum
 * (mis. `/notifikasi`). Dipakai untuk mencegah layar kosong ketika seseorang
 * membuka halaman milik peran lain — misalnya dari tautan lama atau setelah
 * berpindah peran.
 */
export function peranPemilik(pathname: string): Role | null {
  for (const peran of Object.keys(NAVIGASI) as Role[]) {
    const cocok = NAVIGASI[peran].some(
      (m) => pathname === m.href || pathname.startsWith(`${m.href}/`),
    )
    if (cocok) return peran
  }
  return null
}
