'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import logger from '@/lib/logger'

const clusterStatusSchema = z.enum(['stabil', 'instabil', 'unknown'])

const updateProfileSchema = z.object({
  raumStatus: clusterStatusSchema.optional(),
  raumSublever: z.enum(['cross', 'drop', 'both', 'none']).optional(),
  hoeheStatus: clusterStatusSchema.optional(),
  hoeheSublever: z.enum(['tief', 'hoch', 'both', 'none']).optional(),
  mentalStatus: clusterStatusSchema.optional(),
  mentalPattern: z.enum(['risiko_hoch', 'risiko_runter', 'konstant', 'unknown']).optional(),
  konditionNote: z.string().max(500).optional(),
})

type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export async function updateProfile(
  playerId: string,
  data: UpdateProfileInput
): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Nicht angemeldet' }

  const parsed = updateProfileSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Daten' }

  try {
    await db
      .update(profiles)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(profiles.playerId, playerId), eq(profiles.userId, userId)))

    revalidatePath(`/spieler/${playerId}`)
    return {}
  } catch (err) {
    logger.error({ err }, 'updateProfile failed')
    return { error: 'Profil konnte nicht gespeichert werden' }
  }
}

export async function saveAiSummary(
  playerId: string,
  summary: string
): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Nicht angemeldet' }

  try {
    await db
      .update(profiles)
      .set({ aiSummary: summary, aiSummaryGeneratedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(profiles.playerId, playerId), eq(profiles.userId, userId)))

    revalidatePath(`/spieler/${playerId}`)
    return {}
  } catch (err) {
    logger.error({ err }, 'saveAiSummary failed')
    return { error: 'Zusammenfassung konnte nicht gespeichert werden' }
  }
}
