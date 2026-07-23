import { getAuditLogs, getAuditStats, logAuditEvent } from '../../lib/audit-trail.js'

export function getDeveloperAuditTrailFiltersService(request) {
  const { searchParams } = new URL(request.url)
  const filters = {
    username: searchParams.get('username'),
    action: searchParams.get('action'),
    entity: searchParams.get('entity'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    result: searchParams.get('result'),
  }

  Object.keys(filters).forEach(key => {
    if (filters[key] === null) {
      delete filters[key]
    }
  })

  return filters
}

export async function getDeveloperAuditTrailOverviewService(filters = {}) {
  const [logs, stats] = await Promise.all([
    getAuditLogs(filters),
    getAuditStats(),
  ])

  return {
    logs,
    stats,
    filterCount: Object.keys(filters).length,
  }
}

export async function createDeveloperAuditTrailEventService(event, username) {
  return logAuditEvent({
    ...event,
    username,
  })
}
