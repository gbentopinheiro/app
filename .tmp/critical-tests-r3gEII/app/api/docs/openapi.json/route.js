import { NextResponse } from 'next/server'
import { openApiPhase1 } from '../../../../server/docs/openapi-phase1.js'

export async function GET() {
  const response = NextResponse.json(openApiPhase1)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
