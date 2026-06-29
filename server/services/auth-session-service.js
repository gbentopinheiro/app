import { getCurrentSessionService } from './session-service.js'

export function buildAuthenticatedSessionPayload(session) {
  return {
    authenticated: true,
    user: {
      id: session.userId,
      personId: session.personId,
      username: session.username,
      name: session.name,
      role: session.role,
      chefCategory: session.chefCategory || null,
      accountType: session.accountType,
      accessProfileId: session.accessProfileId,
      accessProfile: session.accessProfile,
      permissionKeys: session.permissionKeys,
      workIds: session.workIds,
    },
  }
}

export async function getAuthSessionPayloadService() {
  const session = await getCurrentSessionService()

  if (!session) {
    return null
  }

  return buildAuthenticatedSessionPayload(session)
}
