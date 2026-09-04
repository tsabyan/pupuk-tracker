'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const MAKS_SISI = 720
const MUTU = 0.7

/**
 * Unggah foto bukti.
 *
 * Gambar dikecilkan di browser sebelum disimpan: penyimpanan lokal hanya
 * punya beberapa megabita, sedangkan foto kamera ponsel bisa lebih besar
 * dari itu sendirian.
 */
export function FotoUpload({
  nilai,
  onUbah,
  label,
  petunjuk,
}: {
  nilai?: string
  onUbah: (dataUrl: string | undefined) => void
  label: string
  petunjuk?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [memproses, setMemproses] = useState(false)

  const pilih = async (berkas: File | undefined) => {
    if (!berkas) return
    setMemproses(true)
    try {
      onUbah(await kecilkan(berkas))
    } finally {
      setMemproses(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-neutral-800">{label}</span>

      {nilai ? (
        <div className="overflow-hidden rounded-lg border border-neutral-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={nilai} alt={label} className="block max-h-56 w-full object-cover" />
          <div className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 p-2">
            <Button
              type="button"
              varian="halus"
              ukuran="sm"
              onClick={() => {
                onUbah(undefined)
                if (inputRef.current) inputRef.current.value = ''
              }}
            >
              Hapus foto
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={memproses}
          className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 bg-white text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 disabled:opacity-60"
        >
          <span className="text-lg" aria-hidden>
            📷
          </span>
          {memproses ? 'Memproses…' : 'Ambil atau pilih foto'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void pilih(e.target.files?.[0])}
      />
      {petunjuk ? <p className="mt-1 text-xs text-neutral-500">{petunjuk}</p> : null}
    </div>
  )
}

function kecilkan(berkas: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader()
    pembaca.onerror = () => gagal(new Error('Gagal membaca berkas.'))
    pembaca.onload = () => {
      const gambar = new Image()
      gambar.onerror = () => gagal(new Error('Berkas bukan gambar yang sah.'))
      gambar.onload = () => {
        const skala = Math.min(1, MAKS_SISI / Math.max(gambar.width, gambar.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(gambar.width * skala)
        canvas.height = Math.round(gambar.height * skala)
        const ctx = canvas.getContext('2d')
        if (!ctx) return gagal(new Error('Kanvas tidak tersedia.'))
        ctx.drawImage(gambar, 0, 0, canvas.width, canvas.height)
        selesai(canvas.toDataURL('image/jpeg', MUTU))
      }
      gambar.src = String(pembaca.result)
    }
    pembaca.readAsDataURL(berkas)
  })
}
