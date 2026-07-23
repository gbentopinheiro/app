import { apiFetch } from '../api/api-client.js'

function readDownloadFilename(response, fallbackFilename) {
  const contentDisposition = response.headers.get('content-disposition') || ''
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return filenameMatch?.[1] || fallbackFilename
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json()
    return data?.error || fallbackMessage
  } catch {
    return fallbackMessage
  }
}

export async function exportClientWorkSummary(clientId, payload) {
  const response = await apiFetch(`/api/clients/${clientId}/summary-export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Erro ao exportar o resumo selecionado.'))
  }

  return {
    blob: await response.blob(),
    filename: readDownloadFilename(response, 'resumo.xlsx'),
    contentType: response.headers.get('content-type') || '',
  }
}

export function triggerDownload(blob, filename) {
  const downloadUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(downloadUrl)
}
