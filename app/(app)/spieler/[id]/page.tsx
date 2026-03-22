import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getPlayerById } from '@/lib/db/queries/players'
import { getProfile, getMatchHistory } from '@/lib/db/queries/profiles'
import { PlayerProfileView } from '@/components/players/player-profile-view'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Spielerprofil – ${id}` }
}

export default async function PlayerProfilePage({ params }: PageProps): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const [player, profile, history] = await Promise.all([
    getPlayerById(userId, id),
    getProfile(userId, id),
    getMatchHistory(userId, id),
  ])

  if (!player || !profile) notFound()

  return (
    <PlayerProfileView
      playerId={id}
      playerName={player.name}
      profile={{
        raumStatus: profile.raumStatus as 'stabil' | 'instabil' | 'unknown',
        raumSublever: profile.raumSublever,
        hoeheStatus: profile.hoeheStatus as 'stabil' | 'instabil' | 'unknown',
        hoeheSublever: profile.hoeheSublever,
        mentalStatus: profile.mentalStatus as 'stabil' | 'instabil' | 'unknown',
        mentalPattern: profile.mentalPattern,
        aiSummary: profile.aiSummary,
        aiSummaryGeneratedAt: profile.aiSummaryGeneratedAt,
      }}
      matchHistory={history.map((m) => ({
        id: m.id,
        date: m.date,
        result: m.result,
        score: m.score,
      }))}
    />
  )
}
