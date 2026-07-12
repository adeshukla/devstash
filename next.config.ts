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
   * sets Strict-Transport-Security itself on HTTPS custom domains.
   *
   * CSP is a static, allowlist-based policy rather than the nonce +
   * 'strict-dynamic' pattern from the Next.js docs. Nonces require every
   * component that renders an inline <script> to call headers() from
   * next/headers, which opts the *entire route* out of static rendering —
   * that would force every blog/project page (currently statically
   * generated) to render on every request, which conflicts with RULE 7
   * (perf budget is non-negotiable) for a marginal hardening gain here.
   * `<script type="application/ld+json">` is exempt from script-src by spec
   * (browsers never parse it as JS), so JSON-LD needs no allowance at all.
   * 'unsafe-inline' in script-src covers only the 3 first-party analytics
   * bootstrap snippets (GTM/GA/Clarity in components/layout/Analytics.tsx) —
   * fixed, developer-authored strings, not user input.
   */
  async headers() {
    const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://www.google.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data:;
      font-src 'self' data:;
      connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms;
      frame-src https://www.google.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, ' ')
      .trim()

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
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
