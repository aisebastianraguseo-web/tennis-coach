import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { playerSummarySchema } from '@/lib/validations/ai'
import { getProfile, getMatchHistory } from '@/lib/db/queries/profiles'
import { getPlayerById } from '@/lib/db/queries/players'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import logger from '@/lib/logger'

const client = new Anthropic()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json()
  const parsed = playerSummarySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const { playerId } = parsed.data
  const [player, profile, history] = await Promise.all([
    getPlayerById(userId, playerId),
    getProfile(userId, playerId),
    getMatchHistory(userId, playerId),
  ])

  if (!player || !profile) {
    return NextResponse.json({ error: 'Spieler nicht gefunden' }, { status: 404 })
  }

  const profileText = `Spieler: ${player.name}
Raum: ${profile.raumStatus} (${profile.raumSublever})
Höhe: ${profile.hoeheStatus} (${profile.hoeheSublever})
Mental: ${profile.mentalStatus} (${profile.mentalPattern})
Notiz: ${profile.konditionNote || 'keine'}`

  const historyText = history
    .slice(0, 5)
    .map((m) => `${m.date}: ${m.result ?? '?'} ${m.score}`)
    .join('\n')

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${profileText}\n\nLetzte Matches:\n${historyText || 'Noch keine Matches.'}\n\nGeneriere einen Absatz: Was fordert dieser Spieler von mir und welchen Cluster teste ich zuerst?`,
        },
      ],
    })

    const textBlock = message.content[0]
    const summary = textBlock?.type === 'text' ? textBlock.text : ''
    return NextResponse.json({ summary })
  } catch (err) {
    logger.error({ err }, 'player-summary AI call failed')
    return NextResponse.json({ error: 'KI-Fehler' }, { status: 500 })
  }
}
