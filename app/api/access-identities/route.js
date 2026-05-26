import { NextResponse } from 'next/server'
import { getAllAccessIdentities, getAccessIdentityWorkOptions } from '../../../lib/access-identities.js'

function hidePassword(identity) {
  const { password, ...safeIdentity } = identity
  return safeIdentity
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeWorks = searchParams.get('includeWorks') === 'true'

    if (includeWorks) {
      return NextResponse.json({
        items: getAllAccessIdentities().map(hidePassword),
        works: getAccessIdentityWorkOptions(),
      })
    }

    return NextResponse.json(getAllAccessIdentities().map(hidePassword))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter acessos' }, { status: 500 })
  }
}
