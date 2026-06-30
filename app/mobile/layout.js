export const metadata = {
  title: {
    default: 'Bentix Mobile',
    template: '%s | Bentix',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b1730',
}

export default function MobileLayout({ children }) {
  return children
}
