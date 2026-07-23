import { readFile } from 'fs/promises'
import { join } from 'path'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hasPermission } from '../../../lib/permissions.js'
import { getServerSession } from '../../../lib/server-session.js'
import SwaggerUiClient from './SwaggerUiClient'
import { ViewportPage, ViewportScrollArea, ViewportShell } from '../../components/ViewportLayout.js'

const swaggerUiCssPromise = readFile(
  join(process.cwd(), 'node_modules', 'swagger-ui-dist', 'swagger-ui.css'),
  'utf8',
)

export const metadata = {
  title: 'Bentix API Docs',
  description: 'Swagger UI interno da Bentix.',
}

const pageStyle = {
  minHeight: '100vh',
  padding: 'clamp(20px, 4vw, 42px) 22px 56px',
  background: 'linear-gradient(180deg, #081224 0%, #0d1b35 30%, #edf3fb 30%, #f7f8fb 100%)',
  color: '#10233e',
  fontFamily: 'var(--btx-font-family)',
}

const shellStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
  display: 'grid',
  gap: '22px',
}

const heroStyle = {
  display: 'grid',
  gap: '18px',
  borderRadius: '34px',
  padding: '30px',
  background: 'linear-gradient(135deg, #071226 0%, #10284d 58%, #1c2940 100%)',
  border: '1px solid rgba(150, 185, 255, 0.18)',
  boxShadow: '0 40px 90px rgba(6, 16, 32, 0.32)',
  color: '#ffffff',
}

const heroTopStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
  padding: '10px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#bfdbfe',
  fontSize: '12px',
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const actionRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
}

const linkButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '42px',
  padding: '0 16px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 700,
  backdropFilter: 'blur(12px)',
}

const heroTitleStyle = {
  margin: 0,
  fontSize: 'clamp(34px, 6vw, 58px)',
  lineHeight: 0.98,
  letterSpacing: '-0.06em',
  fontWeight: 900,
}

const heroTextStyle = {
  margin: 0,
  maxWidth: '820px',
  color: 'rgba(226, 232, 240, 0.86)',
  fontSize: '15px',
  lineHeight: 1.7,
}

const panelStyle = {
  borderRadius: '30px',
  overflow: 'hidden',
  background: '#ffffff',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
}

export default async function DeveloperApiDocsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!hasPermission(session, 'developer.dashboard.read')) {
    redirect('/')
  }

  const swaggerUiCss = await swaggerUiCssPromise

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: swaggerUiCss }} />
      <ViewportPage lockViewport style={pageStyle}>
        <ViewportShell fillHeight style={shellStyle}>
          <section style={heroStyle}>
            <div style={heroTopStyle}>
              <span style={badgeStyle}>Bentix API Docs</span>
              <div style={actionRowStyle}>
                <Link href="/developer" style={linkButtonStyle}>
                  Voltar ao developer
                </Link>
                <a href="/api/docs/openapi.json" target="_blank" rel="noreferrer" style={linkButtonStyle}>
                  Abrir OpenAPI JSON
                </a>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <h1 style={heroTitleStyle}>
                Swagger UI interno da <span style={{ color: '#ff8c00' }}>Bentix</span>
              </h1>
              <p style={heroTextStyle}>
                Esta pagina carrega a documentacao diretamente de <code>/api/docs/openapi.json</code> e
                fica protegida dentro da area developer, sem alterar os contratos da API nem o endpoint
                OpenAPI existente.
              </p>
            </div>
          </section>

          <ViewportScrollArea style={{ '--vp-page-scroll-gap': '22px' }}>
            <section style={panelStyle}>
              <SwaggerUiClient specUrl="/api/docs/openapi.json" />
            </section>
          </ViewportScrollArea>
        </ViewportShell>
      </ViewportPage>
    </>
  )
}

