'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BentixButton } from './ViewportLayout.js'

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
  width: 'min(760px, 100%)',
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

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 700,
}

const worksListStyle = {
  display: 'grid',
  gap: '10px',
  border: '1px solid var(--vp-border)',
  borderRadius: '16px',
  padding: '14px',
  background: 'var(--vp-surface-muted)',
  maxHeight: '260px',
  overflowY: 'auto',
}

function getCurrentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function normalizeMonthValue(value) {
  const normalizedValue = String(value || '').trim().slice(0, 7)
  return /^\d{4}-\d{2}$/.test(normalizedValue) ? normalizedValue : ''
}

export function ClientSummaryExportForm({
  client,
  works,
  submitting = false,
  serverError = '',
  onClose,
  onSubmit,
  title = 'Exportar',
  subtitle,
  closeLabel = 'Fechar',
  primarySubmitLabel = 'Exportar PDF',
  secondarySubmitLabel = 'Exportar Excel',
}) {
  const availableWorks = useMemo(
    () => (Array.isArray(works) ? works.map(work => ({ ...work, id: String(work.id) })) : []),
    [works],
  )
  const defaultMonth = useMemo(() => getCurrentMonthValue(), [])
  const lastAutoSummaryNameRef = useRef('')
  const [selectedWorkIds, setSelectedWorkIds] = useState([])
  const [startMonth, setStartMonth] = useState(defaultMonth)
  const [endMonth, setEndMonth] = useState(defaultMonth)
  const [summaryName, setSummaryName] = useState('')
  const [localError, setLocalError] = useState('')
  const [submissionFormat, setSubmissionFormat] = useState('pdf')

  useEffect(() => {
    const workIds = availableWorks.map(work => work.id)
    const automaticSummaryName = workIds.length === 1 ? availableWorks[0]?.name || '' : ''

    setSelectedWorkIds(workIds)
    setStartMonth(defaultMonth)
    setEndMonth(defaultMonth)
    setSummaryName(automaticSummaryName)
    lastAutoSummaryNameRef.current = automaticSummaryName
    setLocalError('')
  }, [availableWorks, defaultMonth])

  useEffect(() => {
    if (!submitting) {
      setSubmissionFormat('pdf')
    }
  }, [submitting])

  useEffect(() => {
    const selectedWorks = availableWorks.filter(work => selectedWorkIds.includes(work.id))
    const nextAutoSummaryName = selectedWorks.length === 1 ? String(selectedWorks[0]?.name || '').trim() : ''

    if (summaryName === '' || summaryName === lastAutoSummaryNameRef.current) {
      setSummaryName(nextAutoSummaryName)
    }

    lastAutoSummaryNameRef.current = nextAutoSummaryName
  }, [availableWorks, selectedWorkIds, summaryName])

  function handleToggleWork(workId, checked) {
    setSelectedWorkIds(current => (
      checked
        ? Array.from(new Set([...current, workId]))
        : current.filter(candidate => candidate !== workId)
    ))
    setLocalError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const requestedFormat = event.nativeEvent?.submitter?.dataset?.format === 'xlsx' ? 'xlsx' : 'pdf'
    const normalizedStartMonth = normalizeMonthValue(startMonth)
    const normalizedEndMonth = normalizeMonthValue(endMonth)
    const normalizedSummaryName = String(summaryName || '').trim()
    const uniqueWorkIds = Array.from(new Set(selectedWorkIds))

    if (!normalizedStartMonth || !normalizedEndMonth) {
      setLocalError('Seleciona os meses inicial e final.')
      return
    }

    if (normalizedStartMonth > normalizedEndMonth) {
      setLocalError('O mês final não pode ser anterior ao mês inicial.')
      return
    }

    if (uniqueWorkIds.length === 0) {
      setLocalError('Seleciona pelo menos uma obra.')
      return
    }

    if (!normalizedSummaryName) {
      setLocalError('Indica o nome do resumo.')
      return
    }

    setLocalError('')
    setSubmissionFormat(requestedFormat)

    await onSubmit({
      workIds: uniqueWorkIds.map(workId => Number.parseInt(workId, 10)),
      startMonth: normalizedStartMonth,
      endMonth: normalizedEndMonth,
      summaryName: normalizedSummaryName,
    }, requestedFormat)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
            {subtitle || client?.name || 'Cliente'}
          </p>
        </div>
        {onClose ? (
          <BentixButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {closeLabel}
          </BentixButton>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <label style={labelStyle}>
            Mês inicial
            <input
              type="month"
              value={startMonth}
              onChange={event => {
                setStartMonth(event.target.value)
                setLocalError('')
              }}
              style={inputStyle}
              disabled={submitting}
              required
            />
          </label>

          <label style={labelStyle}>
            Mês final
            <input
              type="month"
              value={endMonth}
              onChange={event => {
                setEndMonth(event.target.value)
                setLocalError('')
              }}
              style={inputStyle}
              disabled={submitting}
              required
            />
          </label>
        </div>

        <label style={labelStyle}>
          Nome do resumo
          <input
            type="text"
            value={summaryName}
            onChange={event => {
              setSummaryName(event.target.value)
              setLocalError('')
            }}
            style={inputStyle}
            disabled={submitting}
            maxLength={120}
            required
          />
        </label>

        <div style={{ display: 'grid', gap: '10px' }}>
          <strong style={{ fontSize: '14px' }}>Obras</strong>
          <div style={worksListStyle}>
            {availableWorks.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--vp-text-muted)' }}>
                Não existem obras disponíveis para este cliente.
              </p>
            ) : (
              availableWorks.map(work => {
                const isChecked = selectedWorkIds.includes(work.id)

                return (
                  <label
                    key={work.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={event => handleToggleWork(work.id, event.target.checked)}
                      disabled={submitting}
                    />
                    <span>{work.name}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>

        {(localError || serverError) && (
          <p style={{ margin: 0, color: '#b42318', fontWeight: 700 }}>
            {localError || serverError}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          <BentixButton
            type="submit"
            data-format="pdf"
            variant="primary"
            onClick={() => setSubmissionFormat('pdf')}
            loading={submitting && submissionFormat === 'pdf'}
            disabled={availableWorks.length === 0}
          >
            {primarySubmitLabel}
          </BentixButton>
          <BentixButton
            type="submit"
            data-format="xlsx"
            variant="secondary"
            onClick={() => setSubmissionFormat('xlsx')}
            loading={submitting && submissionFormat === 'xlsx'}
            disabled={submitting || availableWorks.length === 0}
          >
            {secondarySubmitLabel}
          </BentixButton>
        </div>
      </form>
    </>
  )
}

export default function ClientSummaryExportModal({
  client,
  works,
  submitting = false,
  serverError = '',
  onClose,
  onSubmit,
}) {
  return (
    <div style={modalBackdropStyle} onClick={submitting ? undefined : onClose}>
      <section
        className="vp-modal-card"
        style={modalCardStyle}
        onClick={event => event.stopPropagation()}
      >
        <ClientSummaryExportForm
          client={client}
          works={works}
          submitting={submitting}
          serverError={serverError}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  )
}
