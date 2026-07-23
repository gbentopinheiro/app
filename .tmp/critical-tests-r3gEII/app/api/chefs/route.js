import {
  createLegacyChefController,
  getLegacyChefsController,
} from '../../../server/controllers/chefs-controller.js'

export async function GET(request) {
  return getLegacyChefsController(request)
}

export async function POST(request) {
  return createLegacyChefController(request)
}
