# Design Document

Phase 8: Analytics & Launch

## Overview

GA4 (and optional Clarity) are loaded via `next/script` with `lazyOnload`, gated
on env vars so dev/CI render nothing. A small `lib/analytics/events.ts` provides
a typed, crash-proof `trackEvent`. Conversion events are wired with a minimal
client footprint: one delegated click listener (mounted globally) that fires
events from outbound links, the contact form's success path, and a blog
scroll-depth tracker. A `docs/launch-checklist.md` captures the manual external
setup (GA4 property, GSC/Bing, custom domain, Vercel env).

### Grounding facts (from reading the code)

- Root metadata + verification tags live in `app/layout.tsx` (Server Component).
  Best mount point for global analytics so it also covers the standalone home.
- `components/contact/ContactForm.tsx` is the client form (the contact page is a
  Server Component that renders it).
- Outbound links use `<a target="_blank">` or the custom `<Button href>`. Since
  `Button` may not forward `data-*` attributes to the DOM, the click listener
  also infers the event from the anchor `href` (github.com → github_link_clicked;
  other external → resource_clicked; resume/`.pdf` → cv_viewed). This avoids
  editing every link and works regardless of Server/Client rendering.
- No CV/resume link exists in the codebase yet, so `cv_viewed` is defined but
  dormant until such a link is added (documented).
- `components/contact/` already exists outside the steering's listed subfolders,
  so adding files under the existing `components/layout/` and `components/blog/`
  folders is consistent with the real structure.

## Architecture

```
app/layout.tsx (Server)
  ├─ <Analytics />        (Server: renders GA4 + Clarity <Script> if env set)
  └─ <AnalyticsClicks />  (Client: delegated document click listener)

app/(main)/blog/[slug]/page.tsx (Server)
  └─ <ReadTracker event="blog_post_read" />  (Client: 75% scroll, once)

components/contact/ContactForm.tsx (Client)
  └─ on submit success → trackEvent('contact_form_submitted', ...)

lib/analytics/events.ts
  └─ trackEvent(name, params?)  +  ANALYTICS_EVENTS  +  Window typing
```

## Components and Interfaces

### 1. `lib/analytics/events.ts` (NEW)

```ts
// Canonical event names (source of truth).
export const ANALYTICS_EVENTS = {
  cvViewed: 'cv_viewed',
  contactFormSubmitted: 'contact_form_submitted',
  githubLinkClicked: 'github_link_clicked',
  blogPostRead: 'blog_post_read',
  resourceClicked: 'resource_clicked',
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]
export type AnalyticsParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    clarity?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: AnalyticsEvent, params?: AnalyticsParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params ?? {})
}
```

No server-only imports; safe in client components. No `as any`/`@ts-ignore`.

### 2. `components/layout/Analytics.tsx` (NEW — Server Component)

Renders GA4 + Clarity scripts conditionally via `next/script`:

```tsx
import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID

export function Analytics() {
  return (
    <>
      {GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}</Script>
        </>
      ) : null}
      {CLARITY_ID ? (
        <Script id="clarity-init" strategy="lazyOnload">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})
          (window,document,"clarity","script","${CLARITY_ID}");
        `}</Script>
      ) : null}
    </>
  )
}
```

Env values are inlined at build time; if unset, nothing renders (Requirement
1.2/1.3). IDs are never hardcoded (Requirement 1.5).

### 3. `components/layout/AnalyticsClicks.tsx` (NEW — Client Component)

```tsx
'use client'
import { useEffect } from 'react'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/events'

export function AnalyticsClicks() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest('a')
      if (!el) return
      const href = el.getAttribute('href') ?? ''
      const explicit = el.getAttribute('data-analytics-event')
      if (explicit) {
        trackEvent(explicit as never, { href })
        return
      }
      if (/^https?:\/\//i.test(href)) {
        if (/github\.com/i.test(href)) trackEvent(ANALYTICS_EVENTS.githubLinkClicked, { href })
        else trackEvent(ANALYTICS_EVENTS.resourceClicked, { href })
      } else if (/\.pdf($|\?)/i.test(href) || /resume|\/cv\b/i.test(href)) {
        trackEvent(ANALYTICS_EVENTS.cvViewed, { href })
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}
```

Mounted once in the root layout body; works for any link on any page.

### 4. `components/blog/ReadTracker.tsx` (NEW — Client Component)

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/events'

export function ReadTracker({ slug }: { slug: string }) {
  const fired = useRef(false)
  useEffect(() => {
    function onScroll() {
      if (fired.current) return
      const el = document.documentElement
      const pct = (el.scrollTop + window.innerHeight) / el.scrollHeight
      if (pct >= 0.75) {
        fired.current = true
        trackEvent(ANALYTICS_EVENTS.blogPostRead, { slug })
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [slug])
  return null
}
```

Fires `blog_post_read` exactly once per page view (guarded by a ref). Mounted in
`app/(main)/blog/[slug]/page.tsx`.

### 5. Edits to existing files

- `app/layout.tsx`: import and render `<Analytics />` and `<AnalyticsClicks />`
  inside `<body>` (after `{children}`). No metadata changes.
- `app/(main)/blog/[slug]/page.tsx`: render `<ReadTracker slug={post.slug} />`.
- `components/contact/ContactForm.tsx`: on a successful submit, call
  `trackEvent(ANALYTICS_EVENTS.contactFormSubmitted, { ... })`.

### 6. `docs/launch-checklist.md` (NEW)

Manual launch runbook: GA4 property + Measurement ID; GSC verify + sitemap
submit; Bing add/import; mark GA4 conversions for the five events; Vercel custom
domain + Cloudflare grey-cloud DNS; set `NEXT_PUBLIC_GA_ID`,
`NEXT_PUBLIC_CLARITY_ID`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` in
Vercel; GDPR note for Clarity + privacy policy reference; final
`pnpm build`/type-check/lint:content/check:links gate.

## Data Models

No persistent models. Types only: `AnalyticsEvent` (union), `AnalyticsParams`,
and the augmented `Window` interface.

## Correctness Properties

### Property 1: Env-gated script rendering

A GA4 (or Clarity) script tag is rendered iff its env var is a non-empty string;
no empty/ID-less script is ever emitted.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: trackEvent totality

`trackEvent` never throws for any input and performs no action when
`window.gtag` is absent (SSR, blocked, not yet loaded).

**Validates: Requirements 2.2, 3.7**

### Property 3: Single blog-read emission

For one blog page view, `blog_post_read` is sent at most once regardless of how
many scroll events fire past 75%.

**Validates: Requirements 3.5**

### Property 4: No hardcoded IDs

No GA Measurement ID or Clarity Project ID literal appears in source; all read
from `NEXT_PUBLIC_*`.

**Validates: Requirements 1.5, 5.4**

### Property 5: Event-name integrity

Every event sent uses a name from `ANALYTICS_EVENTS`; no ad-hoc string literals
at call sites.

**Validates: Requirements 2.3, 3.1, 3.2, 3.3, 3.4, 3.5**

## Error Handling

- Missing env vars → `Analytics` renders nothing; `trackEvent` no-ops. App works
  normally with zero analytics.
- `gtag` not yet loaded when an event fires (lazyOnload) → no-op (event dropped);
  acceptable for a personal site. No queueing layer needed.
- Listener attaches/detaches in `useEffect` cleanup to avoid leaks.

## Testing Strategy

Execution + gates (no test runner is installed, per the no-new-packages rule):

1. `pnpm exec tsc --noEmit` → zero errors.
2. `pnpm build` → succeeds; confirm no analytics script is emitted when
   `NEXT_PUBLIC_GA_ID` is unset (default build env).
3. Local manual check with `NEXT_PUBLIC_GA_ID` set in `.env.local`: `pnpm dev`,
   confirm the gtag script loads (Network tab) and `window.dataLayer` grows on a
   tracked click; with it unset, confirm no script and no errors.
4. `pnpm lint:content` and `pnpm check:links` → still exit 0.
5. Grep to confirm no `G-`/Clarity ID literals in source (Property 4).

## Constraints Compliance

- No new packages (GA4/Clarity via built-in `next/script`).
- IDs from `NEXT_PUBLIC_*` only; nothing hardcoded.
- Server Components by default; `'use client'` only for the click + read
  trackers and the (already client) contact form.
- New files live under existing `components/layout/`, `components/blog/`,
  `lib/analytics/`, `docs/`. No new top-level folders. pnpm only; no
  `--turbopack`. `ds-*` tokens only (these components render no visible UI).
