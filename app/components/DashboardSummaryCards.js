'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import DashboardBillingValue from './DashboardBillingValue'
import { getDashboardSummary } from '../../frontend/controllers/dashboard-summary-controller.js'
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
        {money && value !== undefined ? <DashboardBillingValue value={value} label={label} /> : value ?? '—'}
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

export default function DashboardSummaryCards({
  date,
  refreshVersion,
}) {
  const [state, setState] = useState({ date: null, summary: null, error: '' })
  useEffect(() => {
    const controller = new AbortController()
    getDashboardSummary(date, { signal: controller.signal }).then(summary => {
      if (!controller.signal.aborted) setState({ date, summary, error: '' })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ date, summary: null, error: error.message })
    })
    return () => controller.abort()
  }, [date, refreshVersion])
  const summary = state.date === date ? state.summary : null
  const numberFormat = new Intl.NumberFormat('pt-PT')
  const dateLabel = new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date + 'T12:00:00Z'))
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
        value={summary ? numberFormat.format(summary.totalWorkers) : undefined}
        description="Trabalhadores e chefes registados"
        icon="people"
        tone="navy"
      />
      <SummaryCard
        id="annual-billing"
        label="Faturação anual"
        value={summary ? currencyFormat.format(summary.annualRevenue) : undefined}
        description={`janeiro a dezembro de ${date.slice(0, 4)}`}
        icon="billing"
        tone="success"
        money
      />
      <SummaryCard
        id="monthly-billing"
        label="Faturação mensal"
        value={summary ? currencyFormat.format(summary.monthlyRevenue) : undefined}
        description={dateLabel}
        icon="billing"
        tone="orange"
        money
      />
      <SummaryCard
        id="pending-works"
        label="Obras pendentes"
        value={summary ? numberFormat.format(summary.pendingWorks) : undefined}
        description="Com horas por aprovar hoje"
        icon="pending"
        tone="warning"
        href="/daily-hours"
      />
      {state.date === date && state.error ? <p role="alert" style={{ gridColumn: '1 / -1', margin: 0, color: '#b42318' }}>{state.error}</p> : null}
    </section>
  )
}
