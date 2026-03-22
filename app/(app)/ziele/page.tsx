import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getGoals } from '@/lib/db/queries/goals'
import { GoalLibraryView } from '@/components/goals/goal-library-view'
import type { GoalCategory } from '@/types/domain'

export default async function ZielePage(): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const goals = await getGoals(userId, true)

  return (
    <GoalLibraryView
      goals={goals.map((g) => ({
        id: g.id,
        text: g.text,
        shortLabel: g.shortLabel,
        category: g.category as GoalCategory,
        isArchived: g.isArchived,
        isPredefined: g.isPredefined,
      }))}
    />
  )
}
