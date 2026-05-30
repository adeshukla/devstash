# Information Architecture

> **Location:** `/docs/brand/information-architecture.md`
> **Purpose:** Defines the complete route map, navigation structure, and content relationship model for DevStash.

---

## Complete Route Map

### Marketing & Portfolio Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Brand introduction, featured projects, CTA to blog/resources |
| `/about` | About | Personal background, skills, experience, values |
| `/projects` | Projects List | Grid/list of all projects with filters |
| `/projects/[slug]` | Project Detail | Full breakdown of a single project |
| `/resources` | Resources | Curated developer tools, links, references |
| `/tools` | Tools | Interactive or downloadable tools built for developers |
| `/contact` | Contact | Contact form + social links |
| `/privacy` | Privacy Policy | Legal — privacy policy |
| `/terms` | Terms of Service | Legal — terms of use |

### Blog Routes (all nested under `/blog`)

| Route | Page | Purpose |
|---|---|---|
| `/blog` | Blog List | All posts, filterable by category/tag |
| `/blog/[slug]` | Blog Post | Full article with SEO, schema, related posts |
| `/blog/category/[category]` | Category Archive | All posts in a specific category |
| `/blog/tag/[tag]` | Tag Archive | All posts with a specific tag |

### System Routes

| Route | Purpose |
|---|---|
| `/sitemap.xml` | XML sitemap (auto-generated) |
| `/robots.txt` | Crawler directives |
| `/404` | Custom not-found page |

---

## Navigation Structure

### Primary Navigation (Desktop & Mobile)
```
DevStash Logo   |   Projects   Blog   Resources   Tools   About   Contact
```

### Navigation Rules
- **Sticky** on scroll (reduces bounce on long pages).
- **Keyboard-accessible** — full tab/focus navigation, visible focus rings.
- **Mobile-first** — hamburger/drawer on small screens, no horizontal overflow.
- **Active state** — clear visual indicator of current route.
- **No mega-menus** — keep it minimal and fast to parse.

### Footer Navigation
```
DevStash © 2025

Links:   Home · About · Projects · Blog · Resources · Tools · Contact
Legal:   Privacy Policy · Terms of Service
Social:  GitHub · LinkedIn · [Twitter/X] · [RSS Feed]
```

---

## Breadcrumb Structure

Breadcrumbs are used on all nested routes and rendered as both visible UI and `BreadcrumbList` JSON-LD schema.

| Page | Breadcrumb |
|---|---|
| Project Detail | Home → Projects → [Project Name] |
| Blog Post | Home → Blog → [Post Title] |
| Blog Category | Home → Blog → Category → [Category Name] |
| Blog Tag | Home → Blog → Tag → [Tag Name] |

---

## Internal Linking Relationship Map

The following relationships drive internal links and cross-promotion across content types.

```
Home
 ├── → Projects (featured 3–4 projects)
 ├── → Blog (latest 2–3 posts)
 ├── → Resources (featured resources section)
 └── → Contact (CTA)

Projects List
 ├── → Project Detail (each card)
 └── → Blog (related posts per project)

Project Detail
 ├── → Related Blog Posts (technical breakdowns)
 ├── → Related Tools (if applicable)
 └── → Other Projects (sidebar/footer recommendations)

Blog List
 ├── → Blog Post (each card)
 ├── → Category Archive (category links)
 └── → Tag Archive (tag links)

Blog Post
 ├── → Related Posts (by category/tag)
 ├── → Relevant Projects (inline contextual links)
 ├── → Resources (if post references tools/links)
 └── → Tools (if post covers a specific tool)

Resources
 ├── → Tools (cross-link where tools complement resources)
 └── → Blog Posts (guides for using specific resources)

Tools
 ├── → Related Blog Posts (usage guides)
 └── → Resources (complementary references)
```

### Internal Linking Rules
- Every blog post must link to at least **1 related project** or **1 resource/tool** where relevant.
- Every project page must link to **at least 1 related blog post** if one exists.
- Anchor text must be **descriptive and natural** — never "click here" or "read more".
- Do not link to the same URL more than once per page (unless it's the primary CTA).

---

## URL Structure Rules

| Rule | Example |
|---|---|
| All lowercase | `/projects/devstash-portfolio` not `/Projects/DevStash` |
| Kebab-case only | `/blog/next-js-performance-tips` not `/blog/nextjs_performance_tips` |
| No trailing slashes (consistent) | `/about` not `/about/` |
| No query params for primary content | `/blog/category/frontend` not `/blog?category=frontend` |
| Descriptive, human-readable slugs | `/projects/ai-automation-dashboard` not `/projects/proj-001` |
