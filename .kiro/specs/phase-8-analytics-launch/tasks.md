# Implementation Plan

## Overview

Implementation tasks for Phase 8 (Analytics & Launch). Adds env-gated GA4 +
optional Clarity loading via `next/script`, a typed `trackEvent` helper, minimal
event wiring (global click listener, contact-form success, blog scroll-depth),
and a manual launch checklist. Constraints: no new packages; IDs from
`NEXT_PUBLIC_*` only (never hardcoded); Server Components by default; new files
under existing folders; pnpm only. Gates: `pnpm exec tsc --noEmit` zero errors,
`pnpm build` succeeds, `lint:content` + `check:links` still exit 0.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "4"],
      "rationale": "The trackEvent helper (1) is the dependency for all wiring; the launch checklist doc (4) is fully independent."
    },
    {
      "wave": 2,
      "tasks": ["2.1", "2.2", "3.1", "3.2"],
      "rationale": "Analytics loader, global click listener, blog read tracker, and contact-form wiring all depend on the helper (1) and touch independent files."
    },
    {
      "wave": 3,
      "tasks": ["2.3"],
      "rationale": "Mounting Analytics + AnalyticsClicks in the root layout depends on those components existing (2.1, 2.2)."
    },
    {
      "wave": 4,
      "tasks": ["5"],
      "rationale": "Final gates run after all code + wiring are in place."
    }
  ],
  "dependencies": {
    "2.1": ["1"],
    "2.2": ["1"],
    "2.3": ["2.1", "2.2"],
    "3.1": ["1"],
    "3.2": ["1"],
    "5": ["2.3", "3.1", "3.2", "4"]
  }
}
```

## Tasks

- [x] 1. Typed analytics event helper
  - Create `lib/analytics/events.ts` exporting `ANALYTICS_EVENTS` (const map of
    the 5 events: cv_viewed, contact_form_submitted, github_link_clicked,
    blog_post_read, resource_clicked), an `AnalyticsEvent` union type, an
    `AnalyticsParams` type, a `declare global` Window augmentation (typed
    `gtag`/`dataLayer`/`clarity`, no `as any`/`@ts-ignore`), and a crash-proof
    `trackEvent(name, params?)` that no-ops when `window.gtag` is absent.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5; Properties 2, 5_

- [x] 2. Analytics loading & global wiring
- [x] 2.1 Analytics script loader component
  - Create `components/layout/Analytics.tsx` (Server Component) that renders GA4
    (`gtag.js` + inline init) and optional Clarity via `next/script`
    `strategy="lazyOnload"`, each gated on `NEXT_PUBLIC_GA_ID` /
    `NEXT_PUBLIC_CLARITY_ID` (render nothing when unset). No hardcoded IDs.
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6; Properties 1, 4_
- [x] 2.2 Global click listener component
  - Create `components/layout/AnalyticsClicks.tsx` (`'use client'`): a delegated
    document click listener that, on anchor clicks, fires the explicit
    `data-analytics-event` if present, else infers from href (github.com →
    github_link_clicked; other external http(s) → resource_clicked;
    `.pdf`/resume/cv → cv_viewed). Uses `trackEvent`. Cleans up on unmount.
  - _Requirements: 3.2, 3.3, 3.4, 3.6, 3.7; Properties 2, 5_
- [x] 2.3 Mount analytics in root layout
  - Edit `app/layout.tsx` to render `<Analytics />` and `<AnalyticsClicks />`
    inside `<body>` after `{children}`. Do not change existing metadata. Keep
    Server Component semantics.
  - _Requirements: 1.4_

- [x] 3. Conversion event wiring
- [x] 3.1 Blog read-depth tracker
  - Create `components/blog/ReadTracker.tsx` (`'use client'`) that fires
    `blog_post_read` exactly once when scroll depth reaches ~75% (ref-guarded,
    listener removed after firing). Mount `<ReadTracker slug={post.slug} />` in
    `app/(main)/blog/[slug]/page.tsx`.
  - _Requirements: 3.5; Property 3_
- [x] 3.2 Contact form submit event
  - Edit `components/contact/ContactForm.tsx` to call
    `trackEvent(ANALYTICS_EVENTS.contactFormSubmitted, {...})` on a SUCCESSFUL
    submit only. Do not alter the form's existing behavior/validation.
  - _Requirements: 3.1; Property 5_

- [x] 4. Launch readiness checklist
  - Create `docs/launch-checklist.md`: GA4 property + Measurement ID; GSC verify
    - sitemap submit; Bing add/import; mark the 5 events as GA4 conversions;
      Vercel custom domain + Cloudflare grey-cloud DNS (never orange-cloud); set
      `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`, `GOOGLE_SITE_VERIFICATION`,
      `BING_SITE_VERIFICATION` in Vercel; GDPR/Clarity + privacy-policy note; final
      build/type-check/lint:content/check:links gate.
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Final verification gates
  - Run `pnpm exec tsc --noEmit` (zero errors), `pnpm build` (succeeds; confirm
    no analytics script emitted when `NEXT_PUBLIC_GA_ID` unset), `pnpm
lint:content` and `pnpm check:links` (exit 0). Grep source to confirm no GA/
    Clarity ID literals (Property 4). Report results.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

## Notes

- Properties 1–5 are verified via execution + the gates in task 5 (no test-runner
  package is added, per the constraint).
- `cv_viewed` is defined but dormant — no CV/resume link exists in the codebase
  yet; it will fire automatically once such a link is added (the listener infers
  it from `.pdf`/resume hrefs).
- All external setup (GA4 property, GSC/Bing verification, Cloudflare DNS, Vercel
  env vars) is manual and lives in `docs/launch-checklist.md` for Adesh.
