# DevStash — Complete AI Context File

# Paste this at the start of every new Claude conversation

# Last updated: Phase 9 complete — versions verified against package.json (Jun 2026)

---

## SECTION 1 — PROJECT IDENTITY

**Name:** DevStash  
**Domain:** devstash.me  
**Staging:** staging.devstash.me (Vercel preview, dev branch)  
**Developer:** Adesh Shukla, Ghaziabad, India  
**Positioning:** "A modern developer ecosystem showcasing engineering, automation, AI workflows, frontend systems, and developer resources." — NOT just a personal portfolio.  
**Evolution path:** Personal Portfolio → Developer Brand → Content Engine → Product Ecosystem

---

## SECTION 2 — MASTER AI RULES (ALWAYS FOLLOW)

### RULE 1 — DO NOT OVERENGINEER

Prefer maintainable, readable, boring-good solutions. No premature abstractions, no unnecessary libraries.

### RULE 2 — SEO IS NON-NEGOTIABLE

Every significant page MUST have:

- Unique `<title>` (50–60 chars) and `<meta description>` (130–160 chars)
- `<link rel="canonical">`
- Open Graph tags (og:title, og:description, og:url, og:image, og:type)
- Twitter Card tags
- Single `<h1>`, logical heading hierarchy
- JSON-LD structured data (via lib/schema/builders.ts)
- Inclusion in /sitemap.xml

### RULE 3 — BLOG LIVES AT /blog SUBFOLDER ONLY

NEVER use blog.devstash.me subdomain — splits domain authority and backlinks.
All blog routes: /blog, /blog/[slug], /blog/category/[category], /blog/tag/[tag]

### RULE 4 — CONTENT STRUCTURE MUST STAY MODULAR

Each content type (projects, blogs, experience, resources, tools) must:

- Have its own TypeScript interface
- Be independently editable (MDX/JSON file-based)
- Be separately queryable
- Support future CMS migration (swap lib/markdown layer only)

### RULE 5 — NO HALLUCINATIONS

NEVER invent project metrics, fake clients, fake testimonials, fake SEO data.
If info missing: mark as TODO or ask.
Applies to AI-generated content too: never fabricate code, benchmarks, or "human" anecdotes to sound authentic or evade AI detectors — use `[TODO: ...]` placeholders instead (see Phase 10). Google does not penalize AI content; fabrication does break RULE 5.

### RULE 6 — DESIGN SYSTEM CONSISTENCY

Always use DevStash brand tokens. Never use arbitrary colors.

### RULE 7 — PERFORMANCE BUDGET

- Lighthouse target: >90 mobile and desktop
- LCP <2.5s, CLS <0.1, INP <200ms
- Default to Server Components. `use client` only when interactive.
- `next/image` for all images (enforced via ESLint)
- `next/font` for all fonts (self-hosted, zero layout shift)
- `next/script strategy="lazyOnload"` for all third-party scripts

### RULE 8 — FILE STRUCTURE IS FIXED

Never create files outside the established folder structure.
Never mix concerns between modules.

---

## SECTION 3 — TECH STACK (HARD CONSTRAINTS)

| Layer           | Choice                                | Notes                                                                                                                                    |
| --------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16.2.6 App Router             | Turbopack DISABLED (Windows crashes)                                                                                                     |
| UI Library      | React 19.2.4 (exact pin)              | react-dom 19.2.4 — pinned, not caret-ranged                                                                                              |
| Language        | TypeScript strict mode                | noUnusedLocals, noUnusedParameters                                                                                                       |
| Styling         | Tailwind CSS v4                       | Tokens in globals.css @theme (NOT tailwind.config.ts)                                                                                    |
| Package manager | pnpm ONLY                             | Never suggest npm or yarn                                                                                                                |
| Fonts           | next/font/google                      | DM Sans (sans) + JetBrains Mono (mono)                                                                                                   |
| Images          | next/image                            | @next/next/no-img-element ESLint rule (config pending)                                                                                   |
| Deployment      | Vercel                                | pnpm build, pnpm install commands                                                                                                        |
| DNS             | Cloudflare                            | DNS Only mode (grey cloud) — no proxy with Vercel                                                                                        |
| Content         | MDX + JSON                            | File-based, CMS-ready (next-mdx-remote ^6.0.0)                                                                                           |
| CI/CD           | GitHub Actions                        | .github/workflows/ci.yml                                                                                                                 |
| Testing/QA      | Playwright ^1.61                      | `pnpm qa` = static security audit + 200–1440px responsive suite (scripts/qa/, tests/qa/). `pnpm test:smoke` = post-deploy checks vs prod |
| Analytics       | GA4 + Search Console + Speed Insights | lazyOnload strategy; @vercel/speed-insights ^2.0.0 wired                                                                                 |

---

## SECTION 4 — BRAND DESIGN SYSTEM

### Colors (Tailwind v4 @theme tokens)

```css
--color-ds-bg: #0b0f19 /* bg-ds-bg — page background */ --color-ds-surface: #111827
  /* bg-ds-surface — cards, panels */ --color-ds-surface2: #161f2e
  /* bg-ds-surface2 — inputs, title bars */ --color-ds-accent: #3b82f6
  /* text-ds-accent / bg-ds-accent — CTAs, links */ --color-ds-purple: #8b5cf6
  /* text-ds-purple — secondary accent */ --color-ds-text: #f3f4f6 /* text-ds-text — primary text */
  --color-ds-muted: #9ca3af /* text-ds-muted — subtext, metadata */ --color-ds-border: #1f2937
  /* border-ds-border — dividers, card edges */ --color-ds-border2: #2a3649
  /* border-ds-border2 — subtle borders */ --color-ds-success: #10b981 --color-ds-warning: #f59e0b
  --color-ds-error: #ef4444;
```

### Typography

- **Headings/UI:** DM Sans (variable: --font-sans) — weights 300,400,500,600,700
- **Code/Mono:** JetBrains Mono (variable: --font-mono) — weights 400,500,700
- Tailwind: `font-sans` → DM Sans, `font-mono` → JetBrains Mono

### Logo Mark

SVG terminal-style `>_` mark in dark rounded square:

```svg
<rect width="100" height="100" rx="22" fill="#0B0F19"/>
<rect stroke="#1F2937" strokeWidth="2"/>
<path d="M23 34L46 50L23 66" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
<rect x="53" y="57" width="26" height="7" rx="3.5" fill="#8B5CF6"/>
```

### Wordmark

`<span style="color:#3B82F6">Dev</span>Stash` — DM Sans 700, tracking -0.04em

---

## SECTION 5 — ENVIRONMENT VARIABLES

```bash
# .env.local (gitignored) — local dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_CLARITY_ID=
RESEND_API_KEY=
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=

# Vercel Dashboard — Production
NEXT_PUBLIC_SITE_URL=https://devstash.me

# Vercel Dashboard — Preview
NEXT_PUBLIC_SITE_URL=https://staging.devstash.me
```

**Rule:** NEXT*PUBLIC* vars = safe for client. Others = server only (API routes / Server Components).

---

## SECTION 6 — FOLDER STRUCTURE (STRICT)

```
devstash/
├── app/
│   ├── (standalone)/           ← No Navbar/Footer (Coming Soon)
│   │   └── page.tsx
│   ├── (main)/                 ← Navbar + Footer via layout.tsx
│   │   ├── layout.tsx
│   │   └── preview/page.tsx    ← DELETE before launch
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── resources/page.tsx
│   ├── tools/page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   ├── [slug]/page.tsx
│   │   ├── category/[category]/page.tsx
│   │   └── tag/[tag]/page.tsx
│   ├── contact/page.tsx
│   ├── api/
│   │   ├── og/route.tsx        ← Dynamic OG images (edge runtime)
│   │   └── contact/route.ts    ← Contact form (Resend)
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── not-found.tsx
│   ├── layout.tsx              ← Root (fonts + global metadata only)
│   └── globals.css
│
├── components/
│   ├── ui/                     ← Button, Card, Badge, Input, Separator, Skeleton
│   ├── layout/                 ← Navbar, NavbarLinks, MobileNav, Footer, Breadcrumb
│   ├── seo/                    ← JsonLd
│   ├── blog/                   ← BlogCard, BlogList, BlogFilter, TOC, AuthorBio, RelatedPosts
│   └── sections/               ← HeroSection, ProjectsGrid, FeaturedPosts
│
├── content/
│   ├── projects/               ← project-slug.json
│   ├── blogs/                  ← post-slug.mdx
│   ├── pages/                  ← about.md etc
│   └── metadata/
│       └── site.config.ts      ← Global SEO defaults
│
├── lib/
│   ├── seo/
│   │   └── buildMetadata.ts    ← Metadata factory for all pages
│   ├── analytics/
│   │   └── events.ts           ← trackEvent() typed helper
│   ├── schema/
│   │   └── builders.ts         ← JSON-LD schema builders (6 functions)
│   ├── markdown/
│   │   ├── blog.ts             ← getAllPosts(), getPostBySlug()
│   │   └── projects.ts         ← getAllProjects(), getProjectBySlug()
│   ├── automation/
│   │   └── utils.ts            ← slugify(), readingTime(), validateFrontmatter()
│   └── utils/
│       └── cn.ts               ← Tailwind class merger (clsx + tailwind-merge)
│
├── types/
│   ├── blog.ts                 ← BlogPost, BlogCategory, BlogTag interfaces
│   ├── project.ts              ← Project interface
│   ├── seo.ts                  ← MetadataOptions, BreadcrumbItem, FAQItem
│   └── content.ts              ← PaginatedResult<T>, FilterOptions
│
├── public/
│   ├── images/                 ← Static images
│   ├── og/                     ← Pre-generated OG fallback
│   ├── logos/                  ← SVG + PNG logo variants
│   └── favicons/
│
├── scripts/
│   ├── seo/check-metadata.ts   ← MDX frontmatter linter
│   ├── automation/check-links.ts
│   └── indexing/ping-search-console.ts
│
├── docs/                       ← Brand guidelines, build plan, AI rules
├── .github/workflows/ci.yml    ← TypeScript check + build check
├── .env.local                  ← Gitignored
├── .env.example                ← Committed, empty values
├── .gitattributes              ← * text=auto eol=lf
├── .npmrc
├── .prettierrc
├── tailwind.config.ts          ← Minimal (content paths only, v4)
└── tsconfig.json               ← strict: true, paths: @/*
```

---

## SECTION 7 — PHASES STATUS

### ✅ Phase 0 — Foundation (COMPLETE)

- Next.js 16.2.6 scaffolded, TypeScript, Tailwind v4, App Router
- Full folder structure created with .gitkeep
- GitHub repo: github.com/adeshukla/devstash (main + dev branches)
- Branch protection on main (require PR)
- Vercel connected: pnpm build, pnpm install, .next output
- .env.local + .env.example created
- Prettier configured (.prettierrc + prettier-plugin-tailwindcss)
- Husky + lint-staged (Prettier only — ESLint deferred)
- .gitattributes for CRLF normalization
- ESLint: packages installed (eslint ^9, eslint-config-next 16.2.6, @typescript-eslint ^8.60.0) but `lint` script is still a placeholder echo — config not wired up yet

### ✅ Phase 1 — Core Infrastructure (COMPLETE)

- Tailwind v4 @theme tokens in globals.css (all ds-\* tokens)
- DM Sans + JetBrains Mono via next/font/google (self-hosted)
- content/metadata/site.config.ts (global SEO defaults)
- app/layout.tsx: root layout with fonts, default metadata, suppressHydrationWarning
- lib/seo/buildMetadata.ts: metadata factory function
- GitHub Actions CI: .github/workflows/ci.yml (tsc + build check)
- Coming Soon page: app/(standalone)/page.tsx
- 404 page: app/not-found.tsx (glitch effect, monitor illustration)

### ✅ Phase 2 — Design System (COMPLETE)

**UI Primitives (components/ui/):**

- Button.tsx: variants(primary/ghost/outline/danger), sizes(sm/md/lg), href→Link, loading, icons
- Card.tsx: variants(default/hover/accent), padding options, CardHeader/CardFooter
- Badge.tsx: 7 variants(default/blue/purple/green/warn/error/muted), dot option
- Input.tsx + Textarea: accessible (useId, aria-describedby, aria-invalid), label/hint/error
- Separator.tsx: horizontal/vertical/labeled
- SkeletonLoader.tsx: CardSkeleton, BlogCardSkeleton, TextSkeleton
- components/ui/index.ts: barrel exports

**Layout Components (components/layout/):**

- Navbar.tsx: Server Component wrapper, NavLogo, desktop links, mobile trigger
- NavbarLinks.tsx: 'use client', usePathname for active state, active dot indicator
- MobileNav.tsx: 'use client', native <dialog>, focus trap, auto-close on route change
- Footer.tsx: Server Component, address tag, nav/legal/social links
- Breadcrumb.tsx: visible trail + BreadcrumbList JSON-LD schema
- components/layout/index.ts: barrel exports

**SEO Components (components/seo/):**

- JsonLd.tsx: <script type="application/ld+json"> renderer

**Schema Builders (lib/schema/builders.ts):**

- buildPersonSchema(): Person schema
- buildWebSiteSchema(): WebSite schema
- buildBlogPostingSchema(post): BlogPosting schema
- buildProjectSchema(project): SoftwareApplication | CreativeWork
- buildBreadcrumbSchema(items): BreadcrumbList schema
- buildFAQSchema(faqs): FAQPage schema

**Other:**

- lib/utils/cn.ts: clsx + tailwind-merge utility
- types/seo.ts: MetadataOptions, BreadcrumbItem, FAQItem, OgOptions
- types/content.ts: PaginatedResult<T>, FilterOptions, SortOrder
- app/api/og/route.tsx: Edge runtime OG image (1200x630, branded)
- Route groups: app/(standalone)/ and app/(main)/

### ✅ Phase 3 — Content Layer (COMPLETE)

- types/blog.ts: BlogPost, BlogCategory, BlogTag interfaces
- types/project.ts: Project interface
- MDX pipeline: **next-mdx-remote** (switched from @next/mdx — Turbopack serialization error on Windows), gray-matter, rehype-slug, rehype-pretty-code, remark-gfm
- lib/markdown/blog.ts: getAllPosts(), getPostBySlug(), getRelatedPosts()
- lib/markdown/projects.ts: getAllProjects(), getProjectBySlug(), getFeaturedProjects()
- lib/automation/utils.ts: slugify(), readingTime(), validateFrontmatter()
- app/sitemap.ts: auto-generated XML sitemap (static routes + blog posts + projects)
- app/robots.ts: crawl directives
- First real content files: 1 test blog post (content/blogs/) + 1 project (content/projects/)

**⚠️ Package note:** Use `next-mdx-remote`, NOT `@next/mdx`. The `@next/mdx` package causes a Turbopack serialization error. Switch was made during this phase.

### ✅ Phase 4 — Core Marketing Pages (COMPLETE)

- app/(main)/about/page.tsx
- app/(main)/projects/page.tsx + [slug]/page.tsx
- app/(main)/resources/page.tsx
- app/(main)/tools/page.tsx
- app/(main)/contact/page.tsx (form + Resend email via /api/contact route)
- app/(main)/privacy/page.tsx + terms/page.tsx
- components/sections/: HeroSection, ProjectsGrid, FeaturedPosts
- All pages have buildMetadata() + JsonLd schema + BreadcrumbList where applicable

### ✅ Phase 5 — Blog System (COMPLETE)

- app/(main)/blog/page.tsx (list + filter by category/tag)
- app/(main)/blog/[slug]/page.tsx (post + TOC + related posts)
- app/(main)/blog/category/[category]/page.tsx (category archives)
- app/(main)/blog/tag/[tag]/page.tsx (tag archives)
- components/blog/: BlogCard, BlogList, BlogFilter, TOC, AuthorBio, RelatedPosts, MDXComponents
- BlogPosting + BreadcrumbList JSON-LD on every post page
- generateStaticParams for all slugs, categories, and tags

### ✅ Phase 6 — SEO & OG Images (COMPLETE)

- Dynamic OG endpoint (app/api/og, edge, 1200×630) + lib/seo/ogImage.ts helper
- OG image URLs wired into every page's buildMetadata()
- Article OG tags (published/modified time, author, section, tags) on blog posts
- Root layout provides default OG/Twitter + robots/googleBot tags (covers client pages)
- SEO audit: relative canonicals, single h1, JSON-LD coverage; fixed canonical & title-suffix bugs
- sitemap.ts covers all public routes; robots.ts allow-all + sitemap; verification meta tags
- docs/seo-checklist.md created
- Remaining manual step: validate JSON-LD via Rich Results Test + submit sitemap to GSC/Bing

### ✅ Phase 7 — Automation Scripts (COMPLETE)

- scripts/seo/check-metadata.mjs — MDX frontmatter linter (errors fail, SEO issues warn)
- scripts/automation/check-links.mjs — broken internal-link checker (--external opt-in)
- pnpm scripts: lint:content, check:links
- @lhci/cli + lighthouserc.cjs + .github/workflows/lighthouse.yml (perf/a11y/seo/best-practices ≥ 0.9)
- Wired into .husky/pre-commit (lint:content) and ci.yml (content-checks job)
- Manual step: install the Lighthouse CI GitHub App + set LHCI_GITHUB_APP_TOKEN secret

### ✅ Phase 8 — Analytics & Launch (COMPLETE)

- lib/analytics/events.ts — typed trackEvent + ANALYTICS_EVENTS (5 events) + crash-proof no-op
- GA4 + optional Clarity via next/script (lazyOnload), env-gated in components/layout/Analytics.tsx
- Events wired: contact_form_submitted, github_link_clicked, resource_clicked, blog_post_read (75% scroll), cv_viewed (dormant until a CV/PDF link exists)
- AnalyticsClicks delegated listener + ReadTracker scroll tracker
- docs/launch-checklist.md — GA4/GSC/Bing/custom-domain/Vercel-env runbook
- Manual steps for Adesh: create GA4 property, verify GSC/Bing, configure Cloudflare DNS (grey-cloud), set Vercel env vars
- Pre-launch checklist complete
- Custom domain live: devstash.me

### ✅ Phase 9 — Blog Admin Panel (COMPLETE — local-only)

> **Implemented as a local-only authoring tool.** Vercel's runtime FS is read-only,
> so the whole admin surface is disabled (404) in production via `isAdminEnabled()`
> (`NODE_ENV !== 'production'`). Author locally → commit + push.

**Auth:** `iron-session` encrypted cookie (`devstash_admin`). Login password from
`ADMIN_PASSWORD`, cookie secret from `SESSION_SECRET` (≥32 chars). Constant-time
password check (`crypto.timingSafeEqual`). Secrets are server-only (`import
'server-only'` in lib/auth/session.ts); never NEXT*PUBLIC*.

**Routes:** `app/admin/` layout (noindex) + dashboard, `/admin/login`, `/admin/new`,
`/admin/edit/[slug]`. API: `/api/admin/login`, `/api/admin/logout`,
`/api/admin/posts` (POST create / PUT update).

**Write path:** `lib/markdown/writePost.ts` (server-only) — path-traversal-safe,
kebab-slug validated, create=409-on-exists / update=404-if-missing, frontmatter
validated, written via `gray-matter` stringify. Output passes `pnpm lint:content`.

**New files:** lib/auth/{adminEnabled,session}.ts, lib/markdown/writePost.ts,
components/admin/{PostEditor,LoginForm,LogoutButton}.tsx, app/admin/**, app/api/admin/**.

**Env vars:** `ADMIN_PASSWORD`, `SESSION_SECRET` (both server-only, set in .env.local).

**Package added:** `iron-session` (^8).

**Note:** `/admin` is noindex and excluded from the sitemap. Not reachable in prod.

### 🟡 Phase 10 — AI Blog Automation + Humanizing (PARTIALLY SHIPPED)

> **Shipped to production (2026-07):** `/lab/ai-content-pipeline` — a real 3-step Groq chain
> (scaffold → copy-edit → frontmatter) in `app/api/ai-pipeline/route.ts`. Design principle: it
> NEVER fabricates code, metrics, or "human voice" to sound authentic or beat AI detectors — the
> scaffold leaves `[TODO: ...]` placeholders (`lib/ai/humanInputMarkers.ts`) wherever only the
> author's real experience belongs. Do NOT reintroduce a "sound human"/"beat the detector"
> instruction here — that path was tried, fabricates content, and still fails detectors. Groq has an
> automatic Cerebras fallback (`lib/ai/groq.ts`). The copy-edit pass strips AI-tell phrases
> (`lib/ai/aiTellPhrases.ts`).
>
> **Still just a proposal (NOT built):** the n8n → Admin API workflow described below.

**Stack:** n8n (already running at localhost:5678) + Groq API (already used in cold email workflow, `llama-3.1-8b-instant`) + DevStash Admin API (Phase 9).

**Full n8n Workflow — "Blog Draft Generator":**

```
1. Webhook Trigger
   → Triggered from Admin Panel "Generate with AI" button
   → Payload: { topic, keywords[], tone, targetLength, notes }

2. Draft Generation (Groq — LLM Chain)
   → Model: llama-3.1-8b-instant
   → Prompt: "Write a technical blog post for developers about [topic].
     Target keywords: [keywords]. Length: ~[targetLength] words.
     Use real code examples. No fluff. Notes: [notes]."
   → Output: raw draft text

3. Humanizing Pass (Groq — second LLM Chain)
   → Takes output from step 2 via $('Draft Generation').all()[0].json.text
   → Prompt: "Rewrite this draft to sound like a real developer wrote it.
     Remove all AI giveaways (avoid: 'In conclusion', 'It's worth noting',
     'Delve into', 'Leverage', 'Comprehensive'). Add opinions, real-world
     frustration, and developer humor where natural. Keep all code examples
     intact. Keep technical accuracy."
   → Output: humanized draft

4. SEO + Frontmatter Generation (Groq — third LLM Chain)
   → Takes humanized draft
   → Prompt: "Generate JSON frontmatter for this blog post.
     Return ONLY valid JSON, no markdown. Schema: { title, slug, description,
     category, tags, readingTime (int, estimate at 200wpm) }"
   → Output: JSON string

5. Code Node — Assemble MDX
   → Parses frontmatter JSON from step 4
   → Assembles full MDX file string with frontmatter + humanized content
   → Sets draft: true, featured: false
   → Payload: { slug, mdxContent, frontmatter }

6. HTTP Request Node — POST to DevStash Admin API
   → POST https://devstash.me/api/admin/posts (or localhost:3000 for local)
   → Header: Authorization: Bearer [ADMIN_PASSWORD]
   → Body: { slug, content: mdxContent }
   → Saves as draft in content/blogs/

7. Respond to Webhook
   → Returns { success: true, slug, adminUrl: /admin/edit/[slug] }
   → Admin panel redirects to edit page for final review
```

**Admin Panel Integration:** "Generate with AI" button on `/admin/new` opens a modal: topic input + keyword tags + tone selector (Technical/Conversational/Tutorial) + length slider. On submit → calls n8n webhook → polls for result → redirects to edit page with generated draft.

**Key n8n gotcha (already known):** Each LLM Chain node drops upstream JSON fields. Use `$('NodeName').all()[0].json.text` in subsequent nodes to pass content between steps.

**New env vars:**

```bash
N8N_BLOG_WEBHOOK_URL=http://localhost:5678/webhook/blog-draft   # or ngrok URL
N8N_WEBHOOK_SECRET=your-webhook-secret                          # to verify origin
```

---

## SECTION 8 — THIRD-PARTY TOOLS

| Tool                  | Status       | Notes                                                                                 |
| --------------------- | ------------ | ------------------------------------------------------------------------------------- |
| Vercel                | ✅ Connected | pnpm build, github.com/adeshukla/devstash                                             |
| GitHub                | ✅ Setup     | main (prod) + dev (staging) branches                                                  |
| Cloudflare            | ✅ DNS Only  | Grey cloud on all records (no proxy with Vercel)                                      |
| Google Search Console | ⬜ Pending   | Add after custom domain live                                                          |
| Google Analytics 4    | ⬜ Pending   | Add NEXT_PUBLIC_GA_ID                                                                 |
| Bing Webmaster        | ⬜ Pending   | After GSC setup                                                                       |
| Ahrefs Webmaster      | ⬜ Pending   | Free tier, after launch                                                               |
| Microsoft Clarity     | ⬜ Optional  | Heatmaps/session recording                                                            |
| Resend                | ✅ Phase 4   | Contact form email delivery — v6.12.4 installed                                       |
| Formspree             | ✅ Done      | Coming soon page (replaced by Resend in Phase 4)                                      |
| Lighthouse CI         | ✅ Phase 7   | @lhci/cli installed — lighthouserc.cjs + workflow                                     |
| Vercel Speed Insights | ✅ Installed | @vercel/speed-insights ^2.0.0 — real user perf monitoring, not in original phase docs |

---

## SECTION 9 — BLOG CONTENT MODEL

Every blog post MDX file MUST have:

```mdx
---
title: 'Post Title'
slug: 'post-slug-kebab-case'
description: '130-160 chars, unique, human-readable'
author: 'Adesh Shukla'
createdAt: 'YYYY-MM-DD'
updatedAt: 'YYYY-MM-DD'
category: 'automation' # one of: automation, frontend, performance, ai-workflows, devtools, tutorials, career
tags: ['tag-one', 'tag-two'] # 2-5 tags, kebab-case
featuredImage: '/images/blog/slug.webp'
readingTime: 7
canonical: 'https://devstash.me/blog/slug'
draft: false
featured: false
---
```

---

## SECTION 10 — KNOWN ISSUES & FIXES

| Issue                                                      | Fix Applied                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| gitleaks CI step fails on public/secret-shaped files       | IndexNow key (`public/<32hex>.txt`) + the security-audit script's regex patterns look like secrets. Allowlisted in `.gitleaks.toml` (extend.useDefault + allowlist.paths). Add new by-design "secret-shaped" files there |
| `main` branch protection (docs say PR-required)            | NOT actually enforced as of 2026-07 — a direct `git push origin main` succeeded. Verify in GitHub Settings → Branches before assuming a PR gate                                                                          |
| `gh` CLI not installed in this dev env                     | Use local `git merge` + `git push` for dev→main, not `gh pr create`                                                                                                                                                      |
| Playwright `waitUntil:'networkidle'` hangs vs `next dev`   | HMR websocket never idles — use `domcontentloaded` + explicit wait. And `documentElement.scrollWidth` gives false overflow (scrollbars/fixed els); assert `window.scrollX` after `scrollTo()`                            |
| Phantom tsc errors in `.next/dev/types/routes.d.ts`        | Stale generated file — `rm -rf .next/dev/types` and re-run `pnpm tsc --noEmit`                                                                                                                                           |
| Lighthouse CI referenced in Phase 7 but no workflow exists | `.github/workflows/lighthouse.yml` + `lighthouserc.cjs` are NOT in the repo. Only CI workflows: `ci.yml`, `smoke.yml` (deploy-triggered), `submit-sitemap.yml`                                                           |
| Turbopack crashes on Windows                               | Removed --turbopack flag from package.json dev script                                                                                                                                                                    |
| Hydration mismatch (Grammarly/Dark Reader)                 | suppressHydrationWarning on <body> in layout.tsx                                                                                                                                                                         |
| ESLint 9 + Next.js 16 flat config not yet wired up         | ESLint deferred — only Prettier via lint-staged. Packages ARE installed (eslint ^9, eslint-config-next 16.2.6); `lint` script is a placeholder echo until configured                                                     |
| CRLF line endings on Windows                               | git config --global core.autocrlf true + .gitattributes                                                                                                                                                                  |
| pnpm approve-builds (sharp/unrs-resolver)                  | Added to .npmrc: onlyBuiltDependencies                                                                                                                                                                                   |
| Tailwind v4 @theme warning in VS Code                      | .vscode/settings.json: "css.validate": false                                                                                                                                                                             |
| bg-ds-\* classes not working                               | Tokens in @theme in globals.css (v4 syntax), NOT tailwind.config.ts                                                                                                                                                      |
| .env\* in .gitignore blocking .env.example                 | Changed to explicit: .env, .env.local, .env.\*.local                                                                                                                                                                     |
| @next/mdx Turbopack serialization error                    | Switched to next-mdx-remote — works with App Router + Turbopack off                                                                                                                                                      |
| TypeScript errors: canonical vs path in MetadataOptions    | Field is `canonical` (NOT `path`), and it takes a RELATIVE path — buildMetadata prepends siteConfig.url. MetadataOptions lives in types/seo.ts                                                                           |
| buildMetadata `type` union                                 | Only `'website' \| 'article'` (NO `'profile'`). Article pages may also pass publishedTime/modifiedTime/authors/section/tags                                                                                              |
| BreadcrumbItem fields                                      | Fields are `name` and `url` (NOT `label`/`href`) — verified in types/seo.ts                                                                                                                                              |
| JsonLd prop                                                | Prop is `data` (NOT `schema`) — verified in components/seo/JsonLd.tsx. The `<Breadcrumb>` component emits its own BreadcrumbList JSON-LD, so don't add a manual one on the same page                                     |

---

## SECTION 11 — INSTALLED PACKAGES (EXACT VERSIONS — verified against package.json)

```bash
# ✅ Phase 0-2 (installed)
clsx ^2.1.1
tailwind-merge ^3.6.0          # NOTE: v3, not v2 — breaking API changes if you remember v2 patterns
schema-dts ^2.0.0
prettier ^3.8.3
prettier-plugin-tailwindcss ^0.8.0
husky ^9.1.7
lint-staged ^17.0.5
@eslint/eslintrc ^3.3.5        # installed, NOT wired into a working lint script yet

# ✅ Phase 3 (installed) — NOTE: next-mdx-remote, NOT @next/mdx
next-mdx-remote ^6.0.0
gray-matter ^4.0.3
remark-gfm ^4.0.1              # devDep
rehype-slug ^6.0.0             # devDep
rehype-pretty-code ^0.14.3     # devDep
unified ^11.0.5                # devDep

# ✅ Phase 4 (installed)
resend ^6.12.4                 # major version bump from early docs — check changelog before assuming old API
zod ^4.4.3                     # BREAKING from v3 — different API (e.g. error handling, .parse() changes).
                                # Never write Zod v3-style code. Verify schema syntax against v4 docs.

# ✅ Phase 7 (installed)
@lhci/cli ^0.15.1               # devDep — NOTE: lighthouserc.cjs + lighthouse.yml workflow are NOT actually in the repo (see Known Issues)

# ✅ QA/security automation (installed 2026-07) — portable to other repos
@playwright/test ^1.61.1        # devDep — pnpm qa:responsive + pnpm test:smoke

# ✅ Phase 9 (installed) — Blog Admin auth
iron-session ^8.0.4

# ✅ NOT IN ORIGINAL PHASE DOCS — confirmed in package.json, undocumented until now
@vercel/speed-insights ^2.0.0   # Real user monitoring on Vercel dashboard. Already wired — do not add a duplicate.

# Core framework (exact pins — do not assume looser ranges)
next 16.2.6                     # EXACT pin, not ^16
react 19.2.4                    # EXACT pin, not ^19
react-dom 19.2.4                # EXACT pin, not ^19

# ESLint stack — installed but NOT active (lint script is a placeholder echo)
eslint ^9
eslint-config-next 16.2.6
@next/eslint-plugin-next ^16.2.6
@typescript-eslint/eslint-plugin ^8.60.0
@typescript-eslint/parser ^8.60.0

# Tailwind v4 toolchain
tailwindcss ^4
@tailwindcss/postcss ^4

# ⬜ Phase 10 — AI Blog Automation (pending — n8n side, no new npm packages needed)
# n8n workflow uses Groq API (already set up) + HTTP Request node to DevStash API
```

**Rule:** When suggesting any code using `zod`, `resend`, or `tailwind-merge`, verify against the
exact versions above first — these have had breaking changes from common older patterns in training data.

---

## SECTION 12 — SEO URL STRUCTURE

```
/                          Home
/about                     About
/projects                  Projects list
/projects/[slug]           Project detail
/resources                 Resources
/tools                     Tools
/blog                      Blog list
/blog/[slug]               Blog post
/blog/category/[category]  Category archive
/blog/tag/[tag]            Tag archive
/contact                   Contact
/privacy                   Privacy Policy
/terms                     Terms of Service
/sitemap.xml               Auto-generated
/robots.txt                Auto-generated
/api/og                    OG image generator
/api/contact               Contact form endpoint
```

Rules: lowercase, kebab-case, no trailing slash, no query params for primary content.

---

## SECTION 13 — HOW TO USE THIS FILE

**Start of every new conversation:**

```
Read this CLAUDE.md for full project context:
[paste entire CLAUDE.md content]

Current task: [what you want to do]
```

**Update this file after each phase completes.**

**Current Status (2026-07):** Phase 9 complete. Phase 10 partially shipped — honest-scaffold AI pipeline (`/lab/ai-content-pipeline`) live in prod; n8n workflow still proposal-only. `/lab` hub + recruiter-facing home/case-studies/nav shipped to `main`. `pnpm qa` security/responsive automation added. Sitemap/IndexNow auto-submission wired (IndexNow live; GSC step skips until `GSC_SERVICE_ACCOUNT_JSON` + `GSC_PROPERTY` repo secrets are set). Pending on user: GSC secrets, Groq key rotation, real quotes for social-proof section.

**Version note (Jun 2026):** This file's tech stack was corrected against the live `package.json` —
Next.js is **16.2.6** (not 15), React is pinned at **19.2.4**, Zod is **^4.4.3** (v4 API, breaking
from v3), Resend is **^6.12.4**, tailwind-merge is **^3.6.0**, and **@vercel/speed-insights ^2.0.0**
is installed and wired (previously undocumented). Always cross-check `package.json` directly if in doubt.
