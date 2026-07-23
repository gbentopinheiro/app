'use client'

import { useEffect, useState } from 'react'
import { ClientSummaryExportForm } from './ClientSummaryExportModal.js'
import { BentixButton } from './ViewportLayout.js'
import ModalCloseButton from './ModalCloseButton.js'

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
  width: 'min(860px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  background: 'var(--vp-surface-soft-strong)',
  border: '1px solid var(--vp-border)',
  borderRadius: '28px',
  padding: '24px',
  boxShadow: 'var(--vp-shadow-modal)',
}

const reportOptionStyle = {
  display: 'grid',
  gap: '16px',
  padding: '20px',
  borderRadius: '20px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
}

export default function ClientReportsModal({
  client,
  works,
  summaryExportSubmitting = false,
  summaryExportError = '',
  exportingAnnualPdf = false,
  onClose,
  onExportAnnualSummaryPdf,
  onSubmitWorkedHoursSummary,
}) {
  const [mode, setMode] = useState('menu')

  useEffect(() => {
    setMode('menu')
  }, [client?.id])

  const isBusy = summaryExportSubmitting || exportingAnnualPdf

  function handleClose() {
    if (isBusy) {
      return
    }

    setMode('menu')
    onClose?.()
  }

  function handleOpenWorkedHours() {
    setMode('worked-hours')
  }

  return (
    <div style={modalBackdropStyle} onClick={isBusy ? undefined : handleClose}>
      <section
        className="vp-modal-card"
        style={modalCardStyle}
        onClick={event => event.stopPropagation()}
      >
        {mode === 'worked-hours' ? (
          <ClientSummaryExportForm
            client={client}
            works={works}
            submitting={summaryExportSubmitting}
            serverError={summaryExportError}
            onClose={() => setMode('menu')}
            onSubmit={onSubmitWorkedHoursSummary}
            title="Resumo de horas trabalhadas"
            subtitle="Seleciona as obras, o período mensal e o nome do resumo a exportar."
            closeLabel="Voltar"
            primarySubmitLabel="Exportar PDF"
            secondarySubmitLabel="Exportar Excel"
          />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gap: '6px' }}>
                <h2 style={{ margin: 0 }}>Relatórios</h2>
              </div>
              <ModalCloseButton onClick={handleClose} disabled={isBusy} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
              <article style={reportOptionStyle}>
                <h3 style={{ margin: 0 }}>Resumo anual</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                  <BentixButton
                    type="button"
                    variant="primary"
                    onClick={onExportAnnualSummaryPdf}
                    loading={exportingAnnualPdf}
                    disabled={summaryExportSubmitting}
                  >
                    Exportar PDF
                  </BentixButton>
                </div>
              </article>

              <article style={reportOptionStyle}>
                <h3 style={{ margin: 0 }}>Resumo de horas</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                  <BentixButton
                    type="button"
                    variant="secondary"
                    onClick={handleOpenWorkedHours}
                    disabled={isBusy}
                  >
                    Configurar resumo
                  </BentixButton>
                </div>
              </article>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
