import { db } from '@/lib/db'
import { players, profiles, matches } from '@/lib/db/schema'
import { eq, and, count, max, sql } from 'drizzle-orm'

export interface PlayerListRow {
  id: string
  name: string
  isPredefined: boolean
  matchCount: number
  lastMatchDate: string | null
  raumStatus: string
  hoeheStatus: string
  mentalStatus: string
}

export async function getPlayersForList(userId: string): Promise<PlayerListRow[]> {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      isPredefined: players.isPredefined,
      matchCount: count(matches.id),
      lastMatchDate: max(matches.date),
      raumStatus: sql<string>`COALESCE(${profiles.raumStatus}, 'unknown')`,
      hoeheStatus: sql<string>`COALESCE(${profiles.hoeheStatus}, 'unknown')`,
      mentalStatus: sql<string>`COALESCE(${profiles.mentalStatus}, 'unknown')`,
    })
    .from(players)
    .leftJoin(profiles, eq(profiles.playerId, players.id))
    .leftJoin(matches, and(eq(matches.playerId, players.id), eq(matches.userId, userId)))
    .where(eq(players.userId, userId))
    .groupBy(
      players.id,
      players.name,
      players.isPredefined,
      profiles.raumStatus,
      profiles.hoeheStatus,
      profiles.mentalStatus
    )
    .orderBy(players.name)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    isPredefined: r.isPredefined,
    matchCount: Number(r.matchCount),
    lastMatchDate: r.lastMatchDate ?? null,
    raumStatus: r.raumStatus ?? 'unknown',
    hoeheStatus: r.hoeheStatus ?? 'unknown',
    mentalStatus: r.mentalStatus ?? 'unknown',
  }))
}

export async function getPlayerById(userId: string, playerId: string) {
  const rows = await db
    .select()
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.userId, userId)))
    .limit(1)

  return rows[0] ?? null
}
