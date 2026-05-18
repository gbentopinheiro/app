import { NextResponse } from 'next/server'
import { getAdminByUsername } from '../../../../lib/admins.js'
import { getAccessIdentityByUsername } from '../../../../lib/access-identities.js'
import { createSessionToken, getDefaultPathForRole, getSessionCookieOptions, SESSION_COOKIE_NAME } from '../../../../lib/auth.js'
import { canRoleSignIn } from '../../../../lib/roles.js'

function buildAdminSession(admin) {
  return {
    userId: admin.id,
    personId: 0,
    username: admin.username,
    name: admin.name || admin.username,
    role: 'admin',
    workIds: [],
  }
}

function buildAccessIdentitySession(identity) {
  return {
    userId: identity.id,
    personId: identity.person?.id || identity.personId || 0,
    username: identity.username,
    name: identity.person?.name || identity.username,
    role: identity.person?.role || identity.role,
    workIds: Array.isArray(identity.works) ? identity.works.map(work => work.id) : [],
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const username = String(body.username || '').trim()
    const password = String(body.password || '').trim()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username e password são obrigatórios.' }, { status: 400 })
    }

    const accessIdentity = getAccessIdentityByUsername(username)
    const admin = accessIdentity ? null : getAdminByUsername(username)
    const user = accessIdentity || admin

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    if (
      accessIdentity?.personId &&
      (!accessIdentity.person || accessIdentity.person.missing || accessIdentity.person.role !== accessIdentity.role)
    ) {
      return NextResponse.json(
        { error: 'O acesso desta pessoa não está corretamente ligado ao role configurado.' },
        { status: 403 },
      )
    }

    if (accessIdentity && !canRoleSignIn(accessIdentity.role)) {
      return NextResponse.json(
        { error: 'Este perfil ainda não tem acesso à aplicação.' },
        { status: 403 },
      )
    }

    const session = admin ? buildAdminSession(admin) : buildAccessIdentitySession(accessIdentity)
    const token = await createSessionToken(session)
    const response = NextResponse.json({
      role: session.role,
      username: session.username,
      name: session.name,
      redirectTo: getDefaultPathForRole(session.role),
    })

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao iniciar sessão.' }, { status: 500 })
  }
}
