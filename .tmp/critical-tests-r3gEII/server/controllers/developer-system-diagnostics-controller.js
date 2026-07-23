import { hasPermission } from '../../lib/permissions.js'
import { getCurrentSessionService } from '../services/session-service.js'
import { getDeveloperSystemDiagnosticsService } from '../services/developer-system-diagnostics-service.js'

export async function getDeveloperSystemDiagnosticsController() {
  try {
    const session = await getCurrentSessionService()

    if (!session || !hasPermission(session, 'developer.diagnostics.read')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 },
      )
    }

    return Response.json(await getDeveloperSystemDiagnosticsService())
  } catch (error) {
    return Response.json(
      { error: 'Failed to collect diagnostics' },
      { status: 500 },
    )
  }
}
