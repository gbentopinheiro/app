import { SESSION_COOKIE_NAME } from '../../lib/auth.js'

export function logoutService() {
  return {
    body: { success: true },
    cookieName: SESSION_COOKIE_NAME,
    cookieValue: '',
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0),
    },
  }
}
