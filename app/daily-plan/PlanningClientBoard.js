'use client'

import { useMemo, useState } from 'react'
import { ResponsiveGrid } from '../components/ViewportLayout.js'
import { filterPlanningClients, groupPlanningClients } from './planning-board-view.js'
import styles from './DailyPlan.module.css'

export default function PlanningClientBoard({ groupedAssignments, works, unplannedWorks, conflictPersonIds, renderWork, renderUnplannedWork }) {
  const [query, setQuery] = useState('')
  const [collapsedClients, setCollapsedClients] = useState(() => new Set())
  const clients = useMemo(
    () => groupPlanningClients(groupedAssignments, works, unplannedWorks, conflictPersonIds),
    [groupedAssignments, works, unplannedWorks, conflictPersonIds],
  )
  const visibleClients = useMemo(() => filterPlanningClients(clients, query), [clients, query])
  const workCount = clients.reduce((total, client) => total + client.workCount, 0)
  const visibleWorkCount = visibleClients.reduce((total, client) => total + client.works.length, 0)

  function toggleClient(key) {
    setCollapsedClients(current => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" focusable="false">
            <circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" />
          </svg>
          <span className={styles.srOnly}>Pesquisar cliente, obra ou pessoa</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Pesquisar cliente, obra ou pessoa…" />
        </label>
        <div className={styles.expandActions}>
          <button type="button" onClick={() => setCollapsedClients(new Set())} disabled={clients.length === 0}>Expandir todos</button>
          <button type="button" onClick={() => setCollapsedClients(new Set(clients.map(client => client.key)))} disabled={clients.length === 0}>Recolher todos</button>
        </div>
      </div>
      {query.trim() && (
        <p className={styles.searchResult} role="status">{visibleWorkCount} de {workCount} obras</p>
      )}
      {visibleClients.map(client => {
        const expanded = !collapsedClients.has(client.key)
        const bodyId = `planning-client-${encodeURIComponent(client.key)}`
        return (
          <section key={client.key} className={styles.client}>
            <h3 className={styles.clientHeading}>
              <button className={styles.clientToggle} type="button" aria-expanded={expanded} aria-controls={bodyId} onClick={() => toggleClient(client.key)}>
                <span className={styles.clientIdentity}>
                  <span className={styles.clientIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 21h18M5 21V3h10v18m0-13h4v13M8 7h4m-4 4h4m-4 4h4" /></svg>
                  </span>
                  <span className={styles.clientName}>{client.name}</span>
                  {client.hasConflicts ? (
                    <span className={styles.conflictWarning} role="img" aria-label="Existem afetações que requerem atenção" title="Existem afetações que requerem atenção">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="m12 3 10 18H2L12 3ZM12 9v5m0 3h.01" />
                      </svg>
                    </span>
                  ) : null}
                </span>
                <span className={styles.clientMeta}>
                  <span>{client.workCount} {client.workCount === 1 ? 'obra' : 'obras'}</span>
                  <span>{client.workerCount} {client.workerCount === 1 ? 'trabalhador afetado' : 'trabalhadores afetados'}</span>
                </span>
                <svg className={styles.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={expanded ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></svg>
              </button>
            </h3>
            <div id={bodyId} className={styles.clientBody} hidden={!expanded}>
              <ResponsiveGrid className="vp-planning-work-grid">
                {client.works.map(entry => entry.unplanned ? renderUnplannedWork(entry.work) : renderWork(entry))}
              </ResponsiveGrid>
            </div>
          </section>
        )
      })}
      {query.trim() && visibleClients.length === 0 && (
        <p className={styles.emptySearch}>Nenhum cliente, obra ou pessoa corresponde à pesquisa.</p>
      )}
    </div>
  )
}
