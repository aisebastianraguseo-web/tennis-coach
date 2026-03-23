import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { preMatchSchema } from '@/lib/validations/ai'
import { getProfile } from '@/lib/db/queries/profiles'
import { getPlayerById } from '@/lib/db/queries/players'
import { getGoalsByIds } from '@/lib/db/queries/goals'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import logger from '@/lib/logger'

const client = new Anthropic()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json()
  const parsed = preMatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  const { playerId, selectedGoalIds } = parsed.data
  const [player, profile, selectedGoals] = await Promise.all([
    getPlayerById(userId, playerId),
    getProfile(userId, playerId),
    getGoalsByIds(userId, selectedGoalIds),
  ])

  if (!player || !profile)
    return NextResponse.json({ error: 'Spieler nicht gefunden' }, { status: 404 })

  const profileText = `Spieler: ${player.name} | Raum: ${profile.raumStatus} | Höhe: ${profile.hoeheStatus} | Mental: ${profile.mentalStatus}`
  const goalsText = selectedGoals.map((g) => g.shortLabel).join(', ')

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${profileText}\nMeine 3 Ziele: ${goalsText}\nGeneriere einen Satz: die taktische Einstiegshypothese für dieses Match.`,
        },
      ],
    })
    const textBlock = message.content[0]
    const briefing = textBlock?.type === 'text' ? textBlock.text : ''
    return NextResponse.json({ briefing })
  } catch (err) {
    logger.error({ err }, 'pre-match AI call failed')
    return NextResponse.json({ error: 'KI-Fehler' }, { status: 500 })
  }
}
