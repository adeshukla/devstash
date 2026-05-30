# SEO Playbook

> **Location:** `/docs/seo/playbook.md`
> **Purpose:** Complete on-page and technical SEO checklist, structured data recipes, and rules for DevStash.

---

## The #1 Rule

> **Blog lives at `https://devstash.me/blog` and will NEVER move to a subdomain.**
> Using `blog.devstash.me` would split domain authority, dilute backlinks, and require recrawling. The blog subfolder inherits all main domain trust signals.

---

## Page-Level SEO Checklist

Complete this checklist for every significant page before publishing.

### Metadata
- [ ] `<title>` — 50–60 characters, unique per page, primary keyword near the start.
- [ ] `<meta name="description">` — 130–160 characters, written for humans, unique per page.
- [ ] `<link rel="canonical">` — points to the preferred, definitive URL for this page.

### Open Graph Tags
- [ ] `og:title` — matches or closely mirrors the `<title>`.
- [ ] `og:description` — can mirror or slightly expand the meta description.
- [ ] `og:url` — full canonical URL.
- [ ] `og:image` — 1200×630px, WebP or JPEG, descriptive filename.
- [ ] `og:type` — `website` for most pages, `article` for blog posts.

### Twitter Card Tags
- [ ] `twitter:card` — `summary_large_image` for most pages.
- [ ] `twitter:title`
- [ ] `twitter:description`
- [ ] `twitter:image`

### Semantic HTML
- [ ] Single `<h1>` per page — contains the primary topic/keyword naturally.
- [ ] Logical `H2` and `H3` hierarchy — no skipped levels.
- [ ] Landmark roles: `<header>`, `<nav>`, `<main>`, `<footer>` present and correct.
- [ ] No `<div>` soup where semantic elements belong.

### Images
- [ ] Every `<img>` has a descriptive `alt` attribute (not empty, not "image of", not filename).
- [ ] Images use `next/image` for automatic optimization.
- [ ] Format: WebP or AVIF preferred.
- [ ] Lazy-load all non-critical (below-fold) images.

### Internal Linking
- [ ] At least 1–3 internal links to related pages per post/page.
- [ ] Anchor text is descriptive (not "click here").
- [ ] No orphan pages — every page reachable via navigation or internal link.

### Sitemap
- [ ] Page included in `/sitemap.xml`.
- [ ] No accidental `noindex` on important pages.

---

## Site-Wide Technical SEO Checklist

- [ ] `robots.txt` present and correctly configured — allows crawling of all important routes.
- [ ] `/sitemap.xml` generated and submitted to:
  - [ ] Google Search Console
  - [ ] Bing Webmaster Tools
- [ ] HTTPS enforced — no HTTP pages, no mixed content.
- [ ] No `www` vs non-`www` duplication — one canonical form, redirect the other.
- [ ] Mobile-friendly — no horizontal scroll, tap targets ≥ 44px, readable font sizes.
- [ ] Core Web Vitals passing:
  - [ ] LCP < 2.5s
  - [ ] CLS < 0.1
  - [ ] INP < 200ms
- [ ] Clean URL structure: lowercase, kebab-case, no query params for primary content.
- [ ] 404 page is custom and helpful (links back to Home, Blog, Projects).
- [ ] No broken internal links (run periodic checks via script).
- [ ] Redirect chains are minimal (no chains longer than 1 hop).

---

## Structured Data Recipes (JSON-LD)

All structured data uses JSON-LD in a `<script type="application/ld+json">` tag in the `<head>`.

### 1. Person (sitewide / homepage)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "TODO: Your Full Name",
  "url": "https://devstash.me",
  "jobTitle": "TODO: Your Job Title",
  "sameAs": [
    "TODO: https://github.com/yourusername",
    "TODO: https://linkedin.com/in/yourprofile"
  ]
}
```

### 2. WebSite (homepage)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "DevStash",
  "url": "https://devstash.me",
  "description": "A modern developer ecosystem showcasing engineering, automation, AI workflows, frontend systems, and developer resources."
}
```

### 3. BlogPosting (each blog post)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "TODO: Post Title",
  "description": "TODO: Post description",
  "author": {
    "@type": "Person",
    "name": "TODO: Your Name",
    "url": "https://devstash.me/about"
  },
  "datePublished": "TODO: YYYY-MM-DD",
  "dateModified": "TODO: YYYY-MM-DD",
  "image": "TODO: https://devstash.me/images/blog/post-slug.webp",
  "url": "TODO: https://devstash.me/blog/post-slug",
  "publisher": {
    "@type": "Person",
    "name": "TODO: Your Name",
    "url": "https://devstash.me"
  }
}
```

### 4. SoftwareApplication / Project
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TODO: Project Name",
  "description": "TODO: Project description",
  "url": "TODO: https://devstash.me/projects/project-slug",
  "author": {
    "@type": "Person",
    "name": "TODO: Your Name",
    "url": "https://devstash.me"
  },
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web"
}
```

### 5. BreadcrumbList (nested pages)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://devstash.me"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://devstash.me/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "TODO: Post Title",
      "item": "TODO: https://devstash.me/blog/post-slug"
    }
  ]
}
```

### 6. FAQPage (for FAQ sections)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "TODO: Question text?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TODO: Answer text."
      }
    }
  ]
}
```

> **Rules for FAQ schema:**
> - Only use on pages with genuine Q&A content visible to the user.
> - Question and answer must match the visible page content exactly.
> - Do not fabricate answers or questions.

---

## Meta Title & Description Formula

### Title Formula
```
[Primary Keyword or Topic] — [Brand or Context] | DevStash
```
Examples:
- `Next.js Performance Optimization Guide | DevStash`
- `AI Automation Workflow for Developers | DevStash Blog`
- `Frontend Engineering Projects | DevStash`

### Description Formula
Describe what the page delivers + why a developer should read/visit it. 130–160 characters.

Examples:
- `Practical techniques to improve Next.js LCP, CLS, and bundle size. Real benchmarks, no fluff. Written for frontend engineers.`
- `Explore DevStash projects: web apps, automation tools, and AI-powered developer utilities built with Next.js and TypeScript.`

---

## SEO Anti-Patterns (Never Do These)

| Anti-Pattern | Reason |
|---|---|
| Duplicate `<title>` or meta across pages | Confuses crawlers, signals low quality |
| Missing `<h1>` or multiple `<h1>` tags | Breaks heading hierarchy signals |
| `noindex` on project/blog pages accidentally | Removes pages from search entirely |
| Keyword stuffing in titles or descriptions | Penalized by Google, poor UX |
| No `alt` text on images | Accessibility failure + missed keyword signal |
| Blog on subdomain (`blog.devstash.me`) | Splits domain authority and backlink equity |
| Fake structured data (made-up ratings, reviews) | Google penalizes structured data spam |
| Pages not in sitemap | Slower or no crawling and indexing |
