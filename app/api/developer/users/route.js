import { getDeveloperUsersController } from '../../../../server/controllers/developer-users-controller.js'
import { toNextErrorResponse, toNextResponse } from '../../../../server/responses/route-response.js'

export async function GET() {
  try {
    return toNextResponse(await getDeveloperUsersController())
  } catch (error) {
    console.error('Error fetching users:', error.message)
    return toNextErrorResponse(error, 'Erro ao obter utilizadores.')
  }
}
