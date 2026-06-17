import { getServerSession } from '../../../../lib/server-session.js'
import { getDeveloperSystemState } from '../../../../lib/developer-management.js'
import { hasPermission } from '../../../../lib/permissions.js'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session || !hasPermission(session, 'developer.diagnostics.read')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return Response.json(await getDeveloperSystemState())
  } catch (error) {
    return Response.json(
      { error: 'Failed to collect diagnostics' },
      { status: 500 }
    )
  }
}
