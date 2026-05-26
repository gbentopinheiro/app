import Link from 'next/link'
import { redirect } from 'next/navigation'
import NotificationsClient from './NotificationsClient'
import { canManageEntireApp } from '../../lib/auth.js'
import { getAllDailyWorkNotes } from '../../lib/daily-work-notes.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { getServerSession } from '../../lib/server-session.js'

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(22px, 4vw, 42px) 24px 56px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
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

function formatNotificationDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getNotifications() {
  return getAllDailyWorkNotes()
    .filter(note => note.note)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .map(note => ({
      id: note.id,
      chef: note.authorName || 'Chefe',
      work: note.work?.name || `Obra ${note.workId}`,
      date: formatNotificationDate(note.date),
      note: note.note,
    }))
}

export default async function NotificationsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!canManageEntireApp(session.role)) {
    redirect('/')
  }

  if (!isFeatureEnabled('notificationsCenter')) {
    redirect('/')
  }

  const notifications = getNotifications()

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={backLinkStyle}>
            Voltar ao menu
          </Link>
          <h1 style={titleStyle}>Central de notificações</h1>
        </section>

        <NotificationsClient initialNotifications={notifications} />
      </div>
    </main>
  )
}
