import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPlayersForList } from '@/lib/db/queries/players'
import { initUser } from '@/app/(app)/actions'
import { PlayerList } from '@/components/players/player-list'
import { GdprNotice } from '@/components/players/gdpr-notice'

export default async function SpielersitePage(): Promise<React.JSX.Element> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { showGdpr } = await initUser()
  const players = await getPlayersForList(userId)

  return (
    <>
      {showGdpr && <GdprNotice />}
      <PlayerList players={players} />
    </>
  )
}
