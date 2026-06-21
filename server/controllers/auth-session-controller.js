import { jsonResponse } from '../responses/route-response.js'
import { getAuthSessionPayloadService } from '../services/auth-session-service.js'

export async function getAuthSessionController() {
  const payload = await getAuthSessionPayloadService()

  if (!payload) {
    return jsonResponse({ authenticated: false }, 401)
  }

  return jsonResponse(payload)
}
