import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devstash.me'

  return {
    rules: [
      {
        userAgent: '*',
        // /_next/ is deliberately NOT blocked: Googlebot needs the JS and CSS there
        // to render pages. Only the API (except the OG image route) and admin are off-limits.
        allow: ['/', '/api/og'],
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
