import Script from 'next/script'
import { buildPwaBootstrapScript } from '../../lib/pwa-bootstrap.js'

export default function PwaSetupClient() {
  return (
    <Script id="bentix-pwa-bootstrap" strategy="beforeInteractive">
      {buildPwaBootstrapScript()}
    </Script>
  )
}
