# DevStash — Keyword Map & Organic Reach Plan

_Last updated: 2026-09-09. Analytics decision for this pass: **GTM stays exactly as it
is** (lazyOnload container in `components/layout/Analytics.tsx`) — no changes made._

---

## 0. Read this before the keyword list

Two honest constraints, so nothing below gets over-sold:

1. **No keyword volumes in this document.** There is no keyword tool wired into this
   repo (the Ahrefs connector is unauthenticated), so every number would be invented.
   Per RULE 5 there are none. Keywords below are ranked by **intent match ×
   winnability**, not by fabricated volume. Section 8 says how to get real numbers free.

2. **Keywords are not the current bottleneck — backlinks are.** GSC on 2026-09-04:
   13 clicks / 833 impressions / avg position 16.3 / **0 external links**, and 16 URLs
   sitting in "discovered / crawled – currently not indexed". A zero-authority domain
   cannot rank for competitive terms no matter how good the title tag is. So the whole
   strategy below is: **target queries where authority barely matters** — exact error
   strings, version-specific questions, and free-tool queries.

The good news from that same data: the two non-branded query families that already
surface are _exactly_ that shape — `"usesearchparams" "suspense" "build error" "next.js 16"`
and `next.js 16 params promise app router`. That is the proven vein. Mine it.

---

## 1. The strategy in one line

**Own error messages and version-specific "what changed" questions for Next.js 16 /
React 19 / Tailwind v4, and own the free-tool queries in `/lab`.** Everything else is
supporting cast.

Why this works at zero authority — verified against live SERPs (2026-09-09): results for
`next.js 16 useSearchParams suspense boundary build error` and
`tailwind v4 @theme tailwind.config.ts not working` are GitHub issues, the official docs
page, DEV.to posts, and small personal blogs (fixdevs.com, ivanguzman.dev,
iloveblogs.blog). Personal blogs rank on page 1 for these. They do not rank for
"react developer" or "web performance".

### Three keyword tiers, and how to treat each

| Tier                                   | Example                                                            | Winnable now?   | What to do                                      |
| -------------------------------------- | ------------------------------------------------------------------ | --------------- | ----------------------------------------------- |
| **A — Error / exact-string**           | `useSearchParams should be wrapped in a suspense boundary next 16` | Yes             | Dedicated post, error string verbatim in the H1 |
| **B — Version-delta / "what changed"** | `tailwind v4 css-first config what changed`                        | Yes, 3–9 months | Post, then keep it updated                      |
| **C — Head / commercial**              | `frontend developer portfolio`, `web performance`                  | **No.** Skip    | Do not spend a title tag on these               |

Anything you feel tempted to write that is Tier C, rewrite as Tier A or B.

---

## 2. Keyword map — existing pages

Primary = the one query that page should own. Secondary = supporting terms to work into
H2s and body copy naturally, not to stuff.

### Money pages

| URL          | Primary keyword                                                              | Secondary                                                       | Verdict on current title                                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | `adesh shukla ui developer` (branded — already 74 impressions, **0 clicks**) | `ppc landing page developer`, `landing page developer india`    | **Fix the CTR, not the ranking.** 74 impressions and zero clicks on your own name means the snippet is not compelling. Front-load the proof number: `Adesh Shukla — UI Developer · 200+ PPC Landing Pages` |
| `/services`  | `freelance next.js landing page developer`                                   | `seo-ready next.js build`, `n8n automation freelancer`          | Title is fine; the body needs the phrase "landing page" far more often than it currently does                                                                                                              |
| `/about`     | `adesh shukla`                                                               | `ui developer ghaziabad`, `frontend developer ncr`              | OK                                                                                                                                                                                                         |
| `/contact`   | `hire frontend developer noida`                                              | `hire ui developer gurugram`, `remote frontend developer india` | OK — best local-intent page on the site                                                                                                                                                                    |
| `/projects`  | `next.js project case study`                                                 | `frontend build notes`                                          | Weak. Case studies rank on the _problem_ they solved, not on the word "projects"                                                                                                                           |
| `/uses`      | `developer uses page`                                                        | `next.js 16 stack`, `tailwind v4 setup`                         | Fine. `/uses` pages attract organic links — keep it                                                                                                                                                        |
| `/resources` | `developer resources curated`                                                | —                                                               | Tier C, low ceiling. Leave as is                                                                                                                                                                           |
| `/tools`     | `developer tools daily driver`                                               | —                                                               | Tier C. Leave as is                                                                                                                                                                                        |

### `/lab` tools — the highest-reach pages on the site

Free tools earn links (which is the actual bottleneck) _and_ rank on transactional-ish
queries where nobody checks domain authority. Treat these as first-class SEO pages, not
demos.

| URL                           | Primary keyword                               | Secondary                                                                     |
| ----------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `/lab/utm-builder`            | `free utm builder`                            | `utm link generator`, `campaign url builder`, `utm parameter generator`       |
| `/lab/meta-tag-generator`     | `meta tag generator`                          | `open graph tag generator`, `twitter card generator`, `social preview tester` |
| `/lab/css-shapes-playground`  | `css clip-path generator`                     | `css shapes playground`, `clip path polygon tool`, `css blob generator`       |
| `/lab/illustration-generator` | `free svg illustration generator`             | `ai svg generator`, `open source illustration generator`                      |
| `/lab/ai-content-pipeline`    | `ai blog post generator with seo frontmatter` | `groq content pipeline`, `ai writing without hallucinated code`               |

**Action:** each lab tool page needs 300–600 words of real prose under the tool — what it
does, when to use it, the gotcha it handles. A bare widget with no text is the textbook
"crawled – currently not indexed" case, and there are 6 of those URLs in GSC right now.

### Blog category hubs

| URL                           | Primary keyword                 |
| ----------------------------- | ------------------------------- |
| `/blog/category/frontend`     | `next.js 16 tutorials`          |
| `/blog/category/automation`   | `n8n workflow examples`         |
| `/blog/category/ai-workflows` | `ai coding workflow`            |
| `/blog/category/performance`  | `core web vitals landing pages` |

Tag archives are `noindex` and should stay that way.

---

## 3. Existing posts worth re-titling (highest ROI, roughly an hour total)

Same content, better intent match. In each case Google already understands the page — the
title just does not match what the searcher typed.

| File                                                | Current title                                           | Change                                                                                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tailwind-v4-css-first-config-migration.mdx`        | "Tailwind v4's CSS-First Config: What Actually Changes" | Retitle to **"Tailwind v4: Why Your `tailwind.config.ts` Stopped Working"** — that is the query people actually type, and the live SERP for it is small blogs             |
| `usesearchparams-suspense-boundary-build-error.mdx` | already error-shaped ✅                                 | Leave the title. Add the two other variant strings as H2s: `Missing Suspense boundary with useSearchParams` and `should be wrapped in a suspense boundary at page "/404"` |
| `nextjs-16-app-router-patterns.mdx`                 | fine                                                    | Add an H2 for `searchParams is now a Promise` — GSC already shows `next.js 16 params promise app router` impressions landing here                                         |
| `why-devstash-isnt-on-react-compiler-yet.mdx`       | fine                                                    | Add H2 `Should I enable React Compiler?` — question form pulls People-Also-Ask                                                                                            |
| `core-web-vitals-high-traffic-landing-pages.mdx`    | fine                                                    | Secondary terms: `INP fix landing page`, `LCP element not settling`                                                                                                       |
| `screen-reader-accessibility-checklist.mdx`         | fine                                                    | Secondary terms: `react accessibility checklist`, `NVDA testing react`                                                                                                    |

---

## 4. Content gaps — new posts, ranked by winnability

Every one is Tier A or B, and every one comes from a gotcha already documented in
`CLAUDE.md` §10 or from work already done in this repo. Write them in this order.

1. **`Tailwind v4: bg-* classes not working after upgrade`** — the `@theme` gotcha,
   verbatim. Live SERP is small blogs. Highest win probability on the list.
2. **`Next.js 16: params and searchParams are Promises now`** — already earning
   impressions, still has no dedicated page.
3. **`Turbopack crashes on Windows: what I run instead`** — near-zero competition,
   painfully specific, and you actually hit it.
4. **`@next/mdx Turbopack serialization error → next-mdx-remote`** — an exact error
   string nobody has written up well.
5. **`ESLint 9 + eslint-config-next: "Converting circular structure to JSON"`** — exact
   error string; the FlatCompat fix is the answer.
6. **`Zod 4 vs Zod 3: what actually breaks`** — Tier B, large migration audience.
7. **`Next.js dev server keeps serving stale globals.css`** — the webpack CSS-cache gotcha.
8. **`react-hooks/set-state-in-effect: when the new rule is wrong`** — new rule, no
   settled answer online yet. Time-sensitive: write it soon or lose the window.
9. **`Playwright: waitUntil networkidle hangs against next dev`** — straight from the QA work.
10. **`llms.txt and Lighthouse Agentic Browsing: what the checks measure`** — emerging
    query, no entrenched incumbents.
11. **`Groq rate limits: automatic Cerebras fallback`** — niche, but exactly what someone
    hitting a 429 searches for.
12. **`iron-session 8 + Next.js 16 App Router auth`** — version-pair queries are gold.

Rule for all twelve: **the exact error string or version pair goes in the H1 and in the
first 100 words**, and the post opens with the fix, not a preamble.

---

## 5. Local / hiring cluster (separate intent — keep it off the blog)

These belong on `/contact`, `/about`, `/services`. Never in blog titles.

- `frontend developer ghaziabad` · `ui developer noida` · `react developer gurugram`
- `hire landing page developer india` · `ppc landing page developer for hire`
- `remote frontend developer india` · `next.js developer india`

`/contact` already carries the geography in plain body text, and
`lib/schema/builders.ts:35-42` already emits `jobTitle: 'UI Developer'` plus a
`PostalAddress` with `addressLocality: 'Ghaziabad'`. Nothing to add here — this cluster
is a copy job on the three pages, not a schema job.

---

## 6. The two structural fixes that beat any keyword

1. **Internal links.** GSC (2026-09-04) counted 299 internal links, with `/terms` holding
   as many inbound internal links as `/blog` — i.e. almost all of it is nav/footer
   boilerplate. Re-counted in the repo on 2026-09-09: **24 in-body `/blog/...` links
   across 25 posts**, up from 15, but that is still ~1 per post, and these 5 have none:
   `agentic-browsing-lighthouse`, `choosing-scalable-architecture-early`,
   `n8n-job-application-automation-groq-google-sheets`,
   `screen-reader-accessibility-checklist`, `understanding-css-cubic-bezier-easing`.
   Target **3–5 in-body contextual links per post**, pointed at the Tier A posts you want
   ranked. Cheapest ranking lever available and it costs no authority.

2. **Backlinks.** Still the root cause. The lab tools are the natural vehicle — a free UTM
   builder or clip-path generator gets linked; a portfolio does not. Cross-post the Tier A
   error posts to DEV.to with a canonical back here.

---

## 7. What not to do

- Do not add a `keywords` meta tag. Google has ignored it since 2009.
- Do not chase Lighthouse scores for SEO reasons. CWV reports "not enough usage data" —
  there is no field data, so performance is not affecting rankings today.
- Do not target Tier C head terms. At 0 backlinks that is wasted title-tag real estate.
- Do not keyword-stuff the AI pipeline output. The `[TODO: ...]` honesty stance stands.

---

## 8. How to get real numbers, free

1. **GSC → Performance → Queries**, filtered to Position 8–20. Those are the queries you
   _almost_ rank for. Anything there with impressions and no clicks is a title-tag fix,
   not a new post. Best keyword source available and it costs nothing.
2. **Google autocomplete + "People also ask"** on each Tier A error string — harvest the
   exact phrasings and turn them into H2s.
3. **Google Keyword Planner** (free with any Google Ads account, no spend required) for
   rough volume bands.

Re-measure against the 2026-09-04 baseline: 13 clicks · 833 impressions · position 16.3.
