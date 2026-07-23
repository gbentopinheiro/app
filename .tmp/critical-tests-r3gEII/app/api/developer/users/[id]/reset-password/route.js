import { NextResponse } from 'next/server'

// This endpoint has been moved to /api/developer/users/reset-password
export async function POST() {
  return NextResponse.json(
    { error: 'Este endpoint foi movido para /api/developer/users/reset-password' },
    { status: 410 },
  )
}

