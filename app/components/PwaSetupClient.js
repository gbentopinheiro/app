'use client'

import { useEffect } from 'react'
import { bootstrapPwa } from '../../lib/pwa-bootstrap.js'

export default function PwaSetupClient() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    bootstrapPwa()
  }, [])

  return null
}
