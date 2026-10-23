import Link from 'next/link'
import DashboardWorksToday from './DashboardWorksToday'
import DashboardNotifications from './DashboardNotifications'
import styles from './DashboardOperations.module.css'
import navigation from './DashboardNavigation.module.css'

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  )
}

export default function DashboardOperations({
  date,
  todayDate,
  todayLabel,
  smallCalendar,
  calendarOverview,
  notifications,
  username,
  calendarEnabled,
  notificationsEnabled,
}) {
  return (
    <div className={styles.layout}>
      <DashboardWorksToday date={date} />
      <div className={styles.sideColumn}>
        <section className={[styles.panel, calendarEnabled ? navigation.surface : ''].filter(Boolean).join(' ')} aria-labelledby="operations-calendar-title">
          <div className={styles.header}>
            <h2 id="operations-calendar-title" className={styles.title}>Calendário</h2>
            {calendarEnabled ? (
              <Link href="/calendar" className={`${styles.action} ${navigation.link}`} aria-label={`Abrir calendário: ${calendarOverview.unseenEventsCount} eventos por ver`}>
                <span className={styles.badge}>{calendarOverview.unseenEventsCount}</span>
                <Arrow />
              </Link>
            ) : null}
          </div>
          <time className={styles.today} dateTime={todayDate}>
            <span className={styles.day}>{smallCalendar.day}</span>
            <span className={styles.dateCopy}>
              <span className={styles.weekday}>Hoje · {smallCalendar.weekday}</span>
              <span className={styles.dateLabel}>{todayLabel}</span>
            </span>
          </time>
          {calendarEnabled ? (
            smallCalendar.showTomorrow ? (
              <p className={styles.description}>
                Amanhã · {smallCalendar.tomorrowLabel}: {smallCalendar.tomorrowEvent || 'sem eventos registados'}
              </p>
            ) : null
          ) : (
            <p className={styles.description}>Calendário desativado.</p>
          )}
        </section>

        <DashboardNotifications notifications={notifications} username={username} enabled={notificationsEnabled} actionIcon={<Arrow />} />
      </div>
    </div>
  )
}
