import { getServerSession } from '../../../../lib/server-session.js'
import { hasPermission } from '../../../../lib/permissions.js'
import { getAuditLogs, getAuditStats, logAuditEvent } from '../../../../lib/audit-trail.js'

export async function GET(req) {
  try {
    const session = await getServerSession()

    if (!session || !hasPermission(session, 'developer.audit.read')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Parse query parameters for filters
    const { searchParams } = new URL(req.url)
    const filters = {
      username: searchParams.get('username'),
      action: searchParams.get('action'),
      entity: searchParams.get('entity'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      result: searchParams.get('result'),
    }

    // Remove null filters
    Object.keys(filters).forEach(key => 
      filters[key] === null && delete filters[key]
    )

    const logs = await getAuditLogs(filters)
    const stats = await getAuditStats()

    return Response.json({
      logs,
      stats,
      filterCount: Object.keys(filters).length,
    })
  } catch (error) {
    console.error('Audit trail error:', error)
    return Response.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession()

    if (!session || !hasPermission(session, 'developer.audit.write')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const event = await req.json()
    const auditEntry = await logAuditEvent({
      ...event,
      username: session.username,
    })

    return Response.json(auditEntry)
  } catch (error) {
    console.error('Failed to log audit event:', error)
    return Response.json(
      { error: 'Failed to log event' },
      { status: 500 }
    )
  }
}
