import Link from 'next/link'
import DashboardBillingValue from './DashboardBillingValue'
import { getAllPeopleData } from '../../lib/people.js'
import { getAllWorkAssignmentsData } from '../../lib/work-assignments.js'
import { getAllWorksData, WorkStatus } from '../../lib/works.js'
import { isChefRole, isWorkerRole, ROLE_ADMIN } from '../../lib/roles.js'
import { filterAssignmentsForSession } from '../../lib/work-assignment-policy.js'
import { getApprovedAssignmentTotalCost, isAssignmentApproved } from '../../lib/work-assignment-approval.js'
import styles from './DashboardSummaryCards.module.css'
import navigation from './DashboardNavigation.module.css'

const iconPaths = {
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 .13a4 4 0 0 1 0 7.75',
  billing: 'M18 7a7 7 0 1 0 0 10M3 10h11M3 14h10',
  pending: 'M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
}

function CardIcon({ name, ...props }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      <path d={iconPaths[name]} />
    </svg>
  )
}

function SummaryCard({ id, label, value, description, icon, tone, money = false, href }) {
  return (
    <article className={[styles.card, href ? navigation.surface : ''].filter(Boolean).join(' ')} aria-labelledby={id}>
      <div className={styles.cardHeader}>
        <span className={[styles.icon, styles[tone]].join(' ')}><CardIcon name={icon} /></span>
        <h2 id={id} className={styles.label}>{label}</h2>
      </div>
      <p className={styles.value + (money ? ' ' + styles.money : '')}>
        {money ? <DashboardBillingValue value={value} label={label} /> : value}
      </p>
      <div className={styles.cardFooter}>
        <p className={styles.description}>{description}</p>
        {href ? (
          <Link href={href} className={`${styles.action} ${navigation.link}`} aria-label="Abrir Registo de Horas" title="Abrir Registo de Horas">
            <CardIcon name="arrow" width="18" height="18" />
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export default async function DashboardSummaryCards({
  date,
  annualBilling,
}) {
  const monthStart = `${date.slice(0, 7)}-01`
  const monthEnd = new Date(`${monthStart}T12:00:00Z`)
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0)
  const [people, assignments, works, monthAssignments] = await Promise.all([
    getAllPeopleData(),
    getAllWorkAssignmentsData({ date }),
    getAllWorksData(),
    getAllWorkAssignmentsData({ dateFrom: monthStart, dateTo: monthEnd.toISOString().slice(0, 10) }),
  ])
  const workers = people.filter(person => isWorkerRole(person.role) || isChefRole(person.role))
  // Match the entries and approval state used by the Admin's Registo de Horas.
  const pendingWorkIds = new Set(
    filterAssignmentsForSession(assignments, { role: ROLE_ADMIN })
      .filter(assignment => !isAssignmentApproved(assignment))
      .map(assignment => String(assignment.workId)),
  )
  const pendingWorks = works.filter(work =>
    work.status !== WorkStatus.COMPLETED && pendingWorkIds.has(String(work.id)),
  ).length
  const numberFormat = new Intl.NumberFormat('pt-PT')
  const dateLabel = new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date + 'T12:00:00Z'))
  const monthlyBilling = monthAssignments.reduce((sum, assignment) => sum + getApprovedAssignmentTotalCost(assignment), 0)
  const currencyFormat = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })

  return (
    <section className={styles.grid} aria-label="Indicadores principais">
      <SummaryCard
        id="total-workers"
        label="Trabalhadores no total"
        value={numberFormat.format(workers.length)}
        description="Trabalhadores e chefes registados"
        icon="people"
        tone="navy"
      />
      <SummaryCard
        id="annual-billing"
        label="Faturação anual"
        value={annualBilling.value}
        description={annualBilling.text}
        icon="billing"
        tone="success"
        money
      />
      <SummaryCard
        id="monthly-billing"
        label="Faturação mensal"
        value={currencyFormat.format(monthlyBilling)}
        description={dateLabel}
        icon="billing"
        tone="orange"
        money
      />
      <SummaryCard
        id="pending-works"
        label="Obras pendentes"
        value={numberFormat.format(pendingWorks)}
        description="Com horas por aprovar hoje"
        icon="pending"
        tone="warning"
        href="/daily-hours"
      />
    </section>
  )
}
