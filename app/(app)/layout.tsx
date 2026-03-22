import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/spieler" className="text-lg font-bold text-navy-900">
            Tennis Coach
          </Link>
          <nav aria-label="Hauptnavigation" className="flex items-center gap-4">
            <Link
              href="/fortschritt"
              className="text-sm text-slate-600 hover:text-navy-900"
            >
              Fortschritt
            </Link>
            <Link
              href="/ziele"
              className="text-sm text-slate-600 hover:text-navy-900"
            >
              Ziele
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  )
}
