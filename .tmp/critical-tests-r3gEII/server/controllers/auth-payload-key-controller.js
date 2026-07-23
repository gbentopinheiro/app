import { NextResponse } from 'next/server'
import { getAuthPayloadKeyService } from '../services/auth-payload-key-service.js'

export async function getAuthPayloadKeyController() {
  try {
    const response = NextResponse.json(getAuthPayloadKeyService())
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Protecao de login nao configurada.' }, { status: 503 })
  }
}
