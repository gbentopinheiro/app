'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import LogoutButton from './LogoutButton'
import styles from './AdminSidebar.module.css'

const menuItems = [
  { label: 'Início', href: '/', icon: 'home' },
  { label: 'Registo de horas', href: '/daily-hours', icon: 'clock' },
  { label: 'Clientes', href: '/clients', icon: 'clients' },
  { label: 'Obras', href: '/works', icon: 'building' },
  { label: 'Trabalhadores', href: '/people', icon: 'people' },
  { label: 'Plano diário', href: '/daily-plan', icon: 'calendar' },
  { label: 'Relatórios', href: '/works', icon: 'reports', blocked: true },
]

const iconPaths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  clock: 'M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  clients: 'M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M4 7h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm-1 5a20 20 0 0 0 18 0M10 12v3h4v-3',
  calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM7 14h2m6 0h2M7 18h2',
  history: 'M3 4v5h5M3.5 9a9 9 0 1 1-.1 6M12 7v5l3 2',
  building: 'M3 21h18M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16M9 21v-4h6v4M9 8h1m4 0h1m-6 4h1m4 0h1',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 .13a4 4 0 0 1 0 7.75',
  reports: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 17v-3m4 3v-6m4 6v-4',
  settings: 'm9.5 3-.6 2.4-2.1 1.2-2.4-.7L2 10l1.8 1.7v2.6L2 16l2.4 4.1 2.4-.7 2.1 1.2.6 2.4h5l.6-2.4 2.1-1.2 2.4.7L22 16l-1.8-1.7v-2.6L22 10l-2.4-4.1-2.4.7-2.1-1.2-.6-2.4ZM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9',
}

function MenuIcon({ name }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={iconPaths[name]} />
    </svg>
  )
}

export default function AdminSidebar({ activePath = '/', mobileNavigation = false }) {
  const sidebarId = useId()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!mobileNavigation) return

    const query = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [mobileNavigation])

  return (
    <>
      {mobileNavigation ? (
        <button
          type="button"
          className={styles.mobileToggle}
          popoverTarget={sidebarId}
          aria-controls={sidebarId}
          aria-label="Abrir menu principal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Menu
        </button>
      ) : null}
      <aside
        id={sidebarId}
        className={`${styles.sidebar}${mobileNavigation ? ` ${styles.mobileNavigation}` : ''}`}
        aria-label="Menu do administrador"
        popover={isMobile ? 'auto' : undefined}
        onClick={event => {
          if (isMobile && event.target.closest('a')) event.currentTarget.hidePopover()
        }}
      >
        <Link href="/" className={styles.brand} aria-label="Bentix — Início">
          <img src="/icon.svg" alt="" width="40" height="40" />
          <span className={styles.label}>BENTIX</span>
        </Link>

        <nav className={styles.menu} aria-label="Navegação principal">
          {menuItems.map(item => item.blocked ? (
            <button
              key={item.label}
              type="button"
              className={styles.item}
              aria-label={item.label}
              aria-disabled="true"
              title={item.label}
            >
              <MenuIcon name={item.icon} />
              <span className={styles.label}>{item.label}</span>
            </button>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.item}${item.href === activePath ? ` ${styles.active}` : ''}`}
              aria-current={item.href === activePath ? 'page' : undefined}
              aria-label={item.label}
              title={item.title || item.label}
            >
              <MenuIcon name={item.icon} />
              <span className={styles.label}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.footer}>
          <Link href="/account-settings" className={styles.item} aria-label="Definições" title="Definições">
            <MenuIcon name="settings" />
            <span className={styles.label}>Definições</span>
          </Link>
          <div className={styles.logout} title="Sair">
            <MenuIcon name="logout" />
            <LogoutButton className={`${styles.item} ${styles.logoutButton}`} variant="ghost" />
          </div>
        </div>
      </aside>
    </>
  )
}
