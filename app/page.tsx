import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function RootPage(): Promise<never> {
  const { userId } = await auth()

  if (userId) {
    redirect('/spieler')
  } else {
    redirect('/sign-in')
  }
}
