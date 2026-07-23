import {
  applyDeveloperDataIntegrityFix,
  getDeveloperDataIntegrityReport,
} from '../../lib/developer-management.js'

export async function getDeveloperDataIntegrityReportService() {
  return getDeveloperDataIntegrityReport()
}

export async function applyDeveloperDataIntegrityFixService(issueId, actorUsername) {
  return applyDeveloperDataIntegrityFix(issueId, actorUsername)
}

export function getDeveloperDataIntegrityFixErrorStatusService(error) {
  const message = String(error?.message || 'Erro ao aplicar a correcao de integridade.').trim()

  if (message.includes('ainda nao esta disponivel')) {
    return 409
  }

  if (message.includes('invalida')) {
    return 400
  }

  return 500
}
