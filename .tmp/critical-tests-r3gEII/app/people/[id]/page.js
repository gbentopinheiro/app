import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import PersonDocumentsPanel from './PersonDocumentsPanel.js'
import { getAccessIdentityByPersonIdData } from '../../../lib/access-identities.js'
import { getAllDailyWorkNotesData } from '../../../lib/daily-work-notes.js'
import { getPersonDocumentRemindersData } from '../../../lib/person-document-reminders.js'
import { getPersonByIdData } from '../../../lib/people.js'
import { getApprovedAssignmentTotalCost, isAssignmentApproved } from '../../../lib/work-assignment-approval.js'
import { getRoleDisplayLabel, isResponsavelRole, roleCanHaveAppAccess, roleUsesWorkScope } from '../../../lib/roles.js'
import { getServerSession } from '../../../lib/server-session.js'
import { getAllWorkAssignmentsData } from '../../../lib/work-assignments.js'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../../components/ViewportLayout.js'

export const dynamic = 'force-dynamic'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: 'var(--btx-font-family)',
}

const shellStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: '28px',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
  '--vp-surface': 'var(--vp-hero-surface)',
  '--vp-border': 'var(--vp-hero-border)',
}

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
}

const statCardStyle = {
  borderRadius: '20px',
  padding: '18px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const activityGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '12px',
}

const activityListStyle = {
  display: 'grid',
  gap: '8px',
  marginTop: '12px',
  maxHeight: '220px',
  overflowY: 'auto',
  paddingRight: '4px',
}

const activityItemStyle = {
  display: 'grid',
  gap: '4px',
  padding: '10px 12px',
  borderRadius: '14px',
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
}

const activityMetaStyle = {
  margin: 0,
  color: 'var(--vp-text-soft)',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const activityTextStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '13px',
  lineHeight: 1.45,
  fontWeight: 800,
}

const exportButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '42px',
  padding: '0 18px',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, #2563eb 0%, #ff8c00 100%)',
  color: '#ffffff',
  fontWeight: 900,
  textDecoration: 'none',
  boxShadow: '0 14px 30px rgba(37, 99, 235, 0.18)',
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
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

function sortActivityEvents(events) {
  return events.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
}

function buildMonthlyAssignmentSummary(assignments) {
  const monthMap = new Map()

  assignments.forEach(assignment => {
    if (!assignment.date) {
      return
    }

    const monthKey = String(assignment.date).slice(0, 7)
    const currentMonth = monthMap.get(monthKey) || {
      monthKey,
      label: formatMonthLabel(monthKey),
      totalHours: 0,
      days: new Map(),
    }

    currentMonth.totalHours += Number(assignment.hours) || 0

    const currentDay = currentMonth.days.get(assignment.date) || {
      date: assignment.date,
      totalHours: 0,
      works: new Map(),
    }

    currentDay.totalHours += Number(assignment.hours) || 0

    const workName = assignment.work?.name || `Obra ${assignment.workId}`
    const currentWork = currentDay.works.get(workName) || {
      name: workName,
      hours: 0,
    }

    currentWork.hours += Number(assignment.hours) || 0
    currentDay.works.set(workName, currentWork)
    currentMonth.days.set(assignment.date, currentDay)
    monthMap.set(monthKey, currentMonth)
  })

  return Array.from(monthMap.values())
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey))
    .map(month => ({
      monthKey: month.monthKey,
      label: month.label,
      totalHours: Number(month.totalHours.toFixed(2)),
      days: Array.from(month.days.values())
        .sort((left, right) => right.date.localeCompare(left.date))
        .map(day => ({
          ...day,
          totalHours: Number(day.totalHours.toFixed(2)),
          works: Array.from(day.works.values())
            .sort((left, right) => left.name.localeCompare(right.name))
            .map(work => ({
              ...work,
              hours: Number(work.hours.toFixed(2)),
            })),
        })),
    }))
}

async function buildPersonActivityGroups(person, assignments) {
  const notes = await getAllDailyWorkNotesData({ authorId: person.id })

  const submittedEvents = sortActivityEvents(
    assignments
      .filter(assignment => assignment.submitted && assignment.submittedAt)
      .map(assignment => ({
        id: `submitted-${assignment.id}`,
        date: assignment.submittedAt,
        actor: assignment.submittedBy || person.name,
        text: `${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.hours}h submetidas`,
      })),
  ).slice(0, 20)

  const approvedEvents = sortActivityEvents(
    assignments
      .filter(assignment => isAssignmentApproved(assignment))
      .map(assignment => ({
        id: `approved-${assignment.id}`,
        date: assignment.submittedAt || assignment.date,
        actor: 'Administrador',
        text: `${assignment.work?.name || `Obra ${assignment.workId}`} - ${assignment.approvedHours}h aprovadas`,
      })),
  ).slice(0, 20)

  const noteEvents = sortActivityEvents(
    notes
      .filter(note => note.note)
      .map(note => ({
        id: `note-${note.id}`,
        date: note.updatedAt,
        actor: note.authorName || person.name,
        text: `${note.work?.name || `Obra ${note.workId}`} - ${note.note}`,
      })),
  ).slice(0, 20)

  return { submittedEvents, approvedEvents, noteEvents }
}

function ActivitySection({ title, events = [], emptyText }) {
  return (
    <article style={statCardStyle}>
      <h3 style={{ margin: 0, fontSize: '18px' }}>{title}</h3>
      <div style={activityListStyle}>
        {events.length > 0 ? (
          events.map(event => (
            <div key={event.id} style={activityItemStyle}>
              <p style={activityMetaStyle}>
                {event.actor} - {formatDateTime(event.date)}
              </p>
              <p style={activityTextStyle}>{event.text}</p>
            </div>
          ))
        ) : (
          <div style={activityItemStyle}>
            <p style={activityTextStyle}>{emptyText}</p>
          </div>
        )}
      </div>
    </article>
  )
}

export default async function PersonDetailPage({ params }) {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const person = await getPersonByIdData(id)

  if (!person) {
    notFound()
  }

  const personDocuments = await getPersonDocumentRemindersData(id)

  if (isResponsavelRole(session.role)) {
    return (
      <ViewportPage lockViewport style={pageStyle}>
        <ViewportShell fillHeight style={shellStyle}>
          <section style={heroStyle}>
            <Link href="/people" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
              Voltar à gestão de pessoas
            </Link>
            <h1 style={{ margin: '10px 0 0', fontSize: '46px', lineHeight: 1.05 }}>{person.name}</h1>
          </section>
          <ViewportScrollArea style={{ '--vp-page-scroll-gap': '24px' }}>
            <PersonDocumentsPanel personId={person.id} initialDocuments={personDocuments} />
          </ViewportScrollArea>
        </ViewportShell>
      </ViewportPage>
    )
  }

  const accessIdentity = await getAccessIdentityByPersonIdData(id)
  const assignments = await getAllWorkAssignmentsData({ personId: id })
  const monthlyAssignmentSummary = buildMonthlyAssignmentSummary(assignments)
  const activityGroups = await buildPersonActivityGroups(person, assignments)
  const totalHours = Number(assignments.reduce((sum, assignment) => sum + (Number(assignment.hours) || 0), 0).toFixed(2))
  const totalCost = Number(assignments.reduce((sum, assignment) => sum + getApprovedAssignmentTotalCost(assignment), 0).toFixed(2))
  const workedDays = new Set(assignments.map(assignment => assignment.date).filter(Boolean)).size

  return (
    <ViewportPage lockViewport style={pageStyle}>
      <ViewportShell fillHeight style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/people" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar à gestão de pessoas
          </Link>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>{person.name}</h1>
          {false && <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
            Página independente com os dados principais, acesso à aplicação e histórico mensal.
          </p>}
        </section>

        <ViewportScrollArea style={{ '--vp-page-scroll-gap': '24px' }}>
          <section style={statGridStyle}>
          <article style={statCardStyle}>
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Tipo</div>
            <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>
              {person.isMonthlyBilling ? 'Mensal' : 'Horária'}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>
              {person.isMonthlyBilling ? 'Preço mensal' : 'Preço hora'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>
              {person.isMonthlyBilling ? person.monthlyPrice || 0 : `${person.price || 0}/h`}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Função</div>
            <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>
              {getRoleDisplayLabel(person.role, person.chefCategory)}
            </div>
          </article>
          <article style={statCardStyle}>
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Total de horas</div>
            <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{totalHours}h</div>
          </article>
        </section>

        <section style={panelStyle}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0 }}>Resumo da pessoa</h2>
                <p style={{ margin: '8px 0 0', color: 'var(--vp-text-muted)' }}>
                  Consulta rápida do perfil e do histórico já registado.
                </p>
              </div>
              <Link
                href="/people"
                style={{
                  border: '1px solid var(--vp-accent)',
                  borderRadius: '999px',
                  padding: '12px 18px',
                  color: 'var(--vp-accent)',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Voltar à lista
              </Link>
            </div>

            <div style={statGridStyle}>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Registos</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{assignments.length}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Dias com horas</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{workedDays}</div>
              </article>
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Custo acumulado</div>
                <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{totalCost}</div>
              </article>
            </div>

            {(roleCanHaveAppAccess(person.role) || accessIdentity) && (
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Acesso à aplicação</div>
                <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
                  <div>
                    <strong>Nome de utilizador:</strong> {accessIdentity?.username || 'Sem acesso configurado'}
                  </div>
                  {roleUsesWorkScope(person.role) && (
                    <div>
                      <strong>Obras:</strong>{' '}
                      {accessIdentity?.works?.length
                        ? accessIdentity.works.map(work => work.name || `Obra ${work.id}`).join(', ')
                        : 'Sem obras atribuídas'}
                    </div>
                  )}
                </div>
              </article>
            )}
          </div>
        </section>

        <section style={panelStyle}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>Histórico mensal</h2>
            </div>

            {monthlyAssignmentSummary.length === 0 && (
              <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>Sem afetações registadas para esta pessoa.</p>
            )}

            {monthlyAssignmentSummary.map(month => (
              <details
                key={month.monthKey}
                style={{
                  border: '1px solid var(--vp-border)',
                  borderRadius: '18px',
                  background: 'var(--vp-surface)',
                  padding: '16px',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                  {month.label} | {month.totalHours}h
                </summary>

                <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
                  {month.days.map(day => (
                    <article
                      key={day.date}
                      style={{
                        border: '1px solid var(--vp-border)',
                        borderRadius: '14px',
                        padding: '14px',
                        background: 'var(--vp-surface-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <strong>{formatDateLabel(day.date)}</strong>
                        <span style={{ color: 'var(--vp-text-muted)' }}>{day.totalHours}h</span>
                      </div>

                      <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                        {day.works.map(work => (
                          <div
                            key={`${day.date}-${work.name}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '12px',
                              padding: '10px 12px',
                              borderRadius: '12px',
                              background: 'var(--vp-surface)',
                            }}
                          >
                            <span>{work.name}</span>
                            <strong>{work.hours}h</strong>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section id="documentos">
          <PersonDocumentsPanel personId={person.id} initialDocuments={personDocuments} />
        </section>

        {(
          <section style={{ ...panelStyle, padding: '18px' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px' }}>Histórico de atividades</h2>
                  <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
                    Alterações registadas nas horas desta pessoa.
                  </p>
                </div>
                <Link href={`/api/people/${person.id}/activity-history?format=pdf`} style={exportButtonStyle}>
                  Exportar PDF
                </Link>
              </div>

              <div style={{ ...activityGridStyle, alignItems: 'start' }}>
                <ActivitySection
                  title="Horas submetidas"
                  events={activityGroups.submittedEvents}
                  emptyText="Ainda não existem horas submetidas."
                />
                <ActivitySection
                  title="Horas aprovadas"
                  events={activityGroups.approvedEvents}
                  emptyText="Ainda não existem horas aprovadas."
                />
                <ActivitySection
                  title="Notas da obra"
                  events={activityGroups.noteEvents}
                  emptyText="Ainda não existem notas registadas."
                />
              </div>
            </div>
          </section>
        )}
        </ViewportScrollArea>
      </ViewportShell>
    </ViewportPage>
  )
}






