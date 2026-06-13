# Implementation Plan

## Overview

Implementation tasks for Phase 6 (SEO & Dynamic OG Image Generation). Decisions
locked from design review: keep `JsonLd` `data` prop; keep `app/robots.ts` (no
static `public/robots.txt`); sitemap excludes category/tag indexes. Constraints:
no new packages, no new components, OG route stays edge, pnpm only. Verification
gates are `pnpm type-check` (zero errors), `pnpm build` (no missing-metadata
warnings), plus documented manual smoke tests.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2.1", "3", "7.1", "7.2"],
      "rationale": "No prerequisites: helper, OG param handling, verification tags, sitemap/robots are all independent entry points."
    },
    {
      "wave": 2,
      "tasks": ["2.2", "4", "5.1", "5.2", "5.3"],
      "rationale": "OG visuals depend on 2.1; all page wiring depends on the helper (1)."
    },
    {
      "wave": 3,
      "tasks": ["2.3", "6"],
      "rationale": "OG smoke test depends on 2.2; heading/JSON-LD audit depends on page wiring (4, 5.x)."
    },
    {
      "wave": 4,
      "tasks": ["8"],
      "rationale": "Checklist doc records the audit matrix produced in tasks 4-6."
    },
    {
      "wave": 5,
      "tasks": ["9"],
      "rationale": "Final type-check/build gates run after all implementation and audit tasks."
    }
  ],
  "dependencies": {
    "2.2": ["2.1"],
    "2.3": ["2.2"],
    "4": ["1"],
    "5.1": ["1"],
    "5.2": ["1"],
    "5.3": ["1"],
    "6": ["4", "5.1", "5.2", "5.3"],
    "8": ["4", "5.1", "5.2", "5.3", "6"],
    "9": ["2.3", "3", "6", "7.1", "7.2", "8"]
  }
}
```

## Tasks

- [x] 1. Create the OG image URL helper
  - Create `lib/seo/ogImage.ts` exporting `OgImageParams` and `buildOgImageUrl()`.
  - Use `URLSearchParams` so every value is percent-encoded; default `type` to
    `website`; include `category`/`readingTime` only when provided; base URL from
    `siteConfig.url` (localhost fallback).
  - No React, no server-only imports (must be edge/client/server safe).
  - _Requirements: 2.2, 2.3, 2.6; Properties 1, 2_

- [x] 2. Rework the dynamic OG image endpoint
- [x] 2.1 Update query-param handling in `app/api/og/route.tsx`
  - Read `title`, `description`, `type` (`website|article|project`), `category`,
    `readingTime`; remove the old `date` param. Parse `readingTime` defensively.
  - Keep `export const runtime = 'edge'`; no `next/headers`/server-only imports.
  - Ensure a generic branded fallback renders when no params are supplied.
  - _Requirements: 1.1, 1.2, 1.5, 1.7_
- [x] 2.2 Update the OG card visuals
  - Add a full-width top accent bar using a `#3b82f6` → `#8b5cf6` gradient.
  - Keep title (bold), description, and bottom-left DevStash/`devstash.me`
    wordmark; keep length-based title font scaling.
  - When `type=article`, render the category badge plus a `{readingTime} min
read` chip; when `type=project`, render a "Project" label.
  - Brand hex colors only (ds-\* tokens do not apply in `next/og`).
  - _Requirements: 1.3, 1.4, 1.6, 1.8_
- [x] 2.3 Manual OG smoke test
  - Run `pnpm dev`; verify `/api/og?title=Test&description=Hello` renders a
    branded 1200×630 card; verify `type=article&category=frontend&readingTime=7`
    and the no-param fallback. Document results in the checklist.
  - _Requirements: 1.10; Property 6_

- [x] 3. Add verification meta-tag support in `app/layout.tsx`
  - Conditionally spread `verification.google` from `GOOGLE_SITE_VERIFICATION`
    and `other['msvalidate.01']` from `BING_SITE_VERIFICATION`; render neither
    when its env var is unset/empty. Preserve existing `metadataBase`, title
    template, and description.
  - _Requirements: 7.2, 7.3, 7.4, 7.5; Property 5_

- [x] 4. Wire OG + fix canonicals/titles on static pages
  - For `about`, `resources`, `tools`, `contact`, `privacy`, `terms`,
    `projects`, `blog` index pages: import `buildOgImageUrl`, set `ogImage`;
    change `canonical` to a relative path (D1); strip any `| DevStash` from the
    title (D2). Confirm each title is 50–60 chars and description 130–160 chars,
    unique across pages.
  - _Requirements: 2.1, 2.2, 2.3, 2.7, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2; Properties 3, 4_

- [x] 5. Wire OG + fix metadata on dynamic pages
- [x] 5.1 Blog post page `blog/[slug]/page.tsx`
  - Set `ogImage: buildOgImageUrl({ title, description, type:'article',
category, readingTime })`; keep relative `canonical: /blog/${slug}`.
  - Confirm `BlogPosting` + `BreadcrumbList` JSON-LD present, no duplicate types.
  - _Requirements: 2.4, 4.3, 6.2, 6.4_
- [x] 5.2 Project detail page `projects/[slug]/page.tsx`
  - Set `ogImage: buildOgImageUrl({ title, description, type:'project' })`; fix
    `canonical` to relative `/projects/${slug}` (D1); strip `— DevStash`/double
    suffix from title (D2). Confirm `buildProjectSchema` JSON-LD present.
  - _Requirements: 2.5, 4.1, 4.3, 6.3, 6.4_
- [x] 5.3 Blog category and tag pages
  - `blog/category/[category]/page.tsx` and `blog/tag/[tag]/page.tsx`: set
    `ogImage` via helper; relative dynamic `canonical`; ensure a JSON-LD schema
    (WebSite or BreadcrumbList) is present.
  - _Requirements: 2.1, 2.2, 2.3, 4.3, 6.1_

- [x] 6. Heading-hierarchy and JSON-LD coverage audit
  - Verify every audited page has exactly one `<h1>` and no skipped heading
    levels; fix markup with `ds-*` styling only. Ensure every page renders at
    least one JSON-LD schema (add `buildWebSiteSchema()` where none exists).
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.4_

- [x] 7. Sitemap and robots updates
- [x] 7.1 Add privacy/terms to `app/sitemap.ts`
  - Add `/privacy` and `/terms` static entries with `lastModified`; confirm
    home, about, projects, blog, resources, tools, contact, all post slugs, and
    all project slugs are present. (Category/tag indexes intentionally excluded.)
  - _Requirements: 8.1, 8.2_
- [x] 7.2 Confirm `app/robots.ts` correctness
  - Ensure allow-all is explicit and the `Sitemap:` line points to
    `${SITE_URL}/sitemap.xml`. Do not create `public/robots.txt`.
  - _Requirements: 7.1, 7.6_

- [x] 8. Author the SEO checklist doc
  - Create `docs/seo-checklist.md`: per-page title/description/canonical
    verification, single-`h1` check, OG render smoke test, Rich Results Test per
    schema type, `/sitemap.xml` + `/robots.txt` reachability, env verification
    tag setup, and GSC/Bing submission steps. Include the audit matrix recorded
    during tasks 4–6.
  - _Requirements: 9.1, 9.2_

- [x] 9. Final verification gates
  - Run `pnpm type-check` (expect zero errors) and `pnpm build` (expect no
    missing-metadata warnings). Spot-check rendered `<head>` of a sample page for
    a unique `og:image` URL and (with env set) the verification meta tags. Fix
    any failures.
  - _Requirements: 10.1, 10.2, 10.3, 2.7_

## Notes

- Properties 1–6 from the design are verified via the type-check/build gates and
  the manual smoke tests (tasks 2.3, 9); no test-runner package is added, per the
  no-new-packages constraint.
- Defects D1 (absolute canonical double-prefix) and D2 (double `| DevStash`
  title suffix) are corrected inline during tasks 4 and 5.
- All color values inside `app/api/og/route.tsx` are brand hex by necessity —
  `next/og` does not process Tailwind `ds-*` classes.
