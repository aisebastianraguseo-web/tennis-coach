// Feature: player profile AI summary
// Implemented by: feature-agent (Phase 4)
// Spec reference: Section 3 — Feature: player-profile, Section 5 — API Surface

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
