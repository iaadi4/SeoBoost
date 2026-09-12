import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://boost-seo.vercel.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
  },
]

const PUBLIC_HOST = 'https://boost-seo.vercel.app'

/** 308 custom domain → Vercel public host. Never the reverse. */
export const APEX_HOST_REDIRECTS = [
  {
    source: '/',
    has: [{ type: 'host' as const, value: 'seoboost.app' }],
    destination: `${PUBLIC_HOST}/`,
    statusCode: 308 as const,
  },
  {
    source: '/:path*',
    has: [{ type: 'host' as const, value: 'seoboost.app' }],
    destination: `${PUBLIC_HOST}/:path*`,
    statusCode: 308 as const,
  },
  {
    source: '/',
    has: [{ type: 'host' as const, value: 'www.seoboost.app' }],
    destination: `${PUBLIC_HOST}/`,
    statusCode: 308 as const,
  },
  {
    source: '/:path*',
    has: [{ type: 'host' as const, value: 'www.seoboost.app' }],
    destination: `${PUBLIC_HOST}/:path*`,
    statusCode: 308 as const,
  },
]

const nextConfig: NextConfig = {
  async redirects() {
    return APEX_HOST_REDIRECTS
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
