'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { AiCard } from '@/components/ui/ai-card'
import { startMatch } from '@/app/(app)/spieler/[id]/vorbereitung/actions'
import type { GoalCategory } from '@/types/domain'

interface Goal {
  id: string
  text: string
  shortLabel: string
  category: GoalCategory
}

interface PlayerSummary {
  raumStatus: string
  hoeheStatus: string
  mentalStatus: string
  aiSummary: string
}

interface PreMatchViewProps {
  playerId: string
  playerName: string
  profile: PlayerSummary
  goals: Goal[]
}

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  bewegung: 'Bewegung & Position', technik: 'Schlagtechnik',
  taktik: 'Taktik & Strategie', aufschlag: 'Aufschlag',
  koerper: 'Körper & Ausrichtung', sonstige: 'Sonstige',
}

const CATEGORY_ORDER: GoalCategory[] = ['bewegung', 'technik', 'taktik', 'aufschlag', 'koerper', 'sonstige']

export function PreMatchView({ playerId, playerName, profile, goals }: PreMatchViewProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [aiBriefing, setAiBriefing] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [isLoadingAi, startAiTransition] = useTransition()
  const [isStarting, startMatchTransition] = useTransition()

  function toggleGoal(id: string): void {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }

  function handleAiBriefing(): void {
    setAiError(null)
    startAiTransition(async () => {
      try {
        const res = await fetch('/api/ai/pre-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, selectedGoalIds: selectedIds }),
        })
        const data = (await res.json()) as { briefing?: string; error?: string }
        if (!res.ok || data.error) { setAiError(data.error ?? 'Fehler'); return }
        setAiBriefing(data.briefing ?? '')
      } catch { setAiError('Netzwerkfehler') }
    })
  }

  function handleStart(): void {
    startMatchTransition(async () => {
      await startMatch({ playerId, selectedGoalIds: selectedIds, aiBriefing: aiBriefing ?? '' })
    })
  }

  const byCategory = CATEGORY_ORDER.reduce<Record<string, Goal[]>>((acc, cat) => {
    acc[cat] = goals.filter((g) => g.category === cat)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Vorbereitung: {playerName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Raum: {profile.raumStatus} · Höhe: {profile.hoeheStatus} · Mental: {profile.mentalStatus}
        </p>
        {profile.aiSummary && (
          <p className="mt-2 text-sm italic text-slate-600">{profile.aiSummary}</p>
        )}
      </div>

      <section aria-label="Zielauswahl">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Wähle 3 Ziele ({selectedIds.length}/3)
        </h2>
        <div className="space-y-4">
          {CATEGORY_ORDER.map((cat) => {
            const catGoals = byCategory[cat] ?? []
            if (catGoals.length === 0) return null
            return (
              <div key={cat}>
                <p className="mb-1 text-xs font-medium text-slate-400">{CATEGORY_LABELS[cat]}</p>
                <div className="space-y-2">
                  {catGoals.map((goal) => {
                    const isSelected = selectedIds.includes(goal.id)
                    return (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                          isSelected
                            ? 'border-navy-900 bg-navy-900 text-white'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                        }`}
                      >
                        {goal.text}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-label="KI-Briefing">
        <Button
          variant="secondary"
          size="touch"
          disabled={selectedIds.length < 3}
          isLoading={isLoadingAi}
          onClick={handleAiBriefing}
        >
          🤖 KI-Briefing generieren
        </Button>
        {(aiBriefing || isLoadingAi || aiError) && (
          <div className="mt-3">
            <AiCard text={aiBriefing} isLoading={isLoadingAi} error={aiError} />
          </div>
        )}
      </section>

      <Button
        variant="primary"
        size="touch"
        disabled={selectedIds.length < 3}
        isLoading={isStarting}
        onClick={handleStart}
      >
        Match starten →
      </Button>
    </div>
  )
}
