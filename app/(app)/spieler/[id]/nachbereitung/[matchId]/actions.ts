'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { saveRetroEntry } from '@/lib/db/queries/matches'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import logger from '@/lib/logger'

const submitRetroSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  goal1Id: z.string().uuid(),
  goal1Result: z.enum(['ja', 'teilweise', 'nein']),
  goal1Note: z.string().max(200),
  goal2Id: z.string().uuid(),
  goal2Result: z.enum(['ja', 'teilweise', 'nein']),
  goal2Note: z.string().max(200),
  goal3Id: z.string().uuid(),
  goal3Result: z.enum(['ja', 'teilweise', 'nein']),
  goal3Note: z.string().max(200),
  strongestLever: z.enum(['raum', 'hoehe', 'mental', 'keiner']),
  missedSignalNote: z.string().max(500),
  nextTestNote: z.string().max(500),
  aiSynergyFeedback: z.string().max(1000),
  raumStatus: z.enum(['stabil', 'instabil', 'unknown']).optional(),
  hoeheStatus: z.enum(['stabil', 'instabil', 'unknown']).optional(),
  mentalStatus: z.enum(['stabil', 'instabil', 'unknown']).optional(),
})

export async function submitRetrospective(data: unknown): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Nicht angemeldet' }

  const parsed = submitRetroSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Daten' }

  const d = parsed.data

  try {
    await saveRetroEntry({
      matchId: d.matchId,
      userId,
      goal1Id: d.goal1Id,
      goal1Result: d.goal1Result,
      goal1Note: d.goal1Note,
      goal2Id: d.goal2Id,
      goal2Result: d.goal2Result,
      goal2Note: d.goal2Note,
      goal3Id: d.goal3Id,
      goal3Result: d.goal3Result,
      goal3Note: d.goal3Note,
      strongestLever: d.strongestLever,
      missedSignalNote: d.missedSignalNote,
      nextTestNote: d.nextTestNote,
      aiSynergyFeedback: d.aiSynergyFeedback,
    })

    // Update player profile with new cluster insights
    if (d.raumStatus ?? d.hoeheStatus ?? d.mentalStatus) {
      await db
        .update(profiles)
        .set({
          ...(d.raumStatus ? { raumStatus: d.raumStatus } : {}),
          ...(d.hoeheStatus ? { hoeheStatus: d.hoeheStatus } : {}),
          ...(d.mentalStatus ? { mentalStatus: d.mentalStatus } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(profiles.playerId, d.playerId), eq(profiles.userId, userId)))
    }
  } catch (err) {
    logger.error({ err }, 'submitRetrospective failed')
    return { error: 'Retrospektive konnte nicht gespeichert werden' }
  }

  redirect(`/spieler/${d.playerId}`)
}
