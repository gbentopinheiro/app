import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAllDailyWorkNotes } from '../../lib/daily-work-notes.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { hasPermission } from '../../lib/permissions.js'
import { isDeveloperRole } from '../../lib/roles.js'
import { getServerSession } from '../../lib/server-session.js'
import { getAllWorkAssignments } from '../../lib/work-assignments.js'

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(22px, 4vw, 42px) 24px 56px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '1100px',
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
  color: '#bfdbfe',
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

const sectionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '18px',
}

const panelStyle = {
  borderRadius: '28px',
  padding: '20px',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  boxShadow: 'var(--vp-shadow-panel)',
}

const sectionTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '22px',
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const sectionMetaStyle = {
  margin: '8px 0 0',
  color: 'var(--vp-text-soft)',
  fontSize: '13px',
  fontWeight: 700,
}

const listStyle = {
  display: 'grid',
  gap: '12px',
  marginTop: '18px',
}

const itemStyle = {
  display: 'grid',
  gap: '8px',
  padding: '16px',
  borderRadius: '20px',
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
}

const metaStyle = {
  margin: 0,
  color: 'var(--vp-text-soft)',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const textStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '16px',
  lineHeight: 1.5,
  fontWeight: 800,
}

function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function sortEvents(events) {
  return events.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
}

function buildActivityGroups() {
  const assignments = getAllWorkAssignments()
  const notes = getAllDailyWorkNotes()

  const submittedEvents = sortEvents(
    assignments
      .filter(assignment => assignment.submitted && assignment.submittedAt)
      .map(assignment => ({
        id: `submitted-${assignment.id}`,
        date: assignment.submittedAt,
        actor: assignment.submittedBy || 'Chef',
        text: `${assignment.person?.name || 'Pessoa'} - ${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.hours}h`,
      })),
  ).slice(0, 40)

  const approvedEvents = sortEvents(
    assignments
      .filter(assignment => assignment.approvedHours !== null && assignment.approvedHours !== undefined)
      .map(assignment => ({
        id: `approved-${assignment.id}`,
        date: assignment.submittedAt || assignment.date,
        actor: 'Administrador',
        text: `${assignment.person?.name || 'Pessoa'} - ${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.approvedHours}h`,
      })),
  ).slice(0, 40)

  const noteEvents = sortEvents(
    notes
      .filter(note => note.note)
      .map(note => ({
        id: `note-${note.id}`,
        date: note.updatedAt,
        actor: note.authorName || 'Chef',
        text: `${note.work?.name || `Obra ${note.workId}`} - ${note.note}`,
      })),
  ).slice(0, 40)

  return {
    submittedEvents,
    approvedEvents,
    noteEvents,
  }
}

function EventSection({ title, helper, events, emptyText }) {
  return (
    <section style={panelStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <p style={sectionMetaStyle}>{helper}</p>
      {events.length > 0 ? (
        <div style={listStyle}>
          {events.map(event => (
            <article key={event.id} style={itemStyle}>
              <p style={metaStyle}>
                {event.actor} - {formatDateTime(event.date)}
              </p>
              <p style={textStyle}>{event.text}</p>
            </article>
          ))}
        </div>
      ) : (
        <div style={listStyle}>
          <article style={itemStyle}>
            <p style={textStyle}>{emptyText}</p>
          </article>
        </div>
      )}
    </section>
  )
}

export default async function ActivityHistoryPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const developerView = isDeveloperRole(session.role)

  if (!hasPermission(session, 'activity_history.read_global')) {
    redirect('/')
  }

  if (!isFeatureEnabled('activityHistory')) {
    redirect(developerView ? '/developer' : '/')
  }

  const { submittedEvents, approvedEvents, noteEvents } = buildActivityGroups()
  const backHref = developerView ? '/developer' : '/daily-hours'
  const backLabel = developerView ? 'Voltar ao centro tecnico' : 'Voltar ao registo diario'

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href={backHref} style={backLinkStyle}>
            {'<- '}{backLabel}
          </Link>
          <h1 style={titleStyle}>Historico de atividades</h1>
        </section>

        <section style={sectionGridStyle}>
          <EventSection
            title="Horas submetidas"
            helper={`${submittedEvents.length} registos mais recentes`}
            events={submittedEvents}
            emptyText="Ainda nao existem horas submetidas."
          />
          <EventSection
            title="Horas aprovadas"
            helper={`${approvedEvents.length} registos mais recentes`}
            events={approvedEvents}
            emptyText="Ainda nao existem horas aprovadas."
          />
        </section>

        <EventSection
          title="Notas da obra"
          helper={`${noteEvents.length} notas mais recentes`}
          events={noteEvents}
          emptyText="Ainda nao existem notas registadas."
        />
      </div>
    </main>
  )
}
