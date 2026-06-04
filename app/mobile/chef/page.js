import { redirect } from 'next/navigation'
import ChefMobileDailyHoursClient from './ChefMobileDailyHoursClient'
import { canManageEntireApp, getDefaultPathForRole } from '../../../lib/auth.js'
import { buildChefPreviewSession, getChefPreviewIdentity } from '../../../lib/chef-preview.js'
import { isChefRole } from '../../../lib/roles.js'
import { getServerSession } from '../../../lib/server-session.js'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Registo Diário Móvel',
}

export default async function ChefMobileDailyHoursPage({ searchParams }) {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const previewMode = canManageEntireApp(session.role)
  const resolvedSearchParams = (await searchParams) || {}
  const previewIdentity = previewMode
    ? await getChefPreviewIdentity({
        personId: resolvedSearchParams.previewPersonId,
        username: resolvedSearchParams.previewChef,
      })
    : null
  const previewSession = previewIdentity ? buildChefPreviewSession(previewIdentity) : null
  const scopedSession = previewSession || session

  if (!previewMode && !isChefRole(session.role)) {
    redirect(getDefaultPathForRole(session.role))
  }

  return (
    <ChefMobileDailyHoursClient
      initialSession={{
        id: scopedSession.userId,
        personId: scopedSession.personId,
        username: scopedSession.username,
        name: scopedSession.name,
        role: scopedSession.role,
        workIds: scopedSession.workIds,
      }}
      previewMode={previewMode}
    />
  )
}
