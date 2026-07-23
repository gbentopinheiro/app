import {
  getDeveloperUserController,
  updateDeveloperUserController,
} from '../../../../../server/controllers/developer-users-controller.js'

export async function GET(request, { params }) {
  const { id } = await params
  return getDeveloperUserController(id)
}

export async function PUT(request, { params }) {
  const { id } = await params
  return updateDeveloperUserController(request, id)
}
