/** @type {import('next').NextConfig} */
const productionSecurityHeaders =
  process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ]
    : []

const nextConfig = {
  async headers() {
    if (productionSecurityHeaders.length === 0) {
      return []
    }

    return [
      {
        source: '/:path*',
        headers: productionSecurityHeaders,
      },
    ]
  },
}

export default nextConfig
