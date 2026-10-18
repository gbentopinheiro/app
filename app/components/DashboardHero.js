import Image from 'next/image'
import NotificationBell from './NotificationBell'
import { getOperationNotifications } from '../../lib/operation-notifications.js'
import styles from './DashboardHero.module.css'

export default async function DashboardHero({ userName, notificationUsername, notificationsEnabled }) {
  const firstName = String(userName || '').trim().split(/\s+/u)[0]
  const today = new Date()
  const dateLabel = new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(today)
  const notifications = notificationsEnabled
    ? await getOperationNotifications({ audience: 'admin', withYear: true })
    : []

  return (
    <header className={`${styles.hero} btx-dashboard-hero`}>
      <Image
        src="/images/dashboard-construction.png"
        alt=""
        fill
        priority
        unoptimized
        sizes="(min-width: 1024px) calc(100vw - 296px), 100vw"
        className={styles.image}
      />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.topbar}>
        <NotificationBell notifications={notifications} username={notificationUsername} enabled={notificationsEnabled} />
        <div className={styles.userControls}>
          <span className={styles.userName}>{userName}</span>
        </div>
      </div>

      <div className={styles.headingRow}>
        <h1 className={styles.greeting}>Olá{firstName ? `, ${firstName}` : ''}</h1>
        <time className={styles.date} dateTime={today.toISOString().slice(0, 10)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            <path d="M7 14h2m6 0h2M7 18h2" />
          </svg>
          <span>{dateLabel}</span>
        </time>
      </div>
    </header>
  )
}
