import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getMatchById, getGoalsForMatch } from '@/lib/db/queries/matches'
import { RetrospectiveView } from '@/components/match/retrospective-view'

interface PageProps {
  params: Promise<{ id: string; matchId: string }>
}

export default async function NachbereitungPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id, matchId } = await params
  const match = await getMatchById(userId, matchId)
  if (!match) notFound()

  const selectedGoals = await getGoalsForMatch(userId, match.selectedGoalIds)

  return (
    <RetrospectiveView
      matchId={matchId}
      playerId={id}
      selectedGoals={selectedGoals.map((g) => ({
        id: g.id,
        text: g.text,
        shortLabel: g.shortLabel,
      }))}
    />
  )
}
