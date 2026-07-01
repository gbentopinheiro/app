const fallbackBuildVersion = `${Date.now()}`

const versionCandidate = [
  process.env.NEXT_PUBLIC_PWA_VERSION,
  process.env.GITHUB_SHA,
  process.env.VERCEL_GIT_COMMIT_SHA,
  process.env.SOURCE_VERSION,
  fallbackBuildVersion,
]
  .map(value => String(value || '').trim())
  .find(Boolean)

export const PWA_BUILD_VERSION = versionCandidate

export function appendBuildVersion(pathname, version = PWA_BUILD_VERSION) {
  const url = new URL(String(pathname || '/'), 'https://bentix.local')
  url.searchParams.set('v', String(version || PWA_BUILD_VERSION).trim() || fallbackBuildVersion)
  return `${url.pathname}${url.search}${url.hash}`
}
