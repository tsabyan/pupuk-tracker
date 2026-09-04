import Link from 'next/link'
import { Ikon } from '@/components/shell/ikon'
import { cn } from '@/lib/ui/cn'

/** Aksen semantik untuk lencana angka — menandai jenis metrik, bukan peran. */
export type Aksen = 'biru' | 'hijau' | 'jingga' | 'merah' | 'ungu' | 'netral'

const LENCANA: Record<Aksen, string> = {
  biru: 'bg-biru-lembut text-biru',
  hijau: 'bg-hijau-lembut text-hijau',
  jingga: 'bg-jingga-lembut text-jingga',
  merah: 'bg-merah-lembut text-merah',
  ungu: 'bg-ungu-lembut text-ungu',
  netral: 'bg-neutral-100 text-neutral-500',
}

export function PageHeader({
  judul,
  keterangan,
  langkah,
  meta,
  aksi,
}: {
  judul: string
  keterangan?: string
  /** Nomor langkah pada diagram alur, mis. "Langkah 2". */
  langkah?: string
  /** Baris keterangan pendek di bawah judul, mis. kode dan wilayah. */
  meta?: React.ReactNode
  aksi?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {langkah ? (
          <span className="mb-2.5 inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-wide text-neutral-500 uppercase shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-black/[0.04]">
            {langkah}
          </span>
        ) : null}
        <h1 className="text-2xl font-semibold text-tinta sm:text-[1.75rem]">{judul}</h1>
        {meta ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
            {meta}
          </div>
        ) : null}
        {keterangan ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
            {keterangan}
          </p>
        ) : null}
      </div>
      {aksi ? <div className="flex shrink-0 flex-wrap gap-2">{aksi}</div> : null}
    </header>
  )
}

export function StatCard({
  label,
  nilai,
  satuan,
  keterangan,
  ikon,
  aksen = 'netral',
}: {
  label: string
  nilai: string
  satuan?: string
  keterangan?: string
  /** Nama ikon pada components/shell/ikon.tsx. */
  ikon?: string
  aksen?: Aksen
}) {
  return (
    <div className="group rounded-3xl bg-white p-5 shadow-kartu ring-1 ring-black/[0.04] transition-shadow duration-200 hover:shadow-naik sm:p-6">
      <div className="flex items-start gap-4">
        {ikon ? (
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105',
              LENCANA[aksen],
            )}
          >
            <Ikon nama={ikon} className="size-5" />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[1.6rem] leading-none font-semibold tracking-tight text-tinta tabular-nums">
              {nilai}
            </span>
            {satuan ? <span className="text-sm text-neutral-400">{satuan}</span> : null}
          </p>
          {keterangan ? (
            <p className="mt-2 text-xs leading-relaxed text-neutral-400">{keterangan}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export interface BarisMetrik {
  label: string
  nilai: string
  satuan?: string
  keterangan?: string
  ikon?: string
}

/**
 * Panel angka utama: satu kartu gelap berisi beberapa metrik bertumpuk.
 *
 * Memberi satu titik fokus di setiap halaman supaya angka penting tidak
 * tenggelam di antara tabel.
 */
export function PanelMetrik({ metrik }: { metrik: BarisMetrik[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-tinta-lembut to-tinta shadow-panel">
      {/* Sorotan tipis di tepi atas — memberi kesan permukaan, bukan blok datar. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/15" />
      <div
        className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(47,111,237,0.5), transparent 70%)' }}
      />

      <div className="relative divide-y divide-white/[0.07]">
        {metrik.map((m) => (
          <div key={m.label} className="px-6 py-5 sm:px-7">
            <div className="flex items-center gap-2.5">
              {m.ikon ? (
                <span className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white/70">
                  <Ikon nama={m.ikon} className="size-3.5" />
                </span>
              ) : null}
              <p className="text-sm text-white/55">{m.label}</p>
            </div>
            <p className="mt-2 flex items-baseline gap-1.5 text-white">
              <span className="text-[2rem] leading-none font-semibold tracking-tight tabular-nums">
                {m.nilai}
              </span>
              {m.satuan ? <span className="text-sm text-white/50">{m.satuan}</span> : null}
            </p>
            {m.keterangan ? (
              <p className="mt-2 text-xs text-white/40">{m.keterangan}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Kosong({
  judul,
  keterangan,
  aksi,
}: {
  judul: string
  keterangan?: string
  aksi?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
        <Ikon nama="Inbox" className="size-5" />
      </span>
      <p className="text-sm font-medium text-tinta">{judul}</p>
      {keterangan ? (
        <p className="max-w-sm text-sm leading-relaxed text-neutral-500">{keterangan}</p>
      ) : null}
      {aksi ? <div className="mt-3">{aksi}</div> : null}
    </div>
  )
}

export function Peringatan({
  nada = 'info',
  judul,
  children,
}: {
  nada?: 'info' | 'sukses' | 'bahaya' | 'peringatan'
  judul?: string
  children: React.ReactNode
}) {
  const kelas = {
    info: 'bg-biru-lembut text-[#123a86] ring-biru/10',
    sukses: 'bg-hijau-lembut text-[#0a5c34] ring-hijau/10',
    bahaya: 'bg-merah-lembut text-[#8f2126] ring-merah/10',
    peringatan: 'bg-jingga-lembut text-[#8a5200] ring-jingga/15',
  }[nada]

  return (
    <div
      className={cn('rounded-2xl px-4 py-3.5 text-sm leading-relaxed ring-1 ring-inset', kelas)}
      role="status"
    >
      {judul ? <p className="mb-0.5 font-semibold">{judul}</p> : null}
      {children}
    </div>
  )
}

export function TautanKembali({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-tinta"
    >
      <span aria-hidden>&larr;</span>
      {children}
    </Link>
  )
}

export function BarisRingkas({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 not-last:border-b not-last:border-garis">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-sm font-medium text-tinta">{children}</dd>
    </div>
  )
}

/** Baris aksi di kaki kartu, mis. tautan "lihat semua". */
export function KakiKartu({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-garis px-6 py-4 sm:px-7">
      {children}
    </div>
  )
}
