'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { useEffect } from 'react'
import { useSesiStore } from '@/lib/auth/session'
import { useDb, useSesi } from '@/lib/hooks'
import { AKUN_DEMO, KABUPATEN, PROVINSI } from '@/lib/seed'
import { TEMA, URUTAN_ROLE } from '@/lib/ui/tema'
import type { Role } from '@/lib/domain/types'

const PRINSIP = [
  { judul: 'Transparan', isi: 'Data terbuka dan dapat dipantau semua pihak berwenang' },
  { judul: 'Akuntabel', isi: 'Setiap transaksi tercatat dan dapat ditelusuri' },
  { judul: 'Tepat Sasaran', isi: 'Pupuk bersubsidi diterima kelompok tani yang berhak' },
  { judul: 'Tepat Waktu', isi: 'Proses cepat, paperless, dan terintegrasi' },
]

export default function HalamanLogin() {
  const db = useDb()
  const { user } = useSesi()
  const masuk = useSesiStore((s) => s.masuk)
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace(TEMA[user.role].beranda)
  }, [user, router])

  const pilih = (role: Role) => {
    const akun = db.users.find((u) => u.id === AKUN_DEMO[role])
    if (!akun) return
    masuk(akun.id)
    router.push(TEMA[role].beranda)
  }

  return (
    <div className="min-h-dvh bg-kertas">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:py-20">
        <section className="lg:pt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-black/[0.05]">
            <span className="size-1.5 rounded-full bg-hijau" />
            {KABUPATEN} · {PROVINSI}
          </span>

          <h1 className="mt-5 text-[2.1rem] leading-[1.1] font-semibold tracking-tight text-tinta sm:text-[2.6rem]">
            Aplikasi Pengawasan Pupuk Bersubsidi Terintegrasi
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-neutral-500">
            Satu rantai data dari distributor sampai kelompok tani. Setiap
            penyerahan pupuk dikonfirmasi kedua belah pihak dan terpantau
            Pengawas KP3 secara waktu nyata.
          </p>

          <dl className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {PRINSIP.map((p) => (
              <div key={p.judul}>
                <dt className="text-sm font-semibold text-tinta">{p.judul}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-neutral-500">{p.isi}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <div className="rounded-3xl bg-white p-6 shadow-kartu ring-1 ring-black/[0.04] sm:p-7">
            <h2 className="text-base font-semibold tracking-tight text-neutral-900">
              Masuk sebagai
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Pilih peran untuk menelusuri alur aplikasi. Ini lingkungan demo —
              tidak diperlukan kata sandi.
            </p>

            <div className="mt-5 grid gap-3">
              {URUTAN_ROLE.map((role) => {
                const tema = TEMA[role]
                const akun = db.users.find((u) => u.id === AKUN_DEMO[role])

                return (
                  <button
                    key={role}
                    onClick={() => pilih(role)}
                    className="group flex items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-black/[0.05] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-naik hover:ring-black/[0.09]"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-xs font-bold tracking-wide text-neutral-500 transition-colors group-hover:bg-tinta group-hover:text-white">
                      {tema.singkatan}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-neutral-900">{tema.label}</span>
                      <span className="block text-sm text-neutral-500">{tema.ringkas}</span>
                      {akun ? (
                        <span className="mt-1 block truncate text-xs text-neutral-400">
                          {akun.nama} · {akun.email}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="shrink-0 text-lg text-neutral-300 transition-colors group-hover:text-tinta"
                      aria-hidden
                    >
                      &rarr;
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Link
            href="/petunjuk"
            className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.05] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-naik hover:ring-black/[0.09]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-biru-lembut text-biru">
              <BookOpen className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-tinta">
                Baru pertama kali? Baca petunjuk uji coba
              </span>
              <span className="block text-sm text-neutral-500">
                Alur lengkap 6 tahap, use case tiap peran, dan hal yang layak diuji
              </span>
            </span>
            <span className="shrink-0 text-lg text-neutral-300" aria-hidden>
              &rarr;
            </span>
          </Link>

          <p className="mt-4 text-center text-xs text-neutral-500">
            Prototipe. Seluruh nama pelaku usaha, kelompok tani, dan transaksi
            adalah data sintetis.
          </p>
        </section>
      </div>
    </div>
  )
}
