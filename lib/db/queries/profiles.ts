import { db } from '@/lib/db'
import { profiles, matches, matchObservations } from '@/lib/db/schema'
import { eq, and, desc, or, sql } from 'drizzle-orm'

export async function getProfile(userId: string, playerId: string) {
  const rows = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.playerId, playerId), eq(profiles.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

export async function getMatchHistory(userId: string, playerId: string) {
  return db
    .select({
      id: matches.id,
      date: matches.date,
      mode: matches.mode,
      result: matches.result,
      score: matches.score,
    })
    .from(matches)
    .where(
      and(
        eq(matches.userId, userId),
        or(
          eq(matches.playerId, playerId),
          sql`${playerId}::uuid = ANY(${matches.observePlayerIds})`
        )
      )
    )
    .orderBy(desc(matches.date))
}

export async function getMatchObservations(userId: string, matchId: string) {
  return db
    .select()
    .from(matchObservations)
    .where(and(eq(matchObservations.matchId, matchId), eq(matchObservations.userId, userId)))
    .orderBy(matchObservations.createdAt)
}
