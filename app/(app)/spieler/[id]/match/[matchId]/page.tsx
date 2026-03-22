import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getMatchById, getGoalsForMatch } from '@/lib/db/queries/matches'
import { getPlayerById } from '@/lib/db/queries/players'
import { MatchView } from '@/components/match/match-view'

interface PageProps {
  params: Promise<{ id: string; matchId: string }>
}

export default async function MatchPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id, matchId } = await params
  const [match, player] = await Promise.all([
    getMatchById(userId, matchId),
    getPlayerById(userId, id),
  ])

  if (!match || !player) notFound()

  const selectedGoals = await getGoalsForMatch(userId, match.selectedGoalIds)

  return (
    <MatchView
      matchId={matchId}
      playerId={id}
      playerName={player.name}
      selectedGoals={selectedGoals.map((g) => ({ id: g.id, text: g.text }))}
      aiBriefing={match.aiBriefing}
    />
  )
}
