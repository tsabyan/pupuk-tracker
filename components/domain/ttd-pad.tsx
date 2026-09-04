'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Papan tanda tangan digital.
 *
 * Dipakai kios saat serah terima dan ketua kelompok tani saat konfirmasi
 * penerimaan. Hasilnya PNG data URL berukuran kecil agar muat di
 * penyimpanan lokal browser.
 */
export function TtdPad({
  nilai,
  onUbah,
  label = 'Tanda tangan',
}: {
  nilai?: string
  onUbah: (dataUrl: string | undefined) => void
  label?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const menggambar = useRef(false)
  const [adaGoresan, setAdaGoresan] = useState(Boolean(nilai))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rasio = window.devicePixelRatio || 1
    const lebar = canvas.clientWidth
    const tinggi = canvas.clientHeight
    canvas.width = lebar * rasio
    canvas.height = tinggi * rasio

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(rasio, rasio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1f2937'
  }, [])

  const titik = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const kotak = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - kotak.left, y: e.clientY - kotak.top }
  }

  const mulai = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    menggambar.current = true
    const { x, y } = titik(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const gerak = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!menggambar.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = titik(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!adaGoresan) setAdaGoresan(true)
  }

  const selesai = useCallback(() => {
    if (!menggambar.current) return
    menggambar.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    onUbah(canvas.toDataURL('image/png'))
  }, [onUbah])

  const bersihkan = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setAdaGoresan(false)
    onUbah(undefined)
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-800">
          {label} <span className="text-rose-600">*</span>
        </span>
        <Button type="button" varian="halus" ukuran="sm" onClick={bersihkan}>
          Hapus
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-neutral-300 bg-white">
        <canvas
          ref={canvasRef}
          className="block h-40 w-full touch-none"
          onPointerDown={mulai}
          onPointerMove={gerak}
          onPointerUp={selesai}
          onPointerLeave={selesai}
        />
        {!adaGoresan ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
            Tanda tangan di sini
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Gunakan jari pada layar sentuh atau tahan tombol kiri tetikus.
      </p>
    </div>
  )
}
