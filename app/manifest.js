export default function manifest() {
  return {
    name: 'Bentix Registo Diário',
    short_name: 'Bentix',
    description: 'Registo diário móvel para chefes da Bentix.',
    start_url: '/mobile/chef',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5efe7',
    theme_color: '#0b1730',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
