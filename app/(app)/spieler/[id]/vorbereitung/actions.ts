'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createMatch } from '@/lib/db/queries/matches'
import { z } from 'zod'

const startMatchSchema = z.object({
  playerId: z.string().uuid(),
  selectedGoalIds: z.array(z.string().uuid()).length(3),
  aiBriefing: z.string().max(500),
})

export async function startMatch(data: unknown): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Nicht angemeldet' }

  const parsed = startMatchSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Daten' }

  const match = await createMatch({
    userId,
    playerId: parsed.data.playerId,
    mode: 'play',
    selectedGoalIds: parsed.data.selectedGoalIds,
    aiBriefing: parsed.data.aiBriefing,
  })

  if (!match) return { error: 'Match konnte nicht gestartet werden' }

  redirect(`/spieler/${parsed.data.playerId}/match/${match.id}`)
}
