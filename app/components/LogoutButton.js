'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const defaultStyle = {
  border: '1px solid var(--vp-accent)',
  borderRadius: '999px',
  padding: '10px 16px',
  background: 'transparent',
  color: 'var(--vp-accent)',
  fontWeight: 700,
  cursor: 'pointer',
}

export default function LogoutButton({ label = 'Sair', redirectTo = '/login', style = {} }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleLogout() {
    setSubmitting(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } finally {
      router.push(redirectTo)
      router.refresh()
      setSubmitting(false)
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={submitting} style={{ ...defaultStyle, ...style }}>
      {submitting ? 'A sair...' : label}
    </button>
  )
}
