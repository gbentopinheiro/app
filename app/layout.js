import './globals.css'
import { Inter } from 'next/font/google'
import PwaSetupClient from './components/PwaSetupClient'
import { appendBuildVersion } from '../lib/pwa-version.js'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
})

const manifestPath = appendBuildVersion('/manifest.webmanifest')

export const metadata = {
  title: {
    default: 'Bentix',
    template: '%s | Bentix',
  },
  applicationName: 'Bentix',
  manifest: manifestPath,
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Bentix',
    statusBarStyle: 'default',
  },
  description: 'Plataforma de gestao operacional da Bentix',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#102E49',
}

const bodyStyle = {
  margin: 0,
  background: 'var(--btx-color-background)',
  color: 'var(--btx-color-text-primary)',
  '--vp-page-background': [
    'radial-gradient(circle at 14% 16%, rgba(24, 59, 91, 0.08), transparent 24%)',
    'radial-gradient(circle at 88% 10%, rgba(184, 94, 0, 0.06), transparent 18%)',
    'linear-gradient(180deg, var(--btx-color-background) 0%, var(--btx-color-surface-subtle) 100%)',
  ].join(', '),
  '--vp-page-start': 'var(--btx-color-background)',
  '--vp-page-end': 'var(--btx-color-surface-subtle)',
  '--vp-hero-gradient':
    'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(247,250,252,0.99) 100%)',
  '--vp-module-hero': [
    'radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.1), transparent 26%)',
    'radial-gradient(circle at 86% 88%, rgba(184, 94, 0, 0.12), transparent 20%)',
    'linear-gradient(135deg, var(--btx-color-navy-strong) 0%, #163854 58%, var(--btx-color-navy) 100%)',
  ].join(', '),
  '--vp-module-hero-border': 'rgba(220, 228, 234, 0.2)',
  '--vp-hero-surface': 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.08) 100%)',
  '--vp-hero-border': 'rgba(255,255,255,0.12)',
  '--vp-hero-text-muted': 'rgba(234, 241, 246, 0.88)',
  '--vp-hero-text-soft': 'rgba(220, 228, 234, 0.76)',
  '--vp-hero-shadow-strong': '0 34px 90px rgba(16, 46, 73, 0.24)',
  '--vp-stat-surface': 'var(--btx-color-surface)',
  '--vp-stat-border': 'var(--btx-color-border)',
  '--vp-stat-shadow': '0 18px 40px rgba(16, 46, 73, 0.08)',
  '--vp-surface-soft': 'var(--btx-color-surface)',
  '--vp-surface-soft-strong': 'var(--btx-color-surface)',
  '--vp-surface': 'var(--btx-color-surface)',
  '--vp-surface-alt': 'var(--btx-color-surface-subtle)',
  '--vp-surface-muted': 'var(--btx-color-surface-subtle)',
  '--vp-surface-selection': 'var(--btx-color-primary-soft)',
  '--vp-highlight': 'var(--btx-color-navy-soft)',
  '--vp-highlight-text': 'var(--btx-color-navy-strong)',
  '--vp-border': 'var(--btx-color-border)',
  '--vp-border-strong': 'var(--btx-color-border-strong)',
  '--vp-accent': 'var(--btx-color-primary)',
  '--vp-accent-strong': 'var(--btx-color-primary-hover)',
  '--vp-text': 'var(--btx-color-text-primary)',
  '--vp-text-muted': 'var(--btx-color-text-secondary)',
  '--vp-text-soft': 'var(--btx-color-text-muted)',
  '--btx-font-family': 'var(--font-inter)',
  '--vp-shadow-soft': '0 18px 44px rgba(16, 46, 73, 0.08)',
  '--vp-shadow-panel': '0 16px 40px rgba(16, 46, 73, 0.08)',
  '--vp-shadow-hero': '0 24px 60px rgba(16, 46, 73, 0.12)',
  '--vp-shadow-modal': '0 24px 70px rgba(16, 46, 73, 0.16)',
  '--vp-overlay': 'rgba(16, 46, 73, 0.42)',
  '--vp-disabled': '#9dadbd',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <body className={inter.variable} style={bodyStyle}>
        <PwaSetupClient />
        {children}
      </body>
    </html>
  )
}
