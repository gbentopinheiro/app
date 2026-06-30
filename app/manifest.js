export default function manifest() {
  return {
    name: 'Bentix',
    short_name: 'Bentix',
    description: 'Experiencia mobile Bentix para chefes e registo diario.',
    start_url: '/mobile/chef',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5efe7',
    theme_color: '#0b1730',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
