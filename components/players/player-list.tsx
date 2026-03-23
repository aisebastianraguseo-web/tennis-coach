'use client'

import { useState } from 'react'
import type { PlayerListRow } from '@/lib/db/queries/players'
import { ProfileIndicator } from './profile-indicator'
import { PlayerActionDialog } from './player-action-dialog'
import { AddPlayerDialog } from './add-player-dialog'
import { Button } from '@/components/ui/button'

interface PlayerListProps {
  players: PlayerListRow[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '–'
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function PlayerList({ players }: PlayerListProps): React.JSX.Element {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerListRow | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <section aria-label="Spielerliste">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-navy-900 text-xl font-bold">Meine Gegner</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          aria-label="Neuen Spieler hinzufügen"
        >
          + Spieler
        </Button>
      </div>

      {players.length === 0 ? (
        <p className="py-8 text-center text-slate-500">
          Noch keine Spieler. Füge deinen ersten hinzu.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {players.map((player) => (
            <li key={player.id}>
              <button
                onClick={() => setSelectedPlayer(player)}
                className="flex w-full items-center gap-3 py-4 text-left hover:bg-slate-50 active:bg-slate-100"
                aria-label={`${player.name} – ${player.matchCount} ${player.matchCount === 1 ? 'Match' : 'Matches'}`}
              >
                <ProfileIndicator
                  matchCount={player.matchCount}
                  raumStatus={player.raumStatus}
                  hoeheStatus={player.hoeheStatus}
                  mentalStatus={player.mentalStatus}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{player.name}</p>
                  <p className="text-sm text-slate-500">
                    {player.matchCount} {player.matchCount === 1 ? 'Match' : 'Matches'}
                    {player.lastMatchDate && <> · {formatDate(player.lastMatchDate)}</>}
                  </p>
                </div>
                <span aria-hidden="true" className="text-slate-400">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedPlayer && (
        <PlayerActionDialog
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {showAddDialog && <AddPlayerDialog onClose={() => setShowAddDialog(false)} />}
    </section>
  )
}
