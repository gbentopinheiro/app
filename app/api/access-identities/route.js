import { NextResponse } from 'next/server'
import { getAllAccessIdentities, getAccessIdentityWorkOptions } from '../../../lib/access-identities.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeWorks = searchParams.get('includeWorks') === 'true'

    if (includeWorks) {
      return NextResponse.json({
        items: getAllAccessIdentities(),
        works: getAccessIdentityWorkOptions(),
      })
    }

    return NextResponse.json(getAllAccessIdentities())
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter acessos' }, { status: 500 })
  }
}
