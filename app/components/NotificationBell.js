'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import styles from './NotificationBell.module.css'
import { useOperationNotificationState } from '../../frontend/hooks/use-operation-notification-state.js'
import { getNotificationVersion } from '../../lib/operation-notification-state.js'

export default function NotificationBell({ username, enabled }) {
  const { notifications } = useOperationNotificationState({ enabled })
  const [isOpen, setIsOpen] = useState(false)
  const [seen, setSeen] = useState({ key: null, versions: {} })
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const panelId = useId()
  const storageKey = `bentix:notifications:seen:v1:${String(username).trim().toLowerCase()}`
  const hasUnread = enabled && seen.key === storageKey && notifications.some(notification =>
    seen.versions[notification.id] !== getNotificationVersion(notification),
  )

  useEffect(() => {
    function loadSeen() {
      let versions = {}
      try {
        const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}')
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) versions = saved
      } catch {
        // Reading notifications still works when browser storage is unavailable.
      }
      setSeen({ key: storageKey, versions })
    }
    function handleStorage(event) {
      if (event.key === storageKey || event.key === null) loadSeen()
    }
    loadSeen()
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [storageKey])

  useEffect(() => {
    if (!isOpen) return undefined
    function handleOutside(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  function togglePanel() {
    if (!isOpen && enabled) {
      const versions = Object.fromEntries(notifications.map(notification => [notification.id, getNotificationVersion(notification)]))
      setSeen({ key: storageKey, versions })
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(versions))
      } catch {
        // Keep the seen state for this visit if browser storage is unavailable.
      }
    }
    setIsOpen(current => !current)
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={hasUnread ? 'Abrir notificações: novas notificações' : 'Abrir notificações'}
        aria-expanded={isOpen}
        aria-controls={panelId}
        title={hasUnread ? 'Novas notificações' : 'Notificações'}
        onClick={togglePanel}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {hasUnread ? <span className={styles.dot} aria-hidden="true" /> : null}
      </button>

      {isOpen ? (
        <section id={panelId} className={styles.panel} aria-label="Notificações">
          <div className={styles.panelHeader}>
            <h2>Notificações</h2>
            {enabled ? <Link href="/notifications" onClick={() => setIsOpen(false)}>Ver todas</Link> : null}
          </div>
          {enabled && notifications.length > 0 ? (
            <ul className={styles.list}>
              {notifications.map(notification => (
                <li key={notification.id}>
                  <Link href={notification.href || '/notifications'} onClick={() => setIsOpen(false)}>
                    {notification.title ? <strong className={styles.warningTitle}>⚠ {notification.title}</strong> : null}
                    <span className={styles.meta}>{notification.date} · {notification.work}</span>
                    <p className={styles.note}>{notification.note}</p>
                    <span className={styles.author}>{notification.chef}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>{enabled ? 'Sem notificações novas.' : 'Notificações desativadas.'}</p>
          )}
        </section>
      ) : null}
    </div>
  )
}
