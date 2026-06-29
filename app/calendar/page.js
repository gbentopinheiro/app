import Link from 'next/link'
import { redirect } from 'next/navigation'
import CalendarClient from './CalendarClient.js'
import { getAllCalendarEvents } from '../../lib/calendar-events.js'
import { markCalendarNotificationsSeen } from '../../lib/calendar-notifications.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { getAllPeopleData } from '../../lib/people.js'
import { hasPermission } from '../../lib/permissions.js'
import { getServerSession } from '../../lib/server-session.js'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../components/ViewportLayout.js'

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

function formatDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default async function CalendarPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!hasPermission(session, 'calendar.read')) {
    redirect('/')
  }

  if (!(await isFeatureEnabled('calendarManagement'))) {
    redirect('/')
  }

  await markCalendarNotificationsSeen(session.username)

  const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const initialMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  const todayDate = formatDateKey(currentYear, currentMonth, today.getDate())
  const initialEvents = (await getAllCalendarEvents({ year: currentYear, month: currentMonth })).map(event => ({ ...event }))
  const peopleNames = (await getAllPeopleData())
    .map(person => person.name)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'pt-PT'))

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={backLinkStyle}>
            Voltar ao menu
          </Link>
          <h1 style={titleStyle}>Calendário</h1>
        </section>

        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '22px' }}>
          <CalendarClient
            initialMonthKey={initialMonthKey}
            weekdays={weekdays}
            initialEvents={initialEvents}
            todayDate={todayDate}
            peopleNames={peopleNames}
          />
        </ViewportScrollArea>
      </ViewportShell>
    </ViewportPage>
  )
}
