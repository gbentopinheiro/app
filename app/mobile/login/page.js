import { redirect } from 'next/navigation'
import { canManageEntireApp, getDefaultPathForRole } from '../../../lib/auth.js'
import { isChefRole } from '../../../lib/roles.js'
import { getSafeRedirectPath } from '../../../lib/safe-redirect.js'
import { getServerSession } from '../../../lib/server-session.js'
import MobileLoginClient from './MobileLoginClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Login Mobile',
}

export default async function MobileLoginPage({ searchParams }) {
  const session = await getServerSession()
  const resolvedSearchParams = (await searchParams) || {}
  const redirectTo = getSafeRedirectPath(resolvedSearchParams.redirectTo)

  if (session) {
    if (redirectTo) {
      redirect(redirectTo)
    }

    if (canManageEntireApp(session.role) || isChefRole(session.role)) {
      redirect('/mobile/chef')
    }

    redirect(getDefaultPathForRole(session.role))
  }

  return <MobileLoginClient initialRedirectTo={redirectTo} />
}
