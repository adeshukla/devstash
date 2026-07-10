# Phase 10 — Blog Automation (n8n + Groq) — Step-by-Step

> **Goal:** generate a trending, humanized, SEO-optimized blog post with AI and
> get it into DevStash with minimal effort — ideally one click → review → publish.
>
> **Key reality to design around:** the `/admin` write API
> (`/api/admin/posts`) is **local-only** (it writes real files and is disabled in
> production because Vercel's filesystem is read-only). So there are **two**
> automation paths:
>
> - **Path A — "Push to local admin"** (matches "push into the admin panel"):
>   n8n posts to your **locally running** dev server, which writes the `.mdx`
>   file. You then commit + push. Best when your machine is on.
> - **Path B — "Push to Git"** (fully hands-off, production-grade): n8n commits
>   the `.mdx` straight to GitHub via the GitHub API; Vercel auto-deploys. No
>   laptop needed at publish time.
>
> Pick A to start (simplest, uses what you already built). Graduate to B when you
> want it to run without you.

---

## 0. Prerequisites

- **n8n** running (you already have it at `http://localhost:5678`).
- **Groq API key** (you already use `llama-3.1-8b-instant`). A larger model like
  `llama-3.3-70b-versatile` gives noticeably better, more humanized long-form.
- The blog format + rules: **`docs/blog-authoring-guide.md`** (the source of
  truth the AI must follow).
- For **Path A**: the site running locally with admin configured —
  `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env.local`, then `pnpm dev`.
- For **Path B**: a **GitHub Personal Access Token** (fine-grained, scoped to the
  DevStash repo, `Contents: Read and write`).

---

## 1. The data contract (what the admin API expects)

`POST /api/admin/posts` accepts **JSON** in this exact shape (see
`app/api/admin/posts/route.ts`). Making the AI output this JSON directly is the
cleanest integration:

```json
{
  "title": "string",
  "slug": "kebab-case-string",
  "description": "130-160 char string",
  "category": "automation | frontend | performance | ai-workflows | devtools | tutorials | career",
  "tags": ["2-to-5", "kebab-tags"],
  "featuredImage": "",
  "readingTime": 7,
  "draft": true,
  "body": "MDX content WITHOUT frontmatter — starts at '##'"
}
```

- The server fills `author`, `createdAt`, `updatedAt`, and `canonical`
  automatically — **don't** send those.
- Send `"draft": true` so it lands as a draft you review before publishing.
- Leave `featuredImage` empty unless you have a real image path; add the image
  later in `/admin/edit/<slug>`.

---

## 2. The workflow at a glance

```
[Trigger]
   │  (manual button / daily schedule / webhook)
   ▼
[Pick a topic]          ← static list, a Google Sheet, or an RSS/trends feed
   ▼
[Groq: generate post]   ← uses the prompt in §4, returns STRICT JSON
   ▼
[Code: parse + clean]   ← extract JSON text, validate, coerce types
   ▼
   ├── Path A → [HTTP: admin login] → [HTTP: POST /api/admin/posts]
   └── Path B → [GitHub: create file content/blogs/<slug>.mdx]
   ▼
[Notify]                ← Slack/email/Telegram: "Draft ready: <slug>"
```

---

## 3. Build it node by node

### 3.1 Trigger

Choose one:

- **Manual Trigger** — click to run (best while testing).
- **Schedule Trigger** — e.g. every Monday 9am for a weekly post.
- **Webhook** — trigger from anywhere (a bookmarklet, a phone shortcut).

### 3.2 (Optional) Topic source

- Simplest: a **Set** node with a `topic` and `category` field you edit.
- Better: read a **Google Sheet** of queued topics (you already use the Sheets
  API), and mark a row "done" after publishing.
- Trend-driven: pull titles from an RSS feed (dev.to, Hacker News, Google News
  RSS for a keyword) and let the LLM pick/angle one.

### 3.3 Groq — generate the post

Use an **HTTP Request** node (POST `https://api.groq.com/openai/v1/chat/completions`)
or the Groq/OpenAI-compatible node. Key settings:

- Model: `llama-3.3-70b-versatile` (recommended for long-form) or your
  `llama-3.1-8b-instant`.
- `response_format`: `{ "type": "json_object" }` if available — forces valid JSON.
- `temperature`: ~0.7 (some personality, still coherent).
- System + user messages: the prompt in §4.

### 3.4 Code node — parse, clean, validate

> ⚠️ **n8n gotcha (you've hit this before):** LLM/Chain nodes drop upstream JSON
> fields. In a downstream **Code** node, reference the model output explicitly,
> e.g. `$('Groq').all()[0].json...` — do **not** assume `$json.text` carries
> through. Use the exact node name.

In the Code node:

- Pull the model's text, `JSON.parse` it (strip markdown fences if the model
  wrapped it in ```json).
- Enforce the contract: `slug` is kebab-case, `tags` length 2–5, `category` is
  one of the seven, `description` trimmed to ≤160 chars, `draft: true`.
- Output a clean JSON object for the next node.

### 3.5 Publish — Path A (local admin)

Two HTTP Request nodes:

1. **Login:** `POST http://localhost:3000/api/admin/login` with body
   `{ "password": "<ADMIN_PASSWORD>" }`. Enable **"Full Response"** and capture
   the `set-cookie` header (the `devstash_admin` session cookie). Store the
   `ADMIN_PASSWORD` as an **n8n credential**, not inline.
2. **Create post:** `POST http://localhost:3000/api/admin/posts` with the cleaned
   JSON as the body and the captured cookie in the `Cookie` header.
   - `200 { ok, slug }` → success. `409` → slug exists (regenerate/rename).
   - The `.mdx` file now exists locally in `content/blogs/`.
3. After the run: review in `/admin/edit/<slug>`, add an image if wanted, then
   **commit + push** to publish.

### 3.5 Publish — Path B (GitHub commit, no laptop needed)

- First, in the **Code** node, assemble the **full MDX file text** (frontmatter
  - body). Build frontmatter from the JSON fields and set
    `canonical: https://devstash.me/blog/<slug>`, `author: 'Adesh Shukla'`,
    `createdAt`/`updatedAt` = today, `draft: true`.
- Use the **GitHub** node (or HTTP to the GitHub API) → **Create/Update file**:
  - Path: `content/blogs/<slug>.mdx`
  - Branch: `dev` (open a PR) or `main` (direct — triggers deploy).
  - Commit message: `blog: add <slug> (draft)`.
- Vercel auto-deploys. Because `draft: true`, it won't show publicly until you
  flip it to `false` (edit the file / another small commit).

### 3.6 Notify

Add a Slack/Telegram/email node: "📝 Draft ready: `<slug>` — review at
/admin/edit/<slug>" (Path A) or the PR link (Path B).

---

## 4. The Groq prompt (paste into the LLM node)

> **Upgrade available:** the single-call prompt below has no web access, so any
> "trending"/version/stat claim is a guess. For a research-grounded version that
> adds a `groq/compound` web-search step + a `gpt-oss-120b` QA pass before the
> post is written, see **`docs/phase-10-research-grounded-pipeline.md`**. It
> keeps this same JSON contract and `/api/admin/posts` target.

**System message:**

```
You generate blog posts for DevStash (devstash.me), Adesh Shukla's developer
site. Voice: first person, practical, opinionated, no corporate fluff. You
ALWAYS return a single valid JSON object and nothing else.
```

**User message:**

````
Write a trending, genuinely useful technical blog post.

TOPIC: {{ $json.topic }}
CATEGORY: {{ $json.category }}   // one of: automation, frontend, performance, ai-workflows, devtools, tutorials, career
(If keywords aren't given, choose strong, currently-trending, low-competition
long-tail keywords yourself.)

Return ONLY a JSON object with these keys:
- title: specific, keyword-rich (~50-60 chars incl. an implied " | DevStash" suffix; do not add the suffix)
- slug: lowercase kebab-case derived from the title
- description: 130-160 characters, unique, includes the primary keyword
- category: the CATEGORY above
- tags: array of 2-5 lowercase kebab-case tags
- featuredImage: ""   // leave empty
- readingTime: integer minutes (~200 wpm)
- draft: true
- body: the MDX article body as a string

BODY rules:
- Do NOT include an H1 (#). Start sections at "##", sub-sections at "###". Never skip levels.
- Markdown + GitHub-flavoured extras only. NO import/export, NO live React/JS, NO <script>, NO raw HTML.
- Show code in fenced blocks with a language hint (```tsx, ```ts, ```bash, ...). Code is displayed, not executed.
- You may use the Callout component (blank line before/after):
  <Callout type="tip" title="Optional">Markdown here.</Callout>   // type: info|tip|warning|danger
- For images, use Markdown with descriptive alt + LOCAL paths only: ![alt](/images/blog/<slug>-1.webp). Insert 1-3 image placeholders.
- 1000-2000 words. Weave the primary + long-tail keywords into the title, first 100 words, one ## heading, and the description. No keyword stuffing.
- 1-3 internal links (/blog, /projects, /about) and 1-3 external authoritative links.

HUMANIZE: vary sentence length; first person; concrete specifics (versions, file
names, real numbers, a real tradeoff/mistake); open with a real problem, end with
a practical takeaway. Avoid: delve, leverage, robust, seamless, unleash, "in
today's fast-paced world", "it is important to note", excessive em-dashes.

Output: a single JSON object. No markdown fences, no commentary.
````

> This mirrors `docs/blog-authoring-guide.md` but returns **JSON** (not a raw
> `.mdx` file) so the admin API can consume it directly. For Path B, your Code
> node converts that JSON into the `.mdx` file text.

---

## 5. Quality gates before it goes live (don't skip)

Automation drafts, **you** approve. Always:

1. It lands as **`draft: true`** — never auto-publish.
2. Review the post in `/admin/edit/<slug>` (Path A) or locally after pulling
   (Path B): check facts, code correctness, the keyword feels natural, the
   description is 130–160 chars.
3. Add a real `featuredImage` (upload in admin) and any body images.
4. Run `pnpm lint:content` and `pnpm check:links`.
5. Flip `draft: false`, commit, push.

---

## 6. Hardening / future upgrades (optional)

- **Production "push to admin" without a laptop:** add a small, **token-protected
  ingest API route** (e.g. `POST /api/ingest/post` guarded by an
  `INGEST_SECRET` bearer token) that commits to GitHub via the GitHub API. This
  makes Path A work from anywhere without exposing the local-only admin. (Code
  change — a future phase, not built yet.)
- **Auto images:** call an image API (e.g. an OG-style generator or a stock/AI
  image service) and commit the asset alongside the post.
- **Dedup/quality:** have a second LLM pass score the draft for originality and
  SEO before it's allowed through.
- **Editorial calendar:** drive topics from a Google Sheet with status columns
  (queued → drafted → reviewed → published).

---

## 7. Security notes

- Keep `ADMIN_PASSWORD`, `SESSION_SECRET`, `GROQ_API_KEY`, and the GitHub token in
  **n8n credentials**, never hard-coded in nodes or committed.
- Path A talks to `localhost` only — keep it that way; don't expose the dev
  server publicly.
- The admin remains disabled in production by design; automation must use Git
  (Path B) or the future token-protected ingest route to affect the live site.
