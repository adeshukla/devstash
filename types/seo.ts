// types/seo.ts

export interface MetadataOptions {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface OgOptions {
  title: string
  description?: string
  category?: string
  date?: string
}
