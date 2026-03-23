'use client'

type Lever = 'raum' | 'hoehe' | 'mental' | 'keiner'
type GoalCategory = 'bewegung' | 'technik' | 'taktik' | 'aufschlag' | 'koerper' | 'sonstige'

interface MatchSummary {
  id: string
  date: string
  playerName: string
  result: string | null
  score: string
  strongestLever: Lever | null
}

interface GoalStat {
  category: GoalCategory
  ja: number
  teilweise: number
  nein: number
  total: number
}

interface LeverStat {
  lever: Lever
  count: number
}

interface ProgressViewProps {
  matchSummaries: MatchSummary[]
  goalStats: GoalStat[]
  leverStats: LeverStat[]
}

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  bewegung: 'Bewegung & Position',
  technik: 'Schlagtechnik',
  taktik: 'Taktik & Strategie',
  aufschlag: 'Aufschlag',
  koerper: 'Körper & Ausrichtung',
  sonstige: 'Sonstige',
}

const LEVER_LABELS: Record<Lever, string> = {
  raum: 'Raum',
  hoehe: 'Höhe',
  mental: 'Mental',
  keiner: 'Keiner',
}

export function ProgressView({
  matchSummaries,
  goalStats,
  leverStats,
}: ProgressViewProps): React.JSX.Element {
  return (
    <div className="space-y-8">
      <h1 className="text-navy-900 text-xl font-bold">Saisonfortschritt</h1>

      {/* Goal adherence */}
      <section aria-label="Eigene Ziele">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Eigene Ziele
        </h2>
        {goalStats.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Matchdaten vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {goalStats.map((stat) => {
              const jaP = stat.total > 0 ? Math.round((stat.ja / stat.total) * 100) : 0
              const teilP = stat.total > 0 ? Math.round((stat.teilweise / stat.total) * 100) : 0
              const neinP = 100 - jaP - teilP
              return (
                <div key={stat.category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {CATEGORY_LABELS[stat.category]}
                    </span>
                    <span className="text-slate-500">{jaP}% Ja</span>
                  </div>
                  <div
                    className="flex h-4 overflow-hidden rounded-full bg-slate-100"
                    role="img"
                    aria-label={`${CATEGORY_LABELS[stat.category]}: ${jaP}% Ja, ${teilP}% Teilweise, ${neinP}% Nein`}
                  >
                    {jaP > 0 && (
                      <div className="bg-stable-text opacity-80" style={{ width: `${jaP}%` }} />
                    )}
                    {teilP > 0 && <div className="bg-amber-400" style={{ width: `${teilP}%` }} />}
                    {neinP > 0 && (
                      <div className="bg-instabil-text opacity-60" style={{ width: `${neinP}%` }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Lever frequency */}
      <section aria-label="Cluster-Übersicht">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Stärkste Hebel
        </h2>
        {leverStats.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Matchdaten vorhanden.</p>
        ) : (
          <div className="space-y-2">
            {leverStats.map((stat) => {
              const max = leverStats.reduce((m, s) => Math.max(m, s.count), 0)
              const pct = max > 0 ? Math.round((stat.count / max) * 100) : 0
              return (
                <div key={stat.lever} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium text-slate-700">
                    {LEVER_LABELS[stat.lever]}
                  </span>
                  <div className="flex-1 rounded-full bg-slate-100">
                    <div
                      className="bg-navy-900 h-4 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                      role="img"
                      aria-label={`${LEVER_LABELS[stat.lever]}: ${stat.count} Mal`}
                    />
                  </div>
                  <span className="w-6 text-right text-sm text-slate-500">{stat.count}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Match history */}
      <section aria-label="Matchhistorie">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Alle Matches
        </h2>
        {matchSummaries.length === 0 ? (
          <p className="text-sm text-slate-500">Noch keine Matches gespeichert.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {matchSummaries.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{m.playerName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(m.date).toLocaleDateString('de-DE')}
                    {m.strongestLever && m.strongestLever !== 'keiner' && (
                      <> · Hebel: {LEVER_LABELS[m.strongestLever]}</>
                    )}
                  </p>
                </div>
                {m.result && (
                  <span
                    className={`rounded px-2 py-0.5 text-sm font-semibold ${
                      m.result === 'W'
                        ? 'bg-stable-bg text-stable-text'
                        : 'bg-instabil-bg text-instabil-text'
                    }`}
                  >
                    {m.result} {m.score}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
