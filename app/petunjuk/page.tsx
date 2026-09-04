'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, TombolTautan } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/misc'
import { Tabs } from '@/components/ui/tabs'
import { useSesiStore } from '@/lib/auth/session'
import { useSesi } from '@/lib/hooks'
import type { Role } from '@/lib/domain/types'
import { AKUN_DEMO, KABUPATEN, MUSIM_TANAM, PROVINSI, TAHUN_MUSIM } from '@/lib/seed'
import {
  ALUR_UTAMA,
  DI_LUAR_CAKUPAN,
  UJI_BATAS,
  USE_CASE,
} from '@/lib/ui/panduan'
import { TEMA, URUTAN_ROLE } from '@/lib/ui/tema'

const DATA_DEMO = [
  ['Wilayah', `${KABUPATEN}, ${PROVINSI} · 4 kecamatan · 12 desa`],
  ['Pelaku usaha', '2 distributor · 8 pengecer resmi'],
  ['Penerima', '24 kelompok tani · 331 petani terdaftar'],
  ['Jenis pupuk', 'Urea, NPK Phonska, NPK Formula Khusus, Organik Granul'],
  [
    'Komoditas petani',
    'Padi, jagung, kedelai, cabai rawit, bawang merah, tebu rakyat — hanya komoditas penerima subsidi',
  ],
  ['Musim tanam', `${MUSIM_TANAM} ${TAHUN_MUSIM} · Juli–Desember 2026`],
  ['Tanggal acuan', '3 September 2026'],
]

export default function HalamanPetunjuk() {
  const router = useRouter()
  const masuk = useSesiStore((s) => s.masuk)
  const { user, role } = useSesi()
  const [tabRole, setTabRole] = useState<Role>('distributor')

  /** Masuk sebagai peran yang dibutuhkan langkah, lalu buka layarnya. */
  const mulai = (peran: Role, href: string) => {
    masuk(AKUN_DEMO[peran])
    router.push(href)
  }

  return (
    <div className="min-h-dvh bg-kertas">
      <header className="sticky top-0 z-30 border-b border-black/[0.05] bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-tinta-lembut to-tinta text-sm font-bold text-white shadow-[0_2px_6px_rgba(16,24,40,0.28)]">
            P
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-tinta">Petunjuk Uji Coba</p>
            <p className="truncate text-xs text-neutral-500">
              Pengawasan Pupuk Bersubsidi Terintegrasi
            </p>
          </div>
          <div className="ml-auto">
            {user && role ? (
              <TombolTautan href={TEMA[role].beranda} varian="utama">
                <span className="hidden sm:inline">Kembali ke aplikasi</span>
                <span className="sm:hidden">Kembali</span>
              </TombolTautan>
            ) : (
              <TombolTautan href="/login" varian="utama">
                <span className="hidden sm:inline">Masuk ke aplikasi</span>
                <span className="sm:hidden">Masuk</span>
              </TombolTautan>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 py-8 pb-24 sm:px-6 sm:py-12">
        <PageHeader
          judul="Cara Menguji Prototipe Ini"
          keterangan="Halaman ini memandu Anda menelusuri seluruh alur aplikasi, dari distributor menyusun alokasi sampai pengawas memvalidasi. Ikuti alur utama lebih dulu, baru jelajahi use case tiap peran dan pengujian batas."
        />

        <Card>
          <CardHeader judul="Sebelum mulai" />
          <CardBody className="grid gap-5 sm:grid-cols-3">
            {[
              {
                judul: 'Tidak perlu kata sandi',
                isi: 'Empat akun demo sudah disiapkan, satu untuk tiap peran. Cukup klik peran yang ingin dilihat.',
              },
              {
                judul: 'Berpindah peran kapan saja',
                isi: 'Klik avatar di kanan atas, pilih "Lihat sebagai". Tidak perlu keluar-masuk aplikasi.',
              },
              {
                judul: 'Bisa diulang dari awal',
                isi: 'Avatar kanan atas → "Reset data demo" mengembalikan seluruh data ke kondisi semula.',
              },
            ].map((k) => (
              <div key={k.judul}>
                <p className="text-sm font-semibold text-tinta">{k.judul}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{k.isi}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-tinta">
              Alur uji coba utama
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              Enam tahap ini menelusuri rantai penuh dari awal sampai selesai. Perlu
              sekitar 8 menit. Tombol di tiap tahap langsung memasukkan Anda sebagai
              peran yang tepat.
            </p>
          </div>

          <ol className="space-y-3">
            {ALUR_UTAMA.map((tahap, i) => (
              <li key={tahap.judul}>
                <Card>
                  <CardBody className="pt-5 sm:pt-6">
                    <div className="flex gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-tinta-lembut to-tinta text-sm font-semibold text-white shadow-[0_2px_6px_rgba(16,24,40,0.24)] tabular-nums">
                        {i + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                          {TEMA[tahap.role].label}
                        </p>
                        <h3 className="mt-0.5 font-semibold text-tinta">{tahap.judul}</h3>

                        <ul className="mt-3 space-y-1.5">
                          {tahap.langkah.map((l) => (
                            <li
                              key={l}
                              className="flex gap-2.5 text-sm leading-relaxed text-neutral-600"
                            >
                              <span className="mt-2 size-1 shrink-0 rounded-full bg-neutral-300" />
                              {l}
                            </li>
                          ))}
                        </ul>

                        <p className="mt-3 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600 ring-1 ring-black/[0.03]">
                          <span className="font-medium text-tinta">Perhatikan: </span>
                          {tahap.periksa}
                        </p>

                        <Button
                          varian="garis"
                          ukuran="sm"
                          className="mt-3"
                          onClick={() => mulai(tahap.role, tahap.href)}
                        >
                          {tahap.labelTombol} &rarr;
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-tinta">
              Use case per peran
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              Rincian apa saja yang bisa dikerjakan tiap peran, beserta hasil yang
              seharusnya Anda lihat.
            </p>
          </div>

          <Card className="overflow-hidden">
            <Tabs
              aktif={tabRole}
              onPilih={setTabRole}
              daftar={URUTAN_ROLE.map((r) => ({
                nilai: r,
                label: TEMA[r].label,
                jumlah: USE_CASE[r].length,
              }))}
            />
            <ul className="divide-y divide-garis">
              {USE_CASE[tabRole].map((uc) => (
                <li key={uc.judul} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="font-semibold text-tinta">{uc.judul}</h3>
                    <Button
                      varian="polos"
                      ukuran="sm"
                      onClick={() => mulai(tabRole, uc.href)}
                    >
                      Buka &rarr;
                    </Button>
                  </div>

                  <ol className="mt-2.5 space-y-1.5">
                    {uc.langkah.map((l, i) => (
                      <li
                        key={l}
                        className="flex gap-2.5 text-sm leading-relaxed text-neutral-600"
                      >
                        <span className="shrink-0 tabular-nums text-neutral-400">
                          {i + 1}.
                        </span>
                        {l}
                      </li>
                    ))}
                  </ol>

                  <p className="mt-2.5 text-sm leading-relaxed text-neutral-500">
                    <span className="font-medium text-tinta">Hasil: </span>
                    {uc.hasil}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-tinta">
              Pengujian batas dan penolakan
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              Bagian yang paling layak dicoba: membuktikan sistem menolak hal yang
              memang seharusnya ditolak.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {UJI_BATAS.map((u) => (
              <Card key={u.judul}>
                <CardBody className="pt-5 sm:pt-5">
                  <h3 className="text-sm font-semibold text-tinta">{u.judul}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    <span className="font-medium text-neutral-500">Cara: </span>
                    {u.cara}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    <span className="font-medium text-neutral-500">Harapkan: </span>
                    {u.harapkan}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader
              judul="Data yang Anda lihat"
              keterangan="Seluruhnya sintetis. Nama pelaku usaha, kelompok tani, dan transaksi adalah rekaan."
            />
            <CardBody>
              <dl className="space-y-3">
                {DATA_DEMO.map(([label, isi]) => (
                  <div key={label}>
                    <dt className="text-xs tracking-wide text-neutral-400 uppercase">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-neutral-700">{isi}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600 ring-1 ring-black/[0.03]">
                Data tersimpan di peramban Anda sendiri dan tidak dikirim ke mana pun.
                Perubahan yang Anda buat tidak terlihat oleh penguji lain.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              judul="Di luar cakupan tahap ini"
              keterangan="Belum dikerjakan pada prototipe, direncanakan pada implementasi produksi."
            />
            <CardBody>
              <ul className="space-y-2.5">
                {DI_LUAR_CAKUPAN.map((d) => (
                  <li key={d} className="flex gap-2.5 text-sm text-neutral-600">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-neutral-300" />
                    {d}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600 ring-1 ring-black/[0.03]">
                Implementasi produksi direncanakan memakai Laravel + Filament. Rancangan
                tabelnya sudah disiapkan agar pemindahannya lurus.
              </p>
            </CardBody>
          </Card>
        </section>

        <div className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-3xl bg-gradient-to-b from-tinta-lembut to-tinta px-6 py-6 shadow-panel sm:px-7">
          <div>
            <p className="font-semibold text-white">Siap mencoba?</p>
            <p className="mt-0.5 text-sm text-white/60">
              Mulai dari tahap pertama sebagai Distributor.
            </p>
          </div>
          <Button
            varian="garis"
            onClick={() => mulai(ALUR_UTAMA[0].role, ALUR_UTAMA[0].href)}
          >
            Mulai alur uji coba
          </Button>
        </div>

        <p className="text-center text-xs text-neutral-400">
          Ada pertanyaan saat menelusuri?{' '}
          <Link href="/login" className="underline hover:text-neutral-600">
            Kembali ke halaman masuk
          </Link>
        </p>
      </main>
    </div>
  )
}
