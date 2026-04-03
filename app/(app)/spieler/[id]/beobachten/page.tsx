import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getPlayerById } from '@/lib/db/queries/players'
import { getPlayersForList } from '@/lib/db/queries/players'
import { startObserve } from './actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BeobachtenPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const [player, allPlayers] = await Promise.all([
    getPlayerById(userId, id),
    getPlayersForList(userId),
  ])
  if (!player) notFound()

  const otherPlayers = allPlayers.filter((p) => p.id !== id)

  return (
    <div className="space-y-6">
      <h1 className="text-navy-900 text-xl font-bold">Beobachtung starten</h1>
      <p className="text-sm text-slate-600">
        Beobachte <span className="font-semibold">{player.name}</span> und optional einen zweiten
        Spieler. Die Cluster-Analyse wird pro Spieler getrennt erfasst.
      </p>
      <form
        action={async (formData: FormData) => {
          'use server'
          const observePlayerId = formData.get('observePlayerId') as string | null
          await startObserve({
            playerId: id,
            observePlayerId: observePlayerId ?? undefined,
          })
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Spieler 1 (Hauptgegner)</p>
            <p className="mt-1 text-base font-medium text-slate-900">{player.name}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <label
              htmlFor="observePlayerId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Spieler 2 (optional)
            </label>
            <select
              id="observePlayerId"
              name="observePlayerId"
              defaultValue=""
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">– Keinen zweiten Spieler –</option>
              {otherPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-navy-900 w-full rounded-xl px-4 py-4 text-base font-semibold text-white"
          >
            Beobachtung starten
          </button>
        </div>
      </form>
    </div>
  )
}
