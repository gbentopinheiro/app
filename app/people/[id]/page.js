import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccessIdentityByPersonId } from '../../../lib/access-identities.js'
import { getPersonById } from '../../../lib/people.js'
import { getRoleLabel, roleRequiresAppAccess, roleUsesWorkScope } from '../../../lib/roles.js'
import { getAllWorkAssignments } from '../../../lib/work-assignments.js'

export const dynamic = 'force-dynamic'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
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

export default async function PersonDetailPage({ params }) {
  const { id } = await params
  const person = getPersonById(id)

  if (!person) {
    notFound()
  }

  const accessIdentity = getAccessIdentityByPersonId(id)
  const assignments = getAllWorkAssignments({ personId: id })
  const monthlyAssignmentSummary = buildMonthlyAssignmentSummary(assignments)
  const totalHours = Number(assignments.reduce((sum, assignment) => sum + (Number(assignment.hours) || 0), 0).toFixed(2))
  const totalCost = Number(assignments.reduce((sum, assignment) => sum + (Number(assignment.totalCost) || 0), 0).toFixed(2))
  const workedDays = new Set(assignments.map(assignment => assignment.date).filter(Boolean)).size

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/people" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar à gestão de pessoas
          </Link>
          <p style={{ margin: '18px 0 0', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '12px', color: 'var(--vp-text-soft)' }}>
            Pessoa #{person.id}
          </p>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>{person.name}</h1>
          <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
            Página independente com os dados principais, acesso à aplicação e histórico mensal.
          </p>
        </section>

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
            <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Role</div>
            <div style={{ marginTop: '8px', fontSize: '28px', fontWeight: 700 }}>{getRoleLabel(person.role)}</div>
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

            {(roleRequiresAppAccess(person.role) || accessIdentity) && (
              <article style={statCardStyle}>
                <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Acesso à aplicação</div>
                <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
                  <div>
                    <strong>Username:</strong> {accessIdentity?.username || 'Sem acesso configurado'}
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
              <h2 style={{ margin: 0, fontSize: '24px' }}>Acesso mensal</h2>
              <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
                Horas agrupadas por mês, com detalhe por dia e por obra.
              </p>
            </div>

            {monthlyAssignmentSummary.length === 0 && (
              <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>Sem afetações registadas para esta pessoa.</p>
            )}

            {monthlyAssignmentSummary.map(month => (
              <details
                key={month.monthKey}
                open={monthlyAssignmentSummary[0]?.monthKey === month.monthKey}
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
      </div>
    </main>
  )
}
