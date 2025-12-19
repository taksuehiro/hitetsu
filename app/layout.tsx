import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '非鉄ポジションP/Lシミュレーター',
  description: '非鉄金属（錫）のLMEポジション損益シミュレーションMVP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

