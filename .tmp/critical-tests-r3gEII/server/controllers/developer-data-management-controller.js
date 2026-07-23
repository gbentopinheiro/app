import { hasAnyPermission, hasPermission } from '../../lib/permissions.js'
import { getCurrentSessionService } from '../services/session-service.js'
import {
  getDeveloperDataManagementActionService,
  getDeveloperDataManagementExportService,
  getDeveloperDataManagementExportTypeService,
  getDeveloperDataManagementStatsService,
} from '../services/developer-data-management-service.js'

export async function getDeveloperDataManagementController(request) {
  try {
    const session = await getCurrentSessionService()

    if (!session) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 },
      )
    }

    const action = getDeveloperDataManagementActionService(request)

    if (action === 'stats') {
      if (!hasPermission(session, 'developer.data_management.read')) {
        return Response.json(
          { error: 'Unauthorized' },
          { status: 403 },
        )
      }

      return Response.json(await getDeveloperDataManagementStatsService())
    }

    if (action === 'export') {
      if (!hasPermission(session, 'developer.data_management.export')) {
        return Response.json(
          { error: 'Unauthorized' },
          { status: 403 },
        )
      }

      const exportType = getDeveloperDataManagementExportTypeService(request)
      const { exportedData, filename } = await getDeveloperDataManagementExportService(exportType)

      return new Response(JSON.stringify(exportedData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    if (!hasAnyPermission(session, ['developer.data_management.read', 'developer.data_management.export'])) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 },
      )
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Data management error:', error)
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 },
    )
  }
}
