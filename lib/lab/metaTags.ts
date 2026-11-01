// Output builders for the Lab meta tag generator. Pure, no React and no "@/"
// imports so node:test can run it.

export interface MetaInput {
  title: string
  description: string
  url: string
  siteName: string
  image: string
  twitter: string
  type: 'website' | 'article'
}

/** Escapes a value for use inside an HTML attribute or text node. */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Only the tags that have a value: an empty content="" is worse than none. */
export function buildHtml(m: MetaInput): string {
  const tag = (open: string, value: string, close = ' />') =>
    value.trim() ? `${open}"${escapeAttr(value.trim())}"${close}` : ''
  const lines = [
    m.title.trim() ? `<title>${escapeAttr(m.title.trim())}</title>` : '',
    tag('<meta name="description" content=', m.description),
    tag('<link rel="canonical" href=', m.url),
    '',
    tag('<meta property="og:type" content=', m.type),
    tag('<meta property="og:title" content=', m.title),
    tag('<meta property="og:description" content=', m.description),
    tag('<meta property="og:url" content=', m.url),
    tag('<meta property="og:site_name" content=', m.siteName),
    tag('<meta property="og:image" content=', m.image),
    '',
    '<meta name="twitter:card" content="summary_large_image" />',
    tag('<meta name="twitter:title" content=', m.title),
    tag('<meta name="twitter:description" content=', m.description),
    tag('<meta name="twitter:image" content=', m.image),
    tag('<meta name="twitter:site" content=', m.twitter),
  ]
  return lines
    .filter((l, i) => l !== '' || (lines[i - 1] !== '' && i > 0))
    .join('\n')
    .trim()
}

/** Next.js App Router `metadata` export, the form most of this tool's audience pastes. */
export function buildNextMetadata(m: MetaInput): string {
  const s = (v: string) => JSON.stringify(v.trim())
  const field = (key: string, v: string, indent = 2) =>
    v.trim() ? `${' '.repeat(indent)}${key}: ${s(v)},` : ''
  const images = m.image.trim() ? `images: [${s(m.image)}]` : ''
  const lines = [
    "import type { Metadata } from 'next'",
    '',
    'export const metadata: Metadata = {',
    field('title', m.title),
    field('description', m.description),
    m.url.trim() ? `  alternates: { canonical: ${s(m.url)} },` : '',
    '  openGraph: {',
    field('title', m.title, 4),
    field('description', m.description, 4),
    field('url', m.url, 4),
    field('siteName', m.siteName, 4),
    `    type: ${s(m.type)},`,
    images ? `    ${images},` : '',
    '  },',
    '  twitter: {',
    "    card: 'summary_large_image',",
    field('title', m.title, 4),
    field('description', m.description, 4),
    field('site', m.twitter, 4),
    images ? `    ${images},` : '',
    '  },',
    '}',
  ]
  return lines.filter((l, i) => l !== '' || i === 1).join('\n')
}

export type JsonLdType = 'WebPage' | 'Article'

/** A script tag. "<" is escaped so a title can never close it early. */
export function buildJsonLd(m: MetaInput, type: JsonLdType): string {
  const data: Record<string, unknown> =
    type === 'Article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: m.title.trim(),
          description: m.description.trim(),
          ...(m.image.trim() && { image: m.image.trim() }),
          ...(m.url.trim() && { mainEntityOfPage: { '@type': 'WebPage', '@id': m.url.trim() } }),
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: m.title.trim(),
          description: m.description.trim(),
          ...(m.url.trim() && { url: m.url.trim() }),
          ...(m.image.trim() && {
            primaryImageOfPage: { '@type': 'ImageObject', url: m.image.trim() },
          }),
          ...(m.siteName.trim() && { isPartOf: { '@type': 'WebSite', name: m.siteName.trim() } }),
        }
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">\n${json}\n</script>`
}

export interface Fitted {
  text: string
  truncated: boolean
  width: number
}

/** Trims text to a pixel budget, the way search results cut it, with an ellipsis. */
export function fitToWidth(text: string, maxPx: number, measure: (s: string) => number): Fitted {
  const full = measure(text)
  if (full <= maxPx) return { text, truncated: false, width: full }
  let end = text.length
  while (end > 0 && measure(`${text.slice(0, end).trimEnd()}…`) > maxPx) end--
  const out = `${text.slice(0, end).trimEnd()}…`
  return { text: out, truncated: true, width: measure(out) }
}
