import { NextResponse } from 'next/server'
import { getLoginTransportPublicKey } from '../../../../lib/login-transport.js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const response = NextResponse.json({ publicKey: getLoginTransportPublicKey() })
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Protecao de login nao configurada.' }, { status: 503 })
  }
}
