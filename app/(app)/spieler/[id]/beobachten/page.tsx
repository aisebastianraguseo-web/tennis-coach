import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getPlayerById } from '@/lib/db/queries/players'
import { startObserve } from './actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BeobachtenPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const player = await getPlayerById(userId, id)
  if (!player) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-navy-900 text-xl font-bold">Beobachtung starten</h1>
      <p className="text-sm text-slate-600">
        Beobachte <span className="font-semibold">{player.name}</span> und analysiere die 3 Cluster
        live während des Matches.
      </p>
      <form
        action={async () => {
          'use server'
          await startObserve({ playerId: id })
        }}
      >
        <button
          type="submit"
          className="bg-navy-900 w-full rounded-xl px-4 py-4 text-base font-semibold text-white"
        >
          Beobachtung starten
        </button>
      </form>
    </div>
  )
}
