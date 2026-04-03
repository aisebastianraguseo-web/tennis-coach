'use server'

import { auth } from '@clerk/nextjs/server'
import {
  endMatch as dbEndMatch,
  getMatchById,
  getLatestObservationsForMatch,
} from '@/lib/db/queries/matches'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import logger from '@/lib/logger'

async function updateProfileFromObservations(
  userId: string,
  matchId: string,
  playerId: string
): Promise<void> {
  const obs = await getLatestObservationsForMatch(userId, matchId, playerId)
  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (obs.raum) update['raumStatus'] = obs.raum
  if (obs.hoehe) update['hoeheStatus'] = obs.hoehe
  if (obs.mental) update['mentalStatus'] = obs.mental
  if (!obs.raum && !obs.hoehe && !obs.mental) return
  await db
    .update(profiles)
    .set(update)
    .where(and(eq(profiles.playerId, playerId), eq(profiles.userId, userId)))
}

export async function endMatch(data: {
  matchId: string
  playerId: string
  result: string | null
  score: string
}): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  const result = data.result === 'W' || data.result === 'L' ? data.result : null
  await dbEndMatch(userId, data.matchId, result, data.score)

  // For observe mode: update profiles for all observed players
  try {
    const match = await getMatchById(userId, data.matchId)
    if (match?.mode === 'observe') {
      const allPlayerIds = [data.playerId, ...(match.observePlayerIds ?? [])]
      await Promise.all(
        allPlayerIds.map((pid) => updateProfileFromObservations(userId, data.matchId, pid))
      )
    }
  } catch (err) {
    logger.error({ err }, 'endMatch observe profile update failed')
  }
}
