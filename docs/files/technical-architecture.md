# Technical Architecture

> **Location:** `/docs/workflows/technical-architecture.md`
> **Purpose:** Defines the stack, folder-to-framework mapping, and core library conventions for DevStash.

---

## Chosen Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js (App Router) | SSG + SSR hybrid, file-based routing, edge-ready, excellent SEO primitives |
| **Language** | TypeScript | Type safety across content schemas, API responses, and component props |
| **Styling** | Tailwind CSS | Utility-first, design token compatible, minimal runtime overhead |
| **Content** | MDX + JSON | Human-editable, Git-based, CMS-migratable, supports React components inline |
| **Fonts** | Next/font (self-hosted) | No external font requests, zero layout shift, GDPR-friendly |
| **Images** | `next/image` | Automatic WebP/AVIF, lazy loading, responsive sizing built-in |
| **Deployment** | Vercel (recommended) | Zero-config Next.js, edge functions, fast global CDN |
| **Analytics** | GA4 + Search Console | Free, comprehensive, industry standard |
| **Automation** | GitHub Actions + Node scripts | CI/CD linting, Lighthouse, sitemap generation |

---

## Folder Structure — Framework Mapping

The conceptual structure maps to Next.js App Router conventions as follows:

```
root/
├── app/                          # Next.js App Router root
│   ├── (marketing)/              # Route group — no URL segment
│   │   ├── page.tsx              # → /  (Home)
│   │   ├── about/page.tsx        # → /about
│   │   ├── contact/page.tsx      # → /contact
│   │   ├── privacy/page.tsx      # → /privacy
│   │   └── terms/page.tsx        # → /terms
│   ├── projects/
│   │   ├── page.tsx              # → /projects
│   │   └── [slug]/page.tsx       # → /projects/[slug]
│   ├── resources/
│   │   └── page.tsx              # → /resources
│   ├── tools/
│   │   └── page.tsx              # → /tools
│   ├── blog/                     # Blog nested under app/ for subfolder URL
│   │   ├── page.tsx              # → /blog
│   │   ├── [slug]/page.tsx       # → /blog/[slug]
│   │   ├── category/
│   │   │   └── [category]/page.tsx  # → /blog/category/[category]
│   │   └── tag/
│   │       └── [tag]/page.tsx    # → /blog/tag/[tag]
│   ├── sitemap.ts                # → /sitemap.xml (auto-generated)
│   ├── robots.ts                 # → /robots.txt
│   ├── not-found.tsx             # → /404
│   ├── layout.tsx                # Root layout (fonts, meta defaults, analytics)
│   └── globals.css
│
├── components/
│   ├── ui/                       # Primitive components: Button, Card, Badge, Input
│   ├── seo/                      # MetaTags, JsonLd, OpenGraph, CanonicalLink
│   ├── blog/                     # BlogCard, BlogList, TagFilter, AuthorBio, TOC
│   ├── layout/                   # Navbar, Footer, MobileNav, Breadcrumb
│   └── sections/                 # HeroSection, ProjectsGrid, FeaturedPosts
│
├── content/
│   ├── projects/                 # project-name.mdx or project-name.json
│   ├── blogs/                    # post-slug.mdx (with full frontmatter)
│   ├── pages/                    # about.md, home-meta.json
│   └── metadata/                 # site.config.ts — global SEO defaults
│
├── lib/
│   ├── seo/                      # buildMetadata(), getCanonicalUrl(), buildOgMeta()
│   ├── analytics/                # trackEvent(), GA4 helpers
│   ├── schema/                   # buildPersonSchema(), buildBlogPostingSchema()
│   ├── markdown/                 # getAllPosts(), getPostBySlug(), parseMDX()
│   └── automation/               # slugify(), readingTime(), validateFrontmatter()
│
├── public/
│   ├── images/                   # Static images (avatars, project screenshots)
│   ├── og/                       # Pre-generated OG images
│   ├── logos/                    # SVG + PNG logo variants
│   └── favicons/                 # favicon.ico, apple-touch-icon, etc.
│
├── scripts/
│   ├── seo/                      # generate-sitemap.ts, check-metadata.ts
│   ├── indexing/                 # ping-search-console.ts
│   ├── automation/               # generate-og-images.ts, check-links.ts
│   └── ai/                       # generate-schema.ts, draft-outline.ts
│
└── docs/                         # This documentation folder
```

---

## `content/` — File-Based Content Layer

All content is stored as **MDX or JSON** files. This means:
- Content is editable in any text editor or Git UI.
- Future migration to a headless CMS (Contentful, Sanity, Payload) requires only swapping the data-fetching layer in `lib/markdown/`.
- Content is version-controlled alongside code.

### Blog Post File: `content/blogs/[slug].mdx`
```mdx
---
title: "How I Built a CI Pipeline for My Portfolio"
slug: "ci-pipeline-portfolio"
description: "A step-by-step walkthrough of setting up GitHub Actions to run Lighthouse, lint MDX frontmatter, and auto-generate sitemaps."
author: "TODO: Your Name"
createdAt: "2025-01-15"
updatedAt: "2025-01-20"
category: "automation"
tags: ["github-actions", "ci-cd", "devops", "next-js"]
featuredImage: "/images/blog/ci-pipeline-portfolio.webp"
readingTime: 8
canonical: "https://devstash.me/blog/ci-pipeline-portfolio"
---

# How I Built a CI Pipeline for My Portfolio

Content goes here...
```

### Project File: `content/projects/[slug].json`
```json
{
  "title": "TODO: Project Title",
  "slug": "TODO: project-slug",
  "description": "TODO: Short description (used for SEO meta description).",
  "longDescription": "TODO: Full project description for the detail page.",
  "tags": ["next-js", "typescript", "tailwind"],
  "githubUrl": "TODO: https://github.com/...",
  "liveUrl": "TODO: https://...",
  "featuredImage": "/images/projects/TODO.webp",
  "status": "completed",
  "createdAt": "TODO: YYYY-MM-DD",
  "featured": true
}
```

---

## `lib/seo/` — Centralized SEO Helpers

All SEO metadata generation flows through `lib/seo/` to ensure consistency.

### Key Exports

```ts
// lib/seo/buildMetadata.ts
// Generates Next.js Metadata object for any page
export function buildMetadata(options: MetadataOptions): Metadata

// lib/seo/getCanonicalUrl.ts
// Returns the canonical URL for a given path
export function getCanonicalUrl(path: string): string

// lib/seo/buildOgMeta.ts
// Returns Open Graph and Twitter Card metadata
export function buildOgMeta(options: OgOptions): OpenGraphMeta
```

### Usage Pattern (App Router page)
```tsx
// app/projects/[slug]/page.tsx
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getProjectBySlug } from '@/lib/markdown/projects'

export async function generateMetadata({ params }) {
  const project = await getProjectBySlug(params.slug)
  return buildMetadata({
    title: project.title,
    description: project.description,
    canonical: `/projects/${project.slug}`,
    ogImage: project.featuredImage,
    type: 'website',
  })
}
```

---

## `lib/schema/` — JSON-LD Structured Data Builders

Each schema type has a typed builder function.

```ts
// lib/schema/builders.ts

export function buildPersonSchema(): WithContext<Person>
export function buildWebSiteSchema(): WithContext<WebSite>
export function buildBlogPostingSchema(post: BlogPost): WithContext<BlogPosting>
export function buildProjectSchema(project: Project): WithContext<SoftwareApplication | CreativeWork>
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): WithContext<BreadcrumbList>
export function buildFAQSchema(faqs: FAQItem[]): WithContext<FAQPage>
```

---

## Performance Conventions

| Rule | Implementation |
|---|---|
| No autoplaying media | Enforced via ESLint / code review |
| Images use `next/image` | Enforced via ESLint `@next/next/no-img-element` |
| Fonts self-hosted | `next/font/google` with `display: swap` |
| Third-party scripts deferred | `next/script` with `strategy="lazyOnload"` |
| No unnecessary `use client` | Default to Server Components; hydrate only interactive islands |
| Bundle size monitored | `@next/bundle-analyzer` in CI |
| Lighthouse target | > 90 on mobile and desktop in CI |
