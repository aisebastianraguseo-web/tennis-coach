'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { goals } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import logger from '@/lib/logger'

const addGoalSchema = z.object({
  text: z.string().min(1).max(500).trim(),
  category: z.enum(['bewegung', 'technik', 'taktik', 'aufschlag', 'koerper', 'sonstige']),
})

export async function addGoal(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Nicht angemeldet' }

  const parsed = addGoalSchema.safeParse({
    text: formData.get('text'),
    category: formData.get('category') ?? 'sonstige',
  })
  if (!parsed.success) return { error: 'Ungültige Eingabe' }

  const shortLabel = parsed.data.text.slice(0, 40)

  try {
    await db.insert(goals).values({
      userId,
      text: parsed.data.text,
      shortLabel,
      category: parsed.data.category,
      isPredefined: false,
    })
    revalidatePath('/ziele')
    return {}
  } catch (err) {
    logger.error({ err }, 'addGoal failed')
    return { error: 'Ziel konnte nicht gespeichert werden' }
  }
}

export async function archiveGoal(goalId: string): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Nicht angemeldet' }

  try {
    await db
      .update(goals)
      .set({ isArchived: true })
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    revalidatePath('/ziele')
    return {}
  } catch (err) {
    logger.error({ err }, 'archiveGoal failed')
    return { error: 'Ziel konnte nicht archiviert werden' }
  }
}
