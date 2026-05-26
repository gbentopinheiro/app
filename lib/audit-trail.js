import fs from 'fs/promises'
import path from 'path'

const AUDIT_LOG_FILE = path.join(process.cwd(), 'data', '.audit-trail.json')

export async function logAuditEvent(event) {
  try {
    const logs = await getAllAuditLogs()
    
    const auditEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      username: event.username || 'system',
      action: event.action, // 'create', 'update', 'delete', 'login', 'logout', 'login_failed'
      entity: event.entity, // 'user', 'work', 'person', 'etc'
      entityId: event.entityId || null,
      details: event.details || {},
      result: event.result || 'success', // 'success' or 'failure'
      errorMessage: event.errorMessage || null,
    }
    
    logs.push(auditEntry)
    
    // Keep only last 10000 events
    const recentLogs = logs.slice(-10000)
    
    await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify(recentLogs, null, 2), 'utf8')
    return auditEntry
  } catch (error) {
    console.error('Failed to log audit event:', error)
    throw error
  }
}

export async function getAllAuditLogs() {
  try {
    const data = await fs.readFile(AUDIT_LOG_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

export async function getAuditLogs(filters = {}) {
  const logs = await getAllAuditLogs()
  
  let filtered = logs
  
  // Filter by username
  if (filters.username) {
    filtered = filtered.filter(log => 
      log.username.toLowerCase().includes(filters.username.toLowerCase())
    )
  }
  
  // Filter by action
  if (filters.action) {
    filtered = filtered.filter(log => log.action === filters.action)
  }
  
  // Filter by entity
  if (filters.entity) {
    filtered = filtered.filter(log => log.entity === filters.entity)
  }
  
  // Filter by date range
  if (filters.startDate) {
    const start = new Date(filters.startDate)
    filtered = filtered.filter(log => new Date(log.timestamp) >= start)
  }
  
  if (filters.endDate) {
    const end = new Date(filters.endDate)
    end.setHours(23, 59, 59, 999)
    filtered = filtered.filter(log => new Date(log.timestamp) <= end)
  }
  
  // Filter by result
  if (filters.result) {
    filtered = filtered.filter(log => log.result === filters.result)
  }
  
  // Sort by timestamp descending (most recent first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  
  return filtered
}

export async function getAuditStats() {
  const logs = await getAllAuditLogs()
  
  const stats = {
    totalEvents: logs.length,
    byAction: {},
    byEntity: {},
    byUsername: {},
    successRate: 0,
    recentErrors: [],
  }
  
  let successCount = 0
  
  logs.forEach(log => {
    // Count by action
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
    
    // Count by entity
    stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1
    
    // Count by username
    stats.byUsername[log.username] = (stats.byUsername[log.username] || 0) + 1
    
    // Count successes
    if (log.result === 'success') {
      successCount++
    }
  })
  
  // Get recent errors
  stats.recentErrors = logs
    .filter(log => log.result === 'failure')
    .slice(-5)
    .reverse()
  
  stats.successRate = logs.length > 0 
    ? Math.round((successCount / logs.length) * 100)
    : 100
  
  return stats
}
