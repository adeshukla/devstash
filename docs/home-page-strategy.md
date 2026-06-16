# Home Page Strategy

> **Status:** Built. `/` now renders a real home page (Navbar + Footer); the old
> coming-soon page moved to `/coming-soon`. This doc explains the thinking so the
> page can evolve with intent rather than guesswork.

## The problem we solved

Until now, `devstash.me` (`/`) served the **coming-soon** page — so anyone who
searched DevStash, clicked a shared link, or arrived from a résumé landed on a
dead-end email-capture screen. Every other page (about, projects, blog…) was
live, but the front door wasn't. The home page is the highest-intent page on the
site; it had to convert.

## Who lands on the home page (and what they want)

| Audience                              | What they're deciding             | What they need in <10 seconds                        |
| ------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| **Recruiters / hiring managers**      | "Is this person worth a call?"    | Role fit, proof of work, availability, easy résumé   |
| **Companies / founders / tech leads** | "Can they actually build & ship?" | Real projects, engineering depth, a point of view    |
| **Developers**                        | "Is there something useful here?" | Quality writing, tools, a reason to subscribe/return |
| **Search engines**                    | "What is this page about?"        | Clear H1, structured data, fast load, internal links |

The home page is built to satisfy all four **in priority order**: hook → proof →
credibility → next step.

## The structure (top to bottom) and why

1. **Hero** (`HeroSection`)
   - Availability pill ("Available for frontend roles · Noida / Delhi NCR") —
     the single most important signal for recruiters, above the fold.
   - One-line value proposition + a focused sub-line (React/Next.js/automation).
   - Two primary CTAs: **View Projects** (proof) and **Get in Touch** (convert).
   - Quick stats (years, pages shipped, OSS) — instant credibility.
2. **Featured projects** (`ProjectsGrid`, preview of up to 6)
   - Proof of work comes before words. Falls back to latest projects if none are
     flagged `featured`. Links through to `/projects`.
3. **Latest writing** (`FeaturedPosts`, up to 3)
   - Signals an active, thinking engineer (great for devs + SEO freshness).
     Renders nothing gracefully if there are no posts yet.
4. **Closing CTA**
   - "Let's build something" + **Get in touch** and **Download résumé** (tracked
     as `cv_viewed`). Always give the visitor a next action.

## Conversion principles applied

- **Above-the-fold intent:** availability + value prop + CTA without scrolling.
- **Show, don't tell:** projects appear before any long bio.
- **One primary action per section**, with a secondary option — never a dead end.
- **Fast + accessible:** Server Components, no client JS for the page itself,
  single `<h1>`, semantic sections.
- **SEO:** `WebSite` + `Person` JSON-LD, canonical at the site root, the dynamic
  OG card from `/api/og`, internal links to projects/blog/contact.

## What's intentionally NOT on the home page (yet)

- A long résumé/timeline (that's `/about`).
- A newsletter signup (add when there's publishing cadence — see roadmap).
- Testimonials/logos (add when real ones exist — never fabricate).

## TODOs to make it land harder (when you have the assets)

These are the highest-leverage upgrades, in order:

1. **Replace placeholder copy** in `HeroSection` (headline, sub-copy) and the
   **real stats** (the `200+`, `6+`, `5+` are placeholders — make them true).
2. **Mark your best 3–6 projects `featured: true`** so the grid curates itself.
3. **Add a short "What I do" trio** (Engineering / Automation / Writing) if you
   want more narrative before projects.
4. **Add real social proof** once available (a quote, a shipped product, metrics).
5. **A/B the hero CTA** later via GA4 (`view_projects` vs `contact`).

## Files

- `app/(main)/page.tsx` — the home page (composes the sections below).
- `components/sections/HeroSection.tsx`, `ProjectsGrid.tsx`, `FeaturedPosts.tsx`.

> The old coming-soon page was **deleted** once this home page went live (it was
> redundant and posted to a placeholder form). It's recoverable from git history
> if a maintenance/coming-soon page is ever needed again.
