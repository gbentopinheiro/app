import { getDeveloperSystemState } from '../../lib/developer-management.js'

export async function getDeveloperSystemDiagnosticsService() {
  return getDeveloperSystemState()
}
