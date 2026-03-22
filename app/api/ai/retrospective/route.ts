import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { retrospectiveSchema } from '@/lib/validations/ai'
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
  const parsed = retrospectiveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  const { playerId, matchId: _matchId, goalResults, strongestLever } = parsed.data
  const [player, profile] = await Promise.all([
    getPlayerById(userId, playerId),
    getProfile(userId, playerId),
  ])

  if (!player || !profile) return NextResponse.json({ error: 'Spieler nicht gefunden' }, { status: 404 })

  const goalIds = goalResults.map((g) => g.goalId)
  const goals = await getGoalsByIds(userId, goalIds)

  const goalsText = goalResults.map((gr) => {
    const g = goals.find((x) => x.id === gr.goalId)
    return `${g?.shortLabel ?? 'Ziel'}: ${gr.result}`
  }).join(', ')

  const profileText = `Spieler: ${player.name} | Stärkster Hebel: ${strongestLever}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `${profileText}\nZiele: ${goalsText}\nGeneriere 2–3 Sätze: Welches Ziel hatte Synergie mit dem stärksten Hebel und was teste ich beim nächsten Match?`,
      }],
    })
    const textBlock = message.content[0]
    const feedback = textBlock?.type === 'text' ? textBlock.text : ''
    return NextResponse.json({ feedback })
  } catch (err) {
    logger.error({ err }, 'retrospective AI call failed')
    return NextResponse.json({ error: 'KI-Fehler' }, { status: 500 })
  }
}
