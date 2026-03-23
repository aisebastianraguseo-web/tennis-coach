'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/feedback/error-message'
import { addPlayer } from '@/app/(app)/spieler/actions'

interface AddPlayerDialogProps {
  onClose: () => void
}

export function AddPlayerDialog({ onClose }: AddPlayerDialogProps): React.JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const result = await addPlayer(formData)

    setIsPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Hintergrund schließen"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Spieler hinzufügen"
        className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Spieler hinzufügen</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="player-name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              ref={inputRef}
              id="player-name"
              name="name"
              type="text"
              required
              maxLength={100}
              placeholder="Vorname Nachname"
              className="focus:border-navy-900 focus:ring-navy-900 w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:ring-1 focus:outline-none"
              aria-describedby={error ? 'add-player-error' : undefined}
            />
          </div>
          {error && <ErrorMessage id="add-player-error" message={error} />}
          <div className="mt-4 flex gap-3">
            <Button type="button" variant="ghost" size="md" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isPending}
              className="flex-1"
            >
              Hinzufügen
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
