# DevStash — Complete AI Context File

# Paste this at the start of every new Claude conversation

# Last updated: Phase 2 complete

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

| Layer           | Choice                 | Notes                                                 |
| --------------- | ---------------------- | ----------------------------------------------------- |
| Framework       | Next.js 15 App Router  | Turbopack DISABLED (Windows crashes)                  |
| Language        | TypeScript strict mode | noUnusedLocals, noUnusedParameters                    |
| Styling         | Tailwind CSS v4        | Tokens in globals.css @theme (NOT tailwind.config.ts) |
| Package manager | pnpm ONLY              | Never suggest npm or yarn                             |
| Fonts           | next/font/google       | DM Sans (sans) + JetBrains Mono (mono)                |
| Images          | next/image             | @next/next/no-img-element ESLint rule enforced        |
| Deployment      | Vercel                 | pnpm build, pnpm install commands                     |
| DNS             | Cloudflare             | DNS Only mode (grey cloud) — no proxy with Vercel     |
| Content         | MDX + JSON             | File-based, CMS-ready                                 |
| CI/CD           | GitHub Actions         | .github/workflows/ci.yml                              |
| Analytics       | GA4 + Search Console   | lazyOnload strategy                                   |

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

- Next.js 15 scaffolded, TypeScript, Tailwind v4, App Router
- Full folder structure created with .gitkeep
- GitHub repo: github.com/adeshukla/devstash (main + dev branches)
- Branch protection on main (require PR)
- Vercel connected: pnpm build, pnpm install, .next output
- .env.local + .env.example created
- Prettier configured (.prettierrc + prettier-plugin-tailwindcss)
- Husky + lint-staged (Prettier only — ESLint deferred)
- .gitattributes for CRLF normalization
- ESLint: DEFERRED (ESLint 9 + Next.js 15 flat config unstable)

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

### ⬜ Phase 3 — Content Layer (NEXT)

- types/blog.ts + types/project.ts
- MDX pipeline: gray-matter, rehype-slug, rehype-pretty-code, remark-gfm
- lib/markdown/blog.ts: getAllPosts(), getPostBySlug(), getRelatedPosts()
- lib/markdown/projects.ts: getAllProjects(), getProjectBySlug(), getFeaturedProjects()
- lib/automation/utils.ts: slugify(), readingTime(), validateFrontmatter()
- app/sitemap.ts: auto-generated XML sitemap
- app/robots.ts: crawl directives
- First real content files (1 test blog post + 1 project)

### ⬜ Phase 4 — Core Marketing Pages

- app/(main)/about/page.tsx
- app/(main)/projects/page.tsx + [slug]/page.tsx
- app/(main)/resources/page.tsx
- app/(main)/tools/page.tsx
- app/(main)/contact/page.tsx (form + Resend email)
- app/(main)/privacy/page.tsx + terms/page.tsx
- components/sections/: HeroSection, ProjectsGrid, FeaturedPosts

### ⬜ Phase 5 — Blog System

- app/(main)/blog/page.tsx (list + filter)
- app/(main)/blog/[slug]/page.tsx (post + TOC + related)
- app/(main)/blog/category/[category]/page.tsx
- app/(main)/blog/tag/[tag]/page.tsx
- components/blog/: BlogCard, BlogList, BlogFilter, TOC, AuthorBio, RelatedPosts, MDXComponents

### ⬜ Phase 6 — SEO & OG Images

- Dynamic OG images wired into all buildMetadata() calls
- Full SEO audit pass on every page
- All JSON-LD schemas validated via Google Rich Results Test
- Sitemap submitted to GSC + Bing

### ⬜ Phase 7 — Automation Scripts

- scripts/seo/check-metadata.ts (MDX frontmatter linter in CI)
- scripts/automation/check-links.ts (weekly cron)
- pnpm run lint:content added to CI pipeline

### ⬜ Phase 8 — Analytics & Launch

- GA4 events wired: cv_viewed, contact_form_submitted, github_link_clicked, blog_post_read
- lib/analytics/events.ts with typed EventName union
- Search Console + Bing Webmaster verified and sitemap submitted
- Pre-launch checklist complete
- Custom domain live: devstash.me

---

## SECTION 8 — THIRD-PARTY TOOLS

| Tool                  | Status       | Notes                                              |
| --------------------- | ------------ | -------------------------------------------------- |
| Vercel                | ✅ Connected | pnpm build, github.com/adeshukla/devstash          |
| GitHub                | ✅ Setup     | main (prod) + dev (staging) branches               |
| Cloudflare            | ✅ DNS Only  | Grey cloud on all records (no proxy with Vercel)   |
| Google Search Console | ⬜ Pending   | Add after custom domain live                       |
| Google Analytics 4    | ⬜ Pending   | Add NEXT_PUBLIC_GA_ID                              |
| Bing Webmaster        | ⬜ Pending   | After GSC setup                                    |
| Ahrefs Webmaster      | ⬜ Pending   | Free tier, after launch                            |
| Microsoft Clarity     | ⬜ Optional  | Heatmaps/session recording                         |
| Resend                | ⬜ Phase 4   | Contact form email delivery                        |
| Formspree             | ⬜ Temporary | Coming soon email form (replace with Resend later) |
| Lighthouse CI         | ⬜ Phase 7   | pnpm add -D @lhci/cli                              |

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

| Issue                                                 | Fix Applied                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| Turbopack crashes on Windows                          | Removed --turbopack flag from package.json dev script               |
| Hydration mismatch (Grammarly/Dark Reader)            | suppressHydrationWarning on <body> in layout.tsx                    |
| ESLint 9 + Next.js 15 flat config circular JSON error | ESLint deferred — only Prettier via lint-staged                     |
| CRLF line endings on Windows                          | git config --global core.autocrlf true + .gitattributes             |
| pnpm approve-builds (sharp/unrs-resolver)             | Added to .npmrc: onlyBuiltDependencies                              |
| Tailwind v4 @theme warning in VS Code                 | .vscode/settings.json: "css.validate": false                        |
| bg-ds-\* classes not working                          | Tokens in @theme in globals.css (v4 syntax), NOT tailwind.config.ts |
| .env\* in .gitignore blocking .env.example            | Changed to explicit: .env, .env.local, .env.\*.local                |

---

## SECTION 11 — INSTALLED PACKAGES (NON-DEFAULT)

```bash
# Installed
pnpm add schema-dts clsx tailwind-merge
pnpm add -D prettier prettier-plugin-tailwindcss husky lint-staged @eslint/eslintrc

# To install in Phase 3
pnpm add @next/mdx @mdx-js/loader @mdx-js/react
pnpm add -D gray-matter remark remark-gfm rehype-slug rehype-pretty-code

# To install in Phase 4
pnpm add resend zod

# To install in Phase 7
pnpm add -D @lhci/cli
```

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

**Current Status:** Phase 2 complete. Starting Phase 3 — Content Layer.
