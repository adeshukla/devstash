import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  /**
   * Permanent (308) redirects. Add an entry here whenever you rename a slug or
   * move a route, so you don't lose SEO equity or hand visitors a 404.
   *
   * Example:
   *   { source: '/blog/old-slug', destination: '/blog/new-slug', permanent: true }
   *   { source: '/resume', destination: '/resume-adesh-shukla.pdf', permanent: false }
   *
   * `permanent: true`  → 308 (use for genuine, lasting moves; passes link equity).
   * `permanent: false` → 307 (temporary).
   */
  async redirects() {
    return [
      // Add redirects here as routes/slugs change. Empty for now.
    ]
  },

  /**
   * Security headers on every response. HSTS is intentionally absent — Vercel
   * sets Strict-Transport-Security itself on HTTPS custom domains. A full
   * Content-Security-Policy is a future task: it needs nonces for the inline
   * JSON-LD scripts and allowances for GA/Clarity before it can be strict
   * enough to be worth shipping.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Browsers must not MIME-sniff responses into executable types.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // No page on this site needs to be iframed — blocks clickjacking.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Send the origin only on cross-origin navigation, never the full URL.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // This site uses none of these sensors/APIs — deny by default.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
