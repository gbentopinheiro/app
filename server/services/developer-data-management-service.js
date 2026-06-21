import { exportData, getDataStats } from '../../lib/data-management.js'

export function getDeveloperDataManagementActionService(request) {
  return new URL(request.url).searchParams.get('action')
}

export function getDeveloperDataManagementExportTypeService(request) {
  return new URL(request.url).searchParams.get('type') || 'full'
}

export async function getDeveloperDataManagementStatsService() {
  return getDataStats()
}

// This export route remains legacy by design because it snapshots the existing JSON backup surface.
export async function getDeveloperDataManagementExportService(exportType) {
  return {
    exportedData: await exportData(exportType),
    filename: `backup-${exportType}-${new Date().toISOString().split('T')[0]}.json`,
  }
}
