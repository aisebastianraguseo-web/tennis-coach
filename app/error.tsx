'use client'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error: _error, reset }: ErrorPageProps): React.JSX.Element {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="mb-2 text-xl font-semibold text-red-800">Etwas ist schiefgelaufen</h1>
        <p className="mb-4 text-red-700">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-red-700 px-4 py-2 text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Erneut versuchen
        </button>
      </div>
    </main>
  )
}
