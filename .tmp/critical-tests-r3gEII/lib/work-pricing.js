function normalizePricingValue(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) {
    return fallback
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : fallback
}

function normalizePricingMap(map = {}) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(map)
      .filter(([, value]) => value !== '' && value !== null && value !== undefined)
      .map(([key, value]) => [String(key), normalizePricingValue(value, Number.NaN)])
      .filter(([, value]) => Number.isFinite(value) && value >= 0)
      .sort(([leftKey], [rightKey]) => String(leftKey).localeCompare(String(rightKey), 'pt-PT')),
  )
}

export function buildWorkPricingSnapshot(pricing = {}) {
  return {
    defaultHourlyCost: normalizePricingValue(pricing.defaultHourlyCost, 0),
    roleHourlyCosts: normalizePricingMap(pricing.roleHourlyCosts),
    specialPersonHourlyCosts: normalizePricingMap(pricing.specialPersonHourlyCosts),
  }
}

export function hasWorkPricingChanges(nextPricing, previousPricing) {
  return JSON.stringify(buildWorkPricingSnapshot(nextPricing)) !== JSON.stringify(buildWorkPricingSnapshot(previousPricing))
}

