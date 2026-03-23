import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getGoalStats, getLeverStats, getMatchSummaries } from '@/lib/db/queries/progress'
import { ProgressView } from '@/components/match/progress-view'

export default async function FortschrittPage(): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [goalStats, leverStats, matchSummaries] = await Promise.all([
    getGoalStats(userId),
    getLeverStats(userId),
    getMatchSummaries(userId),
  ])

  return (
    <ProgressView
      matchSummaries={matchSummaries}
      goalStats={goalStats}
      leverStats={leverStats}
    />
  )
}
