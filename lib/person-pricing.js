function normalizePriceValue(value) {
  if (value === '' || value === null || value === undefined) {
    return 0
  }

  const normalizedValue = Number(value)
  return Number.isFinite(normalizedValue) ? normalizedValue : 0
}

export function normalizePersonPricingInput({ price, monthlyPrice } = {}) {
  return {
    price: normalizePriceValue(price),
    monthlyPrice: normalizePriceValue(monthlyPrice),
  }
}
