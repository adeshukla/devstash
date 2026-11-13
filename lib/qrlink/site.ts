import 'server-only'

/**
 * The site's own origin, used for links in emails and for Google's redirect address. It is never
 * taken from a header the sender controls: only the configured site, localhost, or a Vercel
 * preview host is accepted, so a forged Host header cannot point a reset email at another site.
 */
export function siteBase(request: Request): string {
  const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://devstash.me')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  if (host === configured.host) return configured.origin
  if (/^localhost(:\d{2,5})?$/.test(host)) return `http://${host}`
  if (/^[a-z0-9-]+\.vercel\.app$/.test(host)) return `https://${host}`
  return configured.origin
}
