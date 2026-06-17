import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ACTIVITY_HISTORY_PERIOD_OPTIONS,
  formatActivityHistoryDateTime,
  getGlobalActivityHistoryData,
  normalizeActivityHistoryFilters,
} from '../../lib/activity-history.js'
import { isFeatureEnabled } from '../../lib/feature-flags.js'
import { getAllPeopleData } from '../../lib/people.js'
import { hasPermission } from '../../lib/permissions.js'
import { isDeveloperRole } from '../../lib/roles.js'
import { getServerSession } from '../../lib/server-session.js'
import { getAllWorksData } from '../../lib/works.js'

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

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: '14px',
  marginTop: '18px',
}

const labelStyle = {
  display: 'grid',
  gap: '8px',
  color: '#10233e',
  fontSize: '13px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  minHeight: '46px',
  padding: '12px 14px',
  borderRadius: '14px',
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: '#ffffff',
  color: '#10233e',
  fontSize: '15px',
  boxSizing: 'border-box',
}

const actionRowStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '18px',
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '42px',
  padding: '0 16px',
  borderRadius: '999px',
  border: '1px solid rgba(255, 140, 0, 0.28)',
  background: '#ff8c00',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#ffffff',
  color: '#10233e',
}

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '12px',
  marginTop: '18px',
}

const summaryCardStyle = {
  padding: '16px',
  borderRadius: '18px',
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
}

const summaryLabelStyle = {
  margin: 0,
  color: 'var(--vp-text-soft)',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const summaryValueStyle = {
  margin: '8px 0 0',
  color: '#10233e',
  fontSize: '30px',
  fontWeight: 900,
  letterSpacing: '-0.05em',
}

function buildQueryString(filters) {
  const params = new URLSearchParams()

  if (filters.period) {
    params.set('period', filters.period)
  }

  if (filters.referenceDate) {
    params.set('referenceDate', filters.referenceDate)
  }

  if (filters.personId) {
    params.set('personId', String(filters.personId))
  }

  if (filters.workId) {
    params.set('workId', String(filters.workId))
  }

  return params.toString()
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
                {event.actor} - {formatActivityHistoryDateTime(event.date)}
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

export default async function ActivityHistoryPage({ searchParams }) {
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

  const resolvedSearchParams = (await searchParams) || {}
  const filters = normalizeActivityHistoryFilters(resolvedSearchParams)
  const [history, people, works] = await Promise.all([
    getGlobalActivityHistoryData(filters, { limitPerSection: 60 }),
    getAllPeopleData(),
    getAllWorksData(),
  ])

  const peopleOptions = people
    .map(person => ({ id: person.id, name: person.name }))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-PT'))
  const workOptions = works
    .map(work => ({ id: work.id, label: work.number ? `#${work.number} - ${work.name}` : work.name }))
    .sort((left, right) => left.label.localeCompare(right.label, 'pt-PT'))

  const backHref = developerView ? '/developer' : '/daily-hours'
  const backLabel = developerView ? 'Voltar ao centro tecnico' : 'Voltar ao registo diario'
  const exportHref = `/api/activity-history/export?${buildQueryString(history.filters)}`

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href={backHref} style={backLinkStyle}>
            {'<- '}{backLabel}
          </Link>
          <h1 style={titleStyle}>Historico de atividades</h1>
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitleStyle}>Filtros</h2>
          <p style={sectionMetaStyle}>Escolhe o período, a data de referência, uma pessoa ou uma obra e exporta exatamente esse resultado.</p>

          <form method="GET">
            <div style={filterGridStyle}>
              <label style={labelStyle}>
                Período
                <select name="period" defaultValue={history.filters.period} style={inputStyle}>
                  {ACTIVITY_HISTORY_PERIOD_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Data
                <input
                  type="date"
                  name="referenceDate"
                  defaultValue={history.filters.referenceDate}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Pessoa
                <select
                  name="personId"
                  defaultValue={history.filters.personId ? String(history.filters.personId) : ''}
                  style={inputStyle}
                >
                  <option value="">Todas</option>
                  {peopleOptions.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Obra
                <select
                  name="workId"
                  defaultValue={history.filters.workId ? String(history.filters.workId) : ''}
                  style={inputStyle}
                >
                  <option value="">Todas</option>
                  {workOptions.map(work => (
                    <option key={work.id} value={work.id}>
                      {work.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={actionRowStyle}>
              <button type="submit" style={primaryButtonStyle}>
                Aplicar
              </button>
              <Link href="/activity-history" style={secondaryButtonStyle}>
                Limpar
              </Link>
              <a href={exportHref} style={secondaryButtonStyle}>
                Exportar CSV
              </a>
            </div>
          </form>

          <div style={summaryGridStyle}>
            <article style={summaryCardStyle}>
              <p style={summaryLabelStyle}>Total</p>
              <p style={summaryValueStyle}>{history.summary.total}</p>
            </article>
            <article style={summaryCardStyle}>
              <p style={summaryLabelStyle}>Submetidas</p>
              <p style={summaryValueStyle}>{history.summary.submitted}</p>
            </article>
            <article style={summaryCardStyle}>
              <p style={summaryLabelStyle}>Aprovadas</p>
              <p style={summaryValueStyle}>{history.summary.approved}</p>
            </article>
            <article style={summaryCardStyle}>
              <p style={summaryLabelStyle}>Notas</p>
              <p style={summaryValueStyle}>{history.summary.notes}</p>
            </article>
          </div>
        </section>

        <section style={sectionGridStyle}>
          <EventSection
            title="Horas submetidas"
            helper={`${history.submittedEvents.length} registos nesta seleção`}
            events={history.submittedEvents}
            emptyText="Sem horas submetidas para os filtros escolhidos."
          />
          <EventSection
            title="Horas aprovadas"
            helper={`${history.approvedEvents.length} registos nesta seleção`}
            events={history.approvedEvents}
            emptyText="Sem horas aprovadas para os filtros escolhidos."
          />
        </section>

        <EventSection
          title="Notas da obra"
          helper={`${history.noteEvents.length} notas nesta seleção`}
          events={history.noteEvents}
          emptyText="Sem notas para os filtros escolhidos."
        />
      </div>
    </main>
  )
}
