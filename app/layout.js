import './globals.css'
import PwaSetupClient from './components/PwaSetupClient'

export const metadata = {
  title: {
    default: 'Bentix',
    template: '%s | Bentix',
  },
  applicationName: 'Bentix',
  manifest: '/manifest.webmanifest',
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
  themeColor: '#0b1730',
}

const bodyStyle = {
  margin: 0,
  background: 'var(--vp-page-start)',
  color: 'var(--vp-text)',
  '--vp-page-background': [
    'radial-gradient(circle at 14% 16%, rgba(37, 99, 235, 0.14), transparent 26%)',
    'radial-gradient(circle at 88% 10%, rgba(255, 140, 0, 0.14), transparent 22%)',
    'radial-gradient(circle at 82% 78%, rgba(59, 130, 246, 0.08), transparent 24%)',
    'linear-gradient(180deg, #eef4ff 0%, #fbf5ec 52%, #ffe2bc 100%)',
  ].join(', '),
  '--vp-page-start': '#f5efe7',
  '--vp-page-end': '#ffe2bc',
  '--vp-hero-gradient':
    'linear-gradient(135deg, rgba(238,244,255,0.98) 0%, rgba(255,248,239,0.98) 54%, rgba(255,235,210,0.99) 100%)',
  '--vp-module-hero': [
    'radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.28), transparent 24%)',
    'radial-gradient(circle at 86% 88%, rgba(255, 140, 0, 0.22), transparent 22%)',
    'linear-gradient(135deg, #0b1730 0%, #11264b 58%, #1a2238 100%)',
  ].join(', '),
  '--vp-module-hero-border': 'rgba(115, 148, 204, 0.24)',
  '--vp-hero-surface': 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.08) 100%)',
  '--vp-hero-border': 'rgba(255,255,255,0.12)',
  '--vp-hero-text-muted': 'rgba(226, 232, 240, 0.84)',
  '--vp-hero-text-soft': 'rgba(147, 197, 253, 0.82)',
  '--vp-hero-shadow-strong': '0 34px 90px rgba(9, 24, 52, 0.26)',
  '--vp-stat-surface': 'linear-gradient(180deg, rgba(255,252,248,0.98) 0%, rgba(255,239,220,0.95) 100%)',
  '--vp-stat-border': 'rgba(228, 194, 156, 0.92)',
  '--vp-stat-shadow': '0 18px 40px rgba(24, 58, 110, 0.08)',
  '--vp-surface-soft': 'linear-gradient(180deg, rgba(255,251,246,0.97) 0%, rgba(255,239,220,0.94) 100%)',
  '--vp-surface-soft-strong':
    'linear-gradient(180deg, rgba(255,252,248,0.99) 0%, rgba(253,244,233,0.99) 42%, rgba(255,231,202,0.98) 100%)',
  '--vp-surface': '#fff5e8',
  '--vp-surface-alt': '#fff0de',
  '--vp-surface-muted': '#ffedd8',
  '--vp-surface-selection': '#ffe2bf',
  '--vp-highlight': '#e5efff',
  '--vp-highlight-text': '#1d4ed8',
  '--vp-border': '#e7ccb0',
  '--vp-border-strong': '#dcb48b',
  '--vp-accent': '#ff8c00',
  '--vp-accent-strong': '#ea7b00',
  '--vp-text': '#14243d',
  '--vp-text-muted': '#5d7391',
  '--vp-text-soft': '#7991b2',
  '--vp-shadow-soft': '0 18px 44px rgba(24, 58, 110, 0.1)',
  '--vp-shadow-panel': '0 16px 40px rgba(24, 58, 110, 0.1)',
  '--vp-shadow-hero': '0 24px 60px rgba(24, 58, 110, 0.12)',
  '--vp-shadow-modal': '0 24px 70px rgba(15, 30, 64, 0.18)',
  '--vp-overlay': 'rgba(9, 24, 52, 0.46)',
  '--vp-disabled': '#b9c9dd',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body style={bodyStyle}>
        <PwaSetupClient />
        {children}
      </body>
    </html>
  )
}
