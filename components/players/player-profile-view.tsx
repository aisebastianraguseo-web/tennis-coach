'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { AiCard } from '@/components/ui/ai-card'
import { ErrorMessage } from '@/components/feedback/error-message'
import { saveAiSummary } from '@/app/(app)/spieler/[id]/actions'

type ClusterStatus = 'stabil' | 'instabil' | 'unknown'

interface Profile {
  raumStatus: ClusterStatus
  raumSublever: string
  hoeheStatus: ClusterStatus
  hoeheSublever: string
  mentalStatus: ClusterStatus
  mentalPattern: string
  aiSummary: string
  aiSummaryGeneratedAt: Date | null
}

interface MatchHistoryEntry {
  id: string
  date: string
  result: string | null
  score: string
}

interface PlayerProfileViewProps {
  playerId: string
  playerName: string
  profile: Profile
  matchHistory: MatchHistoryEntry[]
}

const statusLabel: Record<ClusterStatus, string> = {
  stabil: 'Stabil',
  instabil: 'Instabil',
  unknown: '?',
}

const statusClasses: Record<ClusterStatus, string> = {
  stabil: 'bg-stable-bg text-stable-text',
  instabil: 'bg-instabil-bg text-instabil-text',
  unknown: 'bg-neutral-bg text-neutral-text',
}

function ClusterRow({
  label,
  status,
  sublever,
}: {
  label: string
  status: ClusterStatus
  sublever: string
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <span className="font-medium text-slate-800">{label}</span>
        {sublever !== 'none' && (
          <span className="ml-2 text-xs text-slate-500">({sublever})</span>
        )}
      </div>
      <span
        className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[status]}`}
      >
        {statusLabel[status]}
      </span>
    </div>
  )
}

export function PlayerProfileView({
  playerId,
  playerName,
  profile,
  matchHistory,
}: PlayerProfileViewProps): React.JSX.Element {
  const [aiText, setAiText] = useState(profile.aiSummary || null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isLoadingAi, startAiTransition] = useTransition()
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)

  function handleAiRefresh(): void {
    setAiError(null)
    startAiTransition(async () => {
      try {
        const res = await fetch('/api/ai/player-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        })
        const data = (await res.json()) as { summary?: string; error?: string }
        if (!res.ok || data.error) {
          setAiError(data.error ?? 'KI-Anfrage fehlgeschlagen')
          return
        }
        setAiText(data.summary ?? '')
        await saveAiSummary(playerId, data.summary ?? '')
      } catch {
        setAiError('Netzwerkfehler. Bitte erneut versuchen.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-navy-900">{playerName}</h1>

      {/* Cluster Stability */}
      <section aria-label="Cluster-Stabilität">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Cluster-Stabilität
        </h2>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-4">
          <ClusterRow label="Raum" status={profile.raumStatus} sublever={profile.raumSublever} />
          <ClusterRow label="Höhe" status={profile.hoeheStatus} sublever={profile.hoeheSublever} />
          <ClusterRow label="Mental" status={profile.mentalStatus} sublever={profile.mentalPattern} />
        </div>
      </section>

      {/* AI Summary */}
      <section aria-label="KI-Zusammenfassung">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            KI-Zusammenfassung
          </h2>
          <Button
            variant="secondary"
            size="sm"
            isLoading={isLoadingAi}
            onClick={handleAiRefresh}
          >
            Aktualisieren
          </Button>
        </div>
        <AiCard text={aiText} isLoading={isLoadingAi} error={aiError} />
        {aiError && <div className="mt-2"><ErrorMessage message={aiError} /></div>}
      </section>

      {/* Match History */}
      <section aria-label="Matchhistorie">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Matchhistorie
        </h2>
        {matchHistory.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Matches gespeichert.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white" role="list">
            {matchHistory.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setExpandedMatchId(expandedMatchId === m.id ? null : m.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  aria-expanded={expandedMatchId === m.id}
                >
                  <span className="text-sm text-slate-700">
                    {new Date(m.date).toLocaleDateString('de-DE')}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-sm font-semibold ${
                      m.result === 'W' ? 'bg-stable-bg text-stable-text' : 'bg-instabil-bg text-instabil-text'
                    }`}
                  >
                    {m.result ?? '?'} {m.score}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
