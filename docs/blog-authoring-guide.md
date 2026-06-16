# DevStash Blog Authoring Guide

> **Who this is for:** Adesh (and any AI tool you delegate writing to).
> **What it covers:** the exact file format, what content/code is allowed, how
> to add images, SEO rules, and a copy-paste **AI prompt** that generates a
> ready-to-publish `.mdx` file every time.
>
> **TL;DR:** Posts are **MDX** files in `content/blogs/<slug>.mdx`. They support
> Markdown + GitHub-flavoured extras + fenced code blocks (syntax-highlighted) +
> one custom component (`<Callout>`). They do **not** run live React/JS or
> `import` anything. Jump to [The AI Prompt](#10-the-ai-prompt-copy-paste) to
> generate posts fast.

---

## 1. Where the file goes & how it's named

- Location: **`content/blogs/<slug>.mdx`**
- The **filename must equal the `slug`** in the frontmatter, lowercase
  kebab-case (e.g. `nextjs-server-actions-guide.mdx` → `slug:
'nextjs-server-actions-guide'`).
- One post = one `.mdx` file. The slug becomes the URL:
  `https://devstash.me/blog/<slug>`.

Two ways to create it:

1. **Admin panel (local dev):** run `pnpm dev`, go to `/admin`, click **New
   post**, fill the form, save. It writes the file for you. _(Local only — the
   admin is disabled in production.)_
2. **Hand/AI-authored file:** generate the `.mdx` with the prompt in §10, drop
   it into `content/blogs/`, then commit + push.

Either way: **review → `git commit` → `git push`** to publish. (The site reads
files at build time; new posts go live on the next deploy.)

---

## 2. Frontmatter — the exact schema (required)

Every post **must** start with this YAML block. All 13 fields are required
(the linter fails the build if any is missing).

```yaml
---
title: 'Your Post Title — Specific and Search-Friendly'
slug: 'your-post-title-kebab-case'
description: 'A unique 130–160 character summary that includes your main keyword and a reason to click. No fluff.'
author: 'Adesh Shukla'
createdAt: 'YYYY-MM-DD'
updatedAt: 'YYYY-MM-DD'
category: 'frontend'
tags: ['nextjs', 'react', 'performance']
featuredImage: '/images/blog/your-post-title-kebab-case.webp'
readingTime: 7
canonical: 'https://devstash.me/blog/your-post-title-kebab-case'
draft: false
featured: false
---
```

### Field rules

| Field                     | Rule                                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                   | Unique. Aim so that `"<title> \| DevStash"` is ~50–60 chars. Sentence case.                                                                                                 |
| `slug`                    | lowercase kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$`. **Must match the filename.** Unique across all posts.                                                                    |
| `description`             | **130–160 characters**, unique, human, contains the main keyword. (Outside the range = warning, not a hard fail.)                                                           |
| `author`                  | Always `'Adesh Shukla'`.                                                                                                                                                    |
| `createdAt` / `updatedAt` | `YYYY-MM-DD`. On a new post both are the same date. Bump `updatedAt` when you edit.                                                                                         |
| `category`                | **Exactly one** of: `automation`, `frontend`, `performance`, `ai-workflows`, `devtools`, `tutorials`, `career`.                                                             |
| `tags`                    | **2–5** tags, lowercase kebab-case.                                                                                                                                         |
| `featuredImage`           | Path under `/public`, e.g. `/images/blog/<slug>.webp`. Used for the card + social/OG preview. If the file isn't there yet it's a warning (a gradient placeholder is shown). |
| `readingTime`             | Positive integer (minutes). Estimate at ~200 words/min, or leave the admin to compute it.                                                                                   |
| `canonical`               | **Exactly** `https://devstash.me/blog/<slug>`. The linter checks this.                                                                                                      |
| `draft`                   | `true` hides it from the site (good for WIP). Set `false` to publish.                                                                                                       |
| `featured`                | `true` surfaces it in featured slots. Use sparingly.                                                                                                                        |

> The validator that enforces all this is `pnpm lint:content`
> (`scripts/seo/check-metadata.mjs`). Run it before committing.

---

## 3. The body — start at H2, never H1

The blog page **already renders your `title` as the page's only `<h1>`.** So in
the MDX body:

- **Start every section at `##` (H2).** Never put a `#` (H1) in the body — it
  creates a second H1 and hurts SEO.
- Use `##` for main sections and `###` for sub-sections. Don't skip levels
  (`##` → `####` is wrong).
- Only `##` and `###` appear in the auto-generated Table of Contents.

```md
## Why this matters

Intro paragraph...

### A specific sub-point

More detail...
```

---

## 4. What content & code is supported

### ✅ Supported

- **Standard Markdown:** paragraphs, **bold**, _italic_, `inline code`,
  `[links](https://...)`, lists, blockquotes, `---` dividers.
- **GitHub-Flavoured Markdown (GFM):** tables, task lists (`- [ ]`),
  strikethrough (`~~text~~`), and autolinks.
- **Fenced code blocks with syntax highlighting** in any language — these are
  **displayed as code, not executed.** Always add a language hint:

  ````md
  ```tsx
  export function Hello() {
    return <p>Hi</p>
  }
  ```
  ````

  Supported language hints include `tsx`, `ts`, `jsx`, `js`, `json`, `bash`,
  `html`, `css`, `python`, `yaml`, `md`, etc. (Theme: GitHub Dark Dimmed.)

- **Tables** (GFM pipe tables) — styled automatically.
- **Images** — Markdown image syntax (see §5).
- **One custom component — `<Callout>`** (see §6).

### ❌ NOT supported (will break the build or won't render)

- **`import` / `export` statements** — remote MDX can't resolve them. Don't add
  `import X from '...'`.
- **Live React/JS components** — you cannot embed a running `<MyComponent />`
  (only `<Callout>` exists). Code samples go in **fenced code blocks** instead.
- **Arbitrary executable JavaScript** — no `<script>`, no live JS expressions.
- **Remote images via `next/image`** — only **local** images under `/public`
  work (no `https://...` image URLs; they're not whitelisted and will error).
- **Raw HTML is risky** — MDX parses HTML as JSX, so `class=` must be
  `className=`, and void tags must self-close (`<br />`, not `<br>`). **Prefer
  Markdown + `<Callout>`** and avoid raw HTML entirely.

> **So, to answer "can it accept full HTML / JS / React / TypeScript?"**
> You can **show** HTML/JS/React/TypeScript as highlighted code in fenced blocks
> (unlimited). You **cannot run** them as live components or scripts. Prose is
> Markdown; the only interactive component is `<Callout>`.

---

## 5. Adding images (one or many)

All images must be **local files under `/public`**, referenced by an absolute
path. The convention is `/images/blog/<name>.webp`.

### Step 1 — get the image into `/public/images/blog/`

- **Easiest:** in the local admin editor (`/admin/new` or `/admin/edit/...`)
  use **Upload image** → it saves to `public/images/blog/` and gives you the
  exact path. Max **5 MB**; formats: `webp`, `png`, `jpg`, `gif`, `svg`
  (prefer **webp** for photos/screenshots).
- **Or manually:** drop the file into `public/images/blog/` yourself.

### Step 2 — reference it in the body (Markdown image syntax)

```md
![A short, descriptive alt text](/images/blog/my-diagram.webp)
```

- The `alt` text is **required for SEO + accessibility** and is also shown as a
  caption under the image.
- Images render responsively (rounded, bordered, ~720px wide). Use landscape
  images ideally around **1440×800** for crispness.

### Adding **multiple** images

Just add multiple image lines wherever they belong in the flow:

```md
## Step 1: The setup

![Project structure in VS Code](/images/blog/setup-structure.webp)

Some explanation...

## Step 2: The result

![Final rendered output](/images/blog/final-output.webp)
```

### The `featuredImage` (frontmatter) vs body images

- `featuredImage` = the **hero/card/social** image (one per post, set in
  frontmatter). It does **not** auto-appear in the body.
- Body images = added with the `![...](...)` syntax as above, as many as you
  want.

---

## 6. The `<Callout>` component

The one custom component you can use inline in the body. Great for tips,
warnings, and notes.

```mdx
<Callout type="tip" title="Pro tip">
  Keep your slug short and keyword-rich — it's part of the URL.
</Callout>
```

- `type`: `info` (default) · `tip` · `warning` · `danger`
- `title`: optional bold heading line.
- Put a **blank line** before and after the `<Callout>` block, and write its
  contents as normal Markdown.

---

## 7. SEO checklist (do this every time)

- **Title:** specific, includes the primary keyword, reads naturally. ~50–60
  chars including the ` | DevStash` suffix the site adds.
- **Description:** 130–160 chars, unique, primary keyword early, gives a reason
  to click.
- **Slug:** short, keyword-bearing, kebab-case.
- **One keyword theme per post** + 3–5 related/long-tail keywords woven in
  naturally (no stuffing). Put the main keyword in the title, the first 100
  words, at least one `##` heading, and the description.
- **Headings:** start at `##`, logical hierarchy, descriptive (not "Section 1").
- **Internal links:** link to 1–3 other DevStash posts/pages where relevant
  (e.g. `/blog/<other-slug>`, `/projects`).
- **External links:** link to authoritative sources; they open in a new tab
  automatically.
- **Alt text** on every image.
- **Length:** aim for 1,000–2,000 words for ranking power (adjust to topic).
- **Tags/category:** accurate; pick the single best category.

---

## 8. Humanizing AI-written content (avoid the "robotic" smell)

- Vary sentence length; mix short punchy lines with longer ones.
- Write in **first person** ("I ran into…", "here's what worked").
- Use concrete specifics: real numbers, versions, file names, error messages.
- Cut filler ("In today's fast-paced world", "Furthermore", "It is important to
  note"). Avoid words like _delve, leverage, robust, seamless, unleash, in the
  realm of_.
- Add a personal angle: a mistake you made, a tradeoff you hit, an opinion.
- No em-dash overuse; no perfectly parallel bullet lists everywhere.
- Open with a real problem, not a definition. Close with a takeaway, not a
  generic "In conclusion".

---

## 9. Pre-publish checklist

1. File is at `content/blogs/<slug>.mdx` and the filename matches the slug.
2. Frontmatter complete; `canonical` = `https://devstash.me/blog/<slug>`.
3. Body starts at `##` (no H1 in body).
4. All images exist under `/public/images/blog/` and have alt text.
5. Run **`pnpm lint:content`** → exits clean (warnings about description length
   / missing image are OK to fix or accept).
6. Optionally run **`pnpm check:links`** (catches broken internal links).
7. Set `draft: false` when ready.
8. `git add` → `git commit` → `git push`.

---

## 10. The AI Prompt (copy-paste)

Paste the block below into any AI tool (ChatGPT, Claude, Gemini, etc.). Replace
the **TOPIC** line (and optionally the category/keywords). The AI will return a
single, ready-to-save `.mdx` file you can paste straight into
`content/blogs/<slug>.mdx`.

````text
You are writing a technical blog post for "DevStash" (devstash.me), the personal
developer site of Adesh Shukla — a frontend developer (React, Next.js,
TypeScript, automation, AI workflows). Write in Adesh's voice: first person,
practical, opinionated, no corporate fluff.

TOPIC: <put your topic here — e.g. "Next.js 16 Server Actions: patterns I actually use">
TARGET CATEGORY: <one of: automation | frontend | performance | ai-workflows | devtools | tutorials | career>
PRIMARY KEYWORD: <main SEO keyword, e.g. "next.js server actions">
(If I leave keywords blank, pick strong, currently-trending, low-competition
long-tail keywords for the topic yourself.)

OUTPUT FORMAT — return ONE fenced code block containing the COMPLETE .mdx file
and NOTHING else (no commentary before or after). The file must be:

1) Start with YAML frontmatter with EXACTLY these keys, in this order:
   title, slug, description, author, createdAt, updatedAt, category, tags,
   featuredImage, readingTime, canonical, draft, featured
   Rules:
   - title: specific + keyword-rich; aim ~50–60 chars including a " | DevStash"
     suffix MENTALLY (do NOT actually add the suffix in the title field).
   - slug: lowercase kebab-case, derived from the title.
   - description: 130–160 characters, unique, includes the primary keyword,
     compelling. (Count the characters.)
   - author: 'Adesh Shukla'
   - createdAt & updatedAt: today's date as YYYY-MM-DD (same value).
   - category: the TARGET CATEGORY above (exactly one of the allowed values).
   - tags: 2–5 lowercase kebab-case tags relevant to the topic + keywords.
   - featuredImage: '/images/blog/<slug>.webp'
   - readingTime: integer minutes (estimate at ~200 words/min).
   - canonical: 'https://devstash.me/blog/<slug>'  (must match the slug)
   - draft: false
   - featured: false

2) BODY rules (MDX):
   - Do NOT include an H1 (#). The site renders the title as the H1.
     Start sections at "##" and use "###" for sub-sections; never skip levels.
   - Use Markdown only + GitHub-flavoured extras (tables, task lists,
     strikethrough). NO import/export statements, NO live React/JS components,
     NO <script>, NO raw HTML.
   - Show all code in fenced code blocks with a language hint (```tsx, ```ts,
     ```bash, ```json, etc.). Code is displayed, not executed.
   - You MAY use this one custom component for notes/tips (blank line before &
     after it):
       <Callout type="tip" title="Optional title">
       Markdown content here.
       </Callout>
     type is one of: info | tip | warning | danger.
   - For images, use Markdown with descriptive alt text and LOCAL paths only:
       ![Descriptive alt text](/images/blog/<slug>-<n>.webp)
     Insert 1–3 image placeholders where visuals would help, and list the
     filenames you used at the very end inside a <Callout type="info"> titled
     "Images to add" so I know which files to create in /public/images/blog/.
   - Length: 1,000–2,000 words. Weave the primary keyword + related long-tail
     keywords naturally into the title, first 100 words, at least one ## heading,
     and the description. No keyword stuffing.
   - Include 1–3 internal links to plausible DevStash pages
     (/blog, /projects, /about) and 1–3 external authoritative links.

3) HUMANIZE — sound like a real developer, not an AI:
   - Vary sentence length; first person; concrete specifics (versions, file
     names, real numbers, an actual error or tradeoff).
   - Open with a real problem, not a dictionary definition.
   - End with a practical takeaway, not "In conclusion".
   - Avoid: delve, leverage, robust, seamless, unleash, "in today's fast-paced
     world", "it is important to note", excessive em-dashes, and perfectly
     parallel bullet lists everywhere.

Return only the single ```mdx code block with the full file.
````

### After the AI gives you the file

1. Copy the file contents into `content/blogs/<slug>.mdx` (use the slug from the
   frontmatter as the filename).
2. Create any images it listed under `/public/images/blog/` (or upload them via
   `/admin`), matching the filenames.
3. Run `pnpm lint:content` and fix anything it flags (usually trimming the
   description to 130–160 chars).
4. Preview locally (`pnpm dev` → `/blog/<slug>`), then commit + push.

---

_Keep this guide updated if the MDX components or frontmatter schema change.
Source of truth: `types/blog.ts` (frontmatter), `components/blog/MDXComponents.tsx`
(allowed components), and `scripts/seo/check-metadata.mjs` (validation rules)._
