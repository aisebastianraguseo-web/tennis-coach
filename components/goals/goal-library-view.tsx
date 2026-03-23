'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/feedback/error-message'
import { addGoal, archiveGoal } from '@/app/(app)/ziele/actions'
import type { GoalCategory } from '@/types/domain'

interface Goal {
  id: string
  text: string
  shortLabel: string
  category: GoalCategory
  isArchived: boolean
  isPredefined: boolean
}

interface GoalLibraryViewProps {
  goals: Goal[]
}

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  bewegung: 'Bewegung & Position',
  technik: 'Schlagtechnik',
  taktik: 'Taktik & Strategie',
  aufschlag: 'Aufschlag',
  koerper: 'Körper & Ausrichtung',
  sonstige: 'Sonstige',
}

const CATEGORY_ORDER: GoalCategory[] = [
  'bewegung',
  'technik',
  'taktik',
  'aufschlag',
  'koerper',
  'sonstige',
]

export function GoalLibraryView({ goals: initialGoals }: GoalLibraryViewProps): React.JSX.Element {
  const [showArchived, setShowArchived] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, startAddTransition] = useTransition()
  const [isArchiving, startArchiveTransition] = useTransition()

  const visible = showArchived ? initialGoals : initialGoals.filter((g) => !g.isArchived)

  const byCategory = CATEGORY_ORDER.reduce<Record<string, Goal[]>>((acc, cat) => {
    acc[cat] = visible.filter((g) => g.category === cat)
    return acc
  }, {})

  function handleAdd(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    setAddError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    startAddTransition(async () => {
      const result = await addGoal(formData)
      if (result.error) {
        setAddError(result.error)
        return
      }
      form.reset()
      setShowAddForm(false)
    })
  }

  function handleArchive(goalId: string): void {
    startArchiveTransition(async () => {
      await archiveGoal(goalId)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-navy-900 text-xl font-bold">Meine Ziele</h1>
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="text-sm text-slate-500 underline"
        >
          {showArchived ? 'Archivierte ausblenden' : 'Archivierte anzeigen'}
        </button>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const catGoals = byCategory[cat] ?? []
        if (catGoals.length === 0) return null
        return (
          <section key={cat} aria-label={CATEGORY_LABELS[cat]}>
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
              {CATEGORY_LABELS[cat]}
            </h2>
            <ul className="space-y-2">
              {catGoals.map((goal) => (
                <li
                  key={goal.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    goal.isArchived
                      ? 'border-slate-100 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <p className="min-w-0 flex-1 text-sm text-slate-800">{goal.text}</p>
                  {!goal.isArchived && (
                    <button
                      onClick={() => handleArchive(goal.id)}
                      disabled={isArchiving}
                      aria-label={`"${goal.shortLabel}" archivieren`}
                      className="flex-shrink-0 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Archivieren
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {/* Add new goal */}
      <section aria-label="Neues Ziel hinzufügen">
        {showAddForm ? (
          <form onSubmit={handleAdd} className="rounded-lg border border-slate-200 bg-white p-4">
            <label htmlFor="goal-text" className="mb-1 block text-sm font-medium text-slate-700">
              Zieltext
            </label>
            <textarea
              id="goal-text"
              name="text"
              required
              maxLength={500}
              rows={3}
              className="focus:border-navy-900 focus:ring-navy-900 mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              placeholder="Beschreibe dein Ziel…"
            />
            <label
              htmlFor="goal-category"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Kategorie
            </label>
            <select
              id="goal-category"
              name="category"
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              defaultValue="sonstige"
            >
              {CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            {addError && <ErrorMessage message={addError} />}
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Abbrechen
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isAdding}>
                Speichern
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" size="touch" onClick={() => setShowAddForm(true)}>
            + Neues Ziel hinzufügen
          </Button>
        )}
      </section>
    </div>
  )
}
