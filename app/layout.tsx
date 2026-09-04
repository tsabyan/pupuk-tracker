import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { StoreProvider } from '@/components/store-provider'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pengawasan Pupuk Bersubsidi Terintegrasi',
  description:
    'Prototipe aplikasi pengawasan distribusi pupuk bersubsidi yang menghubungkan distributor, pengecer resmi, kelompok tani, dan Pengawas KP3.',
}

export const viewport: Viewport = {
  themeColor: '#1e9c4a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}
