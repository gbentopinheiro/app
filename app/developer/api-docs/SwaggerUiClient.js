'use client'

import { useEffect, useRef, useState } from 'react'

const containerStyle = {
  minHeight: '70vh',
}

const errorStyle = {
  padding: '18px 20px',
  borderRadius: '18px',
  border: '1px solid rgba(220, 38, 38, 0.18)',
  background: '#fff5f5',
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: 1.6,
}

export default function SwaggerUiClient({ specUrl }) {
  const containerRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function mountSwaggerUi() {
      try {
        const [{ default: SwaggerUIBundle }, { default: SwaggerUIStandalonePreset }] = await Promise.all([
          import('swagger-ui-dist/swagger-ui-bundle.js'),
          import('swagger-ui-dist/swagger-ui-standalone-preset.js'),
        ])

        if (cancelled || !containerRef.current) {
          return
        }

        containerRef.current.innerHTML = ''

        SwaggerUIBundle({
          url: specUrl,
          domNode: containerRef.current,
          deepLinking: true,
          displayRequestDuration: true,
          docExpansion: 'list',
          filter: true,
          defaultModelsExpandDepth: 1,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
        })
      } catch (mountError) {
        if (!cancelled) {
          setError('Nao foi possivel carregar o Swagger UI nesta pagina.')
        }
      }
    }

    mountSwaggerUi()

    return () => {
      cancelled = true

      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [specUrl])

  if (error) {
    return <div style={errorStyle}>{error}</div>
  }

  return <div ref={containerRef} style={containerStyle} />
}
