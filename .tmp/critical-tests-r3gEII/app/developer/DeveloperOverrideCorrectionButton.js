'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteDeveloperDailyPlanOverrideWorkAssignment,
  fetchDeveloperDailyPlanOverrideWorkAssignment,
  updateDeveloperDailyPlanOverrideWorkAssignment,
} from '../../frontend/controllers/developer-controller.js'

const actionButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '42px',
  padding: '0 18px',
  borderRadius: '999px',
  border: '1px solid rgba(255, 140, 0, 0.28)',
  background: '#ff8c00',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
}

const quickActionButtonStyle = active => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '40px',
  padding: '0 14px',
  borderRadius: '999px',
  border: active ? '1px solid rgba(255, 140, 0, 0.3)' : '1px solid rgba(148, 163, 184, 0.22)',
  background: active ? '#ff8c00' : '#ffffff',
  color: active ? '#ffffff' : '#10233e',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
})

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(7, 18, 38, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  zIndex: 1000,
}

const modalStyle = {
  width: 'min(760px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  overflowX: 'hidden',
  borderRadius: '26px',
  padding: '24px',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 28px 60px rgba(15, 23, 42, 0.28)',
}

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
}

const modalTitleStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '26px',
  fontWeight: 900,
  letterSpacing: '-0.04em',
}

const formGridStyle = {
  display: 'grid',
  gap: '16px',
  marginTop: '20px',
}

const fieldGridStyle = {
  display: 'grid',
  gap: '8px',
}

const fieldLabelStyle = {
  margin: 0,
  color: '#10233e',
  fontSize: '13px',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: '46px',
  padding: '12px 14px',
  borderRadius: '14px',
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: '#ffffff',
  color: '#10233e',
  fontSize: '15px',
}

const textareaStyle = {
  ...inputStyle,
  minHeight: '120px',
  resize: 'vertical',
  fontFamily: 'inherit',
}

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
}

const infoCardStyle = {
  padding: '14px 16px',
  borderRadius: '18px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

const infoLabelStyle = {
  margin: 0,
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const infoValueStyle = {
  margin: '8px 0 0',
  color: '#10233e',
  fontSize: '15px',
  lineHeight: 1.5,
  fontWeight: 800,
}

const messageStyle = type => ({
  padding: '12px 14px',
  borderRadius: '14px',
  border: type === 'error' ? '1px solid rgba(239, 68, 68, 0.18)' : '1px solid rgba(34, 197, 94, 0.18)',
  background: type === 'error' ? '#fff1f2' : '#f0fdf4',
  color: type === 'error' ? '#9f1239' : '#166534',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: 1.6,
})

const modalActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '8px',
}

const modalButtonStyle = primary => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '44px',
  padding: '0 18px',
  borderRadius: '999px',
  border: primary ? '1px solid rgba(255, 140, 0, 0.28)' : '1px solid rgba(148, 163, 184, 0.22)',
  background: primary ? '#ff8c00' : '#ffffff',
  color: primary ? '#ffffff' : '#10233e',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
})

const closeButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '999px',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: '#ffffff',
  color: '#10233e',
  fontSize: '24px',
  lineHeight: 1,
  cursor: 'pointer',
}

const dangerButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '44px',
  padding: '0 18px',
  borderRadius: '999px',
  border: '1px solid rgba(239, 68, 68, 0.24)',
  background: '#fff1f2',
  color: '#9f1239',
  fontSize: '14px',
  fontWeight: 800,
  cursor: 'pointer',
}

const quickActionsWrapStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  marginTop: '18px',
}

const helperCardStyle = {
  padding: '16px 18px',
  borderRadius: '18px',
  background: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  color: '#475569',
  fontSize: '14px',
  lineHeight: 1.7,
}

const statusHelperCardStyle = tone => ({
  padding: '16px 18px',
  borderRadius: '18px',
  background:
    tone === 'success'
      ? '#f0fdf4'
      : '#fff7ed',
  border:
    tone === 'success'
      ? '1px solid rgba(34, 197, 94, 0.18)'
      : '1px solid rgba(249, 115, 22, 0.18)',
  color:
    tone === 'success'
      ? '#166534'
      : '#9a3412',
  display: 'grid',
  gap: '6px',
  lineHeight: 1.65,
})

function formatDate(value) {
  if (!value) {
    return 'Sem data'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getWorkLabel(work) {
  if (!work) {
    return 'Sem obra'
  }

  if (work.number) {
    return `#${work.number} - ${work.name}`
  }

  return work.name || 'Sem obra'
}

const QUICK_ACTIONS = [
  { key: 'assignment', label: 'Corrigir afetacao errada' },
  { key: 'hours', label: 'Corrigir horas' },
  { key: 'notes', label: 'Corrigir notas' },
  { key: 'reopen_plan', label: 'Reabrir plano bloqueado' },
]

const QUICK_ACTION_STATUS = {
  assignment: {
    tone: 'warning',
    label: 'Preparacao visual',
    helper: 'Corrigir afetacao errada esta exposto aqui para alinhamento visual. Validar sempre o fluxo tecnico antes de o assumir como rotina fechada.',
  },
  hours: {
    tone: 'success',
    label: 'Ja funcional',
    helper: 'Corrigir horas ja usa o fluxo tecnico atual e grava pela infraestrutura de override existente.',
  },
  notes: {
    tone: 'success',
    label: 'Ja funcional',
    helper: 'Corrigir notas ja usa o fluxo tecnico atual e grava pela infraestrutura de override existente.',
  },
  reopen_plan: {
    tone: 'warning',
    label: 'Preparacao visual',
    helper: 'Reabrir plano bloqueado continua apenas preparado visualmente nesta fase e nao executa nenhuma nova API.',
  },
}

export default function DeveloperOverrideCorrectionButton({ peopleOptions = [], workOptions = [] }) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [quickAction, setQuickAction] = useState('assignment')
  const [assignmentId, setAssignmentId] = useState('')
  const [reason, setReason] = useState('')
  const [personId, setPersonId] = useState('')
  const [workId, setWorkId] = useState('')
  const [hours, setHours] = useState('')
  const [notes, setNotes] = useState('')
  const [currentAssignment, setCurrentAssignment] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [submitMessage, setSubmitMessage] = useState(null)
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isModalOpen || quickAction === 'reopen_plan') {
      return undefined
    }

    const trimmedAssignmentId = String(assignmentId).trim()

    if (!trimmedAssignmentId) {
      setCurrentAssignment(null)
      setLoadError(null)
      setPersonId('')
      setWorkId('')
      setHours('')
      setNotes('')
      setIsLoadingAssignment(false)
      return undefined
    }

    if (!/^\d+$/.test(trimmedAssignmentId)) {
      setCurrentAssignment(null)
      setLoadError('Introduz um Assignment ID valido.')
      setPersonId('')
      setWorkId('')
      setHours('')
      setNotes('')
      setIsLoadingAssignment(false)
      return undefined
    }

    let cancelled = false
    const timeoutId = setTimeout(async () => {
      try {
        setIsLoadingAssignment(true)
        setLoadError(null)
        setCurrentAssignment(null)
        setSubmitMessage(null)

        const { response, data: payload } = await fetchDeveloperDailyPlanOverrideWorkAssignment(trimmedAssignmentId)

        if (!response.ok) {
          throw new Error(payload.error || 'Erro ao carregar a afetacao.')
        }

        if (cancelled) {
          return
        }

        setCurrentAssignment(payload.item || null)
        setPersonId(payload.item?.personId !== undefined && payload.item?.personId !== null ? String(payload.item.personId) : '')
        setWorkId(payload.item?.workId !== undefined && payload.item?.workId !== null ? String(payload.item.workId) : '')
        setHours(
          payload.item?.hours !== undefined && payload.item?.hours !== null ? String(payload.item.hours) : '',
        )
        setNotes(payload.item?.notes || '')
      } catch (error) {
        if (cancelled) {
          return
        }

        setCurrentAssignment(null)
        setPersonId('')
        setWorkId('')
        setHours('')
        setNotes('')
        setLoadError(error.message || 'Erro ao carregar a afetacao.')
      } finally {
        if (!cancelled) {
          setIsLoadingAssignment(false)
        }
      }
    }, 320)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [assignmentId, isModalOpen, quickAction])

  function resetModalState() {
    setQuickAction('assignment')
    setAssignmentId('')
    setReason('')
    setPersonId('')
    setWorkId('')
    setHours('')
    setNotes('')
    setCurrentAssignment(null)
    setLoadError(null)
    setSubmitMessage(null)
    setIsLoadingAssignment(false)
    setIsSubmitting(false)
  }

  function openModal() {
    setIsModalOpen(true)
    resetModalState()
  }

  function closeModal() {
    if (isSubmitting) {
      return
    }

    setIsModalOpen(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (quickAction === 'reopen_plan') {
      setSubmitMessage({
        type: 'error',
        text: 'Reabrir plano bloqueado esta apenas preparado visualmente nesta fase.',
      })
      return
    }

    if (!currentAssignment) {
      setSubmitMessage({ type: 'error', text: 'Carrega primeiro uma afetacao valida.' })
      return
    }

    if (!String(reason).trim()) {
      setSubmitMessage({ type: 'error', text: 'O motivo e obrigatorio.' })
      return
    }

    if (quickAction === 'assignment' && (String(workId).trim() === '' || String(personId).trim() === '')) {
      setSubmitMessage({ type: 'error', text: 'Seleciona a obra e a pessoa.' })
      return
    }

    if ((quickAction === 'assignment' || quickAction === 'hours') && String(hours).trim() === '') {
      setSubmitMessage({ type: 'error', text: 'As horas sao obrigatorias.' })
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitMessage(null)

      const body = {
        workId: Number(workId || currentAssignment.workId),
        personId: Number(personId || currentAssignment.personId),
        hours: Number(hours),
        notes,
        reason,
      }

      const { response, data: payload } = await updateDeveloperDailyPlanOverrideWorkAssignment(
        currentAssignment.id,
        body,
      )

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao gravar a correcao tecnica.')
      }

      setCurrentAssignment(payload.item || currentAssignment)
      setPersonId(
        payload.item?.personId !== undefined && payload.item?.personId !== null
          ? String(payload.item.personId)
          : String(body.personId),
      )
      setWorkId(
        payload.item?.workId !== undefined && payload.item?.workId !== null
          ? String(payload.item.workId)
          : String(body.workId),
      )
      setHours(
        payload.item?.hours !== undefined && payload.item?.hours !== null ? String(payload.item.hours) : String(body.hours),
      )
      setNotes(payload.item?.notes || '')
      setReason('')
      setSubmitMessage({
        type: 'success',
        text: payload.message || 'Correcao tecnica gravada com sucesso.',
      })
      router.refresh()
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error.message || 'Erro ao gravar a correcao tecnica.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!currentAssignment) {
      setSubmitMessage({ type: 'error', text: 'Carrega primeiro uma afetacao valida.' })
      return
    }

    if (!String(reason).trim()) {
      setSubmitMessage({ type: 'error', text: 'O motivo e obrigatorio.' })
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitMessage(null)

      const { response, data: payload } = await deleteDeveloperDailyPlanOverrideWorkAssignment(
        currentAssignment.id,
        { reason },
      )

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao remover a afetacao.')
      }

      setCurrentAssignment(null)
      setAssignmentId('')
      setPersonId('')
      setWorkId('')
      setHours('')
      setNotes('')
      setReason('')
      setSubmitMessage({
        type: 'success',
        text: payload.message || 'Afetacao removida com sucesso.',
      })
      router.refresh()
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error.message || 'Erro ao remover a afetacao.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleQuickActionChange(nextAction) {
    setQuickAction(nextAction)
    setSubmitMessage(null)
    if (nextAction === 'reopen_plan') {
      setLoadError(null)
      setCurrentAssignment(null)
    }
  }

  const companyId =
    currentAssignment?.workPlan?.companyId ??
    currentAssignment?.work?.companyId ??
    currentAssignment?.person?.companyId ??
    null
  const availablePeople = companyId
    ? peopleOptions.filter(person => Number(person.companyId) === Number(companyId))
    : peopleOptions
  const availableWorks = companyId
    ? workOptions.filter(work => Number(work.companyId) === Number(companyId))
    : workOptions
  const showAssignmentScope = quickAction === 'assignment'
  const showHoursField = quickAction === 'assignment' || quickAction === 'hours'
  const showNotesField = quickAction === 'assignment' || quickAction === 'notes'
  const quickActionStatus = QUICK_ACTION_STATUS[quickAction] || QUICK_ACTION_STATUS.assignment

  return (
    <>
      <button type="button" style={actionButtonStyle} onClick={openModal}>
        Nova correcao
      </button>

      {isModalOpen ? (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={event => event.stopPropagation()}>
            <div style={headerRowStyle}>
              <div>
                <h3 style={modalTitleStyle}>Nova correcao</h3>
              </div>
              <button type="button" style={closeButtonStyle} onClick={closeModal} disabled={isSubmitting} aria-label="Fechar">
                ×
              </button>
            </div>

            <div style={quickActionsWrapStyle}>
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.key}
                  type="button"
                  style={quickActionButtonStyle(quickAction === action.key)}
                  onClick={() => handleQuickActionChange(action.key)}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <article style={statusHelperCardStyle(quickActionStatus.tone)}>
              <strong>{quickActionStatus.label}</strong>
              <span>{quickActionStatus.helper}</span>
            </article>

            <form style={formGridStyle} onSubmit={handleSubmit}>
              {quickAction === 'reopen_plan' ? (
                <article style={helperCardStyle}>
                  Reabrir plano bloqueado fica preparado aqui para a proxima fase. Nesta versao ainda nao executa
                  nenhuma acao nem chama nova API.
                </article>
              ) : (
                <div style={fieldGridStyle}>
                  <label htmlFor="developer-override-assignment-id" style={fieldLabelStyle}>
                    Assignment ID
                  </label>
                  <input
                    id="developer-override-assignment-id"
                    type="number"
                    min="1"
                    step="1"
                    value={assignmentId}
                    onChange={event => {
                      setAssignmentId(event.target.value)
                      setLoadError(null)
                      setSubmitMessage(null)
                    }}
                    style={inputStyle}
                    placeholder="Ex.: 164"
                  />
                </div>
              )}

              {isLoadingAssignment ? <div style={messageStyle('success')}>A carregar a afetacao...</div> : null}
              {loadError ? <div style={messageStyle('error')}>{loadError}</div> : null}

              {currentAssignment ? (
                <>
                  <div style={infoGridStyle}>
                    <article style={infoCardStyle}>
                      <p style={infoLabelStyle}>Obra atual</p>
                      <p style={infoValueStyle}>{getWorkLabel(currentAssignment.work)}</p>
                    </article>
                    <article style={infoCardStyle}>
                      <p style={infoLabelStyle}>Pessoa atual</p>
                      <p style={infoValueStyle}>{currentAssignment.person?.name || 'Sem pessoa'}</p>
                    </article>
                    <article style={infoCardStyle}>
                      <p style={infoLabelStyle}>Data</p>
                      <p style={infoValueStyle}>{formatDate(currentAssignment.date)}</p>
                    </article>
                    <article style={infoCardStyle}>
                      <p style={infoLabelStyle}>Horas atuais</p>
                      <p style={infoValueStyle}>{currentAssignment.hours ?? '0'}</p>
                    </article>
                  </div>

                  {showAssignmentScope ? (
                    <>
                      <div style={fieldGridStyle}>
                        <label htmlFor="developer-override-work" style={fieldLabelStyle}>
                          Nova obra
                        </label>
                        <select
                          id="developer-override-work"
                          value={workId}
                          onChange={event => {
                            setWorkId(event.target.value)
                            setSubmitMessage(null)
                          }}
                          style={inputStyle}
                        >
                          <option value="">Seleciona uma obra</option>
                          {availableWorks.map(work => (
                            <option key={work.id} value={work.id}>
                              {getWorkLabel(work)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldGridStyle}>
                        <label htmlFor="developer-override-person" style={fieldLabelStyle}>
                          Nova pessoa
                        </label>
                        <select
                          id="developer-override-person"
                          value={personId}
                          onChange={event => {
                            setPersonId(event.target.value)
                            setSubmitMessage(null)
                          }}
                          style={inputStyle}
                        >
                          <option value="">Seleciona uma pessoa</option>
                          {availablePeople.map(person => (
                            <option key={person.id} value={person.id}>
                              {person.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : null}

                  {showHoursField ? (
                    <div style={fieldGridStyle}>
                      <label htmlFor="developer-override-hours" style={fieldLabelStyle}>
                        Horas
                      </label>
                      <input
                        id="developer-override-hours"
                        type="number"
                        min="0"
                        step="0.25"
                        value={hours}
                        onChange={event => {
                          setHours(event.target.value)
                          setSubmitMessage(null)
                        }}
                        style={inputStyle}
                      />
                    </div>
                  ) : null}

                  {showNotesField ? (
                    <div style={fieldGridStyle}>
                      <label htmlFor="developer-override-notes" style={fieldLabelStyle}>
                        Notas
                      </label>
                      <textarea
                        id="developer-override-notes"
                        value={notes}
                        onChange={event => {
                          setNotes(event.target.value)
                          setSubmitMessage(null)
                        }}
                        style={textareaStyle}
                        placeholder="Sem notas"
                      />
                    </div>
                  ) : null}

                  {!showNotesField && quickAction === 'hours' ? (
                    <article style={helperCardStyle}>
                      O atalho de horas deixa as restantes alteracoes fora do foco desta correcao.
                    </article>
                  ) : null}

                  {!showHoursField && quickAction === 'notes' ? (
                    <article style={helperCardStyle}>
                      O atalho de notas deixa a correcao centrada apenas no texto registado.
                    </article>
                  ) : null}

                  <div style={fieldGridStyle}>
                    <label htmlFor="developer-override-reason" style={fieldLabelStyle}>
                      Motivo
                    </label>
                    <textarea
                      id="developer-override-reason"
                      value={reason}
                      onChange={event => {
                        setReason(event.target.value)
                        setSubmitMessage(null)
                      }}
                      style={{ ...textareaStyle, minHeight: '110px' }}
                      placeholder="Descreve a correcao tecnica necessaria."
                    />
                  </div>
                </>
              ) : null}

              {submitMessage ? <div style={messageStyle(submitMessage.type)}>{submitMessage.text}</div> : null}

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  style={dangerButtonStyle}
                  onClick={handleDelete}
                  disabled={isSubmitting || !currentAssignment || isLoadingAssignment || quickAction === 'reopen_plan'}
                >
                  {isSubmitting ? 'A processar...' : 'Remover afetacao'}
                </button>
                <button
                  type="submit"
                  style={modalButtonStyle(true)}
                  disabled={isSubmitting || (!currentAssignment && quickAction !== 'reopen_plan') || isLoadingAssignment}
                >
                  {isSubmitting ? 'A guardar...' : 'Guardar correcao'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
