import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  // `next dev` rejects cross-origin requests to its own assets/HMR socket by
  // default (CSRF hardening) unless the requesting origin is allowlisted here
  // — without this, tunneling localhost through ngrok/similar to test on a
  // real phone loads a broken/incomplete page (JS/CSS/HMR silently blocked),
  // not an error you'd otherwise see. Dev-only: this key is a no-op outside
  // `next dev`, but scoped explicitly anyway to match the devEval pattern
  // below rather than relying on that alone.
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok-free.dev', '*.ngrok.io', '*.ngrok.app'],
  }),

  images: {
    // AVIF first — next/image already serves WebP, but AVIF is typically
    // 20-30% smaller again on modern browsers; it falls back to WebP/original
    // automatically per the client's Accept header, so this is free.
    formats: ['image/avif', 'image/webp'],
  },

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
   * img-src allows c.bing.com because Microsoft Clarity fires an ID-sync
   * pixel at `c.bing.com/c.gif?...&RedC=c.clarity.ms`. Without it the browser
   * blocks the request and logs a CSP error to the console on every page load,
   * which Lighthouse then reports under "Browser errors were logged to the
   * console". Scoped to img-src only (one host, images only) rather than
   * widening script-src or connect-src.
   * `<script type="application/ld+json">` is exempt from script-src by spec
   * (browsers never parse it as JS), so JSON-LD needs no allowance at all.
   * 'unsafe-inline' in script-src covers only the 3 first-party analytics
   * bootstrap snippets (GTM/GA/Clarity in components/layout/Analytics.tsx) —
   * fixed, developer-authored strings, not user input.
   */
  async headers() {
    // React dev mode calls eval() for debugging (stack-frame reconstruction);
    // it never does in production. Scoped to dev only so prod script-src stays strict.
    const devEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
    const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-inline'${devEval} https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://www.google.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://*.clarity.ms https://c.bing.com;
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
