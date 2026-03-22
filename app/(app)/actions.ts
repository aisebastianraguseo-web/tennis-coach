'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { seedUserIfNew } from '@/lib/db/seed'

export async function initUser(): Promise<{ showGdpr: boolean }> {
  const { userId } = await auth()
  if (!userId) return { showGdpr: false }

  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  if (existing.length === 0) {
    await seedUserIfNew(userId)
    return { showGdpr: true }
  }

  const showGdpr = existing[0]?.gdprNoticeDismissedAt === null
  return { showGdpr: showGdpr ?? true }
}

export async function dismissGdprNotice(): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  await db
    .update(userSettings)
    .set({ gdprNoticeDismissedAt: new Date() })
    .where(eq(userSettings.userId, userId))
}
