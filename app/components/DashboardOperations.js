import Link from 'next/link'
import DashboardWorksToday from './DashboardWorksToday'
import styles from './DashboardOperations.module.css'

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
  calendarEnabled,
  notificationsEnabled,
}) {
  return (
    <div className={styles.layout}>
      <DashboardWorksToday date={date} />
      <div className={styles.sideColumn}>
        <section className={styles.panel} aria-labelledby="operations-calendar-title">
          <div className={styles.header}>
            <h2 id="operations-calendar-title" className={styles.title}>Calendário</h2>
            {calendarEnabled ? (
              <Link href="/calendar" className={styles.action} aria-label={`Abrir calendário: ${calendarOverview.unseenEventsCount} eventos por ver`}>
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

        <section className={styles.panel} aria-labelledby="operations-notifications-title">
          <div className={styles.header}>
            <h2 id="operations-notifications-title" className={styles.title}>Central de notificações</h2>
            {notificationsEnabled ? (
              <Link href="/notifications" className={styles.action} aria-label="Abrir central de notificações" title="Ver todas as notificações">
                <Arrow />
              </Link>
            ) : null}
          </div>
          {notificationsEnabled && notifications.length > 0 ? (
            <ul className={styles.notifications}>
              {notifications.map(notification => (
                <li key={notification.id}>
                  <Link href="/notifications" className={styles.notification}>
                    <span className={styles.meta}>{notification.date} · {notification.chef}</span>
                    <span className={styles.work}>{notification.work}</span>
                    <span className={styles.note}>{notification.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.description}>
              {notificationsEnabled ? 'Sem notificações novas.' : 'Notificações desativadas.'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
