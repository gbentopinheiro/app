import { exportGlobalActivityHistoryController } from '../../../../server/controllers/activity-history-controller.js'

export async function GET(request) {
  return exportGlobalActivityHistoryController(request)
}
