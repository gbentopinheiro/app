'use client'

import { useState } from 'react'
import styles from './DashboardBillingValue.module.css'

export default function DashboardBillingValue({ value, label }) {
  const [revealed, setRevealed] = useState(false)
  const actionLabel = `${revealed ? 'Ocultar' : 'Revelar'} valor da ${label.toLocaleLowerCase('pt-PT')}`

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setRevealed(current => !current)}
      aria-pressed={revealed}
      aria-label={revealed ? `${actionLabel}: ${value}` : actionLabel}
    >
      <span className={styles.amount}>{revealed ? value : '•••••• €'}</span>
      <svg className={styles.eye} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {revealed ? <path d="m3 3 18 18" /> : null}
      </svg>
    </button>
  )
}
