# AI Rules & Usage Guide

> **Location:** `/docs/ai-rules/usage.md`
> **Purpose:** Reference for using AI tools effectively and safely on the DevStash project. Includes the Master AI System Prompt and example prompts.

---

## How to Use AI on DevStash

AI assistance is encouraged for:
- Blog content drafts and outlines
- SEO metadata generation (titles, descriptions, schema)
- Code scaffolding (components, types, utilities)
- Automation script drafts
- Documentation drafts

AI assistance is **not** a replacement for:
- Technical verification of facts and benchmarks
- Human review of all published content
- Strategic decisions about architecture or brand

**Always load the Master AI System Prompt** (below) when starting a new AI session on any DevStash task.

---

## Master AI System Prompt

Paste this as the **system message / developer message** in ChatGPT, Claude, or any AI tool when working on DevStash:

```
You are an AI assistant working exclusively on the DevStash brand and product.

DevStash basics:
- Name: DevStash
- Primary domain: https://devstash.me
- Positioning: "A modern developer ecosystem showcasing engineering, automation, AI workflows, frontend systems, and developer resources." Not just a personal portfolio.
- Evolution path: Personal Portfolio → Developer Brand → Content Engine → Product Ecosystem.

ALWAYS obey the following rules and constraints.

================================================
SECTION 1 — CORE PRODUCT PHILOSOPHY
================================================
1. Performance-first
   - Prioritize fast initial load, low JavaScript weight, and minimal blocking resources.
   - Target: Lighthouse > 90, CLS < 0.1, LCP < 2.5s, responsive and input-latency-optimized UI.

2. SEO before design complexity
   - Never sacrifice crawlability, metadata, or semantic structure for visuals.
   - Animations and micro-interactions are optional; SEO hygiene and clarity are mandatory.

3. Scalable, modular content architecture
   - Treat content types as independent modules: projects, blogs, experience, testimonials, resources, tools, pages.
   - Each module must support JSON/YAML/MD/MDX-based storage, API-driven rendering, future CMS migration, and static or hybrid rendering.

4. AI-assisted automation and minimal maintenance
   - Any repetitive workflow (metadata, schema, OG images, indexing pings, link checks) should be scriptable or AI-assisted.
   - Prefer configuration + metadata over hardcoded logic.

================================================
SECTION 2 — STRICT AI RULES
================================================
RULE 1 — DO NOT OVERENGINEER
- Prefer maintainable, readable, boring-good solutions over clever ones.
- Avoid premature abstractions, unnecessary libraries, complex state machines, or micro-optimizations unless clearly justified.

RULE 2 — SEO IS NON-NEGOTIABLE
Every significant page MUST support: <title>, <meta name="description">, <link rel="canonical">, Open Graph tags, Twitter Card tags, semantic HTML with one <h1>, XML sitemap inclusion, robots-aware routing, and appropriate structured data.

RULE 3 — BLOG SYSTEM MUST STAY SEPARATED (CODE-LEVEL), BUT LIVE UNDER /blog
- Blog content MUST live at https://devstash.me/blog and nested routes.
- DO NOT use a separate subdomain like blog.devstash.me.
- The blog engine must NEVER tightly couple with portfolio-specific logic.

RULE 4 — CONTENT STRUCTURE MUST STAY MODULAR
- Each content type (projects, blogs, experience, testimonials, resources, tools) must have its own type/interface definitions, be independently editable, and be separately queryable.

RULE 5 — AVOID AI HALLUCINATIONS
AI MUST NEVER invent project metrics, create fake clients or collaborators, generate fake testimonials or stats, or fabricate SEO data.
If information is missing: mark as placeholder, ask for input, or leave a clear TODO.

RULE 6 — DESIGN SYSTEM CONSISTENCY
Use existing typography, spacing scale, and brand color tokens. Use existing UI primitives. Maintain mobile-first responsive consistency.

RULE 7 — SEO CONTENT MUST PRIORITIZE HUMAN READABILITY
No keyword stuffing. Natural language. Clear headings, short paragraphs, scannable structure.

RULE 8 — PERFORMANCE BUDGET
Avoid large JS bundles, unnecessary dependencies, heavy animations. Prefer static generation and progressive enhancement. Optimize images (WebP/AVIF, lazy-load, responsive sizes).

RULE 9 — FILE STRUCTURE MUST REMAIN PREDICTABLE
Follow the established folder structure: app/, blog/, components/, content/, lib/, public/, scripts/, docs/.

RULE 10 — AUTOMATE REPETITIVE TASKS
Identify and propose automations for repeated tasks: OG image gen, sitemap updates, frontmatter linting, Lighthouse CI, broken link scans, indexing pings.

Color tokens: Background #0B0F19, Surface #111827, Accent #3B82F6, Secondary Accent #8B5CF6, Text Primary #F3F4F6, Text Secondary #9CA3AF, Border #1F2937.
Typography: Headings (Inter/Satoshi/Geist), Body (Inter/Manrope), Monospace (JetBrains Mono/Fira Code).

If user instructions conflict with these DevStash rules: explain the conflict and propose a solution that stays as close as possible to this specification while respecting the user's intent.
```

---

## Example Prompts

### 1. Blog Post Outline
```
Generate a DevStash-compliant blog post outline for the topic: "How to Set Up a Next.js CI Pipeline with GitHub Actions and Lighthouse".

Requirements:
- Target audience: frontend developers and indie hackers.
- Category: automation
- Target keyword: "next.js github actions ci pipeline"
- Include: H1, H2s, H3s, estimated reading time, suggested internal links to DevStash projects/resources pages, and a suggested meta description (130–160 chars).
- Follow DevStash tone: professional, technical, minimal, no fluff.
```

### 2. JSON-LD Schema Generation
```
Generate a BlogPosting JSON-LD schema for the following blog post frontmatter:

Title: "How to Set Up a Next.js CI Pipeline with GitHub Actions"
Slug: "nextjs-ci-pipeline-github-actions"
Description: "Step-by-step guide to building a CI pipeline for Next.js with GitHub Actions, Lighthouse audits, and automated sitemap updates."
Author: TODO: [Your Name]
Published: 2025-02-10
Updated: 2025-02-12
URL: https://devstash.me/blog/nextjs-ci-pipeline-github-actions
Image: https://devstash.me/images/blog/nextjs-ci-pipeline-github-actions.webp

Output as a valid JSON-LD object following Schema.org BlogPosting type.
```

### 3. Meta Title & Description
```
Write a meta title (50–60 chars) and meta description (130–160 chars) for the following DevStash page:

Page: Projects list page at https://devstash.me/projects
Purpose: Showcases all developer projects built by [TODO: Your Name], including web apps, automation tools, and AI-powered utilities using Next.js and TypeScript.

Follow DevStash SEO rules: unique, human-readable, no keyword stuffing, primary keyword near the start of the title.
```

### 4. Component Scaffold
```
Scaffold a TypeScript React Server Component for a BlogCard used in DevStash's blog list page.

Requirements:
- Displays: featured image, title, description, category badge, tags list, reading time, published date.
- Uses: next/image for the image, next/link for the card link.
- Follows: DevStash design tokens (background #0B0F19, surface #111827, accent #3B82F6, text primary #F3F4F6, text secondary #9CA3AF).
- Styled with: Tailwind CSS utility classes.
- No hardcoded data — accepts a BlogPost prop typed using the DevStash BlogPost interface.
- Performance: no unnecessary use client, no heavy dependencies.
```

### 5. Frontmatter Validation Script
```
Write a Node.js TypeScript script for DevStash that:
- Reads all .mdx files in /content/blogs/
- Validates that each file includes all required frontmatter fields: title, slug, description, author, createdAt, updatedAt, category, tags, featuredImage, readingTime, canonical.
- Checks that slugs are unique across all posts.
- Checks that no slug contains uppercase letters, spaces, or underscores.
- Outputs a clear list of errors and warnings to the terminal.
- Exits with a non-zero code if any required fields are missing (for use in CI).
```

---

## AI Safety Rules — What AI Must Never Do on DevStash

| Prohibited Action | Why |
|---|---|
| Invent project metrics ("increased traffic 300%") | Fake data destroys credibility |
| Create fake clients or collaborators | Dishonest and legally risky |
| Generate fake testimonials or endorsements | Undermines trust |
| Fabricate SEO rankings or analytics | Misleading and unverifiable |
| Suggest moving blog to a subdomain | Violates core SEO architecture rule |
| Add unnecessary npm packages | Violates performance budget |
| Use `any` type in TypeScript | Undermines type safety |
| Hardcode content that should be data-driven | Violates modularity principle |

---

## Workflow: AI-Assisted Blog Post (End to End)

```
1. Keyword Research
   → Prompt AI: "Suggest 10 long-tail keywords for the topic [X] relevant to frontend developers."

2. Content Brief
   → Prompt AI: "Generate a DevStash blog content brief for the keyword [X]."
   → Output: H1, H2 outline, target queries, suggested internal link targets.

3. Draft
   → Prompt AI: "Write the full draft following the content brief. Use DevStash tone: technical, minimal, helpful."
   → Human review: verify all technical claims, add real code examples.

4. SEO Pass
   → Prompt AI: "Optimize headings, meta title, meta description, and internal links for this draft."

5. Schema Generation
   → Prompt AI: "Generate BlogPosting JSON-LD for this post's frontmatter."

6. Publish
   → Add MDX file to /content/blogs/
   → Run frontmatter validation script
   → Rebuild + deploy
   → Request indexing in Google Search Console if needed.
```
