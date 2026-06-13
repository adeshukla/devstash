# Design Document

Phase 6: SEO & Dynamic OG Image Generation

## Overview

This design completes the OG image endpoint, introduces a single helper for
constructing per-page OG image URLs, wires that helper into every page's
`buildMetadata()` call, and corrects SEO defects uncovered during grounding
(canonical double-prefix, double title suffix, sitemap gaps). It also adds
verification meta-tag support and a manual SEO checklist.

The work touches only existing files plus three new artifacts
(`lib/seo/ogImage.ts`, `public/robots.txt` — pending decision, and
`docs/seo-checklist.md`). No new packages, no new components, no folder changes.

### Defects found during grounding (must fix)

| #   | Defect                                                                                                                                       | Where                                         | Fix                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| D1  | `canonical` passed as absolute URL → `buildMetadata` re-prefixes `siteConfig.url`, yielding `http://localhost:3000https://devstash.me/about` | `about`, `projects/[slug]`, and likely others | Pass **relative** paths only (e.g. `/about`)                 |
| D2  | Title includes `\| DevStash`, but `buildMetadata` appends `\| ${siteConfig.name}` again → double suffix                                      | `about`, `projects/[slug]`, others            | Pass the bare page title; let `buildMetadata` add the suffix |
| D3  | Sitemap missing `/privacy`, `/terms`                                                                                                         | `app/sitemap.ts`                              | Add them                                                     |
| D4  | Blog post `ogImage` uses static `post.featuredImage`, not dynamic OG                                                                         | `blog/[slug]`                                 | Route through OG helper                                      |

---

## Decisions on open items from Requirements

These are the proposed resolutions. They are reversible and called out for review.

1. **`JsonLd` prop → keep `data` (DEFAULT).** Every existing call site
   (`blog/[slug]`, `about`, `projects/[slug]`, and others) uses `data`, and the
   component is internally consistent. Renaming to `schema` would touch every
   call site for zero functional gain and risk regressions. **Recommendation:
   keep `data`** and correct the steering doc's gotcha table instead. _(If you
   prefer `schema`, say so and the rename becomes a discrete task.)_

2. **`BreadcrumbItem` → `{ name, url }`.** Matches `types/seo.ts` and
   `buildBreadcrumbSchema()`. No change.

3. **OG `type` param.** The `/api/og` endpoint accepts `website | article |
project`. Page metadata `type` (`buildMetadata`) stays `website | article`;
   the OG image `type` is a separate query value passed through the OG helper.

4. **`generateImageMetadata` → not used.** It is invalid for an API route
   handler. Instead, each page builds a deterministic `/api/og?...` URL via the
   OG helper. Blog posts get a stable, content-derived URL. _(This fully
   satisfies the "static/stable OG per post" intent without the wrong API.)_

5. **`robots.txt` vs `app/robots.ts` → keep `app/robots.ts` (DEFAULT).**
   Next.js errors when a `public/` static file collides with a generated route
   of the same path. `app/robots.ts` already emits allow-all + a
   `Sitemap:` line and is env-aware. **Recommendation: keep `app/robots.ts`**,
   extend it to explicitly allow all and reference `/sitemap.xml`, and **do not**
   create `public/robots.txt`. The requirement's intent (a correct robots
   response with sitemap pointer) is met. _(If you specifically want a static
   file, we delete `app/robots.ts` first to avoid the build collision.)_

---

## Architecture

```
                        ┌─────────────────────────────┐
   page metadata  ───▶  │  lib/seo/ogImage.ts          │
   (buildMetadata)      │  buildOgImageUrl(opts)        │
                        │  → encodeURIComponent each    │
                        │  → `${SITE_URL}/api/og?...`   │
                        └──────────────┬──────────────┘
                                       │  ogImage string
                                       ▼
                        ┌─────────────────────────────┐
                        │  lib/seo/buildMetadata.ts    │
                        │  (unchanged signature)        │
                        └──────────────┬──────────────┘
                                       │ Metadata.openGraph.images
                                       ▼
   social / crawler ──▶  GET /api/og?title&description&type&category&readingTime
                        ┌─────────────────────────────┐
                        │  app/api/og/route.tsx        │
                        │  edge · ImageResponse 1200×630│
                        └─────────────────────────────┘
```

---

## Components and Interfaces

### 1. `lib/seo/ogImage.ts` (NEW)

A pure helper — no React, no server-only imports — so it is safe in any context.

```ts
import { siteConfig } from '@/content/metadata/site.config'

export interface OgImageParams {
  title: string
  description?: string
  type?: 'website' | 'article' | 'project'
  category?: string
  readingTime?: number
}

/**
 * Builds an absolute, fully-encoded /api/og URL for use as ogImage.
 * Falls back to siteConfig.url (localhost in dev) when SITE_URL unset.
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
```

`URLSearchParams.toString()` percent-encodes each value, satisfying the
`encodeURIComponent` requirement without manual concatenation.

> Note: `buildMetadata` already treats an `ogImage` starting with `http` as
> absolute, so the helper's absolute URL flows through untouched.

### 2. `app/api/og/route.tsx` (REWORK existing scaffold)

Keep edge runtime and the existing visual language (grid bg, glow, logo,
gradient). Changes:

- Read params: `title`, `description`, `type`, `category`, `readingTime`
  (replaces the current `date` param).
- **Top accent bar:** add a full-width bar using a blue→purple linear gradient
  (`#3b82f6` → `#8b5cf6`) — currently only a thin bottom accent line exists.
- **Article extras:** when `type=article`, render the category badge (already
  present) plus a `{readingTime} min read` chip.
- **Project type:** when `type=project`, render a subtle "Project" label/badge.
- **Wordmark bottom-left:** keep `devstash.me`/DevStash wordmark anchored
  bottom-left (already present).
- **Title scaling:** keep/extend the existing length-based font-size logic so
  long titles do not overflow.
- **Fallback:** defaults already yield a generic branded card; verify no param
  produces an empty/broken render.
- Colors remain inline hex (OG route is not React/Tailwind DOM — `ds-*` classes
  do not apply here; brand hex values are the only option and are explicitly
  allowed for `next/og`).

No `generateImageMetadata` export.

### 3. `lib/seo/buildMetadata.ts` (UNCHANGED)

Signature and behavior stay. Pages supply the `ogImage` from the helper. We rely
on its existing "starts with http ⇒ absolute" handling.

### 4. Per-page wiring (EDIT each)

For each page, the metadata call becomes (illustrative — static page):

```ts
import { buildOgImageUrl } from '@/lib/seo/ogImage'

const title = 'About' // bare, no "| DevStash"
const description = '…130–160 chars…'

export const metadata = buildMetadata({
  title,
  description,
  canonical: '/about', // RELATIVE, no host, no trailing slash
  ogImage: buildOgImageUrl({ title, description, type: 'website' }),
})
```

Dynamic blog post:

```ts
ogImage: buildOgImageUrl({
  title: post.title,
  description: post.description,
  type: 'article',
  category: post.category,
  readingTime: post.readingTime,
})
// canonical: `/blog/${post.slug}`  (relative)
```

Dynamic project detail:

```ts
ogImage: buildOgImageUrl({
  title: project.title,
  description: project.description,
  type: 'project',
})
// canonical: `/projects/${project.slug}`  (relative)
```

**Routes to edit:** `about`, `projects`, `projects/[slug]`, `resources`,
`tools`, `blog`, `blog/[slug]`, `blog/category/[category]`, `blog/tag/[tag]`,
`contact`, `privacy`, `terms`. Each edit also applies D1 (relative canonical)
and D2 (bare title) where present.

### 5. `app/layout.tsx` — verification meta tags (EDIT)

Use the Next.js Metadata `verification` field plus `other` for Bing, gated on
env presence so nothing renders when unset:

```ts
export const metadata: Metadata = {
  /* …existing… */
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  ...(process.env.BING_SITE_VERIFICATION
    ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } }
    : {}),
}
```

Google → `<meta name="google-site-verification">`; Bing → `<meta
name="msvalidate.01">`. Both omitted entirely when their env var is unset (AC
7.4). Existing `metadataBase`, title template, and description are preserved.

### 6. `app/sitemap.ts` (EDIT)

Add `/privacy` and `/terms` static entries (priority ~0.3, `yearly`). Blog and
project dynamic loops already exist and stay. **Category/tag indexes:** default
**excluded** to avoid thin/duplicative content competing with the canonical
posts; include only if you direct otherwise (Req 8 AC 3).

### 7. `app/robots.ts` (EDIT, per decision 5)

Make allow-all explicit and ensure the sitemap pointer is correct. No static
`public/robots.txt` created (avoids the Next.js public-vs-route collision).

### 8. `docs/seo-checklist.md` (NEW)

Manual pre-submission checklist: per-page title/description length + uniqueness,
canonical correctness, single-`h1` check, OG render smoke test
(`/api/og?title=Test&description=Hello`), Rich Results Test for each schema type,
`/sitemap.xml` + `/robots.txt` reachability, env-var verification-tag setup, and
GSC/Bing submission steps.

---

## Data Models

No new persistent models. Transient shape only:

- `OgImageParams` (above) — input to the OG URL helper, mirrored by the query
  params the OG route reads.

JSON-LD builders (`buildWebSiteSchema`, `buildBreadcrumbSchema`,
`buildBlogPostingSchema`, `buildProjectSchema`, `buildPersonSchema`) are reused
as-is. `buildBlogPostingSchema` already accepts the exact `BlogPost` subset
needed.

---

## SEO Audit Procedure (Requirement 3–6, 8)

Applied per page during implementation:

1. **Title:** strip any `| DevStash` suffix (D2); ensure the page-specific title
   plus the auto-suffix lands in the 50–60 char target; ensure uniqueness across
   pages (maintain a quick comparison list).
2. **Description:** 130–160 chars, unique, natural language.
3. **Canonical:** relative path, lowercase, kebab-case, no trailing slash (D1).
4. **Headings:** exactly one `<h1>`; no skipped levels. Fix markup only, keep
   `ds-*` styling.
5. **JSON-LD:** confirm ≥1 schema per page; `blog/[slug]` → `BlogPosting` +
   `BreadcrumbList`; `projects/[slug]` → project schema; no duplicate types on a
   page. Add `buildWebSiteSchema()` to the home/index pages that lack any schema.
6. **Sitemap:** confirm the route is present with a sensible `lastModified`.

A short audit matrix (page → title len, desc len, canonical, h1 count, schemas)
will be recorded in `docs/seo-checklist.md` as the verification artifact.

---

## Error Handling

- **OG route:** every param has a default; missing params render the fallback
  card. `readingTime` parsed defensively (`Number(...)`, ignored if `NaN`).
- **Helper:** `siteConfig.url` already has a localhost fallback, so OG URLs are
  always well-formed (AC 2.6).
- **Verification tags:** strictly conditional spreads — no empty `content`.
- **Dynamic metadata:** existing `if (!post) return {}` / not-found paths
  preserved.

---

## Testing Strategy

This is config/metadata/edge-rendering work; the gates are type-check, build,
and targeted manual/inspection checks rather than a unit-test suite.

1. `pnpm type-check` → zero errors (AC 10.1).
2. `pnpm build` → completes, no missing-metadata warnings (AC 10.2).
3. **OG smoke test:** run `pnpm dev`, open
   `/api/og?title=Test&description=Hello` → branded card renders; also test
   `type=article&category=frontend&readingTime=7` and the no-param fallback.
4. **OG uniqueness:** grep built metadata / inspect a sample of pages to confirm
   distinct `og:image` URLs.
5. **Verification tags:** set then unset `GOOGLE_SITE_VERIFICATION` /
   `BING_SITE_VERIFICATION`; confirm meta tags appear/disappear in rendered
   `<head>`.
6. **Sitemap:** load `/sitemap.xml`; confirm home, about, projects, blog,
   resources, tools, contact, privacy, terms, all post slugs, all project slugs.
7. **robots:** load `/robots.txt`; confirm allow-all + correct `Sitemap:` line.
8. **JSON-LD:** spot-check via Google Rich Results Test (manual, documented in
   checklist).

---

## Correctness Properties

These properties hold for any valid input and are the basis for verification:

### Property 1: Encoding safety

For any `title`/`description` containing reserved characters (`&`, `?`, spaces,
unicode), `buildOgImageUrl` produces a URL whose query values are fully
percent-encoded and which parses back to the original values (`URLSearchParams`
round-trip).

**Validates: Requirements 2.3**

### Property 2: OG URL uniqueness

Two pages with different `(title, type)` inputs always yield different OG URLs.

**Validates: Requirements 2.7**

### Property 3: Canonical well-formedness

Every emitted canonical is `siteConfig.url` + a single leading-slash relative
path, with no host duplication and no trailing slash (guards against D1).

**Validates: Requirements 4.1, 4.2**

### Property 4: Title suffix idempotence

The final title contains exactly one `| DevStash` suffix regardless of page
input (guards against D2).

**Validates: Requirements 3.1**

### Property 5: Conditional verification tags

A verification meta tag is present iff its env var is a non-empty string; never
rendered with empty `content`.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 6: OG route totality

For any combination of present/absent query params (including none), the OG
route returns a 1200×630 image without throwing.

**Validates: Requirements 1.1, 1.7**

## Constraints Compliance

- pnpm only; no `--turbopack`; no `@next/mdx`; no new packages.
- OG route stays edge; no `next/headers`/server-only imports in it or the helper.
- No new components; `ds-*` tokens in DOM (OG route uses brand hex, which is the
  required mechanism for `next/og`).
- TypeScript strict; no `as any` / `@ts-ignore` (the existing
  `PluggableList`/builder casts are pre-existing and out of scope).
- Folder structure unchanged.
