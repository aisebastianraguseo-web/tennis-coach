'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createMatch } from '@/lib/db/queries/matches'
import { z } from 'zod'

const startObserveSchema = z.object({
  playerId: z.string().uuid(),
  observePlayerId: z.string().uuid().optional(),
})

export async function startObserve(data: unknown): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Nicht angemeldet' }

  const parsed = startObserveSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Daten' }

  const observePlayerIds = parsed.data.observePlayerId ? [parsed.data.observePlayerId] : []

  const match = await createMatch({
    userId,
    playerId: parsed.data.playerId,
    mode: 'observe',
    selectedGoalIds: [],
    aiBriefing: '',
    observePlayerIds,
  })

  if (!match) return { error: 'Beobachtung konnte nicht gestartet werden' }

  redirect(`/spieler/${parsed.data.playerId}/match/${match.id}`)
}
