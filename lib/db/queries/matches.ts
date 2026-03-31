import { db } from '@/lib/db'
import { matches, matchObservations, retestEntries, retroEntries, goals } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'

export async function createMatch(data: {
  userId: string
  playerId: string
  mode: 'play' | 'observe'
  selectedGoalIds: string[]
  aiBriefing: string
  observePlayerIds?: string[]
}) {
  const [row] = await db
    .insert(matches)
    .values({
      userId: data.userId,
      playerId: data.playerId,
      mode: data.mode,
      selectedGoalIds: data.selectedGoalIds,
      aiBriefing: data.aiBriefing,
      observePlayerIds: data.observePlayerIds ?? [],
      date: new Date().toISOString().slice(0, 10),
    })
    .returning({ id: matches.id })
  return row
}

export async function getMatchById(userId: string, matchId: string) {
  const rows = await db
    .select()
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

export async function endMatch(
  userId: string,
  matchId: string,
  result: 'W' | 'L' | null,
  score: string
) {
  await db
    .update(matches)
    .set({ result, score, endedAt: new Date() })
    .where(and(eq(matches.id, matchId), eq(matches.userId, userId)))
}

export async function saveObservation(data: {
  userId: string
  matchId: string
  playerId: string
  setNumber: number
  cluster: 'raum' | 'hoehe' | 'mental'
  status: 'stabil' | 'instabil' | 'unknown'
  note: string
}) {
  await db.insert(matchObservations).values(data)
}

export async function saveRetestEntry(data: {
  userId: string
  matchId: string
  trigger: 'satzwechsel' | 'break' | 'drei_games'
  raumChanged: boolean
  hoeheChanged: boolean
  mentalChanged: boolean
  note: string
}) {
  await db.insert(retestEntries).values(data)
}

export async function saveRetroEntry(data: {
  matchId: string
  userId: string
  goal1Id: string | null
  goal1Result: 'ja' | 'teilweise' | 'nein' | null
  goal1Note: string
  goal2Id: string | null
  goal2Result: 'ja' | 'teilweise' | 'nein' | null
  goal2Note: string
  goal3Id: string | null
  goal3Result: 'ja' | 'teilweise' | 'nein' | null
  goal3Note: string
  strongestLever: 'raum' | 'hoehe' | 'mental' | 'keiner'
  missedSignalNote: string
  nextTestNote: string
  aiSynergyFeedback: string
}) {
  await db.insert(retroEntries).values(data)
}

export async function getLatestObservationsForMatch(
  userId: string,
  matchId: string
): Promise<{
  raum: 'stabil' | 'instabil' | null
  hoehe: 'stabil' | 'instabil' | null
  mental: 'stabil' | 'instabil' | null
}> {
  const rows = await db
    .select()
    .from(matchObservations)
    .where(and(eq(matchObservations.matchId, matchId), eq(matchObservations.userId, userId)))
    .orderBy(desc(matchObservations.createdAt))

  const result: {
    raum: 'stabil' | 'instabil' | null
    hoehe: 'stabil' | 'instabil' | null
    mental: 'stabil' | 'instabil' | null
  } = { raum: null, hoehe: null, mental: null }

  for (const row of rows) {
    const cluster = row.cluster as 'raum' | 'hoehe' | 'mental'
    const status = row.status as 'stabil' | 'instabil' | 'unknown'
    if (result[cluster] === null && status !== 'unknown') {
      result[cluster] = status
    }
  }
  return result
}

export async function getAllMatches(userId: string) {
  return db
    .select({
      id: matches.id,
      date: matches.date,
      playerId: matches.playerId,
      result: matches.result,
      score: matches.score,
    })
    .from(matches)
    .where(eq(matches.userId, userId))
    .orderBy(desc(matches.date))
}

export async function getAllRetroEntries(userId: string) {
  return db.select().from(retroEntries).where(eq(retroEntries.userId, userId))
}

export async function getGoalsForMatch(userId: string, goalIds: string[]) {
  if (goalIds.length === 0) return []
  const all = await db.select().from(goals).where(eq(goals.userId, userId))
  return all.filter((g) => goalIds.includes(g.id))
}
