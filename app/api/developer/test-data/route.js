import { getServerSession } from '../../../../lib/server-session.js'
import { isDeveloperRole } from '../../../../lib/roles.js'
import { generateTestData, generateTestScenarios } from '../../../../lib/test-data-generator.js'

export async function GET(req) {
  try {
    const session = await getServerSession()

    if (!session || !isDeveloperRole(session.role)) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const scenario = searchParams.get('scenario')
    const count = parseInt(searchParams.get('count') || '10')

    if (scenario === 'small' || scenario === 'medium' || scenario === 'large') {
      const scenarios = generateTestScenarios()
      return Response.json({
        scenario,
        data: scenarios[scenario],
      })
    }

    // Custom count
    const testData = generateTestData(count)
    return Response.json({
      scenario: 'custom',
      count,
      data: testData,
    })
  } catch (error) {
    console.error('Test data generation error:', error)
    return Response.json(
      { error: 'Failed to generate test data' },
      { status: 500 }
    )
  }
}
