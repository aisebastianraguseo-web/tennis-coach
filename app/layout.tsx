import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tennis Coach',
  description: 'Strukturierte Matchanalyse und taktisches Selbstcoaching für Tennisspieler',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f4e79',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <ClerkProvider>
      <html lang="de">
        <body>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-navy-900 focus:shadow-lg"
          >
            Zum Hauptinhalt springen
          </a>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
