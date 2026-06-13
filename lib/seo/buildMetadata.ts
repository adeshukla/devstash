// lib/seo/buildMetadata.ts

import type { Metadata } from 'next'
import { siteConfig } from '@/content/metadata/site.config'
import { buildOgImageUrl } from '@/lib/seo/ogImage'
import type { MetadataOptions } from '@/types/seo'

// Re-export so existing `import { MetadataOptions } from '@/lib/seo/buildMetadata'`
// call sites keep working — the canonical definition now lives in types/seo.ts.
export type { MetadataOptions }

export function buildMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    canonical,
    ogImage,
    type = 'website',
    noIndex = false,
    publishedTime,
    modifiedTime,
    authors,
    section,
    tags,
  } = options

  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title

  const canonicalUrl = canonical ? `${siteConfig.url}${canonical}` : siteConfig.url

  // Default OG image points at the dynamic endpoint — the legacy static
  // `/og/default.png` does not exist in /public, so never fall back to it.
  const resolvedOgImage =
    ogImage ?? buildOgImageUrl({ title: title ?? siteConfig.name, description, type })
  const ogImageUrl = resolvedOgImage.startsWith('http')
    ? resolvedOgImage
    : `${siteConfig.url}${resolvedOgImage}`

  const ogImages = [
    { url: ogImageUrl, width: 1200, height: 630, alt: fullTitle, type: 'image/png' },
  ]

  // Branch so the discriminated `type` literal lines up with the article-only
  // fields (Next's OpenGraph type only permits them when type is 'article').
  const openGraph: NonNullable<Metadata['openGraph']> =
    type === 'article'
      ? {
          title: fullTitle,
          description,
          url: canonicalUrl,
          siteName: siteConfig.name,
          locale: 'en_US',
          type: 'article',
          images: ogImages,
          ...(publishedTime ? { publishedTime } : {}),
          ...(modifiedTime ? { modifiedTime } : {}),
          ...(authors && authors.length > 0 ? { authors } : {}),
          ...(section ? { section } : {}),
          ...(tags && tags.length > 0 ? { tags } : {}),
        }
      : {
          title: fullTitle,
          description,
          url: canonicalUrl,
          siteName: siteConfig.name,
          locale: 'en_US',
          type: 'website',
          images: ogImages,
        }

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [{ url: ogImageUrl, alt: fullTitle }],
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  }
}
