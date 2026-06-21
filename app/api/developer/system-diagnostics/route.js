import { getDeveloperSystemDiagnosticsController } from '../../../../server/controllers/developer-system-diagnostics-controller.js'

export async function GET() {
  return getDeveloperSystemDiagnosticsController()
}
