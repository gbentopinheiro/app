export function getNextWorkNumber(works = []) {
  const highestNumber = (Array.isArray(works) ? works : [])
    .map(work => Number.parseInt(work?.number, 10))
    .filter(number => Number.isInteger(number) && number > 0)
    .reduce((currentHighest, number) => Math.max(currentHighest, number), 0)

  return highestNumber + 1
}
