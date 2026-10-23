'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { apiFetchJson } from '../../frontend/api/api-client.js'
import { roleCanHaveAppAccess, roleUsesWorkScope } from '../../lib/roles.js'
import { BentixButton } from '../components/ViewportLayout.js'
import EditPencilIcon from '../components/EditPencilIcon'
import PersonDocumentsPanel from './[id]/PersonDocumentsPanel.js'
import styles from './PeopleWorkspace.module.css'

const tabs = [['summary', 'Resumo'], ['hours', 'Horas e obras'], ['documents', 'Documentos'], ['access', 'Acesso']]

function initials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  return [words[0]?.[0], words.length > 1 ? words.at(-1)[0] : ''].join('').toLocaleUpperCase('pt-PT')
}

function Avatar({ name, large = false }) {
  return <span className={`${styles.avatar}${large ? ` ${styles.avatarLarge}` : ''}`} aria-hidden="true">{initials(name)}</span>
}

function Icon({ kind }) {
  const paths = {
    people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 .13a4 4 0 0 1 0 7.75',
    calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z',
    clock: 'M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
    search: 'm21 21-4.4-4.4M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z',
    export: 'M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6',
  }
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>
}

function Documents({ personId }) {
  const [state, setState] = useState({ loading: true, items: [], error: '' })
  useEffect(() => {
    const controller = new AbortController()
    apiFetchJson(`/api/people/${personId}/documents`, { signal: controller.signal })
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os documentos.')
        if (!controller.signal.aborted) setState({ loading: false, items: data, error: '' })
      })
      .catch(error => { if (!controller.signal.aborted) setState({ loading: false, items: [], error: error.message }) })
    return () => controller.abort()
  }, [personId])
  if (state.loading) return <p className={styles.empty} role="status">A carregar documentos...</p>
  if (state.error) return <p role="alert" className={styles.error}>{state.error}</p>
  return <div className={styles.documents}><PersonDocumentsPanel personId={personId} initialDocuments={state.items} /></div>
}

export default function PeopleWorkspace({
  people, filteredPeople, selectedPerson, selectedAccessIdentity, monthlyCount, hourlyCount,
  searchTerm, onSearch, onSelect, onOpenPerson, onCreate, onEdit, onExport,
  canManagePeople, isResponsavelView, loading, error, success, showForm,
  documentAlerts, onPrintAlerts, monthlyAssignmentSummary, formatDateLabel, getPersonRoleLabel, formatCurrency,
}) {
  const [tab, setTab] = useState('summary')
  const detailRef = useRef(null)
  const listRef = useRef(null)
  const tabId = useId()
  const person = selectedPerson
  const roleLabel = person ? getPersonRoleLabel(person) : ''

  function selectPerson(id) {
    onSelect(id)
    if (window.matchMedia('(max-width: 899px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' }))
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.heading}><h1>Trabalhadores</h1></div>
        <label className={styles.search}>
          <Icon kind="search" />
          <input type="search" aria-label="Pesquisar trabalhador pelo nome" placeholder="Pesquisar trabalhador..." value={searchTerm} onChange={event => onSearch(event.target.value)} />
        </label>
        {canManagePeople ? <div className={styles.actions}>
          <BentixButton onClick={onExport}><Icon kind="export" /><span>Exportar</span><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg></BentixButton>
          <BentixButton variant="primary" onClick={onCreate}><span aria-hidden="true">+</span><span>Adicionar trabalhador</span></BentixButton>
        </div> : <Link className={styles.backLink} href="/">Voltar ao menu</Link>}
      </header>

      {canManagePeople ? <section className={styles.stats} aria-label="Resumo de pessoas">
        {[['Pessoas totais', people.length, 'people'], ['Mensais', monthlyCount, 'calendar'], ['Horárias', hourlyCount, 'clock']].map(([label, value, icon]) =>
          <article key={label} className={styles.stat}><span className={styles.statIcon}><Icon kind={icon} /></span><div className={styles.statCopy}><strong>{value}</strong><span className={styles.statLabel}>{label}</span></div></article>,
        )}
      </section> : null}

      {!showForm && error ? <p role="alert" className={styles.error}>{error}</p> : null}
      {!showForm && success ? <p role="status" className={styles.success}>{success}</p> : null}

      <div className={`${styles.workspace}${canManagePeople ? '' : ` ${styles.restricted}`}`}>
        <section className={styles.panel} ref={listRef} aria-labelledby={`${tabId}-list-title`}>
          <div className={styles.panelHeading}><h2 id={`${tabId}-list-title`}>Lista de trabalhadores</h2><span className={styles.count}>{filteredPeople.length}</span></div>
          {loading ? <p className={styles.empty} role="status">A carregar pessoas...</p> : null}
          {!loading && people.length === 0 ? <p className={styles.empty}>Sem pessoas registadas.</p> : null}
          {!loading && people.length > 0 && filteredPeople.length === 0 ? <p className={styles.empty}>Nenhuma pessoa encontrada com esse nome.</p> : null}

          {isResponsavelView && documentAlerts.length > 0 ? <div className={styles.alerts}>
            <div className={styles.alertHeading}><strong>Documentos a rever</strong><BentixButton size="sm" onClick={onPrintAlerts}>Imprimir folha</BentixButton></div>
            {documentAlerts.map(item => <Link key={item.id} href={`/people/${item.id}`}><strong>{item.name}</strong><span>{item.documentAlertLabel}{item.documentAlertCount > 1 ? ` · ${item.documentAlertCount} documentos` : ''}</span></Link>)}
          </div> : null}

          {!loading ? <div className={styles.list}>{filteredPeople.map(item => {
            const selected = Number(person?.id) === Number(item.id)
            if (isResponsavelView) return <Link key={item.id} className={styles.personRow} href={`/people/${item.id}`}><Avatar name={item.name} /><span className={styles.personText}><strong>{item.name}</strong></span><span aria-hidden="true">›</span></Link>
            return <div key={item.id} className={`${styles.personRow}${selected ? ` ${styles.selected}` : ''}`}>
              <button type="button" className={styles.selectPerson} aria-pressed={selected} onClick={() => selectPerson(item.id)} onDoubleClick={() => onOpenPerson(item.id)} title="Selecionar pessoa. Duplo clique para abrir a ficha completa.">
                <Avatar name={item.name} /><span className={styles.personText}><strong>{item.name}</strong><span>{getPersonRoleLabel(item)}</span></span>
              </button>
              <Link className={styles.openPerson} href={`/people/${item.id}`} aria-label={`Abrir ficha de ${item.name}`} title="Abrir ficha completa">›</Link>
            </div>
          })}</div> : null}
        </section>

        {canManagePeople ? <section className={`${styles.panel} ${styles.detail}`} ref={detailRef} aria-label="Detalhe do trabalhador">
          <button type="button" className={styles.mobileBack} onClick={() => listRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })}>‹ Voltar à lista</button>
          {!person ? <p className={styles.empty}>Seleciona uma pessoa para veres o detalhe.</p> : <>
            <div className={styles.detailHeader}>
              <Avatar name={person.name} large />
              <div className={styles.detailName}><h2>{person.name}</h2><p>{roleLabel}</p></div>
              <BentixButton size="sm" onClick={() => onEdit(person)} aria-label="Editar pessoa"><EditPencilIcon /><span>Editar</span></BentixButton>
            </div>
            <div className={styles.tabs} role="tablist" aria-label="Secções da ficha" onKeyDown={event => {
              const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
              if (!offset && event.key !== 'Home' && event.key !== 'End') return
              event.preventDefault()
              const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (tabs.findIndex(([key]) => key === tab) + offset + tabs.length) % tabs.length
              setTab(tabs[index][0]); event.currentTarget.querySelectorAll('[role="tab"]')[index].focus()
            }}>
              {tabs.map(([key, label]) => <button key={key} type="button" role="tab" id={`${tabId}-${key}`} aria-selected={tab === key} aria-controls={`${tabId}-panel`} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)}>{label}</button>)}
            </div>
            <div className={styles.tabPanel} role="tabpanel" id={`${tabId}-panel`} aria-labelledby={`${tabId}-${tab}`} tabIndex={0}>
              {tab === 'summary' ? <><h3>Resumo</h3><dl className={`${styles.facts} ${styles.summaryFacts}`}>
                <div><dt>Função</dt><dd>{roleLabel}</dd></div>
                <div><dt>Modalidade</dt><dd>{person.isMonthlyBilling ? 'Mensal' : 'Horária'}</dd></div>
                <div><dt>{person.isMonthlyBilling ? 'Preço mensal' : 'Preço hora'}</dt><dd>{person.isMonthlyBilling ? formatCurrency(person.monthlyPrice) : `${formatCurrency(person.price)}/h`}</dd></div>
              </dl></> : null}
              {tab === 'hours' ? <><h3>Horas e obras</h3><p className={styles.secondary}>Histórico mensal</p>
                {monthlyAssignmentSummary.length === 0 ? <p className={styles.empty}>Sem afetações registadas para esta pessoa.</p> : null}
                {monthlyAssignmentSummary.map(month => <details className={styles.month} key={month.monthKey}>
                  <summary>{month.label}<span>{month.totalHours}h</span></summary>
                  {month.days.map(day => <div className={styles.day} key={day.date}><div><strong>{formatDateLabel(day.date)}</strong><span>{day.totalHours}h</span></div>{day.works.map(work => <div key={work.name}><span>{work.name}</span><strong>{work.hours}h</strong></div>)}</div>)}
                </details>)}
              </> : null}
              {tab === 'documents' ? <Documents key={person.id} personId={person.id} /> : null}
              {tab === 'access' ? <><h3>Acesso à aplicação</h3>{roleCanHaveAppAccess(person.role) || selectedAccessIdentity ? <dl className={styles.facts}>
                <div><dt>Nome de utilizador</dt><dd>{selectedAccessIdentity?.username || 'Sem acesso configurado'}</dd></div>
                {roleUsesWorkScope(person.role) ? <div className={styles.fullFact}><dt>Obras</dt><dd>{selectedAccessIdentity?.works?.length ? selectedAccessIdentity.works.map(work => work.name || `Obra ${work.id}`).join(', ') : 'Sem obras atribuídas'}</dd></div> : null}
              </dl> : <p className={styles.empty}>Sem acesso à aplicação para esta função.</p>}</> : null}
            </div>
            <div className={styles.detailFooter}><Link href={`/people/${person.id}`}>Abrir ficha completa e histórico <span aria-hidden="true">→</span></Link></div>
          </>}
        </section> : null}
      </div>
    </>
  )
}
