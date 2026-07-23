'use client'

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

const reportOptionStyle = {
  display: 'grid',
  gap: '16px',
  padding: '20px',
  borderRadius: '20px',
  border: '1px solid var(--vp-border)',
  background: 'var(--vp-surface)',
}

export default function CompanyReportsModal({
  exportingAnnualPdf = false,
  error = '',
  onClose,
  onExportAnnualSummaryPdf,
}) {
  const isBusy = exportingAnnualPdf

  function handleClose() {
    if (isBusy) {
      return
    }

    onClose?.()
  }

  return (
    <div style={modalBackdropStyle} onClick={handleClose}>
      <section
        className="vp-modal-card"
        style={modalCardStyle}
        onClick={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '6px' }}>
            <h2 style={{ margin: 0 }}>Relatórios</h2>
          </div>
          <ModalCloseButton onClick={handleClose} disabled={isBusy} />
        </div>

        <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
          <article style={reportOptionStyle}>
            <h3 style={{ margin: 0 }}>Resumo anual da empresa</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              <BentixButton
                type="button"
                variant="primary"
                onClick={onExportAnnualSummaryPdf}
                loading={exportingAnnualPdf}
              >
                Exportar PDF
              </BentixButton>
            </div>
            {error ? (
              <p style={{ margin: 0, color: '#b42318' }}>{error}</p>
            ) : null}
          </article>
        </div>
      </section>
    </div>
  )
}
