import { NextResponse } from 'next/server'
import { getAllAccessIdentities } from '../../../../lib/access-identities.js'
import { getAllAdmins } from '../../../../lib/admins.js'
import { getAllDevelopers } from '../../../../lib/developers.js'
import { getAllLoginEvents } from '../../../../lib/login-audit.js'
import { isDeveloperRole } from '../../../../lib/roles.js'
import { getServerSession } from '../../../../lib/server-session.js'

function getLastLoginForUser(username, loginEvents) {
  const events = loginEvents
    .filter(event => event.username.toLowerCase() === username.toLowerCase())
    .sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime())

  return events[0]?.loginAt || null
}

function enrichUserWithLoginInfo(user, type, loginEvents) {
  return {
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    type,
    role: user.role || (type === 'admin' ? 'admin' : type === 'developer' ? 'developer' : user.role),
    lastLoginAt: getLastLoginForUser(user.username, loginEvents),
    createdAt: null,
  }
}

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Sessao obrigatoria.' }, { status: 401 })
    }

    if (!isDeveloperRole(session.role)) {
      return NextResponse.json({ error: 'Apenas o programador pode aceder a esta informacao.' }, { status: 403 })
    }

    const admins = getAllAdmins()
    const developers = getAllDevelopers()
    const identities = getAllAccessIdentities()
    const loginEvents = getAllLoginEvents()

    const users = [
      ...admins.map(admin => enrichUserWithLoginInfo(admin, 'admin', loginEvents)),
      ...developers.map(dev => enrichUserWithLoginInfo(dev, 'developer', loginEvents)),
      ...identities.map(identity => enrichUserWithLoginInfo(identity, 'operational', loginEvents)),
    ]

    return NextResponse.json({
      users: users.sort((a, b) => {
        const aLogin = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
        const bLogin = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
        return bLogin - aLogin
      }),
      summary: {
        total: users.length,
        admins: admins.length,
        developers: developers.length,
        operational: identities.length,
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error.message)
    return NextResponse.json({ error: 'Erro ao obter utilizadores.' }, { status: 500 })
  }
}
