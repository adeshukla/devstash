# Requirements Document

Phase 6: SEO & Dynamic OG Image Generation

## Introduction

Phase 6 makes every public DevStash page production-ready for search engines and
social sharing. It delivers a dynamic, brand-accurate Open Graph (OG) image
endpoint, wires a unique OG image URL into every page's metadata, performs a
full SEO audit (titles, descriptions, canonicals, heading hierarchy, JSON-LD,
sitemap coverage), and prepares the site for Google Search Console and Bing
Webmaster submission.

This phase is **audit-and-wire heavy**, not greenfield: `buildMetadata()`,
`lib/schema/builders.ts`, `components/seo/JsonLd.tsx`, `app/sitemap.ts`, and a
scaffolded `app/api/og/route.tsx` already exist. The work is to complete,
correct, and consistently apply them.

### Scope boundaries

- No new npm packages (`next/og` ships with Next.js 15).
- No new components; reuse existing primitives and `ds-*` tokens.
- No folder-structure changes.
- TypeScript strict — no `as any`, no `@ts-ignore`.
- The OG route must remain edge runtime (no `next/headers` or server-only APIs).

## Glossary

- **OG image**: Open Graph image (1200×630) shown when a URL is shared on social
  platforms and in some search previews.
- **Canonical URL**: The authoritative URL for a page, declared via
  `alternates.canonical` in metadata.
- **JSON-LD**: Structured data (schema.org) embedded as
  `<script type="application/ld+json">` for rich results.
- **EARS**: Easy Approach to Requirements Syntax — the WHEN/THE/SHALL phrasing
  used in acceptance criteria below.
- **GSC**: Google Search Console.
- **`buildMetadata()`**: Project helper in `lib/seo/buildMetadata.ts` that
  produces a Next.js `Metadata` object.

---

## ⚠️ Discrepancies discovered during grounding (need decisions)

These conflicts between the steering doc / task brief and the **actual code on
disk** must be resolved. Each is reflected as an open decision in the relevant
requirement below.

1. **`JsonLd` prop name.** The brief and steering doc say the prop is `schema`.
   The actual `components/seo/JsonLd.tsx` exposes `data`. Decision needed:
   rename the prop to `schema` (touches every call site) **or** keep `data` and
   correct the steering doc. _(See Requirement 6.)_

2. **`BreadcrumbItem` shape.** The steering doc says `{ label, href }`. The
   actual `types/seo.ts` defines `{ name, url }`, and `buildBreadcrumbSchema()`
   consumes `name`/`url`. Spec will follow the **code** (`{ name, url }`) unless
   you direct otherwise. _(See Requirement 5.)_

3. **`buildMetadata` `type` values.** `MetadataOptions.type` is only
   `'website' | 'article'`. The OG image `type` query param needs a third value
   `project`. The OG endpoint will accept `website | article | project`, while
   page metadata `type` stays `website | article`. _(See Requirements 1 & 2.)_

4. **`generateImageMetadata` in an API route.** `generateImageMetadata` is a
   Next.js convention for `opengraph-image` file handlers, not for
   `app/api/og/route.tsx` GET handlers. Decision needed on how to satisfy
   "static OG generation on blog posts" (see Requirement 1, AC 9).

5. **Sitemap gaps.** `app/sitemap.ts` is missing `/privacy` and `/terms`, and
   does not include blog `category`/`tag` index routes. _(See Requirement 8.)_

---

## Requirements

### Requirement 1: Dynamic OG Image Endpoint

**User Story:** As a developer sharing DevStash links, I want every page to
generate a branded 1200×630 OG image so that links render attractively on
social platforms and search previews.

#### Acceptance Criteria

1. WHEN a GET request hits `/api/og` THEN the system SHALL respond with an
   `ImageResponse` (from `next/og`) of exactly 1200×630 pixels.
2. THE route SHALL declare `export const runtime = 'edge'` and SHALL NOT import
   `next/headers` or any server-only API.
3. THE rendered card SHALL use brand colors only: background `#0b0f19`, accent
   `#3b82f6`, purple `#8b5cf6`, primary text `#f3f4f6`.
4. THE card SHALL render: the page title in bold (DM Sans intent), a
   subtitle/description, a "DevStash" wordmark anchored bottom-left, and a
   decorative accent bar at the top using a blue→purple brand gradient.
5. THE endpoint SHALL accept query params `title`, `description`, and `type`
   where `type ∈ {website, article, project}`.
6. WHEN `type=article` THEN the card SHALL also render a category badge and the
   reading time WHEN `category` and `readingTime` params are present.
7. WHEN no query params are supplied THEN the card SHALL render a generic
   DevStash-branded fallback (no crash, no empty fields).
8. WHEN `title` exceeds a length threshold THEN the title font size SHALL scale
   down so the layout does not overflow the canvas.
9. THE solution SHALL provide a mechanism for blog posts to reference a stable,
   per-post OG image URL. _(Open decision: `generateImageMetadata` is not valid
   for an API route handler — resolve whether to (a) build deterministic
   `/api/og?...` URLs per post inside `buildMetadata`, or (b) add an
   `opengraph-image` file convention. Spec defaults to option (a) unless
   directed otherwise.)_
10. WHEN `/api/og?title=Test&description=Hello` is visited THEN a valid branded
    PNG/image SHALL be returned (manual smoke test).

---

## Requirement 2 — OG Image URL Wiring Across All Pages

**User Story:** As a site owner, I want every page's metadata to point at a
unique OG image so that no two pages share an identical social preview.

#### Acceptance Criteria

1. THE system SHALL add an `ogImage` value to the `buildMetadata()` call on each
   of these routes: `about`, `projects`, `projects/[slug]`, `resources`,
   `tools`, `blog`, `blog/[slug]`, `blog/category/[category]`,
   `blog/tag/[tag]`, `contact`, `privacy`, `terms`.
2. THE OG URL SHALL follow the format
   `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=...&description=...&type=...`.
3. ALL query param values SHALL be passed through `encodeURIComponent`.
4. WHEN building the `blog/[slug]` OG URL THEN `title` SHALL be `post.title`,
   `description` SHALL be `post.description`, `type` SHALL be `article`, and
   `category` + `readingTime` SHALL be included from the post frontmatter.
5. WHEN building the `projects/[slug]` OG URL THEN `type` SHALL be `project`.
6. WHERE `NEXT_PUBLIC_SITE_URL` is unset THEN the URL SHALL fall back to the same
   base used elsewhere (`http://localhost:3000`) without throwing.
7. EACH page's resulting OG URL SHALL be unique across the site.

---

## Requirement 3 — Title & Description Audit

**User Story:** As an SEO maintainer, I want every page to have a unique,
correctly-sized title and description so that search snippets are clean and
non-duplicated.

#### Acceptance Criteria

1. EACH page title SHALL be 50–60 characters and unique across all pages
   (measured as the page-specific title before the `| DevStash` suffix is
   applied, with the combined length verified against the limit).
2. EACH page description SHALL be 130–160 characters, unique, and free of
   keyword stuffing.
3. WHERE a page currently violates these limits THEN the spec implementation
   SHALL correct it in place.
4. NO two pages SHALL share an identical title or description.

---

## Requirement 4 — Canonical URL Audit

**User Story:** As an SEO maintainer, I want canonical URLs that exactly match
each route so that search engines index the correct URL.

#### Acceptance Criteria

1. EACH `buildMetadata()` call SHALL pass `canonical` (NOT `path`).
2. EACH canonical value SHALL match its actual route: lowercase, kebab-case, and
   no trailing slash.
3. WHEN a route is dynamic (`blog/[slug]`, `projects/[slug]`,
   `blog/category/[category]`, `blog/tag/[tag]`) THEN the canonical SHALL be
   constructed from the resolved param.

---

## Requirement 5 — Heading Hierarchy Audit

**User Story:** As an SEO maintainer, I want a single `<h1>` and a clean heading
hierarchy on every page so that document structure is semantically correct.

#### Acceptance Criteria

1. EACH page SHALL contain exactly one `<h1>`.
2. Heading levels SHALL NOT skip (no `h1 → h3` without an intervening `h2`).
3. WHERE a page violates this THEN the implementation SHALL correct the markup
   without altering visual design or using non-`ds-*` styling.

---

## Requirement 6 — JSON-LD Structured Data Audit

**User Story:** As an SEO maintainer, I want valid structured data on every page
so that rich results are eligible and consistent.

#### Acceptance Criteria

1. EACH page SHALL render at least one JSON-LD schema (minimum: `WebSite` or
   `BreadcrumbList`).
2. THE `blog/[slug]` page SHALL render a `BlogPosting` schema populated from MDX
   frontmatter (title, slug, description, author, createdAt, updatedAt,
   featuredImage, canonical, tags).
3. THE `projects/[slug]` page SHALL render a `SoftwareApplication` **or**
   `CreativeWork` schema via `buildProjectSchema()`.
4. NO page SHALL render duplicate JSON-LD schemas of the same type.
5. THE `JsonLd` component prop SHALL be referenced consistently across all call
   sites. _(Open decision: standardize on `schema` per the brief — which
   requires renaming the prop in `components/seo/JsonLd.tsx` and updating every
   call site — OR keep the existing `data` prop. Resolve before design.)_
6. `BreadcrumbItem` data SHALL use the field names defined in `types/seo.ts`
   (`name`, `url`), consistent with `buildBreadcrumbSchema()`.

---

## Requirement 7 — robots.txt & Verification Meta Tags

**User Story:** As a site owner, I want crawlers correctly directed and
ownership verifiable so that Search Console and Bing Webmaster can validate the
site.

#### Acceptance Criteria

1. THE system SHALL provide a `public/robots.txt` that allows all crawlers and
   declares `Sitemap: https://devstash.me/sitemap.xml`.
2. WHERE `GOOGLE_SITE_VERIFICATION` env var is set THEN `app/layout.tsx` SHALL
   render a corresponding verification `<meta>` tag.
3. WHERE `BING_SITE_VERIFICATION` env var is set THEN `app/layout.tsx` SHALL
   render a corresponding verification `<meta>` tag.
4. WHERE either env var is unset THEN the corresponding tag SHALL NOT be
   rendered (no empty `content`).
5. THE verification tags SHALL be added via Next.js metadata APIs or
   `<head>`-appropriate mechanisms without breaking the existing root metadata.
6. THE coexistence of `public/robots.txt` and `app/robots.ts` SHALL be resolved
   so the two do not conflict. _(Open decision noted in design.)_

---

## Requirement 8 — Sitemap Coverage

**User Story:** As a site owner, I want the sitemap to list every public route
so that all pages are discoverable.

#### Acceptance Criteria

1. `app/sitemap.ts` SHALL include: home, about, projects index, blog index,
   resources, tools, contact, **privacy**, **terms**, all blog post slugs, and
   all project slugs.
2. EACH entry SHALL set a `lastModified` value; dynamic entries SHALL derive it
   from content metadata where available (e.g. `post.updatedAt`).
3. WHERE blog `category`/`tag` index routes should be indexed THEN they SHALL be
   included. _(Open decision: include category/tag indexes or leave them out to
   avoid thin-content duplication. Resolve in design.)_

---

## Requirement 9 — SEO Pre-Submission Checklist Doc

**User Story:** As the project owner (Adesh), I want a manual checklist so that I
can verify readiness before submitting to search engines.

#### Acceptance Criteria

1. THE system SHALL create `docs/seo-checklist.md`.
2. THE checklist SHALL cover: per-page title/description/canonical verification,
   OG image rendering check, JSON-LD validation via Google Rich Results Test,
   sitemap accessibility, robots.txt accessibility, env-var verification tag
   setup, and the GSC/Bing submission steps.

---

## Requirement 10 — Build & Type Safety Gate

**User Story:** As a maintainer, I want the phase to pass the project's quality
gates so that nothing regresses.

#### Acceptance Criteria

1. WHEN `pnpm type-check` runs THEN it SHALL complete with zero errors.
2. WHEN `pnpm build` runs THEN it SHALL complete with no warnings about missing
   metadata.
3. ALL changes SHALL use `pnpm` only and SHALL NOT introduce `--turbopack`,
   `@next/mdx`, new packages, or hardcoded hex colors in JSX/TSX.
