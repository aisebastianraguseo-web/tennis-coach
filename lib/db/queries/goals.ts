import { db } from '@/lib/db'
import { goals } from '@/lib/db/schema'
import { and, eq, asc } from 'drizzle-orm'

export async function getGoals(userId: string, includeArchived = false) {
  const conditions = includeArchived
    ? eq(goals.userId, userId)
    : and(eq(goals.userId, userId), eq(goals.isArchived, false))

  return db.select().from(goals).where(conditions).orderBy(goals.category, asc(goals.createdAt))
}

export async function getGoalsByIds(userId: string, ids: string[]) {
  if (ids.length === 0) return []
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .then((rows) => rows.filter((g) => ids.includes(g.id)))
}
