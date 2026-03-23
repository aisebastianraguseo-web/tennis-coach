import { db } from '@/lib/db'
import { retroEntries, goals, matches, players } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

type GoalCategory = 'bewegung' | 'technik' | 'taktik' | 'aufschlag' | 'koerper' | 'sonstige'
type GoalResult = 'ja' | 'teilweise' | 'nein'
type Lever = 'raum' | 'hoehe' | 'mental' | 'keiner'

export interface GoalStat {
  category: GoalCategory
  ja: number
  teilweise: number
  nein: number
  total: number
}

export interface LeverStat {
  lever: Lever
  count: number
}

export interface MatchSummary {
  id: string
  date: string
  playerName: string
  result: string | null
  score: string
  strongestLever: Lever | null
}

export async function getGoalStats(userId: string): Promise<GoalStat[]> {
  const rows = await db
    .select({
      goal1Id: retroEntries.goal1Id,
      goal1Result: retroEntries.goal1Result,
      goal2Id: retroEntries.goal2Id,
      goal2Result: retroEntries.goal2Result,
      goal3Id: retroEntries.goal3Id,
      goal3Result: retroEntries.goal3Result,
    })
    .from(retroEntries)
    .where(eq(retroEntries.userId, userId))

  const pairs: { goalId: string; result: GoalResult }[] = []
  for (const row of rows) {
    if (row.goal1Id && row.goal1Result) pairs.push({ goalId: row.goal1Id, result: row.goal1Result as GoalResult })
    if (row.goal2Id && row.goal2Result) pairs.push({ goalId: row.goal2Id, result: row.goal2Result as GoalResult })
    if (row.goal3Id && row.goal3Result) pairs.push({ goalId: row.goal3Id, result: row.goal3Result as GoalResult })
  }

  if (pairs.length === 0) return []

  const goalIds = Array.from(new Set(pairs.map((p) => p.goalId)))
  const goalRows = await db
    .select({ id: goals.id, category: goals.category })
    .from(goals)
    .where(eq(goals.userId, userId))

  const categoryMap = new Map<string, GoalCategory>()
  for (const g of goalRows) {
    if (goalIds.includes(g.id)) categoryMap.set(g.id, g.category as GoalCategory)
  }

  const stats = new Map<GoalCategory, { ja: number; teilweise: number; nein: number; total: number }>()
  for (const pair of pairs) {
    const cat = categoryMap.get(pair.goalId)
    if (!cat) continue
    const s = stats.get(cat) ?? { ja: 0, teilweise: 0, nein: 0, total: 0 }
    s[pair.result]++
    s.total++
    stats.set(cat, s)
  }

  return Array.from(stats.entries()).map(([category, s]) => ({ category, ...s }))
}

export async function getLeverStats(userId: string): Promise<LeverStat[]> {
  const rows = await db
    .select({ strongestLever: retroEntries.strongestLever })
    .from(retroEntries)
    .where(eq(retroEntries.userId, userId))

  const counts = new Map<Lever, number>()
  for (const row of rows) {
    const lever = row.strongestLever as Lever
    counts.set(lever, (counts.get(lever) ?? 0) + 1)
  }

  const levers: Lever[] = ['raum', 'hoehe', 'mental', 'keiner']
  return levers
    .filter((l) => counts.has(l))
    .map((lever) => ({ lever, count: counts.get(lever) ?? 0 }))
    .sort((a, b) => b.count - a.count)
}

export async function getMatchSummaries(userId: string): Promise<MatchSummary[]> {
  const rows = await db
    .select({
      id: matches.id,
      date: matches.date,
      playerName: players.name,
      result: matches.result,
      score: matches.score,
      startedAt: matches.startedAt,
      strongestLever: retroEntries.strongestLever,
    })
    .from(matches)
    .innerJoin(players, and(eq(players.id, matches.playerId), eq(players.userId, userId)))
    .leftJoin(retroEntries, eq(retroEntries.matchId, matches.id))
    .where(eq(matches.userId, userId))
    .orderBy(desc(matches.startedAt))

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    playerName: r.playerName,
    result: r.result ?? null,
    score: r.score,
    strongestLever: (r.strongestLever as Lever | null) ?? null,
  }))
}
