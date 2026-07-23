import { apiFetch, apiFetchJson, resolveApiUrl } from '../api/api-client.js'

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item))
        }
      })
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function jsonRequest(path, options) {
  return apiFetchJson(path, options)
}

export function getDeveloperDashboardExportUrl() {
  return resolveApiUrl('/api/developer/dashboard-export')
}

export function readDownloadFilename(response, fallbackFilename) {
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

export function fetchDeveloperAccessProfiles(options) {
  return jsonRequest('/api/developer/access-profiles', options)
}

export function fetchDeveloperPermissions(options) {
  return jsonRequest('/api/developer/permissions', options)
}

export function fetchDeveloperAccessProfile(profileId, options) {
  return jsonRequest(`/api/developer/access-profiles/${profileId}`, options)
}

export function updateDeveloperAccessProfilePermissions(profileId, payload) {
  return jsonRequest(`/api/developer/access-profiles/${profileId}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchDeveloperFeatureFlagsUpdate(payload) {
  return jsonRequest('/api/developer/feature-flags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchDeveloperDataIntegrity(options) {
  return jsonRequest('/api/developer/data-integrity', options)
}

export function runDeveloperDataIntegrityFix(payload) {
  return jsonRequest('/api/developer/data-integrity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchDeveloperDataManagementStats(options) {
  return jsonRequest('/api/developer/data-management?action=stats', options)
}

export function fetchDeveloperDataManagementExport(type, options) {
  return apiFetch(`/api/developer/data-management?action=export&type=${encodeURIComponent(type)}`, options)
}

export function fetchDeveloperSystemDiagnostics(options) {
  return jsonRequest('/api/developer/system-diagnostics', options)
}

export function fetchDeveloperUsers(options) {
  return jsonRequest('/api/developer/users', options)
}

export function fetchDeveloperUser(userId, options) {
  return jsonRequest(`/api/developer/users/${userId}`, options)
}

export function updateDeveloperUser(userId, payload) {
  return jsonRequest(`/api/developer/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function resetDeveloperUserPassword(payload) {
  return jsonRequest('/api/developer/users/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchDeveloperAuditTrail(params = {}, options) {
  return jsonRequest(`/api/developer/audit-trail${buildQueryString(params)}`, options)
}

export function fetchDeveloperDailyPlanOverrideWorkAssignment(assignmentId, options) {
  return jsonRequest(`/api/developer/daily-plan-overrides/work-assignments/${assignmentId}`, options)
}

export function updateDeveloperDailyPlanOverrideWorkAssignment(assignmentId, payload) {
  return jsonRequest(`/api/developer/daily-plan-overrides/work-assignments/${assignmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteDeveloperDailyPlanOverrideWorkAssignment(assignmentId, payload) {
  return jsonRequest(`/api/developer/daily-plan-overrides/work-assignments/${assignmentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchDeveloperTestData(params = {}, options) {
  return jsonRequest(`/api/developer/test-data${buildQueryString(params)}`, options)
}

export function fetchDeveloperDashboardExport(options) {
  return apiFetch('/api/developer/dashboard-export', options)
}
