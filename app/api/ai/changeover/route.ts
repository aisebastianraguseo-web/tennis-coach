import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { changoverSchema } from '@/lib/validations/ai'
import { getProfile } from '@/lib/db/queries/profiles'
import { getPlayerById } from '@/lib/db/queries/players'
import { getGoalsByIds } from '@/lib/db/queries/goals'
import { saveObservation } from '@/lib/db/queries/matches'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import logger from '@/lib/logger'

const client = new Anthropic()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json()
  const parsed = changoverSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  const { playerId, matchId, clusterState, observation, selectedGoalIds } = parsed.data
  const [player, profile, selectedGoals] = await Promise.all([
    getPlayerById(userId, playerId),
    getProfile(userId, playerId),
    getGoalsByIds(userId, selectedGoalIds),
  ])

  if (!player || !profile) return NextResponse.json({ error: 'Spieler nicht gefunden' }, { status: 404 })

  // Persist the latest cluster observations
  const clusters = [
    { cluster: 'raum' as const, status: clusterState.raum },
    { cluster: 'hoehe' as const, status: clusterState.hoehe },
    { cluster: 'mental' as const, status: clusterState.mental },
  ]
  for (const c of clusters) {
    if (c.status !== 'unknown') {
      await saveObservation({
        userId, matchId, playerId,
        setNumber: 1,
        cluster: c.cluster,
        status: c.status as 'stabil' | 'instabil' | 'unknown',
        note: observation ?? '',
      }).catch(() => undefined)
    }
  }

  const profileText = `Spieler: ${player.name} | Raum: ${profile.raumStatus} | Höhe: ${profile.hoeheStatus} | Mental: ${profile.mentalStatus}`
  const clusterText = `Aktuell — Raum: ${clusterState.raum}, Höhe: ${clusterState.hoehe}, Mental: ${clusterState.mental}`
  const goalsText = selectedGoals.map((g) => g.shortLabel).join(', ')

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `${profileText}\n${clusterText}\nBeobachtung: ${observation ?? 'keine'}\nMeine Ziele: ${goalsText}\nGeneriere einen Satz: die beste taktische Anpassung für das nächste Game.`,
      }],
    })
    const textBlock = message.content[0]
    const recommendation = textBlock?.type === 'text' ? textBlock.text : ''
    return NextResponse.json({ recommendation })
  } catch (err) {
    logger.error({ err }, 'changeover AI call failed')
    return NextResponse.json({ error: 'KI-Fehler' }, { status: 500 })
  }
}
