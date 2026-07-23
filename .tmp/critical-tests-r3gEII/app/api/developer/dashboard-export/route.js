import { getDeveloperDashboardExportController } from '../../../../server/controllers/developer-dashboard-export-controller.js'

export async function GET() {
  return getDeveloperDashboardExportController()
}
