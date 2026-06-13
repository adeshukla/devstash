// lib/seo/ogImage.ts

import { siteConfig } from '@/content/metadata/site.config'

export interface OgImageParams {
  title: string
  description?: string
  type?: 'website' | 'article' | 'project'
  category?: string
  readingTime?: number
}

/**
 * Builds an absolute, fully-encoded /api/og URL for use as an `ogImage`.
 *
 * Pure helper — no React, no server-only imports — safe in edge, client, and
 * server contexts. `URLSearchParams.toString()` percent-encodes every value,
 * so reserved characters in the title/description are handled automatically.
 *
 * Falls back to `siteConfig.url` (localhost in dev) when `NEXT_PUBLIC_SITE_URL`
 * is unset, so the URL is always well-formed.
 */
export function buildOgImageUrl(params: OgImageParams): string {
  const base = siteConfig.url // already env-aware with localhost fallback
  const q = new URLSearchParams()

  q.set('title', params.title)
  if (params.description) q.set('description', params.description)
  q.set('type', params.type ?? 'website')
  if (params.category) q.set('category', params.category)
  if (typeof params.readingTime === 'number') {
    q.set('readingTime', String(params.readingTime))
  }

  return `${base}/api/og?${q.toString()}`
}
