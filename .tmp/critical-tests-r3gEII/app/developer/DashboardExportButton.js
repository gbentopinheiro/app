'use client'

import {
  fetchDeveloperDashboardExport,
  getDeveloperDashboardExportUrl,
  readDownloadFilename,
} from '../../frontend/controllers/developer-controller.js'

export default function DashboardExportButton({ children, className = '', style = {} }) {
  const href = getDeveloperDashboardExportUrl()

  async function handleClick(event) {
    event.preventDefault()

    try {
      const response = await fetchDeveloperDashboardExport()

      if (!response.ok) {
        window.location.assign(href)
        return
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = readDownloadFilename(response, 'developer-dashboard.pdf')
      document.body.appendChild(anchor)
      anchor.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(anchor)
    } catch (error) {
      window.location.assign(href)
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  )
}
