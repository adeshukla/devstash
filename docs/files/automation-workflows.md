# Automation Workflows

> **Location:** `/docs/automation/workflows.md`
> **Purpose:** Documents all automation tasks for DevStash — what they do, when they run, and what tools power them.

---

## Automation Philosophy

Any task that is:
- **Repetitive** (run more than twice)
- **Error-prone when manual** (slug uniqueness, missing fields)
- **Blocking publishing velocity** (waiting on OG images, sitemap updates)

…should be scripted or automated.

Prefer: **metadata-driven pipelines** over hardcoded logic.

---

## Automation Inventory

### 1. Sitemap Generation

| Property | Detail |
|---|---|
| **What** | Auto-generate `/sitemap.xml` from all published pages, projects, and blog posts |
| **When** | On every production build |
| **Trigger** | Next.js build (`app/sitemap.ts` or `scripts/seo/generate-sitemap.ts`) |
| **Tool** | Next.js built-in `sitemap.ts` (App Router) |
| **Output** | `/sitemap.xml` served at `https://devstash.me/sitemap.xml` |

**Implementation sketch:**
```ts
// app/sitemap.ts
import { getAllPosts } from '@/lib/markdown/blog'
import { getAllProjects } from '@/lib/markdown/projects'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()
  const projects = await getAllProjects()

  const staticRoutes = ['/', '/about', '/projects', '/blog', '/resources', '/tools', '/contact']

  return [
    ...staticRoutes.map(route => ({
      url: `https://devstash.me${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: route === '/' ? 1 : 0.8,
    })),
    ...posts.map(post => ({
      url: `https://devstash.me/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...projects.map(project => ({
      url: `https://devstash.me/projects/${project.slug}`,
      lastModified: new Date(project.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
```

---

### 2. OG Image Generation

| Property | Detail |
|---|---|
| **What** | Auto-generate Open Graph images for blog posts and project pages from metadata |
| **When** | On build (static pre-generation) or on-demand (edge) |
| **Trigger** | Build step or `next/og` route handler |
| **Tool** | `@vercel/og` (ImageResponse) or `scripts/automation/generate-og-images.ts` |
| **Output** | Images served at `/og/[slug].png` or via dynamic `/api/og` route |

**Implementation options:**

**Option A — Dynamic (recommended):** `app/api/og/route.tsx` using `@vercel/og`
```tsx
// app/api/og/route.tsx
import { ImageResponse } from 'next/og'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'DevStash'
  const description = searchParams.get('description') ?? ''

  return new ImageResponse(
    <div style={{ background: '#0B0F19', color: '#F3F4F6', width: '1200px', height: '630px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px' }}>
      <div style={{ fontSize: '56px', fontWeight: 700, marginBottom: '24px' }}>{title}</div>
      <div style={{ fontSize: '28px', color: '#9CA3AF' }}>{description}</div>
      <div style={{ position: 'absolute', bottom: '60px', left: '80px', fontSize: '22px', color: '#3B82F6' }}>devstash.me</div>
    </div>,
    { width: 1200, height: 630 }
  )
}
```

**Option B — Static pre-generation:** `scripts/automation/generate-og-images.ts` using `puppeteer` or `playwright` to screenshot an HTML template.

---

### 3. MDX Frontmatter Linting

| Property | Detail |
|---|---|
| **What** | Validate all blog post MDX files for required fields, unique slugs, and format rules |
| **When** | Pre-commit (via Husky) and in CI on every PR |
| **Trigger** | `npm run lint:content` or GitHub Actions workflow |
| **Tool** | Custom Node.js script (`scripts/seo/check-metadata.ts`) |
| **Output** | Terminal report of errors/warnings; non-zero exit on failure |

**Validation rules:**
- All required frontmatter fields present (title, slug, description, author, createdAt, updatedAt, category, tags, featuredImage, readingTime, canonical)
- Slugs are unique across all posts
- Slugs are lowercase, kebab-case (no uppercase, spaces, underscores)
- `canonical` matches `https://devstash.me/blog/[slug]`
- `featuredImage` path exists in `/public/images/blog/`
- `readingTime` is a positive integer
- `tags` array has 2–5 items

---

### 4. Lighthouse CI

| Property | Detail |
|---|---|
| **What** | Run Lighthouse audits on key pages on every PR and main branch push |
| **When** | GitHub Actions — on pull request and push to `main` |
| **Trigger** | `.github/workflows/lighthouse.yml` |
| **Tool** | `lighthouse-ci` (`@lhci/cli`) |
| **Output** | Performance report; fails CI if Lighthouse score < 90 |

**GitHub Actions config sketch:**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - name: Run Lighthouse CI
        run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

**`lighthouserc.js` config:**
```js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/blog', 'http://localhost:3000/projects'],
      startServerCommand: 'npm run start',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
}
```

---

### 5. Broken Link Scanner

| Property | Detail |
|---|---|
| **What** | Scan all internal and external links for 404s or broken URLs |
| **When** | Weekly scheduled run + on demand |
| **Trigger** | GitHub Actions scheduled workflow (`cron`) |
| **Tool** | `broken-link-checker` npm package or `scripts/automation/check-links.ts` |
| **Output** | Report of broken links; GitHub Issue created if any found |

**Scheduled GitHub Actions config sketch:**
```yaml
# .github/workflows/link-check.yml
name: Broken Link Check

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am UTC
  workflow_dispatch:

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: node scripts/automation/check-links.js
```

---

### 6. Indexing Ping (Google Search Console)

| Property | Detail |
|---|---|
| **What** | Notify Google to index newly published or updated URLs |
| **When** | After publishing new blog posts or significant page updates |
| **Trigger** | Manual run: `npm run index:ping -- --url /blog/new-post-slug` |
| **Tool** | Google Indexing API via `scripts/indexing/ping-search-console.ts` |
| **Output** | Terminal confirmation of indexing request submission |

> **Note:** Google's Indexing API officially only supports Job Postings and Livestream URLs for guaranteed processing, but general URL submission via Search Console sitemap is the reliable method. Use Search Console's URL Inspection tool for manual priority submissions.

---

### 7. Schema Injection Helper

| Property | Detail |
|---|---|
| **What** | Generate and inject correct JSON-LD schema for any page type |
| **When** | Used at build time within page components |
| **Trigger** | Called from individual page components |
| **Tool** | `lib/schema/builders.ts` |
| **Output** | `<script type="application/ld+json">` injected in `<head>` |

---

## Automation Roadmap

| Priority | Automation | Status |
|---|---|---|
| High | Sitemap generation (Next.js built-in) | TODO |
| High | MDX frontmatter linting script | TODO |
| High | Lighthouse CI in GitHub Actions | TODO |
| Medium | OG image generation (dynamic route) | TODO |
| Medium | Broken link scanner (weekly cron) | TODO |
| Low | Indexing ping script | TODO |
| Low | AI-assisted blog outline generation | TODO |
| Low | n8n workflow for content publishing notification | TODO |
