import { getExpiredSessionCookieOptions, SESSION_COOKIE_NAME } from '../../lib/auth.js'

export function logoutService() {
  return {
    body: { success: true },
    cookieName: SESSION_COOKIE_NAME,
    cookieValue: '',
    cookieOptions: getExpiredSessionCookieOptions(),
  }
}
