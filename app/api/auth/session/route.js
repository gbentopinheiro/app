import { NextResponse } from 'next/server'
import { getServerSession } from '../../../../lib/server-session.js'

export async function GET() {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      personId: session.personId,
      username: session.username,
      name: session.name,
      role: session.role,
      workIds: session.workIds,
    },
  })
}
