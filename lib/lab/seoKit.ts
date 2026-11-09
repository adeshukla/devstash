// Generators for the Next.js SEO files a new App Router site needs. Pure, no React and
// no "@/" imports so node:test can run it.

export interface Faq {
  q: string
  a: string
}

/**
 * Reads "Q: ... / A: ..." pairs. A new "Q:" line starts the next pair, so blank lines between
 * pairs are optional; a blank line ends an answer, so stray notes after it are ignored.
 */
export function parseFaqs(text: string): Faq[] {
  const out: Faq[] = []
  let cur: { q: string; a: string; stage: 'q' | 'a' | 'done' } | null = null
  const push = () => {
    if (cur && cur.q.trim() && cur.a.trim()) out.push({ q: cur.q.trim(), a: cur.a.trim() })
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    const q = line.match(/^Q:\s*(.*)$/i)
    const a = line.match(/^A:\s*(.*)$/i)
    if (q) {
      push()
      cur = { q: q[1], a: '', stage: 'q' }
    } else if (!cur) continue
    else if (a && cur.stage === 'q') {
      cur.stage = 'a'
      cur.a = a[1]
    } else if (!line) {
      if (cur.stage === 'a') cur.stage = 'done'
    } else if (cur.stage === 'a') cur.a += ` ${line}`
    else if (cur.stage === 'q') cur.q += ` ${line}`
  }
  push()
  return out
}

/** A FAQPage script tag. "<" is escaped so an answer can never close it early. */
export function buildFaqJsonLd(faqs: Faq[]): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">\n${json}\n</script>`
}

/** Lines of text to non-empty trimmed entries. */
function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

/**
 * Origin only: "https://x.com/a/b?c" becomes "https://x.com". Empty when it is not a web
 * address: another scheme (ftp://), or a host with no dot that is not localhost.
 */
export function origin(site: string): string {
  const s = site.trim()
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) && !/^https?:\/\//i.test(s)) return ''
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/\//, '')}`)
    return u.hostname.includes('.') || u.hostname === 'localhost' ? u.origin : ''
  } catch {
    return ''
  }
}

/**
 * `app/robots.ts`. Blocking /_next/ stops Googlebot rendering the page, so it is filtered out.
 * Paths get a leading slash; "/" and "*" alone would hide the whole site, so they are dropped.
 */
export function buildRobotsTs(site: string, disallowText: string): string {
  const base = origin(site)
  const disallow = [
    ...new Set(
      lines(disallowText)
        .map((p) => (p.startsWith('/') || p.startsWith('*') ? p : `/${p}`))
        .filter((p) => p !== '/' && p !== '*' && !p.startsWith('/_next'))
    ),
  ]
  const out = [
    "import type { MetadataRoute } from 'next'",
    '',
    'export default function robots(): MetadataRoute.Robots {',
    '  return {',
    '    rules: {',
    "      userAgent: '*',",
    "      allow: '/',",
    ...(disallow.length ? [`      disallow: ${JSON.stringify(disallow)},`] : []),
    '    },',
    ...(base ? [`    sitemap: ${JSON.stringify(`${base}/sitemap.xml`)},`] : []),
    '  }',
    '}',
  ]
  return out.join('\n')
}

/**
 * `app/sitemap.ts`. No lastModified: `new Date()` would stamp every page as changed on every
 * build, and Google learns to ignore dates that are not real.
 */
export function buildSitemapTs(site: string, pathsText: string): string {
  const base = origin(site)
  // One entry per page: full URLs and paths both work, query and #hash are dropped (they
  // are not separate pages), spaces are encoded, repeats removed.
  const entry = (line: string): string => {
    try {
      const abs = /^https?:\/\//i.test(line)
      // "//host/x" must stay a path on this site, never a different host.
      const rel = abs ? line : `/${line.replace(/^\/+/, '')}`
      const u = new URL(rel, abs ? undefined : base || 'https://x.invalid')
      const root = !abs && !base ? '' : u.origin
      return u.pathname === '/' && root ? root : `${root}${u.pathname}`
    } catch {
      return ''
    }
  }
  const urls = [...new Set(lines(pathsText).map(entry).filter(Boolean))]
  const rows = (urls.length ? urls : [base || '/']).map((u) => `    { url: ${JSON.stringify(u)} },`)
  return [
    "import type { MetadataRoute } from 'next'",
    '',
    'export default function sitemap(): MetadataRoute.Sitemap {',
    '  return [',
    ...rows,
    '  ]',
    '}',
  ].join('\n')
}

export interface OgImageInput {
  title: string
  siteName: string
  background: string
  accent: string
}

/** Accepts #rgb or #rrggbb only; anything else falls back so the file never has a bad color. */
export function safeColor(value: string, fallback: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : fallback
}

/** `app/opengraph-image.tsx` using next/og. All user text goes through JSON.stringify. */
export function buildOgImageTsx(o: OgImageInput): string {
  const bg = safeColor(o.background, '#0b0f19')
  const accent = safeColor(o.accent, '#3b82f6')
  return [
    "import { ImageResponse } from 'next/og'",
    '',
    `export const alt = ${JSON.stringify(o.title.trim() || 'Page title')}`,
    'export const size = { width: 1200, height: 630 }',
    "export const contentType = 'image/png'",
    '',
    'export default function Image() {',
    '  return new ImageResponse(',
    '    (',
    '      <div',
    '        style={{',
    "          width: '100%',",
    "          height: '100%',",
    "          display: 'flex',",
    "          flexDirection: 'column',",
    "          justifyContent: 'space-between',",
    '          padding: 80,',
    `          background: ${JSON.stringify(bg)},`,
    "          color: '#f3f4f6',",
    '        }}',
    '      >',
    `        <div style={{ fontSize: 32, color: ${JSON.stringify(accent)} }}>{${JSON.stringify(o.siteName.trim() || 'Site name')}}</div>`,
    `        <div style={{ fontSize: 76, lineHeight: 1.1 }}>{${JSON.stringify(o.title.trim() || 'Page title')}}</div>`,
    '      </div>',
    '    ),',
    '    { ...size }',
    '  )',
    '}',
  ].join('\n')
}
