# DevStash

**A modern developer ecosystem showcasing engineering, automation, AI workflows, frontend systems, and developer resources.**

🌐 Live: [https://devstash.me](https://devstash.me)

---

## Project Overview & Goals

DevStash is not just a personal portfolio. It is a scalable developer brand and content platform evolving along this path:

```
Personal Portfolio → Developer Brand → Content Engine → Product Ecosystem
```

The goal is to build a trusted, high-performance, SEO-optimized platform that serves:
- **Recruiters** — fast-loading proof of work, clean UX, easy CV access.
- **Developers** — educational blogs, automation guides, reusable resources.
- **Founders & Tech Leads** — engineering mindset, execution capability, technical depth.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS (design tokens defined) |
| Content | MD / MDX / JSON (file-based, CMS-ready) |
| Fonts | Inter, Satoshi/Geist (headings), JetBrains Mono (code) |
| Analytics | GA4, Google Search Console, Bing Webmaster |
| Deployment | Vercel (or similar edge-first platform) |
| Automation | GitHub Actions, Node scripts, n8n (optional) |

---

## Folder Architecture

```
root/
├── app/
│   ├── (marketing)/        # Home, About, Contact, Legal
│   ├── projects/           # Projects list + [slug] detail
│   ├── resources/          # Resources page
│   ├── tools/              # Tools page
│   ├── contact/
│   ├── sitemap.(ts|js)
│   └── robots.(ts|js)
│
├── blog/
│   ├── posts/              # Blog post routes
│   ├── categories/         # Category archive routes
│   ├── tags/               # Tag archive routes
│   ├── authors/
│   └── seo/                # Blog-specific SEO helpers
│
├── components/
│   ├── ui/                 # Generic primitives (Button, Card, etc.)
│   ├── seo/                # Meta, JSON-LD, OG components
│   ├── blog/               # Blog-specific components
│   ├── layout/             # Shared layout (Nav, Footer, etc.)
│   └── sections/           # Page-section components
│
├── content/
│   ├── projects/           # Project MDX/JSON files
│   ├── blogs/              # Blog post MDX files
│   ├── pages/              # Static page content
│   └── metadata/           # Global metadata config
│
├── docs/                   # ← You are here
│   ├── brand/
│   ├── seo/
│   ├── automation/
│   ├── ai-rules/
│   └── workflows/
│
├── lib/
│   ├── seo/                # SEO helpers: buildMeta, canonicalUrl, etc.
│   ├── analytics/          # Analytics event helpers
│   ├── schema/             # JSON-LD typed builders
│   ├── markdown/           # MD/MDX parsing utilities
│   └── automation/         # Shared automation utilities
│
├── public/
│   ├── images/
│   ├── og/                 # Generated OG images
│   ├── logos/
│   └── favicons/
│
├── scripts/
│   ├── seo/                # Sitemap gen, schema injection
│   ├── indexing/           # Search Console indexing pings
│   ├── automation/         # OG image gen, link checks
│   └── ai/                 # AI-assisted content scripts
│
└── README.md               ← This file
```

---

## SEO Strategy

DevStash is built SEO-first. Every page ships with:
- Unique `<title>` and `<meta name="description">`
- `<link rel="canonical">`
- Open Graph + Twitter Card tags
- JSON-LD structured data (Schema.org)
- Semantic HTML with a single `<h1>` per page
- XML sitemap inclusion

📖 Full details: [`/docs/seo/playbook.md`](./docs/seo/playbook.md)

> **Important:** The blog lives at `https://devstash.me/blog` and will **never** move to a subdomain. All blog routes are nested under `/blog` to preserve domain authority and SEO equity.

---

## Blog Architecture

Blog content lives at `/blog` on the main domain. It is architecturally separated from portfolio/marketing code but shares generic UI primitives.

📖 Full details: [`/docs/workflows/blog-architecture.md`](./docs/workflows/blog-architecture.md)

---

## Automation Workflows

Repetitive tasks are scripted or AI-assisted:
- OG image generation from post metadata
- Sitemap auto-update on content change
- MDX frontmatter linting
- Lighthouse/Playwright CI checks
- Broken link scans
- Indexing pings to Search Console

📖 Full details: [`/docs/automation/workflows.md`](./docs/automation/workflows.md)

---

## AI Rules

All AI-assisted work on DevStash must follow the Master AI System Prompt to ensure consistent tone, SEO compliance, and no hallucinated data.

📖 Full details: [`/docs/ai-rules/usage.md`](./docs/ai-rules/usage.md)

---

## Deployment

> TODO: Add environment variables list and deployment steps once hosting is finalized.

**Recommended checklist before deploy:**
- [ ] `robots.txt` configured correctly (no accidental blocking).
- [ ] `sitemap.xml` generated and submitted to Google Search Console and Bing Webmaster Tools.
- [ ] All `.env` values set in the hosting platform.
- [ ] Lighthouse score > 90 on mobile and desktop.
- [ ] GA4 and Search Console verified and tracking.

---

## Contributing / Working on This Project

When using AI tools to assist with this project, always load the Master AI System Prompt first.
See [`/docs/ai-rules/usage.md`](./docs/ai-rules/usage.md) for the prompt and example usage.
