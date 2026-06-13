# SEO Pre-Submission Checklist — Phase 6

> **Owner:** Adesh Shukla
> **Site:** https://devstash.me
> **Purpose:** Manual gate to verify Phase 6 (SEO & Dynamic OG Images) readiness
> before submitting to Google Search Console and Bing Webmaster Tools.

Work through every section top to bottom. Each item is a checkbox you tick once
verified. Nothing here changes code — this is a verification and submission
runbook. The audit tables reproduce the results recorded during Tasks 2–6.

---

## 1. Per-page title / description / canonical verification

Verify each static page's bare title (before the `| DevStash` suffix is
auto-appended by `buildMetadata`), the combined title length, the description
length, and the relative canonical path.

| Page      | Bare title                                      | title+suffix len | desc len | canonical  |
| --------- | ----------------------------------------------- | ---------------- | -------- | ---------- |
| about     | About Adesh Shukla — Frontend Developer         | 50               | 152      | /about     |
| resources | Developer Resources — Docs, Articles & Courses  | 57               | 152      | /resources |
| tools     | Tools — The Developer Stack Adesh Uses Daily    | 55               | 150      | /tools     |
| contact   | Contact Adesh Shukla — Frontend Developer       | 52               | 151      | /contact   |
| privacy   | Privacy Policy — How DevStash Handles Your Data | 58               | 152      | /privacy   |
| terms     | Terms of Service — Using the DevStash Website   | 56               | 153      | /terms     |
| projects  | Projects — Frontend, Automation & Web Apps      | 53               | 151      | /projects  |
| blog      | Blog — Frontend, Automation & AI Workflows      | 53               | 149      | /blog      |

All combined title lengths fall within the 50–60 char target and all
descriptions within 130–160 chars. Titles and descriptions are unique across
pages.

**Dynamic pages** (`blog/[slug]`, `projects/[slug]`, `blog/category/[category]`,
`blog/tag/[tag]`) derive their title, description, and canonical from content
(MDX frontmatter / project JSON / resolved route param), so they are not listed
above. Spot-check a representative slug for each.

- [ ] Every static page above matches the recorded title / description / canonical
- [ ] All combined title lengths are 50–60 chars
- [ ] All descriptions are 130–160 chars
- [ ] No two pages share an identical title or description
- [ ] Each `canonical` is a relative, lowercase, kebab-case path with no trailing slash
- [ ] A sample `blog/[slug]` derives title/description/canonical from frontmatter
- [ ] A sample `projects/[slug]` derives title/description/canonical from its content
- [ ] A sample `blog/category/[category]` and `blog/tag/[tag]` derive a correct dynamic canonical

---

## 2. Single `<h1>` per page check

Each page must contain exactly one `<h1>` with no skipped heading levels
(no `h1 → h3` without an intervening `h2`).

**Task 6 result:** all audited pages have exactly one `<h1>`. The projects grid
card titles were corrected from `h3` to `h2` to keep the listing's heading
hierarchy contiguous under the page `h1`.

- [ ] Each page renders exactly one `<h1>`
- [ ] No page skips a heading level
- [ ] Projects grid card titles render as `h2` (verified fix from Task 6)

---

## 3. OG image rendering check

The dynamic OG endpoint (`app/api/og/route.tsx`, edge runtime) must return a
branded 1200×630 PNG for any combination of params, including none.

**Task 2.3 smoke-test results** (all returned `HTTP 200`, `image/png`, 1200×630):

| Request                                                          | Status | Content-Type | Size  | Dimensions |
| ---------------------------------------------------------------- | ------ | ------------ | ----- | ---------- |
| `/api/og?title=Test&description=Hello`                           | 200    | image/png    | ~42KB | 1200×630   |
| `/api/og?title=...&type=article&category=frontend&readingTime=7` | 200    | image/png    | ~55KB | 1200×630   |
| `/api/og` (no params, fallback)                                  | 200    | image/png    | ~47KB | 1200×630   |

**To re-verify locally:**

1. Run `pnpm dev`.
2. Visit each URL in a browser:
   - http://localhost:3000/api/og?title=Test&description=Hello
   - http://localhost:3000/api/og?title=Test&description=Hello&type=article&category=frontend&readingTime=7
   - http://localhost:3000/api/og (fallback)
3. Confirm a branded card renders (top blue→purple accent bar, bold title,
   description, bottom-left DevStash wordmark; article variant shows the category
   badge + `{readingTime} min read` chip).

**Preview real social cards** before submission:

- [ ] Run `pnpm dev` and confirm all three URLs render a branded 1200×630 card
- [ ] Article variant shows category badge + reading-time chip
- [ ] No-param fallback renders without empty fields or crash
- [ ] Preview a deployed page's card on https://www.opengraph.xyz
- [ ] Inspect a shared link with the X (Twitter) post composer
- [ ] Inspect a shared link with the LinkedIn Post Inspector

---

## 4. JSON-LD structured data validation

Validate structured data with the **Google Rich Results Test**
(https://search.google.com/test/rich-results) and the **schema.org validator**
(https://validator.schema.org). Paste the deployed URL (or rendered HTML) and
confirm the expected schema is detected with no errors.

Schema rendered per page type:

| Page type                           | Schema(s) rendered                                   |
| ----------------------------------- | ---------------------------------------------------- |
| about                               | Person                                               |
| home / privacy / terms / blog index | WebSite                                              |
| listing pages                       | BreadcrumbList                                       |
| blog post (`blog/[slug]`)           | BlogPosting + BreadcrumbList                         |
| project detail (`projects/[slug]`)  | SoftwareApplication \| CreativeWork + BreadcrumbList |

- [ ] about → Person validates with no errors
- [ ] home / privacy / terms / blog index → WebSite validates
- [ ] Listing pages → BreadcrumbList validates
- [ ] Blog post → BlogPosting + BreadcrumbList both validate, no duplicate types
- [ ] Project detail → SoftwareApplication or CreativeWork + BreadcrumbList validate
- [ ] No page reports duplicate JSON-LD schemas of the same type

---

## 5. Sitemap accessibility

The sitemap is generated by `app/sitemap.ts` (served at `/sitemap.xml`).

- [ ] `/sitemap.xml` loads and returns valid XML
- [ ] Lists home, about, projects, blog, resources, tools, contact, privacy, terms
- [ ] Lists all blog post slugs
- [ ] Lists all project slugs
- [ ] Each entry has a `lastModified` value

> Category/tag index routes are intentionally excluded from the sitemap to avoid
> thin-content duplication competing with the canonical posts.

---

## 6. robots.txt accessibility

robots is generated by `app/robots.ts` — there is **no static
`public/robots.txt`** file (keeping both would cause a Next.js route/file
collision).

- [ ] `/robots.txt` loads
- [ ] Allows all crawlers (`User-agent: *`, `Allow: /`)
- [ ] Disallows `/api/` and `/_next/` (internal routes)
- [ ] Includes a `Sitemap:` line pointing to `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`
      (`https://devstash.me/sitemap.xml` in production)

---

## 7. Verification meta-tag (env var) setup

Ownership-verification meta tags render **only when their env var is set**.
They are wired in `app/layout.tsx` via the Next.js Metadata API:

- `GOOGLE_SITE_VERIFICATION` → `<meta name="google-site-verification" content="...">`
- `BING_SITE_VERIFICATION` → `<meta name="msvalidate.01" content="...">`

When an env var is unset/empty, the corresponding tag is **not rendered** (no
empty `content` attribute).

**Setup:**

1. Add the values to `.env.local` for local testing and to the Vercel project
   **Environment Variables** for production:
   ```bash
   GOOGLE_SITE_VERIFICATION=your-google-token
   BING_SITE_VERIFICATION=your-bing-token
   ```
2. Redeploy (or restart `pnpm dev`) so the values are picked up.
3. Confirm in the rendered page source (View Source / DevTools → `<head>`):
   - `<meta name="google-site-verification" content="...">` is present
   - `<meta name="msvalidate.01" content="...">` is present

- [ ] `GOOGLE_SITE_VERIFICATION` set in `.env.local` and Vercel env
- [ ] `BING_SITE_VERIFICATION` set in `.env.local` and Vercel env
- [ ] Both meta tags appear in deployed page source
- [ ] With an env var unset, its meta tag does NOT render (no empty `content`)

---

## 8. Search engine submission steps

### Google Search Console (https://search.google.com/search-console)

- [ ] Add a property for `https://devstash.me` (URL-prefix property)
- [ ] Choose the **HTML tag** verification method
- [ ] Copy the token into `GOOGLE_SITE_VERIFICATION` (see Section 7) and redeploy
- [ ] Click **Verify** in GSC (confirms the meta tag is live)
- [ ] Open **Sitemaps**, submit `https://devstash.me/sitemap.xml`
- [ ] Confirm the sitemap status is **Success**

### Bing Webmaster Tools (https://www.bing.com/webmasters)

- [ ] Add the site `https://devstash.me`
- [ ] Either: **Import from Google Search Console** (fastest), OR
- [ ] Verify via the **meta tag** option using `BING_SITE_VERIFICATION` (see Section 7) and redeploy
- [ ] Submit `https://devstash.me/sitemap.xml`
- [ ] Confirm the sitemap is accepted

---

## 9. Final pre-submission gate

Do not submit until the project's quality gates are clean.

- [ ] `pnpm type-check` (or `pnpm exec tsc --noEmit`) reports **zero errors**
- [ ] `pnpm build` completes cleanly with no missing-metadata warnings
- [ ] Spot-check a sample page's rendered `<head>` for a unique `og:image` URL

---

_Phase 6 deliverable — Task 8. Keep this checklist updated as routes are added._
