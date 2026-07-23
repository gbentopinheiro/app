import {
  getPlanningWorkspaceViewController,
  initializePlanningWorkspaceDraftController,
} from '../../../server/controllers/planning-publication-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET(request) {
  try {
    return toNextResponse(await getPlanningWorkspaceViewController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter draft do planeamento')
  }
}

export async function POST(request) {
  try {
    return toNextResponse(await initializePlanningWorkspaceDraftController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao preparar draft do planeamento')
  }
}
