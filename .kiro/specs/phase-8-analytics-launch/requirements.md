# Requirements Document

Phase 8: Analytics & Launch

## Introduction

Phase 8 instruments DevStash with privacy-respecting analytics and prepares it
for public launch. It adds Google Analytics 4 (and optional Microsoft Clarity)
loaded lazily and only when configured, a typed event-tracking helper, wiring of
the key conversion events, and a manual launch-readiness checklist covering
Search Console, Bing, the GA4 property, and the custom domain.

### Scope boundaries

- No new npm packages. GA4/Clarity load via the built-in `next/script` (the
  steering doc specifies a "lazyOnload" strategy). No `@next/third-parties`.
- All measurement IDs come from `NEXT_PUBLIC_*` env vars — never hardcoded.
- Analytics must be a no-op when its env var is unset (local/dev/CI safe) and
  must never throw if the analytics global isn't present.
- pnpm only. No `--turbopack`. Server Components by default; `'use client'` only
  where interactivity is required. `ds-*` tokens only.
- New client components live in existing allowed folders (`components/layout/`,
  `components/blog/`). No new top-level folders.
- External setup (creating the GA4 property, GSC/Bing verification, Cloudflare
  DNS for the custom domain, setting Vercel env vars) is MANUAL and documented in
  a launch checklist — it cannot be performed from the codebase.

## Glossary

- **GA4**: Google Analytics 4. Loaded via gtag.js using a Measurement ID
  (`G-XXXXXXXXXX`) from `NEXT_PUBLIC_GA_ID`.
- **Clarity**: Microsoft Clarity heatmaps/session recording, Project ID from
  `NEXT_PUBLIC_CLARITY_ID` (optional).
- **Conversion event**: a tracked user action (e.g. contact form submit) sent to
  GA4 via `gtag('event', ...)`.
- **lazyOnload**: a `next/script` strategy that loads the script during browser
  idle time after the page is interactive, minimizing performance impact.

## Requirements

### Requirement 1: Analytics Script Loading

**User Story:** As the site owner, I want GA4 (and optionally Clarity) loaded
efficiently and only when configured so that I get analytics without hurting
performance or breaking local/dev runs.

#### Acceptance Criteria

1. THE system SHALL load GA4 via `next/script` using `strategy="lazyOnload"`,
   reading the Measurement ID from `process.env.NEXT_PUBLIC_GA_ID`.
2. WHERE `NEXT_PUBLIC_GA_ID` is unset/empty THEN no GA4 script or inline gtag
   init SHALL be rendered.
3. THE system SHALL optionally load Microsoft Clarity via `next/script`
   (lazyOnload) using `process.env.NEXT_PUBLIC_CLARITY_ID`, rendering nothing
   when that var is unset/empty.
4. THE analytics loader SHALL be mounted in the root `app/layout.tsx` so it
   covers every route (including the standalone home page).
5. THE GA4 init SHALL configure the page and enable subsequent `gtag('event')`
   calls; no Measurement/Project ID SHALL be hardcoded.
6. THE loader SHALL not break SSR or hydration (scripts are injected via
   `next/script`, not raw inline `<script>` in a way that mismatches).

### Requirement 2: Typed Event Helper

**User Story:** As a developer, I want a single typed helper to send analytics
events so that event names stay consistent and calls never crash.

#### Acceptance Criteria

1. THE system SHALL provide `lib/analytics/events.ts` exporting a
   `trackEvent(name, params?)` function.
2. `trackEvent` SHALL be a safe no-op (never throw) when `window` or
   `window.gtag` is undefined (SSR, blocked analytics, not-yet-loaded).
3. THE module SHALL define the canonical event-name set as a TypeScript union or
   const map covering at least: `cv_viewed`, `contact_form_submitted`,
   `github_link_clicked`, `blog_post_read`, `resource_clicked`.
4. THE module SHALL augment the `Window` type (typed `gtag`/`dataLayer`) without
   using `as any` or `@ts-ignore`.
5. THE module SHALL be safe to import from client components and SHALL contain no
   server-only imports.

### Requirement 3: Conversion Event Wiring

**User Story:** As the site owner, I want the key user actions tracked so that I
can measure engagement and conversions in GA4.

#### Acceptance Criteria

1. WHEN the contact form is submitted successfully THEN a
   `contact_form_submitted` event SHALL be sent.
2. WHEN a user clicks an outbound GitHub link THEN a `github_link_clicked` event
   SHALL be sent (with a useful param such as the destination/label).
3. WHEN a user clicks an outbound resource link THEN a `resource_clicked` event
   SHALL be sent.
4. WHEN a user clicks a CV/resume link THEN a `cv_viewed` event SHALL be sent.
5. WHEN a reader reaches ~75% scroll depth of a blog post THEN a
   `blog_post_read` event SHALL be sent exactly once per page view.
6. THE wiring SHALL use the smallest reasonable client footprint (e.g. a single
   delegated click listener keyed off a `data-analytics-event` attribute plus a
   scroll-depth tracker), keeping pages as Server Components where possible.
7. WHERE GA4 is not configured THEN none of the above SHALL error; events simply
   no-op via `trackEvent`.

### Requirement 4: Launch Readiness Documentation

**User Story:** As the project owner (Adesh), I want a step-by-step launch
checklist so that I can complete the manual external setup correctly.

#### Acceptance Criteria

1. THE system SHALL create `docs/launch-checklist.md`.
2. THE checklist SHALL cover: creating the GA4 property + obtaining the
   Measurement ID; verifying ownership in Google Search Console and submitting
   the sitemap; adding the site to Bing Webmaster Tools (or GSC import);
   creating GA4 conversion events from the tracked event names; setting up the
   custom domain on Vercel with Cloudflare DNS (grey-cloud, never orange-cloud
   per steering); and setting all required env vars (`NEXT_PUBLIC_GA_ID`,
   `NEXT_PUBLIC_CLARITY_ID`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`)
   in the Vercel environment.
3. THE checklist SHALL note the GDPR consideration for Clarity session recording
   and reference the privacy policy.

### Requirement 5: Quality Gate

**User Story:** As a maintainer, I want Phase 8 to keep the project green so that
nothing regresses.

#### Acceptance Criteria

1. WHEN `pnpm exec tsc --noEmit` runs THEN it SHALL report zero errors (no
   `as any`/`@ts-ignore`).
2. WHEN `pnpm build` runs THEN it SHALL complete successfully.
3. WHEN `pnpm lint:content` and `pnpm check:links` run THEN they SHALL still exit
   zero.
4. ALL additions SHALL use pnpm only, add no new packages, hardcode no IDs, and
   use `ds-*` tokens for any UI.
