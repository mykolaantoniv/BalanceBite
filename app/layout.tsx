import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'BalanceBite — Планування харчування',
  description: 'Плануйте меню, отримуйте список покупок та замовляйте продукти в Auchan',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
