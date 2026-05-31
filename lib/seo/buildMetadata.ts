// lib/seo/buildMetadata.ts

import type { Metadata } from 'next'
import { siteConfig } from '@/content/metadata/site.config'

export interface MetadataOptions {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}

export function buildMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    canonical,
    ogImage = siteConfig.ogImage,
    type = 'website',
    noIndex = false,
  } = options

  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title

  const canonicalUrl = canonical ? `${siteConfig.url}${canonical}` : siteConfig.url

  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteConfig.url}${ogImage}`

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: fullTitle }],
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl],
      creator: siteConfig.twitterHandle,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  }
}
