'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PlayerActionDialogProps {
  playerId: string
  playerName: string
  onClose: () => void
}

export function PlayerActionDialog({
  playerId,
  playerName,
  onClose,
}: PlayerActionDialogProps): React.JSX.Element {
  const router = useRouter()

  function navigate(path: string): void {
    onClose()
    router.push(path)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
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
        aria-label={`Aktionen für ${playerName}`}
        className="relative w-full max-w-lg rounded-t-2xl bg-white p-4 pb-8 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{playerName}</h2>
          <button
            onClick={onClose}
            aria-label="Dialog schließen"
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            size="touch"
            variant="primary"
            onClick={() => navigate(`/spieler/${playerId}/vorbereitung`)}
          >
            🎾 Spielen
          </Button>
          <Button
            size="touch"
            variant="secondary"
            onClick={() => navigate(`/spieler/${playerId}/beobachten`)}
          >
            👁 Beobachten
          </Button>
          <Button size="touch" variant="ghost" onClick={() => navigate(`/spieler/${playerId}`)}>
            📋 Profil ansehen
          </Button>
        </div>
      </div>
    </div>
  )
}
