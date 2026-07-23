import { getDeveloperDashboardData } from '../../lib/developer-dashboard.js'
import { buildDeveloperDashboardPdf } from '../../lib/developer-dashboard-export.js'

function getSafeDateLabel() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

export async function getDeveloperDashboardExportService(developerName) {
  const dashboard = await getDeveloperDashboardData()
  const exportedAt = new Date().toISOString()

  return {
    pdf: buildDeveloperDashboardPdf({
      dashboard,
      developerName,
      exportedAt,
    }),
    filename: `developer-recente-${getSafeDateLabel()}.pdf`,
  }
}
