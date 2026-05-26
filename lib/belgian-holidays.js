function formatDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function getEasterDate(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31)
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, easterMonth - 1, easterDay)
}

export function getBelgianHolidays(year) {
  const easter = getEasterDate(year)
  const easterMonday = addDays(easter, 1)
  const ascensionDay = addDays(easter, 39)
  const whitMonday = addDays(easter, 50)

  return {
    [formatDateKey(year, 1, 1)]: 'Ano Novo',
    [formatDateKey(easterMonday.getFullYear(), easterMonday.getMonth() + 1, easterMonday.getDate())]: 'Segunda-feira de Páscoa',
    [formatDateKey(year, 5, 1)]: 'Dia do Trabalhador',
    [formatDateKey(ascensionDay.getFullYear(), ascensionDay.getMonth() + 1, ascensionDay.getDate())]: 'Ascensão',
    [formatDateKey(whitMonday.getFullYear(), whitMonday.getMonth() + 1, whitMonday.getDate())]: 'Segunda-feira de Pentecostes',
    [formatDateKey(year, 7, 21)]: 'Dia Nacional da Bélgica',
    [formatDateKey(year, 8, 15)]: 'Assunção de Nossa Senhora',
    [formatDateKey(year, 11, 1)]: 'Todos os Santos',
    [formatDateKey(year, 11, 11)]: 'Armistício',
    [formatDateKey(year, 12, 25)]: 'Natal',
  }
}
