# Blog Architecture

> **Location:** `/docs/workflows/blog-architecture.md`
> **Purpose:** Defines the content model, taxonomy, rendering architecture, and filtering system for the DevStash blog.

---

## Core Principle

The blog is an **architecturally independent module** that lives at `/blog` on the main domain.

- **URL:** `https://devstash.me/blog` (never `blog.devstash.me`)
- **Code separation:** Blog routes, types, helpers, and content are isolated in their own modules.
- **Shared UI only:** Shares generic primitives (Button, Card, Layout, Typography) — never portfolio-specific components.
- **No tight coupling:** Blog code must not import from portfolio-specific modules or data models.

---

## Post Frontmatter Schema

Every blog post MDX file **must** include all required fields. Optional fields should be included when available.

```mdx
---
# ─── REQUIRED ───────────────────────────────────────────────────
title: "Your Post Title Here"
slug: "your-post-slug-in-kebab-case"
description: "A 130–160 character description of this post for SEO and social sharing. Written for humans, not keyword-stuffed."
author: "TODO: Your Name"
createdAt: "YYYY-MM-DD"
updatedAt: "YYYY-MM-DD"
category: "automation"
tags: ["tag-one", "tag-two", "tag-three"]
featuredImage: "/images/blog/your-post-slug.webp"
readingTime: 7
canonical: "https://devstash.me/blog/your-post-slug"

# ─── OPTIONAL ────────────────────────────────────────────────────
draft: false
featured: false
series: ""
seriesPart: null
---
```

### Field Rules

| Field | Type | Rules |
|---|---|---|
| `title` | string | Unique, 50–70 chars recommended, human-readable |
| `slug` | string | Unique, kebab-case, matches filename |
| `description` | string | 130–160 chars, unique per post, no keyword stuffing |
| `author` | string | Real name only, no fabricated names |
| `createdAt` | date | ISO 8601: `YYYY-MM-DD` |
| `updatedAt` | date | ISO 8601, update on any meaningful edit |
| `category` | string | One category per post, from allowed taxonomy |
| `tags` | string[] | 2–5 tags, from allowed taxonomy, kebab-case |
| `featuredImage` | string | WebP format, stored in `/public/images/blog/` |
| `readingTime` | number | Estimated minutes (calculate at ~200 wpm) |
| `canonical` | string | Full `https://devstash.me/blog/[slug]` URL |
| `draft` | boolean | `true` = excluded from build/sitemap |
| `featured` | boolean | `true` = shown in homepage/featured section |

---

## Taxonomy — Categories

One category per post. Use only from this list (expand deliberately as the blog grows):

| Slug | Display Name | Description |
|---|---|---|
| `automation` | Automation | Scripting, workflows, CI/CD, n8n, GitHub Actions |
| `frontend` | Frontend Engineering | React, Next.js, CSS, UI architecture |
| `performance` | Web Performance | Core Web Vitals, bundle size, profiling |
| `ai-workflows` | AI Workflows | AI tools, LLM integrations, AI-assisted development |
| `devtools` | Developer Tools | Productivity tooling, CLI tools, DX improvements |
| `tutorials` | Tutorials | Step-by-step technical guides |
| `career` | Career & Growth | Engineering career advice, job search, freelancing |

> When adding a new category, add it to this list AND create the corresponding `/blog/category/[category]/page.tsx` route.

---

## Taxonomy — Tags

Tags are flexible but should follow kebab-case convention and be reused consistently.

**Example tag pool:**
`next-js`, `react`, `typescript`, `tailwind-css`, `github-actions`, `n8n`, `seo`, `performance`, `accessibility`, `api`, `node-js`, `vercel`, `cloudflare`, `ai`, `llm`, `open-ai`, `automation`, `devops`, `ci-cd`, `web-vitals`, `monorepo`, `pnpm`, `turborepo`

> Aim for 2–5 tags per post. Avoid creating near-duplicate tags (e.g., `nextjs` and `next-js`).

---

## Blog TypeScript Interface

```ts
// types/blog.ts

export interface BlogPost {
  title: string
  slug: string
  description: string
  author: string
  createdAt: string       // ISO 8601
  updatedAt: string       // ISO 8601
  category: string
  tags: string[]
  featuredImage: string
  readingTime: number
  canonical: string
  draft?: boolean
  featured?: boolean
  series?: string
  seriesPart?: number | null
  content?: string        // Parsed MDX content
}

export interface BlogCategory {
  slug: string
  name: string
  description: string
  postCount: number
}

export interface BlogTag {
  slug: string
  name: string
  postCount: number
}
```

---

## Rendering Architecture

```
/blog                          → BlogListPage
  ├── Reads all posts from content/blogs/
  ├── Filters: draft=false
  ├── Sorts: newest first (default)
  └── Renders: BlogCard grid + filter UI

/blog/[slug]                   → BlogPostPage
  ├── Reads post by slug
  ├── Parses MDX
  ├── Renders: Post content + TOC + author + related posts
  └── Injects: BlogPosting JSON-LD + BreadcrumbList JSON-LD

/blog/category/[category]      → CategoryArchivePage
  ├── Filters posts by category
  └── Renders: BlogCard grid with category context

/blog/tag/[tag]                → TagArchivePage
  ├── Filters posts by tag
  └── Renders: BlogCard grid with tag context
```

### Component Breakdown

| Component | Location | Purpose |
|---|---|---|
| `BlogCard` | `components/blog/BlogCard.tsx` | Post preview card (title, description, date, tags, image) |
| `BlogList` | `components/blog/BlogList.tsx` | Grid/list of BlogCards with optional filtering |
| `BlogFilter` | `components/blog/BlogFilter.tsx` | Category/tag filter UI |
| `BlogPostLayout` | `components/blog/BlogPostLayout.tsx` | Full post layout (header, content, sidebar) |
| `TableOfContents` | `components/blog/TableOfContents.tsx` | Auto-generated TOC from H2/H3 headings |
| `AuthorBio` | `components/blog/AuthorBio.tsx` | Author card at post bottom |
| `RelatedPosts` | `components/blog/RelatedPosts.tsx` | 2–3 related posts by category/tag |
| `ReadingTime` | `components/blog/ReadingTime.tsx` | Displays estimated read time |

---

## Filtering & Sorting Options

### Blog List Page — Default Behaviour
- Sort: newest first (`createdAt` descending)
- Filter: all categories, all tags (no filter selected)
- Pagination: TODO — decide between infinite scroll or numbered pagination

### Available Filters
- **By Category:** one category at a time via URL param (`/blog?category=automation`) or route (`/blog/category/automation`)
- **By Tag:** one tag at a time via URL param (`/blog?tag=next-js`) or route (`/blog/tag/next-js`)
- **By Featured:** `featured=true` posts surfaced on homepage

### Available Sorts
| Sort | URL Param | Description |
|---|---|---|
| Newest | `sort=newest` (default) | `createdAt` descending |
| Oldest | `sort=oldest` | `createdAt` ascending |
| Reading Time | `sort=reading-time` | `readingTime` ascending |

---

## Blog Content Writing Rules

1. **Title:** Clear, specific, keyword-relevant. Tells the reader exactly what they will learn.
2. **Introduction:** Hook + what the reader will get. 2–4 sentences max.
3. **Headings:** H2 for major sections, H3 for subsections. No skipped levels.
4. **Code blocks:** Use fenced blocks with language identifiers (` ```ts `, ` ```bash `).
5. **Images:** Include in `/public/images/blog/`, optimized to WebP, with descriptive `alt` text.
6. **Internal links:** Link to at least 1 related project and 1 related resource/tool where relevant.
7. **Conclusion:** Brief summary + call to action (related posts, GitHub, contact).
8. **No hallucinated data:** All metrics, benchmarks, and claims must be real and verifiable.

---

## Blog SEO Per-Post Checklist

- [ ] Frontmatter: all required fields complete.
- [ ] Slug is unique and matches filename.
- [ ] `canonical` URL is correct and matches the actual post URL.
- [ ] `updatedAt` reflects the actual last-edited date.
- [ ] Featured image is WebP, 1200×630px (or similar 16:9), descriptive filename.
- [ ] `<title>` generated from `title` frontmatter, within 50–70 chars.
- [ ] Meta description generated from `description` frontmatter, 130–160 chars.
- [ ] JSON-LD `BlogPosting` schema injected.
- [ ] `BreadcrumbList` schema injected.
- [ ] Post included in `/sitemap.xml`.
- [ ] At least 1–3 internal links to other DevStash pages.
