'use client'

import Link from 'next/link'
import { useOperationNotificationState } from '../../frontend/hooks/use-operation-notification-state.js'
import styles from './DashboardOperations.module.css'
import navigation from './DashboardNavigation.module.css'

export default function DashboardNotifications({ notifications: initialNotifications, username, enabled, actionIcon }) {
  const { notifications, ready } = useOperationNotificationState(initialNotifications, username, { enabled, limit: 3 })

  return (
    <section className={[styles.panel, enabled ? navigation.surface : ''].filter(Boolean).join(' ')} aria-labelledby="operations-notifications-title">
      <div className={styles.header}>
        <h2 id="operations-notifications-title" className={styles.title}>Central de notificações</h2>
        {enabled ? (
          <Link href="/notifications" className={`${styles.action} ${navigation.link}`} aria-label="Abrir central de notificações" title="Ver todas as notificações">
            {actionIcon}
          </Link>
        ) : null}
      </div>
      {enabled && notifications.length > 0 ? (
        <ul className={styles.notifications}>
          {notifications.map(notification => (
            <li key={notification.id}>
              <Link href={notification.href || '/notifications'} className={`${styles.notification} ${navigation.control}`}>
                {notification.title ? <span style={{ color: '#b45309', fontWeight: 700 }}>⚠ {notification.title}</span> : null}
                <span className={styles.meta}>{notification.date} · {notification.chef}</span>
                <span className={styles.work}>{notification.work}</span>
                <span className={styles.note}>{notification.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.description}>
          {enabled ? ready ? 'Sem notificações novas.' : 'A carregar notificações...' : 'Notificações desativadas.'}
        </p>
      )}
    </section>
  )
}
