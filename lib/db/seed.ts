'use server'

import { db } from './index'
import { players, profiles, goals, userSettings } from './schema'
import { PREDEFINED_PLAYERS, PREDEFINED_GOALS } from './seed-data'

export async function seedUserIfNew(userId: string): Promise<void> {
  // Atomic guard: only the first concurrent caller actually inserts the row.
  // ON CONFLICT DO NOTHING returns 0 rows if the userId already exists.
  const inserted = await db
    .insert(userSettings)
    .values({ userId })
    .onConflictDoNothing()
    .returning({ userId: userSettings.userId })

  if (inserted.length === 0) return

  // Seed 16 predefined players + their empty profiles
  const playerRows = PREDEFINED_PLAYERS.map((name) => ({
    userId,
    name,
    isPredefined: true,
  }))

  const insertedPlayers = await db.insert(players).values(playerRows).returning({ id: players.id })

  const profileRows = insertedPlayers.map(({ id }) => ({
    playerId: id,
    userId,
  }))

  await db.insert(profiles).values(profileRows)

  // Seed 17 predefined goals
  const goalRows = PREDEFINED_GOALS.map(({ text, category }) => ({
    userId,
    text,
    shortLabel: text.slice(0, 40),
    category,
    isPredefined: true,
  }))

  await db.insert(goals).values(goalRows)
}
