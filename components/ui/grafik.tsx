'use client'

import { useMemo, useRef, useState } from 'react'
import * as f from '@/lib/domain/format'
import type { TitikTren } from '@/lib/domain/tren'

const LEBAR = 760
const TINGGI = 220
const PAD_ATAS = 18
const PAD_BAWAH = 32
const PAD_KIRI = 46
const PAD_KANAN = 12

/**
 * Grafik area deret waktu.
 *
 * Digambar sebagai SVG biasa, tanpa pustaka grafik: kebutuhannya satu
 * bentuk saja, dan menambah dependensi hanya untuk ini tidak sepadan.
 * Kurvanya dihaluskan lewat titik tengah sehingga tidak pernah melengkung
 * di bawah nol — penting karena datanya jumlah kilogram.
 */
export function GrafikTren({
  titik,
  satuan = 'kg',
  label = 'Tersalur',
}: {
  titik: TitikTren[]
  satuan?: string
  label?: string
}) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const [sorot, setSorot] = useState<number | null>(null)

  const { koordinat, garisArea, garisKurva, tickY, maks } = useMemo(() => {
    const nilaiMaks = Math.max(1, ...titik.map((t) => t.nilai))
    // Bulatkan batas atas supaya label sumbu Y jadi angka bulat yang enak dibaca.
    const langkah = Math.pow(10, Math.floor(Math.log10(nilaiMaks))) / 2
    const atas = Math.ceil(nilaiMaks / langkah) * langkah

    const lebarPlot = LEBAR - PAD_KIRI - PAD_KANAN
    const tinggiPlot = TINGGI - PAD_ATAS - PAD_BAWAH

    const koordinat = titik.map((t, i) => ({
      x: PAD_KIRI + (titik.length === 1 ? lebarPlot / 2 : (i / (titik.length - 1)) * lebarPlot),
      y: PAD_ATAS + tinggiPlot - (t.nilai / atas) * tinggiPlot,
      ...t,
    }))

    // Penghalusan lewat titik tengah: aman dari lonjakan melewati data asli.
    let d = ''
    koordinat.forEach((p, i) => {
      if (i === 0) {
        d += `M ${p.x} ${p.y}`
        return
      }
      const sebelum = koordinat[i - 1]
      const tengahX = (sebelum.x + p.x) / 2
      d += ` C ${tengahX} ${sebelum.y}, ${tengahX} ${p.y}, ${p.x} ${p.y}`
    })

    const dasar = PAD_ATAS + tinggiPlot
    const area = `${d} L ${koordinat[koordinat.length - 1]?.x ?? PAD_KIRI} ${dasar} L ${koordinat[0]?.x ?? PAD_KIRI} ${dasar} Z`

    const tickY = [0, 0.5, 1].map((r) => ({
      nilai: atas * r,
      y: PAD_ATAS + tinggiPlot - r * tinggiPlot,
    }))

    return { koordinat, garisArea: area, garisKurva: d, tickY, maks: atas }
  }, [titik])

  const gerak = (e: React.PointerEvent<HTMLDivElement>) => {
    const kotak = wadahRef.current?.getBoundingClientRect()
    if (!kotak || titik.length === 0) return
    const rasio = (e.clientX - kotak.left) / kotak.width
    const x = rasio * LEBAR
    let terdekat = 0
    let jarak = Infinity
    koordinat.forEach((p, i) => {
      const d = Math.abs(p.x - x)
      if (d < jarak) {
        jarak = d
        terdekat = i
      }
    })
    setSorot(terdekat)
  }

  const aktif = sorot !== null ? koordinat[sorot] : null

  return (
    <div
      ref={wadahRef}
      className="relative touch-none select-none"
      onPointerMove={gerak}
      onPointerLeave={() => setSorot(null)}
    >
      <svg
        viewBox={`0 0 ${LEBAR} ${TINGGI}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label={`Grafik ${label.toLowerCase()} harian`}
      >
        <defs>
          <linearGradient id="isiGrafik" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-biru)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-biru)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {tickY.map((t) => (
          <g key={t.y}>
            <line
              x1={PAD_KIRI}
              x2={LEBAR - PAD_KANAN}
              y1={t.y}
              y2={t.y}
              stroke="currentColor"
              className="text-neutral-200"
              strokeWidth="1"
              strokeDasharray={t.nilai === 0 ? undefined : '4 6'}
            />
            <text
              x={PAD_KIRI - 10}
              y={t.y + 4}
              textAnchor="end"
              className="fill-neutral-400 text-[11px] tabular-nums"
            >
              {f.angka(t.nilai)}
            </text>
          </g>
        ))}

        <path d={garisArea} fill="url(#isiGrafik)" />
        <path
          d={garisKurva}
          fill="none"
          stroke="var(--color-biru)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {koordinat.map((p, i) =>
          i % Math.ceil(koordinat.length / 6) === 0 ? (
            <text
              key={p.tanggal}
              x={p.x}
              y={TINGGI - 10}
              textAnchor="middle"
              className="fill-neutral-400 text-[11px]"
            >
              {f.tanggalSingkat(p.tanggal).replace(/ \d{4}$/, '')}
            </text>
          ) : null,
        )}

        {aktif ? (
          <g>
            <line
              x1={aktif.x}
              x2={aktif.x}
              y1={PAD_ATAS}
              y2={TINGGI - PAD_BAWAH}
              stroke="currentColor"
              className="text-neutral-300"
              strokeWidth="1"
            />
            <circle cx={aktif.x} cy={aktif.y} r="6" fill="white" />
            <circle cx={aktif.x} cy={aktif.y} r="4.5" fill="var(--color-biru)" />
          </g>
        ) : null}
      </svg>

      {aktif ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-tinta px-3 py-2 text-white shadow-lg"
          style={{
            left: `${(aktif.x / LEBAR) * 100}%`,
            top: `${(aktif.y / TINGGI) * 100}%`,
            marginTop: '-10px',
          }}
        >
          <p className="text-[11px] whitespace-nowrap text-white/60">
            {f.tanggal(aktif.tanggal)}
          </p>
          <p className="text-sm font-semibold whitespace-nowrap tabular-nums">
            {f.angka(aktif.nilai)} {satuan}
          </p>
        </div>
      ) : null}

      <span className="sr-only">
        Nilai tertinggi pada rentang ini {f.angka(maks)} {satuan}.
      </span>
    </div>
  )
}
