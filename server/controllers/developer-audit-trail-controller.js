import { hasPermission } from '../../lib/permissions.js'
import { getCurrentSessionService } from '../services/session-service.js'
import {
  createDeveloperAuditTrailEventService,
  getDeveloperAuditTrailFiltersService,
  getDeveloperAuditTrailOverviewService,
} from '../services/developer-audit-trail-service.js'

export async function getDeveloperAuditTrailController(request) {
  try {
    const session = await getCurrentSessionService()

    if (!session || !hasPermission(session, 'developer.audit.read')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 },
      )
    }

    const filters = getDeveloperAuditTrailFiltersService(request)
    return Response.json(await getDeveloperAuditTrailOverviewService(filters))
  } catch (error) {
    console.error('Audit trail error:', error)
    return Response.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 },
    )
  }
}

export async function postDeveloperAuditTrailController(request) {
  try {
    const session = await getCurrentSessionService()

    if (!session || !hasPermission(session, 'developer.audit.write')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 },
      )
    }

    const event = await request.json()
    return Response.json(await createDeveloperAuditTrailEventService(event, session.username))
  } catch (error) {
    console.error('Failed to log audit event:', error)
    return Response.json(
      { error: 'Failed to log event' },
      { status: 500 },
    )
  }
}
