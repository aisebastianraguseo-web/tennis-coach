'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { players, profiles } from '@/lib/db/schema'
import { z } from 'zod'

const addPlayerSchema = z.object({
  name: z.string().min(1).max(100).trim(),
})

export async function addPlayer(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Nicht angemeldet' }

  const parsed = addPlayerSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: 'Name ungültig' }

  const [inserted] = await db
    .insert(players)
    .values({ userId, name: parsed.data.name, isPredefined: false })
    .returning({ id: players.id })

  if (!inserted) return { error: 'Spieler konnte nicht angelegt werden' }

  await db.insert(profiles).values({ playerId: inserted.id, userId })

  revalidatePath('/spieler')
  return {}
}
