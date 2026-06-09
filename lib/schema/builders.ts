// lib/schema/builders.ts
import type {
  WithContext,
  Person,
  WebSite,
  BlogPosting,
  SoftwareApplication,
  CreativeWork,
  BreadcrumbList,
  FAQPage,
} from 'schema-dts'
import { siteConfig } from '@/content/metadata/site.config'
import type { BreadcrumbItem, FAQItem } from '@/types/seo'

// ── Person ────────────────────────────────────────────────────
export function buildPersonSchema(): WithContext<Person> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: siteConfig.url,
    email: siteConfig.author.email,
    sameAs: [siteConfig.author.github, siteConfig.author.linkedin],
  }
}

// ── WebSite ───────────────────────────────────────────────────
export function buildWebSiteSchema(): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    author: {
      '@type': 'Person',
      name: siteConfig.author.name,
    },
  }
}

// ── BlogPosting ───────────────────────────────────────────────
interface BlogPostSchema {
  title: string
  slug: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
  featuredImage: string
  canonical: string
  tags: string[]
}

export function buildBlogPostingSchema(post: BlogPostSchema): WithContext<BlogPosting> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    url: `${siteConfig.url}/blog/${post.slug}`,
    image: `${siteConfig.url}${post.featuredImage}`,
    keywords: post.tags.join(', '),
    author: {
      '@type': 'Person',
      name: post.author,
      url: `${siteConfig.url}/about`,
    },
    publisher: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${post.slug}`,
    },
  }
}

// ── Project (SoftwareApplication or CreativeWork) ─────────────
interface ProjectSchema {
  title: string
  slug: string
  description: string
  type?: 'web-app' | 'tool' | 'automation' | 'library'
  githubUrl?: string
  liveUrl?: string
}

export function buildProjectSchema(
  project: ProjectSchema
): WithContext<SoftwareApplication | CreativeWork> {
  const url = `${siteConfig.url}/projects/${project.slug}`

  if (project.type === 'web-app' || project.type === 'tool') {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: project.title,
      description: project.description,
      url,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      author: {
        '@type': 'Person',
        name: siteConfig.author.name,
        url: siteConfig.url,
      },
      ...(project.liveUrl ? { installUrl: project.liveUrl } : {}),
    } as WithContext<SoftwareApplication>
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    url,
    author: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: siteConfig.url,
    },
    ...(project.githubUrl ? { codeRepository: project.githubUrl } : {}),
  } as WithContext<CreativeWork>
}

// ── BreadcrumbList ────────────────────────────────────────────
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
    })),
  }
}

// ── FAQPage ───────────────────────────────────────────────────
export function buildFAQSchema(faqs: FAQItem[]): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }
}
