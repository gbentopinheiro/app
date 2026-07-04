function withFallbackSuffix(baseLabel, fallbackId) {
  if (fallbackId === undefined || fallbackId === null || fallbackId === '') {
    return baseLabel
  }

  return `${baseLabel} ${fallbackId}`
}

// UI labels are centralized here so future aliases or smarter display rules
// can be introduced without changing page-level planning layouts.
export function getPersonDisplayName(person, fallbackId) {
  return person?.name || withFallbackSuffix('Pessoa', fallbackId)
}

export function getWorkDisplayName(work, fallbackId) {
  return work?.name || withFallbackSuffix('Obra', fallbackId)
}

export function getWorkDisplayReference(work, fallbackId) {
  const name = getWorkDisplayName(work, fallbackId)

  if (work?.number === undefined || work?.number === null || work?.number === '') {
    return name
  }

  return `#${work.number} - ${name}`
}
