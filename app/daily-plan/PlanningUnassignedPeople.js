'use client'

import { useMemo, useState } from 'react'
import { SurfaceCard } from '../components/ViewportLayout.js'
import { getPersonDisplayName } from '../../lib/display-names.js'
import { getEntityRoleLabel, getRoleLabel } from '../../lib/roles.js'
import { filterUnassignedPeople } from './planning-board-view.js'
import styles from './DailyPlan.module.css'

const previewLimit = 8

export default function PlanningUnassignedPeople({ people, roleOptions, onViewPeople }) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const filteredPeople = useMemo(() => filterUnassignedPeople(people, { query, role }), [people, query, role])
  const previewPeople = filteredPeople.slice(0, previewLimit)

  return (
    <SurfaceCard as="section" variant="panel" className={styles.unassignedPanel}>
      <div className={styles.unassignedHeading}>
        <h2 className={styles.unassignedTitle}>Pessoas não atribuídas · {people.length}</h2>
        <div className={styles.unassignedControls}>
          <label className={`${styles.search} ${styles.unassignedSearch}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" focusable="false">
              <circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" />
            </svg>
            <span className={styles.srOnly}>Pesquisar pessoa não atribuída</span>
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Pesquisar trabalhador…" />
          </label>
          <select className={styles.unassignedRoleSelect} aria-label="Filtrar pessoas não atribuídas por função" value={role} onChange={event => setRole(event.target.value)}>
            <option value="all">Todas as funções</option>
            {roleOptions.map(value => <option key={value} value={value}>{getRoleLabel(value)}</option>)}
          </select>
          <button className={`vp-planning-action-button ${styles.planAction} ${styles.secondaryPlanAction}`} type="button" onClick={() => onViewPeople({ query, role })}>
            Ver pessoas
          </button>
        </div>
      </div>
      {previewPeople.length > 0 ? (
        <ul className={styles.unassignedPreview} aria-label="Pessoas não atribuídas">
          {previewPeople.map(person => (
            <li key={person.id} className={styles.unassignedPerson} data-person-id={person.id}>
              <strong className={styles.unassignedPersonName}>{getPersonDisplayName(person, person.id)}</strong>
              {getEntityRoleLabel(person) ? <span className={styles.unassignedPersonRole}>{getEntityRoleLabel(person)}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.teamEmpty}>
          {people.length === 0 ? 'Não há pessoas não atribuídas para este dia.' : 'Nenhuma pessoa corresponde à pesquisa ou à função selecionada.'}
        </p>
      )}
      {people.length > 0 ? <p className={styles.unassignedCount} role="status">A mostrar {previewPeople.length} de {filteredPeople.length} pessoas{filteredPeople.length > previewPeople.length ? ' · Ver pessoas para consultar as restantes.' : '.'}</p> : null}
    </SurfaceCard>
  )
}
