import Link from 'next/link'
import { redirect } from 'next/navigation'
import NotificationsClient from './NotificationsClient'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { getOperationNotifications } from '../../lib/operation-notifications.js'
import { hasPermission } from '../../lib/permissions.js'
import { isResponsavelRole } from '../../lib/roles.js'
import { getServerSession } from '../../lib/server-session.js'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../components/ViewportLayout.js'

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(22px, 4vw, 42px) 24px 56px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: 'var(--btx-font-family)',
}

const shellStyle = {
  maxWidth: '1120px',
  margin: '0 auto',
  display: 'grid',
  gap: '22px',
}

const heroStyle = {
  borderRadius: '32px',
  padding: '28px',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
}

const backLinkStyle = {
  color: '#ff8c00',
  textDecoration: 'none',
  fontWeight: 800,
}

const titleStyle = {
  margin: '20px 0 0',
  fontSize: 'clamp(38px, 6vw, 58px)',
  lineHeight: 1,
  letterSpacing: '-0.06em',
  fontWeight: 900,
}

export default async function NotificationsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!hasPermission(session, 'notifications.read')) {
    redirect('/')
  }

  if (!(await isFeatureEnabled('notificationsCenter'))) {
    redirect('/')
  }

  const notifications = await getOperationNotifications({
    audience: isResponsavelRole(session.role) ? 'responsavel' : 'admin',
    withYear: true,
  })

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={backLinkStyle}>
            Voltar ao menu
          </Link>
          <h1 style={titleStyle}>Central de notificaÃ§Ãµes</h1>
        </section>

        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '22px' }}>
          <NotificationsClient initialNotifications={notifications} />
        </ViewportScrollArea>
      </ViewportShell>
    </ViewportPage>
  )
}

