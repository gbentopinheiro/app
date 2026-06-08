import { NextResponse } from 'next/server'
import { getAllLoginEvents } from '../../../../lib/login-audit.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getServerSession } from '../../../../lib/server-session.js'
import { getAllUsersData } from '../../../../lib/users.js'

function getLastLoginForUser(username, loginEvents) {
  const events = loginEvents
    .filter(event => event.username.toLowerCase() === username.toLowerCase())
    .sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime())

  return events[0]?.loginAt || null
}

function enrichUserWithLoginInfo(user, loginEvents) {
  return {
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    type: user.accountType,
    role: user.person?.role || user.role || '',
    lastLoginAt: user.lastLoginAt || getLastLoginForUser(user.username, loginEvents),
    createdAt: null,
    active: user.active !== false,
  }
}

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!hasPermission(session, 'developer.users.read')) {
      return NextResponse.json({ error: 'Apenas o programador pode aceder a esta informacao.' }, { status: 403 })
    }

    const users = await getAllUsersData()
    const loginEvents = getAllLoginEvents()
    const enrichedUsers = users.map(user => enrichUserWithLoginInfo(user, loginEvents))

    return NextResponse.json({
      users: enrichedUsers.sort((a, b) => {
        const aLogin = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
        const bLogin = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
        return bLogin - aLogin
      }),
      summary: {
        total: enrichedUsers.length,
        admins: enrichedUsers.filter(user => user.type === 'admin').length,
        developers: enrichedUsers.filter(user => user.type === 'developer').length,
        operational: enrichedUsers.filter(user => user.type === 'operational').length,
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error.message)
    return NextResponse.json({ error: 'Erro ao obter utilizadores.' }, { status: 500 })
  }
}
