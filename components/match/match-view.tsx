'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AiCard } from '@/components/ui/ai-card'
import { Button } from '@/components/ui/button'
import { endMatch } from '@/app/(app)/spieler/[id]/match/[matchId]/actions'
import type { ClusterStatus } from '@/types/domain'

interface MatchGoal {
  id: string
  text: string
}

interface MatchViewProps {
  matchId: string
  playerId: string
  playerName: string
  selectedGoals: MatchGoal[]
  aiBriefing: string
}

const CLUSTER_BUTTONS: { value: ClusterStatus; label: string }[] = [
  { value: 'stabil', label: 'Stabil' },
  { value: 'instabil', label: 'Instabil' },
  { value: 'unknown', label: '?' },
]

const clusterActiveClass: Record<ClusterStatus, string> = {
  stabil: 'bg-stable-bg text-stable-text border-stable-text',
  instabil: 'bg-instabil-bg text-instabil-text border-instabil-text',
  unknown: 'bg-neutral-bg text-neutral-text border-neutral-text',
}

interface ClusterState {
  raum: ClusterStatus
  hoehe: ClusterStatus
  mental: ClusterStatus
}

type ClusterKey = keyof ClusterState

function ClusterGroup({
  label,
  clusterKey,
  value,
  onChange,
}: {
  label: string
  clusterKey: ClusterKey
  value: ClusterStatus
  onChange: (key: ClusterKey, val: ClusterStatus) => void
}): React.JSX.Element {
  return (
    <div role="radiogroup" aria-label={`Cluster ${label}`} className="flex items-center gap-2">
      <span className="w-16 text-sm font-semibold text-slate-700">{label}</span>
      {CLUSTER_BUTTONS.map((btn) => (
        <button
          key={btn.value}
          role="radio"
          aria-checked={value === btn.value}
          onClick={() => onChange(clusterKey, btn.value)}
          className={`flex-1 rounded-lg border-2 py-5 text-sm font-semibold transition-colors ${
            value === btn.value
              ? clusterActiveClass[btn.value]
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}

export function MatchView({
  matchId,
  playerId,
  playerName,
  selectedGoals,
  aiBriefing,
}: MatchViewProps): React.JSX.Element {
  const router = useRouter()
  const [clusters, setClusters] = useState<ClusterState>({
    raum: 'unknown',
    hoehe: 'unknown',
    mental: 'unknown',
  })
  const [observation, setObservation] = useState('')
  const [setNumber, setSetNumber] = useState(1)
  const [aiRec, setAiRec] = useState<string | null>(aiBriefing || null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isLoadingAi, startAiTransition] = useTransition()
  const [isEnding, startEndTransition] = useTransition()
  const [showGoals, setShowGoals] = useState(false)
  const [showRetest, setShowRetest] = useState(false)
  const [result, setResult] = useState<'W' | 'L' | ''>('')
  const [score, setScore] = useState('')

  function handleClusterChange(key: ClusterKey, val: ClusterStatus): void {
    const next = { ...clusters, [key]: val }
    setClusters(next)
    fetchAi(next)
  }

  function fetchAi(clusterState: ClusterState): void {
    setAiError(null)
    startAiTransition(async () => {
      try {
        const res = await fetch('/api/ai/changeover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            matchId,
            clusterState: {
              raum: clusterState.raum,
              hoehe: clusterState.hoehe,
              mental: clusterState.mental,
            },
            observation: observation || undefined,
            selectedGoalIds: selectedGoals.map((g) => g.id),
          }),
        })
        const data = (await res.json()) as { recommendation?: string; error?: string }
        if (!res.ok || data.error) {
          setAiError(data.error ?? 'Fehler')
          return
        }
        setAiRec(data.recommendation ?? '')
      } catch {
        setAiError('Netzwerkfehler')
      }
    })
  }

  function handleEnd(): void {
    startEndTransition(async () => {
      await endMatch({ matchId, playerId, result: result || null, score })
      router.push(`/spieler/${playerId}/nachbereitung/${matchId}`)
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-navy-900 text-lg font-bold">{playerName}</h1>
        <div className="flex items-center gap-1" role="group" aria-label="Aktueller Satz">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setSetNumber(s)}
              aria-pressed={setNumber === s}
              className={`rounded px-2 py-1 text-sm font-semibold ${setNumber === s ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              S{s}
            </button>
          ))}
        </div>
      </div>

      {/* AI Recommendation */}
      <AiCard text={aiRec} isLoading={isLoadingAi} error={aiError} aria-label="KI-Empfehlung" />

      {/* Cluster Toggles */}
      <section
        aria-label="Cluster-Status"
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <ClusterGroup
          label="Raum"
          clusterKey="raum"
          value={clusters.raum}
          onChange={handleClusterChange}
        />
        <ClusterGroup
          label="Höhe"
          clusterKey="hoehe"
          value={clusters.hoehe}
          onChange={handleClusterChange}
        />
        <ClusterGroup
          label="Mental"
          clusterKey="mental"
          value={clusters.mental}
          onChange={handleClusterChange}
        />
      </section>

      {/* Observation */}
      <div>
        <label htmlFor="observation" className="sr-only">
          Beobachtung
        </label>
        <input
          id="observation"
          type="text"
          maxLength={100}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          onBlur={() => {
            if (observation) fetchAi(clusters)
          }}
          placeholder="Beobachtung (optional)…"
          className="focus:border-navy-900 focus:ring-navy-900 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Goals reminder (collapsed) */}
      <details className="rounded-lg border border-slate-200 bg-white">
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={() => setShowGoals((v) => !v)}
        >
          Meine Ziele {showGoals ? '▲' : '▼'}
        </summary>
        <ul className="divide-y divide-slate-100 px-4 pb-3">
          {selectedGoals.map((g) => (
            <li key={g.id} className="py-2 text-sm text-slate-700">
              {g.text}
            </li>
          ))}
        </ul>
      </details>

      {/* Retest block (collapsed) */}
      <details className="rounded-lg border border-slate-200 bg-white">
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={() => setShowRetest((v) => !v)}
        >
          Retest-Momente {showRetest ? '▲' : '▼'}
        </summary>
        <div className="px-4 pb-3 text-sm text-slate-500">
          Satzwechsel · Break gegen mich · 3 Games in Folge — hat sich etwas verändert?
        </div>
      </details>

      {/* Score */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="result-select" className="mb-1 block text-xs text-slate-500">
            Ergebnis
          </label>
          <select
            id="result-select"
            value={result}
            onChange={(e) => setResult(e.target.value as 'W' | 'L' | '')}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">–</option>
            <option value="W">Sieg (W)</option>
            <option value="L">Niederlage (L)</option>
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="score-input" className="mb-1 block text-xs text-slate-500">
            Score
          </label>
          <input
            id="score-input"
            type="text"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="6:4, 3:6"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <Button variant="danger" size="touch" isLoading={isEnding} onClick={handleEnd}>
        Match beenden
      </Button>
    </div>
  )
}
