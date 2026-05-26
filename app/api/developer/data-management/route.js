import { getServerSession } from '../../../../lib/server-session.js'
import { isDeveloperRole } from '../../../../lib/roles.js'
import { getDataStats, exportData } from '../../../../lib/data-management.js'

export async function GET(req) {
  try {
    const session = await getServerSession()

    if (!session || !isDeveloperRole(session.role)) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      const stats = await getDataStats()
      return Response.json(stats)
    }

    if (action === 'export') {
      const exportType = searchParams.get('type') || 'full'
      const exportedData = await exportData(exportType)
      
      const filename = `backup-${exportType}-${new Date().toISOString().split('T')[0]}.json`

      return new Response(JSON.stringify(exportedData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Data management error:', error)
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
