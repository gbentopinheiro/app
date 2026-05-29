'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import EditPencilIcon, { editPencilButtonStyle } from '../components/EditPencilIcon'
import { buildWorkPricingSnapshot, hasWorkPricingChanges } from '../../lib/work-pricing.js'

const pageStyle = {
  minHeight: '100vh',
  padding: '40px 24px 60px',
  background: 'var(--vp-page-background)',
  color: 'var(--vp-text)',
  fontFamily: '"Avenir Next", "Segoe UI", "-apple-system", "BlinkMacSystemFont", sans-serif',
}

const shellStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  display: 'grid',
  gap: '24px',
}

const heroStyle = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--vp-module-hero)',
  border: '1px solid var(--vp-module-hero-border)',
  borderRadius: '32px',
  padding: '28px',
  boxShadow: 'var(--vp-hero-shadow-strong)',
  color: '#ffffff',
  '--vp-text-muted': 'var(--vp-hero-text-muted)',
  '--vp-text-soft': 'var(--vp-hero-text-soft)',
  '--vp-surface': 'var(--vp-hero-surface)',
  '--vp-border': 'var(--vp-hero-border)',
}

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
}

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '14px',
  flex: 1,
}

const statCardStyle = {
  borderRadius: '20px',
  padding: '18px',
  background: 'var(--vp-stat-surface)',
  border: '1px solid var(--vp-stat-border)',
  boxShadow: 'var(--vp-stat-shadow)',
}

const panelStyle = {
  background: 'var(--vp-surface-soft)',
  border: '1px solid var(--vp-border)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-panel)',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'var(--vp-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 50,
}

const modalCardStyle = {
  width: 'min(980px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const inputStyle = {
  width: '100%',
  marginTop: '8px',
  padding: '12px 14px',
  boxSizing: 'border-box',
  borderRadius: '12px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface-muted)',
  fontSize: '14px',
}

const notesTextareaStyle = {
  ...inputStyle,
  minHeight: '72px',
  resize: 'none',
  overflow: 'hidden',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'var(--vp-accent)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  border: '1px solid #b42318',
  borderRadius: '999px',
  padding: '13px 20px',
  background: 'transparent',
  color: '#b42318',
  fontWeight: 700,
  cursor: 'pointer',
}

const iconButtonStyle = editPencilButtonStyle

const iconDangerButtonStyle = {
  ...dangerButtonStyle,
  width: '34px',
  height: '34px',
  padding: 0,
  fontSize: '14px',
}

const workDayOptions = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

const rolePriceOptions = [
  { value: 'chef_primeira', label: 'Chefe de primeira' },
  { value: 'chef_segunda', label: 'Chefe de segunda' },
  { value: 'carpinteiro', label: 'Carpinteiro' },
  { value: 'ferrajeiro', label: 'Ferrajeiro' },
  { value: 'trolha', label: 'Trolha' },
  { value: 'gruista', label: 'Gruista' },
]

const defaultWorkingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const workStatusLabels = {
  planned: 'Planeada',
  in_progress: 'Em curso',
  paused: 'Em pausa',
  completed: 'Concluída',
}

const workingDaysGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '10px',
  marginTop: '8px',
}

const workingDayOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  borderRadius: '12px',
  background: 'var(--vp-surface-muted)',
  border: '1px solid var(--vp-border)',
  fontWeight: 700,
}

const emptyWorkForm = {
  id: null,
  number: '',
  name: '',
  clientId: '',
  location: '',
  status: 'planned',
  budget: '',
  defaultHourlyCost: '',
  roleHourlyCosts: {},
  specialPersonHourlyCosts: {},
  startDate: '',
  endDate: '',
  workingDays: defaultWorkingDays,
  notes: '',
}

const emptyWorkPricingSnapshot = buildWorkPricingSnapshot(emptyWorkForm)

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPricingApplicationStartDate(mode) {
  const today = new Date()

  if (mode === 'month_start') {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  }

  if (mode === 'next_month') {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return toDateInputValue(nextMonth)
  }

  return toDateInputValue(today)
}

function autoResizeTextarea(textarea) {
  if (!textarea) return
  textarea.style.height = '72px'
  textarea.style.height = `${Math.max(textarea.scrollHeight, 72)}px`
}

function getWorkStatusLabel(status) {
  return workStatusLabels[String(status || '').trim()] || workStatusLabels.planned
}

export default function WorksPage() {
  const router = useRouter()
  const [works, setWorks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState(emptyWorkForm)
  const [originalPricingSnapshot, setOriginalPricingSnapshot] = useState(emptyWorkPricingSnapshot)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPricingChangeModal, setShowPricingChangeModal] = useState(false)
  const [pendingWorkPayload, setPendingWorkPayload] = useState(null)
  const [handledEditId, setHandledEditId] = useState('')
  const notesTextareaRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || loading || works.length === 0) return

    const editId = new URLSearchParams(window.location.search).get('edit')
    if (!editId || handledEditId === editId) return

    const workToEdit = works.find(work => String(work.id) === String(editId))
    if (!workToEdit) return

    startEdit(workToEdit)
    setHandledEditId(editId)
  }, [handledEditId, loading, works])

  useEffect(() => {
    autoResizeTextarea(notesTextareaRef.current)
  }, [form.notes, showCreateForm])

  const activeWorks = useMemo(() => works.filter(work => work.status !== 'completed'), [works])
  const archivedWorks = useMemo(() => works.filter(work => work.status === 'completed'), [works])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [worksResponse, clientsResponse] = await Promise.all([
        fetch('/api/works'),
        fetch('/api/clients'),
      ])

      const worksData = await worksResponse.json()
      const clientsData = await clientsResponse.json()

      if (!worksResponse.ok) throw new Error(worksData.error || 'Erro ao carregar obras')
      if (!clientsResponse.ok) throw new Error(clientsData.error || 'Erro ao carregar clientes')

      setWorks(worksData)
      setClients(clientsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setFormErrors(current => ({ ...current, [name]: '' }))
  }

  function handleWorkingDayChange(event) {
    const { value, checked } = event.target

    setForm(current => {
      const currentDays = Array.isArray(current.workingDays) ? current.workingDays : []
      const nextDays = checked
        ? [...new Set([...currentDays, value])]
        : currentDays.filter(day => day !== value)

      return { ...current, workingDays: nextDays }
    })
  }

  function handleRoleHourlyCostChange(event) {
    const { name, value } = event.target
    const role = name.replace('roleHourlyCost-', '')

    setForm(current => ({
      ...current,
      roleHourlyCosts: {
        ...(current.roleHourlyCosts || {}),
        [role]: value,
      },
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'O nome da obra é obrigatório.'
    if (!form.clientId) nextErrors.clientId = 'Seleciona um cliente.'
    if (form.defaultHourlyCost !== '' && Number(form.defaultHourlyCost) < 0) nextErrors.defaultHourlyCost = 'O preço hora não pode ser negativo.'
    if (form.budget !== '' && Number(form.budget) < 0) nextErrors.budget = 'O orçamento não pode ser negativo.'
    if (form.startDate && Number.isNaN(new Date(form.startDate).getTime())) nextErrors.startDate = 'A data de começo é inválida.'
    if (form.endDate && Number.isNaN(new Date(form.endDate).getTime())) nextErrors.endDate = 'A data de finalização é inválida.'

    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      nextErrors.endDate = 'A data de finalização não pode ser anterior ao começo.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function startCreate() {
    setForm(emptyWorkForm)
    setOriginalPricingSnapshot(emptyWorkPricingSnapshot)
    setShowCreateForm(true)
    setSuccess('')
    setError('')
    setFormErrors({})
  }

  function cancelCreate() {
    setShowCreateForm(false)
    setForm(emptyWorkForm)
    setOriginalPricingSnapshot(emptyWorkPricingSnapshot)
    setShowPricingChangeModal(false)
    setPendingWorkPayload(null)
    setFormErrors({})
  }

  function startEdit(work) {
    setForm({
      id: work.id,
      number: work.number ?? '',
      name: work.name ?? '',
      clientId: work.clientId ? String(work.clientId) : '',
      location: work.location ?? '',
      status: work.status ?? 'planned',
      budget: work.budget ?? '',
      defaultHourlyCost: work.defaultHourlyCost ?? '',
      roleHourlyCosts: work.roleHourlyCosts || {},
      specialPersonHourlyCosts: work.specialPersonHourlyCosts || {},
      startDate: work.startDate ?? '',
      endDate: work.endDate ?? '',
      workingDays: Array.isArray(work.workingDays) ? work.workingDays : defaultWorkingDays,
      notes: work.notes ?? '',
    })
    setOriginalPricingSnapshot(buildWorkPricingSnapshot(work))
    setShowCreateForm(true)
    setSuccess('')
    setError('')
    setFormErrors({})
  }

  async function saveWork(payload, pricingChangeApplication = null) {
    const url = form.id ? `/api/works/${form.id}` : '/api/works'
    const method = form.id ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        pricingChangeApplication,
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Erro ao gravar obra')

    await loadData()
    setShowCreateForm(false)
    setShowPricingChangeModal(false)
    setPendingWorkPayload(null)
    setForm(emptyWorkForm)
    setOriginalPricingSnapshot(emptyWorkPricingSnapshot)

    if (pricingChangeApplication?.startDate) {
      const updatedCount = Number(data.repricedAssignmentsCount) || 0
      setSuccess(
        updatedCount > 0
          ? `Obra atualizada e ${updatedCount} afetações ficaram com a nova tarifa.`
          : 'Obra atualizada com a nova tarifa. Nao houve afetacoes elegiveis para atualizar.',
      )
      return
    }

    setSuccess(form.id ? 'Obra atualizada com sucesso.' : 'Obra criada com sucesso.')
  }

  async function confirmPricingChangeApplication(mode = 'none') {
    if (!pendingWorkPayload) {
      return
    }

    setShowPricingChangeModal(false)
    setSubmitting(true)

    try {
      const pricingChangeApplication = mode === 'none'
        ? null
        : {
            mode,
            startDate: getPricingApplicationStartDate(mode),
          }

      await saveWork(pendingWorkPayload, pricingChangeApplication)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const payload = {
        number: form.number === '' ? undefined : Number(form.number),
        name: form.name,
        clientId: Number(form.clientId),
        location: form.location,
        status: form.status,
        budget: form.budget === '' ? 0 : Number(form.budget),
        defaultHourlyCost: form.defaultHourlyCost === '' ? 0 : Number(form.defaultHourlyCost),
        roleHourlyCosts: Object.fromEntries(
          Object.entries(form.roleHourlyCosts || {})
            .filter(([, value]) => value !== '' && value !== null && value !== undefined)
            .map(([role, value]) => [role, Number(value)]),
        ),
        specialPersonHourlyCosts: Object.fromEntries(
          Object.entries(form.specialPersonHourlyCosts || {})
            .filter(([, value]) => value !== '' && value !== null && value !== undefined)
            .map(([personId, value]) => [personId, Number(value)]),
        ),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        workingDays: form.workingDays,
        notes: form.notes,
      }

      if (form.id && hasWorkPricingChanges(payload, originalPricingSnapshot)) {
        setPendingWorkPayload(payload)
        setShowPricingChangeModal(true)
        return
      }

      await saveWork(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(workId) {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/works/${workId}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao eliminar obra')

      await loadData()
      setSuccess('Obra eliminada com sucesso.')
      setShowCreateForm(false)
      setForm(emptyWorkForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function renderWorkRow(work) {
    return (
      <div
        key={work.id}
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/works/${work.id}`)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            router.push(`/works/${work.id}`)
          }
        }}
        style={{
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid var(--vp-border)',
          background: 'var(--vp-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div>
          <strong>#{work.number} - {work.name}</strong>
          <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>{work.client?.name || 'Sem cliente'}</p>
          <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>Estado: {getWorkStatusLabel(work.status)}</p>
          <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
            Dias de trabalho: {(work.workingDays || defaultWorkingDays)
              .map(day => workDayOptions.find(option => option.value === day)?.label)
              .filter(Boolean)
              .join(', ')}
          </p>
          {work.roleHourlyCosts && Object.keys(work.roleHourlyCosts).length > 0 && (
            <p style={{ margin: '6px 0 0', color: 'var(--vp-text-muted)' }}>
              Preços por role definidos: {Object.keys(work.roleHourlyCosts).length}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              startEdit(work)
            }}
            style={iconButtonStyle}
            title="Editar obra"
            aria-label="Editar obra"
          >
            <EditPencilIcon />
          </button>
        </div>
      </div>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <Link href="/" style={{ color: 'var(--vp-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Voltar ao menu
          </Link>
          <h1 style={{ margin: '10px 0 12px', fontSize: '46px', lineHeight: 1.05 }}>
            Lista de obras
          </h1>

        </section>

        <section style={topBarStyle}>
          <div style={statGridStyle}>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Obras totais</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{works.length}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Obras ativas</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{activeWorks.length}</div>
            </article>
            <article style={statCardStyle}>
              <div style={{ fontSize: '12px', color: 'var(--vp-text-soft)', textTransform: 'uppercase' }}>Obras antigas</div>
              <div style={{ marginTop: '8px', fontSize: '32px', fontWeight: 700 }}>{archivedWorks.length}</div>
            </article>
          </div>

          <button type="button" onClick={startCreate} style={primaryButtonStyle}>
            Adicionar obra
          </button>
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Obras ativas</h2>
          {loading && <p>A carregar obras...</p>}
          {!loading && error && <p style={{ color: '#b42318' }}>{error}</p>}
          {!loading && !error && activeWorks.length === 0 && <p>Sem obras ativas.</p>}
          {!loading && !error && activeWorks.length > 0 && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {activeWorks.map(renderWorkRow)}
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Obras antigas com resumo</h2>
          {!loading && archivedWorks.length === 0 && <p>Sem obras antigas.</p>}
          {!loading && archivedWorks.length > 0 && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {archivedWorks.map(renderWorkRow)}
            </div>
          )}
        </section>
      </div>

      {showCreateForm && (
        <div style={modalBackdropStyle} onClick={cancelCreate}>
          <section style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{form.id ? 'Editar obra' : 'Adicionar nova obra'}</h2>

              </div>
              <button type="button" onClick={cancelCreate} style={secondaryButtonStyle}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px', marginTop: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                <label style={{ ...labelStyle, maxWidth: '110px' }}>
                  Número
                  <input type="number" name="number" value={form.number} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Nome da obra
                  <input type="text" name="name" value={form.name} onChange={handleChange} style={inputStyle} />
                  {formErrors.name && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.name}</span>}
                </label>
                <label style={labelStyle}>
                  Cliente
                  <select name="clientId" value={form.clientId} onChange={handleChange} style={inputStyle}>
                    <option value="">Seleciona um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.clientId && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.clientId}</span>}
                </label>
                <label style={labelStyle}>
                  Localização
                  <input type="text" name="location" value={form.location} onChange={handleChange} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Estado
                  <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                    <option value="planned">Planeada</option>
                    <option value="in_progress">Em curso</option>
                    <option value="paused">Em pausa</option>
                    <option value="completed">Concluída</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Orçamento
                  <input type="number" name="budget" min="0" step="0.01" value={form.budget} onChange={handleChange} style={inputStyle} />
                  {formErrors.budget && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.budget}</span>}
                </label>
                <label style={labelStyle}>
                  Preço hora por defeito
                  <input
                    type="number"
                    name="defaultHourlyCost"
                    min="0"
                    step="0.01"
                    value={form.defaultHourlyCost}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  {formErrors.defaultHourlyCost && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.defaultHourlyCost}</span>}
                </label>
                <label style={labelStyle}>
                  Data de começo
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={inputStyle} />
                  {formErrors.startDate && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.startDate}</span>}
                </label>
                <label style={labelStyle}>
                  Data de finalização
                  <input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={inputStyle} />
                  {formErrors.endDate && <span style={{ color: '#b42318', fontSize: '13px' }}>{formErrors.endDate}</span>}
                </label>
              </div>

              <fieldset style={{ border: '1px solid var(--vp-border)', borderRadius: '18px', padding: '16px', margin: 0 }}>
                <legend style={{ padding: '0 8px', fontWeight: 800 }}>Dias em que a obra trabalha</legend>
                <div style={workingDaysGridStyle}>
                  {workDayOptions.map(option => (
                    <label key={option.value} style={workingDayOptionStyle}>
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={(form.workingDays || []).includes(option.value)}
                        onChange={handleWorkingDayChange}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset style={{ border: '1px solid var(--vp-border)', borderRadius: '18px', padding: '16px', margin: 0 }}>
                <legend style={{ padding: '0 8px', fontWeight: 800 }}>Preço por role no plano diário</legend>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginTop: '8px' }}>
                  {rolePriceOptions.map(option => (
                    <label key={option.value} style={labelStyle}>
                      {option.label}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name={`roleHourlyCost-${option.value}`}
                        value={form.roleHourlyCosts?.[option.value] ?? ''}
                        onChange={handleRoleHourlyCostChange}
                        placeholder="Usar preço por defeito"
                        style={inputStyle}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <label style={labelStyle}>
                Notas
                <textarea
                  ref={notesTextareaRef}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  style={notesTextareaStyle}
                ></textarea>
              </label>

              {error && <p style={{ margin: 0, color: '#b42318' }}>{error}</p>}
              {success && <p style={{ margin: 0, color: '#1f7a45' }}>{success}</p>}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                  {submitting ? 'A gravar...' : form.id ? 'Guardar alterações' : 'Criar obra'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(form.id)}
                    disabled={submitting}
                    style={iconDangerButtonStyle}
                    title="Eliminar obra"
                    aria-label="Eliminar obra"
                  >
                    🗑
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}

      {showPricingChangeModal && (
        <div style={modalBackdropStyle} onClick={() => !submitting && setShowPricingChangeModal(false)}>
          <section style={{ ...modalCardStyle, width: 'min(720px, 100%)' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <h2 style={{ margin: 0 }}>Alteracao de precos da obra</h2>
              <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                Mudaste os precos desta obra. Queres so guardar os novos valores para o futuro ou reaplicar a nova tarifa nas afetacoes ainda nao aprovadas?
              </p>
              <p style={{ margin: 0, color: 'var(--vp-text-muted)', fontSize: '13px' }}>
                Horas ja aprovadas mantem o preco antigo. Afetacoes com preco manual tambem nao sao alteradas.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => confirmPricingChangeApplication('none')} style={primaryButtonStyle} disabled={submitting}>
                So guardar os novos precos
              </button>
              <button type="button" onClick={() => confirmPricingChangeApplication('today')} style={secondaryButtonStyle} disabled={submitting}>
                Aplicar a partir de hoje
              </button>
              <button type="button" onClick={() => confirmPricingChangeApplication('month_start')} style={secondaryButtonStyle} disabled={submitting}>
                Aplicar desde o inicio do mes
              </button>
              <button type="button" onClick={() => confirmPricingChangeApplication('next_month')} style={secondaryButtonStyle} disabled={submitting}>
                Aplicar a partir do proximo mes
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

