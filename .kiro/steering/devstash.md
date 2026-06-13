# DevStash — Kiro Agent Steering Document

# Place this file at: .kiro/steering/devstash.md

> **Model:** claude-opus-4-8  
> **Project:** DevStash (devstash.me) — Developer platform, NOT a basic portfolio  
> **Current Status:** Phase 9 COMPLETE → Phase 10 NEXT (AI Blog Automation)  
> **Developer:** Adesh Shukla, Ghaziabad, India

---

## 🚨 MANDATORY PRE-TASK PROTOCOL — DO THIS BEFORE WRITING ANY CODE

Before touching any file, run these reads in order. Non-negotiable.

```
1. Read  types/seo.ts            → BreadcrumbItem, MetadataOptions, OgOptions shapes
2. Read  types/blog.ts           → BlogPost, BlogCategory, BlogTag interfaces
3. Read  types/project.ts        → Project interface
4. Read  types/content.ts        → PaginatedResult<T>, FilterOptions shapes
5. Read  lib/seo/buildMetadata.ts → Actual function signature (canonical, not path)
6. Read  components/seo/JsonLd.tsx → Actual prop name is `data` (NOT `schema`)
7. Read  app/globals.css          → All ds-* token names before using any class
8. Read  the target file if editing → Never write over a file you haven't read
```

If a file doesn't exist yet → check types + sibling files first, then create.

---

## ⛔ ABSOLUTE RULES — NEVER BREAK THESE

| Rule                          | What it means                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| **pnpm only**                 | Never write `npm install`, `yarn add`. Always `pnpm add` / `pnpm run`                 |
| **No turbopack**              | Dev script must NOT have `--turbopack` flag (crashes on Windows)                      |
| **next-mdx-remote only**      | Never use `@next/mdx` — causes Turbopack serialization crash                          |
| **No arbitrary colors**       | Only `ds-*` design tokens. Zero hardcoded hex values in JSX/TSX                       |
| **No hallucinated data**      | Mark missing info as `// TODO:` or ask. Never invent metrics/testimonials             |
| **Server Components default** | Add `'use client'` only when the component genuinely needs interactivity              |
| **No subdomain for blog**     | All blog routes under `/blog/*`. Never `blog.devstash.me`                             |
| **Fixed folder structure**    | Never create files outside the established directory tree (see Section 5)             |
| **Read types first**          | If you assume a type shape without reading the file, you will cause TypeScript errors |
| **SEO on every page**         | Every new page MUST have buildMetadata() + JSON-LD + canonical. No exceptions         |

---

## 💥 KNOWN TYPESCRIPT GOTCHAS — MEMORIZE THESE

These have already caused bugs. Don't repeat them.

```typescript
// ✅ CORRECT — buildMetadata() call
buildMetadata({
  canonical: '/blog/my-post',   // ← field is `canonical`, NOT `path`. RELATIVE path only
                                //    (buildMetadata prepends siteConfig.url — never pass an absolute URL)
  type: 'article',              // ← field is `type`, NOT `ogType`.
                                //    MetadataOptions.type only allows 'website' | 'article' (NO 'profile')
})

// ✅ CORRECT — JsonLd usage
<JsonLd data={buildBlogPostingSchema(post)} />  // ← prop is `data` (verified in components/seo/JsonLd.tsx)

// ✅ CORRECT — BreadcrumbItem shape
const crumbs: BreadcrumbItem[] = [
  { name: 'Home', url: '/' },  // ← fields are `name` + `url` (verified in types/seo.ts)
]
// NOTE: the <Breadcrumb> layout component renders its own BreadcrumbList JSON-LD
//       internally — do NOT also emit a manual buildBreadcrumbSchema() on the same
//       page or you get a duplicate schema of the same @type.

// ✅ CORRECT — Badge variants
<Badge variant="blue" />   // variants: default | blue | purple | green | warn | error | muted
// NOT: "primary", "secondary", "info", "danger" — those don't exist

// ✅ CORRECT — Button variants
<Button variant="primary" />  // variants: primary | ghost | outline | danger
// sizes: sm | md | lg
```

**When in doubt:** READ the actual component file. Do not assume from memory.

---

## 🛠️ TECH STACK — HARD CONSTRAINTS

```
Framework     : Next.js 15, App Router, NO turbopack
Language      : TypeScript — strict: true, noUnusedLocals, noUnusedParameters
Styling       : Tailwind CSS v4 — tokens in globals.css @theme (NOT tailwind.config.ts)
Content       : next-mdx-remote + gray-matter (NOT @next/mdx)
Package Mgr   : pnpm ONLY
Fonts         : next/font/google → DM Sans (--font-sans) + JetBrains Mono (--font-mono)
Images        : next/image ONLY (@next/next/no-img-element ESLint enforced)
Deployment    : Vercel (pnpm build, pnpm install)
DNS           : Cloudflare — grey cloud DNS Only (never orange cloud with Vercel)
SEO           : lib/seo/buildMetadata.ts + lib/schema/builders.ts
Analytics     : GA4 + GSC (lazyOnload strategy)
```

---

## 🎨 DESIGN TOKENS — EXACT CLASS NAMES

These are the only valid color classes. Never use Tailwind defaults (blue-500, gray-900 etc).

```
Background    : bg-ds-bg         (#0b0f19)  — page background
Surface       : bg-ds-surface    (#111827)  — cards, panels
Surface2      : bg-ds-surface2   (#161f2e)  — inputs, title bars
Accent Blue   : bg-ds-accent / text-ds-accent   (#3b82f6)  — CTAs, links
Accent Purple : text-ds-purple   (#8b5cf6)  — secondary accent
Text Primary  : text-ds-text     (#f3f4f6)  — primary text
Text Muted    : text-ds-muted    (#9ca3af)  — subtext, metadata
Border        : border-ds-border  (#1f2937) — card edges, dividers
Border2       : border-ds-border2 (#2a3649) — subtle borders
Success       : text-ds-success  (#10b981)
Warning       : text-ds-warning  (#f59e0b)
Error         : text-ds-error    (#ef4444)
```

Typography:

- UI/Headings: `font-sans` → DM Sans
- Code/Mono: `font-mono` → JetBrains Mono
- Aesthetic: Vercel/Linear-inspired — Developer Dark UI

---

## 📁 FOLDER STRUCTURE — STRICTLY FIXED

```
devstash/
├── app/
│   ├── (standalone)/           ← No Navbar/Footer (Coming Soon page)
│   ├── (main)/                 ← All public pages with Navbar + Footer
│   │   ├── layout.tsx
│   │   ├── about/page.tsx
│   │   ├── projects/page.tsx + [slug]/page.tsx
│   │   ├── resources/page.tsx
│   │   ├── tools/page.tsx
│   │   ├── blog/page.tsx + [slug]/page.tsx + category/[cat]/ + tag/[tag]/
│   │   ├── contact/page.tsx
│   │   └── privacy/page.tsx + terms/page.tsx
│   ├── api/
│   │   ├── og/route.tsx        ← Edge runtime OG image (1200x630)
│   │   └── contact/route.ts    ← Resend email
│   ├── sitemap.ts / robots.ts / not-found.tsx / layout.tsx / globals.css
│
├── components/
│   ├── ui/          ← Button, Card, Badge, Input, Textarea, Separator, SkeletonLoader
│   ├── layout/      ← Navbar, NavbarLinks, MobileNav, Footer, Breadcrumb
│   ├── seo/         ← JsonLd
│   ├── blog/        ← BlogCard, BlogList, BlogFilter, TOC, AuthorBio, RelatedPosts, MDXComponents
│   └── sections/    ← HeroSection, ProjectsGrid, FeaturedPosts
│
├── lib/
│   ├── seo/buildMetadata.ts + seo/ogImage.ts
│   ├── analytics/events.ts
│   ├── schema/builders.ts      ← 6 JSON-LD builder functions
│   ├── markdown/blog.ts + projects.ts
│   ├── automation/utils.ts
│   └── utils/cn.ts
│
├── types/
│   ├── blog.ts / project.ts / seo.ts / content.ts
│
├── content/
│   ├── blogs/    ← *.mdx files (blog posts)
│   ├── projects/ ← *.json files (projects)
│   └── pages/    ← *.md files
│
├── public/images/ + og/ + logos/ + favicons/
├── scripts/seo/ + automation/ + indexing/
└── docs/
```

**Never create files outside this tree. Never merge concerns across modules.**

---

## 📝 SEO REQUIREMENTS — EVERY NEW PAGE

Every significant page MUST include ALL of:

```typescript
// 1. Metadata export (lib/seo/buildMetadata.ts) — MetadataOptions lives in types/seo.ts
export const metadata = buildMetadata({
  title: 'Page Title',                   // BARE title — buildMetadata appends ' | DevStash' itself.
                                         // Do NOT include '| DevStash' here (causes a doubled suffix).
                                         // Aim for ~50-60 chars AFTER the suffix is added.
  description: '130-160 char unique description of this specific page.',
  canonical: '/page-path',               // Always `canonical`, NOT `path`. RELATIVE path (no host)
  type: 'website',                       // only 'website' | 'article' (NO 'profile')
  // ogImage defaults to the dynamic /api/og endpoint automatically. Override per page:
  ogImage: buildOgImageUrl({ title: 'Page Title', description: '...', type: 'website' }),
})

// For ARTICLE pages (blog posts), also pass the article OG fields from frontmatter —
// buildMetadata emits article:published_time / modified_time / author / section / tag:
export const metadata = buildMetadata({
  title: post.title,
  description: post.description,
  canonical: `/blog/${post.slug}`,
  type: 'article',
  ogImage: buildOgImageUrl({ title: post.title, description: post.description,
                             type: 'article', category: post.category, readingTime: post.readingTime }),
  publishedTime: post.createdAt,
  modifiedTime: post.updatedAt,
  authors: [post.author],
  section: post.category,
  tags: post.tags,
})

// 2. JSON-LD structured data (lib/schema/builders.ts)
<JsonLd data={buildBreadcrumbSchema(breadcrumbs)} />  // prop is `data` (NOT `schema`)

// 3. Inclusion in app/sitemap.ts
// 4. Single <h1> with logical heading hierarchy (h2, h3 — never skip levels)
// 5. Canonical URL matches route exactly (lowercase, kebab-case, no trailing slash)
// NOTE: the root app/layout.tsx already provides default OG/Twitter + robots/googleBot
//       tags (incl. a dynamic default OG image), so even client-component pages that
//       can't export metadata still get a valid social card.
```

---

## 📊 PHASE STATUS — WHERE WE ARE

| Phase  | Status      | Description                                                                                                                                                                       |
| ------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0      | ✅ DONE     | Foundation, repo, Vercel, CI/CD                                                                                                                                                   |
| 1      | ✅ DONE     | Core infra, tokens, fonts, layout, buildMetadata                                                                                                                                  |
| 2      | ✅ DONE     | Full design system (Button, Card, Badge, Input, etc.)                                                                                                                             |
| 3      | ✅ DONE     | Content layer (MDX pipeline, blog.ts, projects.ts, sitemap)                                                                                                                       |
| 4      | ✅ DONE     | All marketing pages (about, projects, contact, privacy, terms)                                                                                                                    |
| 5      | ✅ DONE     | Full blog system (19 files, TOC, RelatedPosts, MDXComponents)                                                                                                                     |
| 6      | ✅ DONE     | SEO & OG Images (dynamic OG endpoint + ogImage.ts helper, full SEO audit, sitemap/robots, verification meta tags)                                                                 |
| 7      | ✅ DONE     | Automation scripts (MDX linter `scripts/seo/check-metadata.mjs`, link checker `scripts/automation/check-links.mjs`, Lighthouse CI + lighthouserc.cjs; wired into pre-commit + CI) |
| 8      | ✅ DONE     | Analytics & Launch (GA4 + optional Clarity via next/script env-gated, lib/analytics/events.ts trackEvent, event wiring, docs/launch-checklist.md)                                 |
| 9      | ✅ DONE     | Blog Admin Panel — local-only (iron-session auth, /admin dashboard+editor, /api/admin/\* MDX write API, production-locked via isAdminEnabled)                                     |
| **10** | **⚡ NEXT** | **AI Blog Automation (n8n + Groq workflow, webhook, MDX push)**                                                                                                                   |

**Phase 6 Deliverables — ✅ COMPLETE:**

- `app/api/og/route.tsx` — Dynamic OG image generation (edge, 1200×630, brand gradient, article/project variants, fallback) ✅
- `lib/seo/ogImage.ts` — `buildOgImageUrl()` helper; wired into every page's `buildMetadata()` ✅
- Full SEO audit — fixed canonical double-prefix + double title-suffix bugs; single h1 per page; JSON-LD coverage on every page ✅
- `app/sitemap.ts` covers all public routes incl. privacy/terms; `app/robots.ts` allow-all + sitemap (no static robots.txt) ✅
- `GOOGLE_SITE_VERIFICATION` + `BING_SITE_VERIFICATION` meta tags in `app/layout.tsx` (render only when env set) ✅
- `docs/seo-checklist.md` — manual pre-submission runbook (GSC + Bing) ✅
- Remaining manual step for Adesh: run the Rich Results Test + submit the sitemap to GSC/Bing (see `docs/seo-checklist.md`)

---

## 🗄️ ENVIRONMENT VARIABLES — REFERENCE

```bash
# .env.local (gitignored) — add to .env.example with empty values
NEXT_PUBLIC_SITE_URL=http://localhost:3000    # https://devstash.me in production
NEXT_PUBLIC_GA_ID=                           # Phase 8
NEXT_PUBLIC_CLARITY_ID=                      # Optional
RESEND_API_KEY=                              # Phase 4 — contact form
GOOGLE_SITE_VERIFICATION=                    # Phase 6
BING_SITE_VERIFICATION=                      # Phase 6
ADMIN_PASSWORD=                              # Phase 9 — never NEXT_PUBLIC_
N8N_BLOG_WEBHOOK_URL=                        # Phase 10
N8N_WEBHOOK_SECRET=                          # Phase 10
```

**Rule:** `NEXT_PUBLIC_*` = safe for client components. All others = server-only.

---

## 📦 INSTALLED PACKAGES — DO NOT RE-INSTALL

These are already installed. Don't add them again.

```bash
# Core (Phases 0-2)
clsx tailwind-merge schema-dts
prettier prettier-plugin-tailwindcss husky lint-staged

# Content (Phase 3) — USE next-mdx-remote, NEVER @next/mdx
next-mdx-remote gray-matter
remark remark-gfm rehype-slug rehype-pretty-code  # devDeps

# Phase 4
resend zod

# Phase 7 (installed) — Lighthouse CI
@lhci/cli  # devDep

# Phase 9 (installed) — Blog Admin auth
iron-session
```

Pending (don't install until their phase):

```bash
# (none — Phase 10 uses n8n + Groq externally, no new web app packages planned)
```

---

## 🐛 KNOWN ISSUES — ALREADY FIXED, DON'T UNDO

| Issue                                | Fix in place — DO NOT revert                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Turbopack crashes                    | `--turbopack` removed from package.json dev script                                                                                     |
| Hydration mismatch                   | `suppressHydrationWarning` on `<body>` in app/layout.tsx                                                                               |
| CRLF on Windows                      | `.gitattributes` has `* text=auto eol=lf`                                                                                              |
| pnpm approve-builds                  | `.npmrc` has `onlyBuiltDependencies` for sharp/unrs-resolver                                                                           |
| Tailwind v4 CSS warning              | `.vscode/settings.json` has `"css.validate": false`                                                                                    |
| `bg-ds-*` not working                | Tokens are in `@theme` in globals.css — never move to tailwind.config.ts                                                               |
| `.env*` gitignore issue              | Explicit entries: `.env`, `.env.local`, `.env.*.local`                                                                                 |
| ESLint 9 circular JSON               | ESLint DEFERRED — Prettier-only via lint-staged (do not add ESLint config)                                                             |
| `@next/mdx` crash                    | Replaced with `next-mdx-remote` — NEVER add @next/mdx back                                                                             |
| Canonical double-prefix (Phase 6)    | `buildMetadata` prepends `siteConfig.url`, so ALWAYS pass a RELATIVE `canonical` (`/about`) — never an absolute URL                    |
| Double `\| DevStash` title (Phase 6) | `buildMetadata` appends ` \| DevStash`, so pass BARE page titles — never embed `\| DevStash`/`— DevStash`                              |
| Duplicate BreadcrumbList (Phase 6)   | The `<Breadcrumb>` component emits its own BreadcrumbList JSON-LD — don't also add a manual `buildBreadcrumbSchema()` on the same page |

---

## 🔧 COMMANDS REFERENCE

```bash
pnpm dev                # Start dev server
pnpm build              # Production build
pnpm exec tsc --noEmit  # Type-check (NOTE: there is no `type-check` script in package.json)
pnpm lint:content       # MDX frontmatter linter (scripts/seo/check-metadata.mjs) — Phase 7
pnpm check:links        # Broken internal-link checker (scripts/automation/check-links.mjs) — Phase 7
# pnpm lint currently just echoes a placeholder — it does NOT run Prettier/ESLint yet
git checkout dev        # Always work on dev branch, PR to main
```

CI pipeline: `.github/workflows/ci.yml` runs `tsc --noEmit` + `pnpm build` on every push.

---

## 📐 BLOG POST MDX FRONTMATTER — EXACT SCHEMA

Every `.mdx` file in `content/blogs/` MUST have exactly this frontmatter:

```yaml
---
title: 'Post Title'
slug: 'post-slug-kebab-case'
description: '130-160 chars, unique, human-readable'
author: 'Adesh Shukla'
createdAt: 'YYYY-MM-DD'
updatedAt: 'YYYY-MM-DD'
category: 'automation' # one of: automation | frontend | performance | ai-workflows | devtools | tutorials | career
tags: ['tag-one', 'tag-two'] # 2-5 tags, kebab-case
featuredImage: '/images/blog/slug.webp'
readingTime: 7 # integer, estimate at 200wpm
canonical: 'https://devstash.me/blog/slug'
draft: false
featured: false
---
```

---

## 🤖 N8N AUTOMATION CONTEXT (Phase 10)

Already running: `n8n` at `localhost:5678`, Groq API (`llama-3.1-8b-instant`).

**Critical n8n gotcha already discovered:** LLM Chain nodes drop all upstream JSON fields. To pass data between nodes, use `$('NodeName').all()[0].json.text` in downstream Code nodes referencing the exact node name. Do NOT assume `$json.text` works.

---

## 🔄 AGENT DECISION PROTOCOL

**Before writing any code:**

1. Read types first (see Pre-Task Protocol above)
2. Check if the component already exists in `components/` before creating a new one
3. Check `components/ui/index.ts` barrel exports before importing a UI primitive

**When you hit a TypeScript error:**

1. Read the actual type file — don't guess the fix
2. Check if it's in the Known Gotchas table above
3. Never use `// @ts-ignore` or `as any` — fix the actual type

**When a task is ambiguous:**

- Stop and ask Adesh rather than assuming
- Especially for: content (no hallucinations), design decisions, new packages

**When creating a new page:**

- Always add it to `app/sitemap.ts`
- Always add `buildMetadata()` + at least one JSON-LD schema
- Always follow the `(main)/` route group (gets Navbar + Footer automatically)
- Never add it to `(standalone)/` unless it should NOT have Navbar/Footer

---

## 🏗️ PROJECT IDENTITY (Never lose sight of this)

DevStash is a **developer ecosystem**, not a resume site. Positioning:

> "A modern developer ecosystem showcasing engineering, automation, AI workflows, frontend systems, and developer resources."

Evolution path: Personal Portfolio → Developer Brand → **Content Engine** → Product Ecosystem

Every page, every component, every piece of copy should feel like it belongs to a serious developer tool brand. Think Vercel, Linear, Raycast — opinionated, dark, precise.
