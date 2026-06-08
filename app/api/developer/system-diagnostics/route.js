import { getServerSession } from '../../../../lib/server-session.js'
import { hasPermission } from '../../../../lib/permissions.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DIAGNOSTICS_LOG = path.join(process.cwd(), 'data', '.diagnostics-log.json')

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session || !hasPermission(session, 'developer.diagnostics.read')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      memory: getMemoryMetrics(),
      fileIO: await testFileIOHealth(),
      recentErrors: await getRecentErrors(),
      processorHealth: getProcessorHealth(),
      dataFileStatus: await checkDataFilesStatus(),
    }

    return Response.json(diagnostics)
  } catch (error) {
    logError(error)
    return Response.json(
      { error: 'Failed to collect diagnostics' },
      { status: 500 }
    )
  }
}

function getMemoryMetrics() {
  const mem = process.memoryUsage()
  const totalMemMB = Math.round(mem.heapTotal / 1024 / 1024)
  const usedMemMB = Math.round(mem.heapUsed / 1024 / 1024)
  const externalMemMB = Math.round(mem.external / 1024 / 1024)
  const percentageUsed = Math.round((mem.heapUsed / mem.heapTotal) * 100)

  return {
    status: percentageUsed > 90 ? 'critical' : percentageUsed > 75 ? 'warning' : 'healthy',
    heapUsedMB: usedMemMB,
    heapTotalMB: totalMemMB,
    heapPercentage: percentageUsed,
    externalMemMB: externalMemMB,
    rssMemMB: Math.round(mem.rss / 1024 / 1024),
  }
}

async function testFileIOHealth() {
  const testFile = path.join(process.cwd(), 'data', '.io-test')
  const startTime = Date.now()
  
  try {
    // Test write
    await fs.writeFile(testFile, 'test', 'utf8')
    const writeTime = Date.now() - startTime
    
    // Test read
    const readStart = Date.now()
    await fs.readFile(testFile, 'utf8')
    const readTime = Date.now() - readStart
    
    // Cleanup
    await fs.unlink(testFile).catch(() => {})
    
    const avgTime = Math.round((writeTime + readTime) / 2)
    
    return {
      status: avgTime > 100 ? 'slow' : 'healthy',
      writeTimeMs: writeTime,
      readTimeMs: readTime,
      averageTimeMs: avgTime,
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    }
  }
}

async function getRecentErrors() {
  try {
    const data = await fs.readFile(DIAGNOSTICS_LOG, 'utf8')
    const logs = JSON.parse(data)
    
    // Get last 10 errors
    const recent = logs.slice(-10).reverse()
    
    return {
      totalErrorsLogged: logs.length,
      recentCount: recent.length,
      errors: recent.map(err => ({
        timestamp: err.timestamp,
        message: err.message,
        endpoint: err.endpoint,
      })),
    }
  } catch (error) {
    // No errors logged yet
    return {
      totalErrorsLogged: 0,
      recentCount: 0,
      errors: [],
    }
  }
}

function getProcessorHealth() {
  const uptime = process.uptime()
  const upDays = Math.floor(uptime / 86400)
  const upHours = Math.floor((uptime % 86400) / 3600)
  const upMinutes = Math.floor((uptime % 3600) / 60)
  
  return {
    uptimeSeconds: Math.round(uptime),
    uptimeFormatted: `${upDays}d ${upHours}h ${upMinutes}m`,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    cpuUsage: process.cpuUsage(),
  }
}

async function checkDataFilesStatus() {
  const dataDir = path.join(process.cwd(), 'data')
  const files = [
    'people.json',
    'works.json',
    'clients.json',
    'work-assignments.json',
    'daily-work-notes.json',
    'admins.json',
    'developers.json',
  ]
  
  const status = {}
  
  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file)
      const stats = await fs.stat(filePath)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      const ageMinutes = Math.floor((Date.now() - stats.mtimeMs) / 60000)
      
      status[file] = {
        exists: true,
        sizeKB: Math.round(stats.size / 1024),
        sizeMB: parseFloat(sizeMB),
        lastModifiedMinutesAgo: ageMinutes,
        lastModified: new Date(stats.mtimeMs).toISOString(),
      }
    } catch (error) {
      status[file] = {
        exists: false,
        error: error.message,
      }
    }
  }
  
  return status
}

async function logError(error, endpoint = 'system-diagnostics') {
  try {
    const logs = []
    
    try {
      const data = await fs.readFile(DIAGNOSTICS_LOG, 'utf8')
      logs.push(...JSON.parse(data))
    } catch (e) {
      // File doesn't exist yet
    }
    
    logs.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      endpoint: endpoint,
      stack: error.stack,
    })
    
    // Keep only last 100 errors
    const recentLogs = logs.slice(-100)
    
    await fs.writeFile(DIAGNOSTICS_LOG, JSON.stringify(recentLogs, null, 2), 'utf8')
  } catch (e) {
    // Silently fail logging
    console.error('Failed to log error:', e)
  }
}
