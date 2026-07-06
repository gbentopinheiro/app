import {
  getWorkExtraAccessSelectionsController,
  replaceWorkExtraAccessSelectionsController,
} from '../../../server/controllers/work-extra-access-grants-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../server/responses/route-response.js'

export async function GET(request) {
  try {
    return toNextResponse(await getWorkExtraAccessSelectionsController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao obter acessos extra as obras')
  }
}

export async function PUT(request) {
  try {
    return toNextResponse(await replaceWorkExtraAccessSelectionsController(request))
  } catch (error) {
    return toNextErrorResponse(error, 'Erro ao guardar acessos extra as obras')
  }
}
