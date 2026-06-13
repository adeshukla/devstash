# Phase 5 — Blog System: Install Guide

## 1. Install packages

```bash
# MDX rendering (RSC-compatible, avoids Turbopack serialization error)
pnpm add next-mdx-remote

# MDX processing pipeline (may already be installed from Phase 3)
pnpm add gray-matter remark-gfm rehype-slug rehype-pretty-code

# TypeScript types
pnpm add -D @types/mdx
```

> If Phase 3 already installed gray-matter, remark-gfm, rehype-slug, rehype-pretty-code — skip those.

---

## 2. Copy files into your project

```
types/blog.ts                              → types/blog.ts
lib/markdown/blog.ts                       → lib/markdown/blog.ts
lib/utils/toc.ts                           → lib/utils/toc.ts
components/blog/BlogCard.tsx               → components/blog/BlogCard.tsx
components/blog/BlogList.tsx               → components/blog/BlogList.tsx
components/blog/BlogFilter.tsx             → components/blog/BlogFilter.tsx
components/blog/TOC.tsx                    → components/blog/TOC.tsx
components/blog/AuthorBio.tsx              → components/blog/AuthorBio.tsx
components/blog/RelatedPosts.tsx           → components/blog/RelatedPosts.tsx
components/blog/MDXComponents.tsx          → components/blog/MDXComponents.tsx
components/blog/index.ts                   → components/blog/index.ts
components/ui/Pagination.tsx               → components/ui/Pagination.tsx
app/(main)/blog/page.tsx                   → app/(main)/blog/page.tsx
app/(main)/blog/[slug]/page.tsx            → app/(main)/blog/[slug]/page.tsx
app/(main)/blog/category/[category]/page.tsx  → app/(main)/blog/category/[category]/page.tsx
app/(main)/blog/tag/[tag]/page.tsx         → app/(main)/blog/tag/[tag]/page.tsx
content/blogs/*.mdx                        → content/blogs/ (sample posts)
```

---

## 3. Update components/ui/index.ts

Add `Pagination` to the barrel exports:

```typescript
export { Pagination } from './Pagination'
```

---

## 4. Update lib/schema/builders.ts

Make sure `buildBlogPostingSchema` accepts a `BlogPost` from `@/types/blog`.
Expected signature:

```typescript
export function buildBlogPostingSchema(post: BlogPost): WithContext<BlogPosting> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    url: post.canonical,
    image: post.featuredImage || undefined,
  }
}
```

---

## 5. Update app/sitemap.ts

Add blog routes to the sitemap:

```typescript
import { getAllPosts, getAllCategories, getAllTags } from '@/lib/markdown/blog'

// In your generateSitemaps/sitemap export, add:
const posts = getAllPosts()
const categories = getAllCategories()
const tags = getAllTags()

const blogRoutes = [
  { url: `${SITE_URL}/blog`, lastModified: new Date() },
  ...posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
  })),
  ...categories.map(({ category }) => ({
    url: `${SITE_URL}/blog/category/${category}`,
    lastModified: new Date(),
  })),
  ...tags.map(({ tag }) => ({
    url: `${SITE_URL}/blog/tag/${tag}`,
    lastModified: new Date(),
  })),
]
```

---

## 6. Add blog avatar placeholder

Create a placeholder at `public/images/avatar.webp` (used in `AuthorBio`).
Replace with your real photo when ready.

---

## 7. Verify TypeScript

```bash
pnpm exec tsc --noEmit
```

Common issues:

- `buildBlogPostingSchema` signature mismatch → update `lib/schema/builders.ts` as shown above
- `buildMetadata` field is `type` (NOT `ogType`); the union is `'website' | 'article'`. Canonical takes a RELATIVE path. `MetadataOptions` is defined in `types/seo.ts`

---

## 8. Dev server

```bash
pnpm dev
```

Visit:

- `/blog` — listing with filters
- `/blog/n8n-job-application-automation-groq-google-sheets` — sample post
- `/blog/category/automation` — category archive
- `/blog/tag/n8n` — tag archive

---

## What's NOT included (Phase 6 responsibility)

- Dynamic OG images wired to blog posts (`/api/og?title=...`)
- Full SEO audit pass
- JSON-LD validation via Google Rich Results Test
- Sitemap submission to GSC
