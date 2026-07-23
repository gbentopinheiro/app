'use client'

import { BentixButton } from './ViewportLayout.js'

export default function ModalCloseButton({
  disabled = false,
  onClick,
}) {
  return (
    <BentixButton
      type="button"
      variant="ghost"
      size="md"
      iconOnly
      aria-label="Fechar"
      title="Fechar"
      onClick={onClick}
      disabled={disabled}
      style={{ fontSize: '20px', lineHeight: 1 }}
    >
      <span aria-hidden="true">✕</span>
    </BentixButton>
  )
}
