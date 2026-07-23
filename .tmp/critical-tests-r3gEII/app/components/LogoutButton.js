'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { logoutUser } from '../../frontend/controllers/auth-controller.js'
import { BentixButton } from './ViewportLayout.js'

export default function LogoutButton({
  label = 'Sair',
  redirectTo = '/login',
  variant = 'secondary',
  size = 'md',
  className = '',
  style = {},
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleLogout() {
    setSubmitting(true)

    try {
      await logoutUser()
    } finally {
      router.push(redirectTo)
      router.refresh()
      setSubmitting(false)
    }
  }

  return (
    <BentixButton
      type="button"
      variant={variant}
      size={size}
      loading={submitting}
      onClick={handleLogout}
      className={className}
      style={style}
      aria-label={submitting ? 'A sair' : label}
    >
      {label}
    </BentixButton>
  )
}
