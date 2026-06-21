import { getPersonActivityHistoryController } from '../../../../../server/controllers/activity-history-controller.js'

export async function GET(request, { params }) {
  const { id } = await params
  return getPersonActivityHistoryController(request, id)
}
