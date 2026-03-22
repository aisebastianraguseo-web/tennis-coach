'use server'

import { auth } from '@clerk/nextjs/server'
import { endMatch as dbEndMatch } from '@/lib/db/queries/matches'

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
}
