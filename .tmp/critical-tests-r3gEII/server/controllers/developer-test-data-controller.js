import { hasPermission } from '../../lib/permissions.js'
import { getCurrentSessionService } from '../services/session-service.js'
import {
  getDeveloperTestDataRequestService,
  getDeveloperTestDataResponseService,
} from '../services/developer-test-data-service.js'

export async function getDeveloperTestDataController(request) {
  try {
    const session = await getCurrentSessionService()

    if (!session || !hasPermission(session, 'developer.test_data.generate')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 },
      )
    }

    const testDataRequest = getDeveloperTestDataRequestService(request)
    return Response.json(getDeveloperTestDataResponseService(testDataRequest))
  } catch (error) {
    console.error('Test data generation error:', error)
    return Response.json(
      { error: 'Failed to generate test data' },
      { status: 500 },
    )
  }
}
