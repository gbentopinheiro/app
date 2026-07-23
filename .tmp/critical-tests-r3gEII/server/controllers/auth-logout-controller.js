import { NextResponse } from 'next/server'
import { logoutService } from '../services/auth-logout-service.js'

export async function postAuthLogoutController() {
  const result = logoutService()
  const response = NextResponse.json(result.body)

  response.cookies.set(result.cookieName, result.cookieValue, result.cookieOptions)
  return response
}
