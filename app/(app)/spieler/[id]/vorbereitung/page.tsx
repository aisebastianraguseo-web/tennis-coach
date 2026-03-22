import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getPlayerById } from '@/lib/db/queries/players'
import { getProfile } from '@/lib/db/queries/profiles'
import { getGoals } from '@/lib/db/queries/goals'
import { PreMatchView } from '@/components/match/pre-match-view'
import type { GoalCategory } from '@/types/domain'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VorbereitungPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const [player, profile, goals] = await Promise.all([
    getPlayerById(userId, id),
    getProfile(userId, id),
    getGoals(userId),
  ])

  if (!player || !profile) notFound()

  return (
    <PreMatchView
      playerId={id}
      playerName={player.name}
      profile={{
        raumStatus: profile.raumStatus,
        hoeheStatus: profile.hoeheStatus,
        mentalStatus: profile.mentalStatus,
        aiSummary: profile.aiSummary,
      }}
      goals={goals.map((g) => ({
        id: g.id,
        text: g.text,
        shortLabel: g.shortLabel,
        category: g.category as GoalCategory,
      }))}
    />
  )
}
