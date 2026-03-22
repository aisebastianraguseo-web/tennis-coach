'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { dismissGdprNotice } from '@/app/(app)/actions'

export function GdprNotice(): React.JSX.Element {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDismiss(): void {
    startTransition(async () => {
      await dismissGdprNotice()
      setDismissed(true)
    })
  }

  if (dismissed) return <></>

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Datenschutzhinweis"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Datenschutzhinweis</h2>
        <div className="mb-4 space-y-2 text-sm text-slate-600">
          <p>
            Deine Matchdaten (inkl. Spielernamen und Beobachtungen) werden sicher in der EU
            gespeichert (Neon PostgreSQL, Region eu-central-1).
          </p>
          <p>
            Die KI-Coaching-Funktion sendet Match- und Profildaten zur Analyse an die
            Anthropic API (US-Server). Diese Daten werden nicht dauerhaft dort gespeichert.
          </p>
          <p>Du kannst die KI-Funktion jederzeit nicht nutzen.</p>
        </div>
        <Button
          variant="primary"
          size="touch"
          isLoading={isPending}
          onClick={handleDismiss}
        >
          Verstanden, weiter
        </Button>
      </div>
    </div>
  )
}
