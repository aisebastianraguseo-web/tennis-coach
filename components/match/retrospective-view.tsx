'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { AiCard } from '@/components/ui/ai-card'
import { ErrorMessage } from '@/components/feedback/error-message'
import { submitRetrospective } from '@/app/(app)/spieler/[id]/nachbereitung/[matchId]/actions'

type GoalResult = 'ja' | 'teilweise' | 'nein'
type Lever = 'raum' | 'hoehe' | 'mental' | 'keiner'

interface Goal {
  id: string
  text: string
  shortLabel: string
}

interface RetroViewProps {
  matchId: string
  playerId: string
  selectedGoals: Goal[]
}

const RESULT_BUTTONS: { value: GoalResult; label: string }[] = [
  { value: 'ja', label: 'Ja' },
  { value: 'teilweise', label: 'Teilweise' },
  { value: 'nein', label: 'Nein' },
]

const LEVER_OPTIONS: { value: Lever; label: string }[] = [
  { value: 'raum', label: 'Raum' },
  { value: 'hoehe', label: 'Höhe' },
  { value: 'mental', label: 'Mental' },
  { value: 'keiner', label: 'Keiner' },
]

export function RetrospectiveView({
  matchId,
  playerId,
  selectedGoals,
}: RetroViewProps): React.JSX.Element {
  const [goalResults, setGoalResults] = useState<Record<string, GoalResult>>({})
  const [goalNotes, setGoalNotes] = useState<Record<string, string>>({})
  const [strongestLever, setStrongestLever] = useState<Lever | null>(null)
  const [missedSignal, setMissedSignal] = useState('')
  const [nextTest, setNextTest] = useState('')
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoadingAi, startAiTransition] = useTransition()
  const [isSubmitting, startSubmitTransition] = useTransition()

  const allAnswered = selectedGoals.every((g) => goalResults[g.id])
  const canSubmit = allAnswered && strongestLever !== null

  function handleSubmit(): void {
    if (!strongestLever) return
    const goals = selectedGoals.slice(0, 3)
    const g1 = goals[0]
    const g2 = goals[1]
    const g3 = goals[2]
    if (!g1 || !g2 || !g3) return

    setSubmitError(null)
    setAiError(null)

    startAiTransition(async () => {
      try {
        const res = await fetch('/api/ai/retrospective', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            matchId,
            goalResults: goals.map((g) => ({ goalId: g.id, result: goalResults[g.id] })),
            strongestLever,
            missedSignal: missedSignal || undefined,
            nextTest: nextTest || undefined,
          }),
        })
        const data = (await res.json()) as { feedback?: string; error?: string }
        if (!res.ok || data.error) {
          setAiError(data.error ?? 'Fehler')
          return
        }
        const feedback = data.feedback ?? ''
        setAiFeedback(feedback)

        // Submit to DB
        startSubmitTransition(async () => {
          const result = await submitRetrospective({
            matchId,
            playerId,
            goal1Id: g1.id,
            goal1Result: goalResults[g1.id] ?? 'nein',
            goal1Note: goalNotes[g1.id] ?? '',
            goal2Id: g2.id,
            goal2Result: goalResults[g2.id] ?? 'nein',
            goal2Note: goalNotes[g2.id] ?? '',
            goal3Id: g3.id,
            goal3Result: goalResults[g3.id] ?? 'nein',
            goal3Note: goalNotes[g3.id] ?? '',
            strongestLever,
            missedSignalNote: missedSignal,
            nextTestNote: nextTest,
            aiSynergyFeedback: feedback,
          })
          if (result?.error) setSubmitError(result.error)
        })
      } catch {
        setAiError('Netzwerkfehler')
      }
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-navy-900 text-xl font-bold">Nachbereitung</h1>

      {/* Block 1: Goal adherence */}
      <section aria-label="Eigene Ziele">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Eigene Ziele
        </h2>
        <div className="space-y-4">
          {selectedGoals.map((goal) => (
            <div key={goal.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-slate-800">{goal.text}</p>
              <div
                className="mb-2 flex gap-2"
                role="group"
                aria-label={`Ergebnis für ${goal.shortLabel}`}
              >
                {RESULT_BUTTONS.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setGoalResults((r) => ({ ...r, [goal.id]: btn.value }))}
                    aria-pressed={goalResults[goal.id] === btn.value}
                    className={`flex-1 rounded-md border py-2 text-sm font-semibold transition-colors ${
                      goalResults[goal.id] === btn.value
                        ? 'border-navy-900 bg-navy-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Notiz (optional)"
                value={goalNotes[goal.id] ?? ''}
                onChange={(e) => setGoalNotes((n) => ({ ...n, [goal.id]: e.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                aria-label={`Notiz für ${goal.shortLabel}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Block 2: Analysis quality */}
      <section aria-label="Analyse-Qualität">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Analyse-Qualität
        </h2>
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Welcher Cluster war der stärkste Hebel?
            </p>
            <div className="flex gap-2" role="group" aria-label="Stärkster Hebel">
              {LEVER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStrongestLever(opt.value)}
                  aria-pressed={strongestLever === opt.value}
                  className={`flex-1 rounded-md border py-2 text-sm font-semibold ${
                    strongestLever === opt.value
                      ? 'border-navy-900 bg-navy-900 text-white'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="missed-signal"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Wo habe ich ein Signal gesehen und nicht genutzt? (optional)
            </label>
            <input
              id="missed-signal"
              type="text"
              value={missedSignal}
              onChange={(e) => setMissedSignal(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="next-test" className="mb-1 block text-sm font-medium text-slate-700">
              Was teste ich nächstes Mal anders? (optional)
            </label>
            <input
              id="next-test"
              type="text"
              value={nextTest}
              onChange={(e) => setNextTest(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {aiFeedback && <AiCard text={aiFeedback} aria-label="KI-Synergie-Feedback" />}
      {aiError && <ErrorMessage message={aiError} />}
      {submitError && <ErrorMessage message={submitError} />}

      <Button
        variant="primary"
        size="touch"
        disabled={!canSubmit}
        isLoading={isLoadingAi || isSubmitting}
        onClick={handleSubmit}
      >
        Abschließen & speichern
      </Button>
    </div>
  )
}
