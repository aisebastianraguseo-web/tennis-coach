import Link from 'next/link'

export default function NotFoundPage(): React.JSX.Element {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-2xl font-semibold text-slate-800">Seite nicht gefunden</h1>
        <p className="mb-6 text-slate-600">
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-navy-900 px-4 py-2 text-white hover:bg-navy-800"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  )
}
