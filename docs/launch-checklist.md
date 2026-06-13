# Launch Readiness Checklist — Phase 8

> **Owner:** Adesh Shukla
> **Site:** https://devstash.me
> **Purpose:** Manual runbook for the external setup that cannot be done from the
> codebase — Google Analytics 4, Search Console, Bing, GA4 conversions, the
> custom domain, Vercel env vars, optional Microsoft Clarity, and the final
> pre-launch gate.

Work through every section top to bottom. Each item is a checkbox you tick once
verified. Nothing here changes code — analytics and verification are already
wired in the app and gated entirely on environment variables. If an ID is unset,
the corresponding script/tag simply does not render.

**Key fact to keep in mind:** GA4 and Clarity load via `next/script`
(`strategy="lazyOnload"`) and are **env-gated** — no `NEXT_PUBLIC_GA_ID` means no
gtag script is emitted at all. The verification meta tags
(`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`) are already wired in
`app/layout.tsx` and render only when their env var is set. So every step below
is really "set an env var in Vercel, redeploy, then verify".

---

## 1. Google Analytics 4

GA4 loads from `components/layout/Analytics.tsx` via `next/script`
(`lazyOnload`), reading the Measurement ID from `NEXT_PUBLIC_GA_ID`. With no ID
set, no script loads — so dev/CI stay clean and you only get analytics once you
complete the steps below.

- [ ] Create a GA4 property for `devstash.me` at https://analytics.google.com
      (Admin → Create Property → add a **Web** data stream for
      `https://devstash.me`)
- [ ] Copy the **Measurement ID** (format `G-XXXXXXXXXX`) from the web stream
- [ ] Set it locally for testing in `.env.local`:
      `bash
    NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
    `
- [ ] Set the same `NEXT_PUBLIC_GA_ID` in the Vercel project **Environment
      Variables** (Production, and Preview if desired)
- [ ] Redeploy on Vercel so the ID is inlined at build time
- [ ] Verify gtag loads: open the live site, then in GA4 open **Reports →
      Realtime** and confirm your own visit appears
- [ ] Optional sanity check: DevTools → Network shows
      `googletagmanager.com/gtag/js?id=G-...` loading, and `window.dataLayer`
      grows after a tracked click
- [ ] Confirm the negative case: with `NEXT_PUBLIC_GA_ID` unset, no gtag script
      is emitted (no analytics requests in Network)

---

## 2. Google Search Console

The Google ownership-verification meta tag is **already wired** in
`app/layout.tsx` and renders only when `GOOGLE_SITE_VERIFICATION` is set. So the
flow is: get the token from GSC → set the env var → redeploy → verify.

- [ ] Go to https://search.google.com/search-console
- [ ] Add a property for `https://devstash.me` using the **URL-prefix** property
      type
- [ ] Choose the **HTML tag** verification method and copy the token value
      (the `content="..."` part of the `google-site-verification` meta tag)
- [ ] Set it in `.env.local` and in Vercel env:
      `bash
    GOOGLE_SITE_VERIFICATION=your-google-token
    `
- [ ] Redeploy, then confirm the tag is live in the deployed page source:
      `<meta name="google-site-verification" content="...">`
- [ ] Click **Verify** in GSC
- [ ] Open **Sitemaps** and submit `https://devstash.me/sitemap.xml`
- [ ] Confirm the sitemap status is **Success**
- [ ] In **Pages / Coverage**, confirm no important pages are excluded
      (home, about, projects, blog, resources, tools, contact, privacy, terms,
      plus all blog/project slugs)

---

## 3. Bing Webmaster Tools

The Bing verification meta tag (`msvalidate.01`) is also wired in
`app/layout.tsx` and renders only when `BING_SITE_VERIFICATION` is set.

- [ ] Go to https://www.bing.com/webmasters and add the site
      `https://devstash.me`
- [ ] **Fastest path:** choose **Import from Google Search Console** (carries
      over verification + sitemap automatically), OR
- [ ] Verify via the **meta tag** option: copy the token into
      `BING_SITE_VERIFICATION` (in `.env.local` and Vercel env), redeploy, then
      click Verify
      `bash
    BING_SITE_VERIFICATION=your-bing-token
    `
- [ ] Submit the sitemap `https://devstash.me/sitemap.xml`
- [ ] Confirm the sitemap is accepted

---

## 4. GA4 conversion events

The five custom events are sent from the app via the typed `trackEvent` helper
(`lib/analytics/events.ts`). They will **appear in GA4 automatically** once real
users trigger them (allow up to ~24h after first fire). Then mark each one as a
conversion in **GA4 Admin → Events** (toggle "Mark as key event / conversion").

| Event                    | Fires when                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cv_viewed`              | A CV/resume or `.pdf` link is clicked. **Currently dormant** — no such link exists in the codebase yet; it activates automatically once one is added. |
| `contact_form_submitted` | The contact form submits **successfully**.                                                                                                            |
| `github_link_clicked`    | An outbound `github.com` link is clicked.                                                                                                             |
| `resource_clicked`       | Any other outbound `http(s)` link is clicked.                                                                                                         |
| `blog_post_read`         | A reader reaches ~75% scroll depth of a blog post (fires once per page view).                                                                         |

- [ ] Confirm events show up under **GA4 Admin → Events** (or **Reports →
      Realtime → Event count**) after triggering them on the live site
- [ ] Mark `cv_viewed` as a conversion (note: dormant until a CV/resume link
      exists)
- [ ] Mark `contact_form_submitted` as a conversion
- [ ] Mark `github_link_clicked` as a conversion
- [ ] Mark `blog_post_read` as a conversion
- [ ] Mark `resource_clicked` as a conversion

---

## 5. Custom domain (Vercel + Cloudflare DNS)

> ⚠️ **CRITICAL — DNS only, never proxied.** When pointing Cloudflare DNS at
> Vercel, every record MUST stay **GREY-CLOUD (DNS only)**. NEVER use the
> orange-cloud (proxied) mode with Vercel — it breaks Vercel's TLS issuance and
> routing (per the project steering doc). This is the single most important step
> in this section.

- [ ] In the Vercel project → **Settings → Domains**, add `devstash.me`
      (and `www.devstash.me` if you want the www variant)
- [ ] Vercel will show the required DNS records (an `A` record for the apex
      and/or a `CNAME` for `www`) — note the exact values it gives you
- [ ] In **Cloudflare DNS**, add those records exactly as Vercel instructs
- [ ] **Set every Vercel-related record to GREY-CLOUD (DNS only)** — click the
      orange cloud to toggle it grey. Double-check none are proxied.
- [ ] Wait for Vercel to show the domain as **Valid Configuration** and issue
      the SSL certificate
- [ ] Verify `https://devstash.me` loads over HTTPS with a valid certificate
- [ ] Verify the canonical redirect works (e.g. `www` → apex, or whichever
      direction you chose in Vercel) so there is a single canonical host

---

## 6. Vercel environment variables

Set all of these in the Vercel project → **Settings → Environment Variables**
(Production at minimum). Redeploy after changing them so values are picked up.

| Variable                   | Value                 | Notes                                                 |
| -------------------------- | --------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | `https://devstash.me` | Used for canonical URLs, sitemap, OG. Client-exposed. |
| `NEXT_PUBLIC_GA_ID`        | `G-XXXXXXXXXX`        | GA4 Measurement ID. Client-exposed.                   |
| `NEXT_PUBLIC_CLARITY_ID`   | (optional)            | Microsoft Clarity project ID. Client-exposed.         |
| `GOOGLE_SITE_VERIFICATION` | your-google-token     | GSC ownership meta tag. Server-only.                  |
| `BING_SITE_VERIFICATION`   | your-bing-token       | Bing ownership meta tag. Server-only.                 |

> ⚠️ `NEXT_PUBLIC_*` variables are **embedded in the client bundle** and visible
> to anyone — only put non-secret IDs there. Measurement/Project IDs are designed
> to be public, so this is fine; never put secrets behind a `NEXT_PUBLIC_` name.

- [ ] `NEXT_PUBLIC_SITE_URL=https://devstash.me`
- [ ] `NEXT_PUBLIC_GA_ID` set
- [ ] `NEXT_PUBLIC_CLARITY_ID` set (only if using Clarity — see Section 7)
- [ ] `GOOGLE_SITE_VERIFICATION` set
- [ ] `BING_SITE_VERIFICATION` set
- [ ] Redeployed after setting/changing any of the above

---

## 7. Microsoft Clarity (optional)

Clarity loads from `components/layout/Analytics.tsx` via `next/script`
(`lazyOnload`), gated on `NEXT_PUBLIC_CLARITY_ID`. Skip this section entirely if
you don't want session recording — with the ID unset, nothing loads.

- [ ] Create a project at https://clarity.microsoft.com
- [ ] Copy the **project ID** and set `NEXT_PUBLIC_CLARITY_ID` in `.env.local`
      and Vercel env, then redeploy
- [ ] Verify recordings/heatmaps start appearing in the Clarity dashboard

> ⚠️ **GDPR note.** Clarity records session data (clicks, scrolls, and can capture
> page interactions). If you enable it, ensure the privacy policy
> (`app/(main)/privacy/page.tsx`) discloses that session-analytics/recording is
> used and what it captures. For EU/EEA visitors, consider a consent mechanism
> before loading Clarity. Update the privacy page before going live with Clarity.

---

## 8. Final pre-launch gate

Do not launch until every gate below is clean. These mirror the project's CI and
quality bars.

- [ ] `pnpm exec tsc --noEmit` reports **zero errors**
- [ ] `pnpm build` completes successfully
- [ ] `pnpm lint:content` exits **0** (MDX frontmatter linter)
- [ ] `pnpm check:links` exits **0** (broken internal-link checker)
- [ ] Lighthouse CI (Phase 7) is passing
- [ ] OG card preview (Phase 6) renders correctly for a sample page
      (see `docs/seo-checklist.md` §3)
- [ ] `https://devstash.me/robots.txt` resolves in production
- [ ] `https://devstash.me/sitemap.xml` resolves in production

---

_Phase 8 deliverable — Task 4. Keep this checklist updated as analytics events or
launch steps change._
