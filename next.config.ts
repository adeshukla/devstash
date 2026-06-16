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
}

export default nextConfig
