import { generateTestData, generateTestScenarios } from '../../lib/test-data-generator.js'

export function getDeveloperTestDataRequestService(request) {
  const { searchParams } = new URL(request.url)

  return {
    scenario: searchParams.get('scenario'),
    count: parseInt(searchParams.get('count') || '10'),
  }
}

export function getDeveloperTestDataResponseService({ scenario, count }) {
  if (scenario === 'small' || scenario === 'medium' || scenario === 'large') {
    const scenarios = generateTestScenarios()

    return {
      scenario,
      data: scenarios[scenario],
    }
  }

  return {
    scenario: 'custom',
    count,
    data: generateTestData(count),
  }
}
