# Backend & Data-Flow Overview

> **Purpose:** one place that explains where every form submits, where logs come
> from, what data is stored, and where. Reflects the code as built.
>
> **The single most important fact:** **DevStash has no database.** It is a
> file-based Next.js app. "Storage" means: Git-tracked files, third-party
> services (Resend, Google/Microsoft analytics), server logs, and an encrypted
> cookie. Nothing is persisted in an app-owned DB.

---

## 1. The whole picture

```
                          ┌─────────────────────────── Browser ───────────────────────────┐
                          │                                                                │
  Contact form  ──POST──▶ │ /api/contact ─▶ Resend (email) ─▶ your inbox                   │
  Résumé / outbound link ─┤ click → trackEvent() ─▶ GA4 (gtag) + GTM (dataLayer)           │
                          │             └─ logVisit() ──POST──▶ /api/track ─▶ server log    │
  Page views     ───────▶ │ GA4 / GTM / Clarity scripts (client, env-gated)                │
  OG image       ──GET──▶ │ /api/og (edge) ─▶ PNG (nothing stored)                          │
                          │                                                                │
  ── LOCAL DEV ONLY (admin disabled in production) ──                                      │
  /admin login   ──POST──▶ │ /api/admin/login ─▶ iron-session cookie (encrypted)            │
  Create/edit/del post ──▶ │ /api/admin/posts ─▶ writes content/blogs/<slug>.mdx (fs)       │
  Upload image   ──POST──▶ │ /api/admin/upload ─▶ writes public/images/blog/<file> (fs)      │
                          └────────────────────────────────────────────────────────────────┘
```

---

## 2. API routes (every server endpoint)

| Route               | Method          | Runtime | What it does                                                              | Where data goes                                                     | Auth          | Prod?          |
| ------------------- | --------------- | ------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------- | -------------- |
| `/api/contact`      | POST            | Node    | Validates (zod) name/email/subject/message, sends an email via **Resend** | Email to `TO_EMAIL` (reply-to = sender). **Not stored in the app.** | none (public) | ✅             |
| `/api/og`           | GET             | Edge    | Renders the dynamic 1200×630 OG image                                     | Returns a PNG; nothing persisted                                    | none          | ✅             |
| `/api/track`        | POST            | Node    | Receives `logVisit` beacons for key events                                | `console.log("[visit] …")` → **server/Vercel function logs only**   | none          | ✅             |
| `/api/admin/login`  | POST            | Node    | Constant-time check vs `ADMIN_PASSWORD`; sets session                     | Encrypted `devstash_admin` cookie                                   | password      | 🔒 404 in prod |
| `/api/admin/logout` | POST            | Node    | Destroys the session                                                      | Clears the cookie                                                   | session       | 🔒 404 in prod |
| `/api/admin/posts`  | POST/PUT/DELETE | Node    | Create / update / delete a blog post                                      | Writes/removes `content/blogs/<slug>.mdx` (filesystem)              | session       | 🔒 404 in prod |
| `/api/admin/upload` | POST            | Node    | Saves an uploaded image                                                   | Writes `public/images/blog/<file>` (filesystem)                     | session       | 🔒 404 in prod |

🔒 = guarded by `isAdminEnabled()` (`NODE_ENV !== 'production'`) → returns 404 in
any deployed environment, before any auth or filesystem work. Admin write APIs
only function in `pnpm dev` because Vercel's runtime filesystem is read-only.

---

## 3. Forms — where they submit

### Contact form (`/contact`)

- Component: `components/contact/ContactForm.tsx` (client) → `POST /api/contact`.
- Validation: client-side + server-side **zod** (`name`, `email`, `subject`,
  `message`).
- Delivery: **Resend** (`RESEND_API_KEY`) emails the message to `TO_EMAIL`
  (`hello@devstash.me`) with `reply-to` = the sender's email. `FROM_EMAIL` is
  `hello@devstash.me` on your verified Resend domain.
- **Storage:** none in the app. The message exists only as the email in your
  inbox and whatever transient logs Resend keeps per their policy.
- On success: fires `contact_form_submitted` (GA4/GTM) **and** a `/api/track`
  visit log.

### Coming-soon email capture — removed

- The old coming-soon page (and its placeholder Formspree form) has been
  **deleted** now that the real home page is live. No such route/form exists.

---

## 4. Logs — where they come from and live

- **Visit logs:** `lib/analytics/events.ts → logVisit()` sends a `sendBeacon` to
  `/api/track`, which writes a single structured line:
  `[visit] {"kind":"visit","event":…,"path":…,"href":…,"referrer":…,"ua":…,"ip":…,"at":…}`.
  Fired for: résumé view/download (`cv_viewed`), contact submit
  (`contact_form_submitted`), outbound GitHub/resource clicks.
- **Where they go:** standard output → **Vercel → your project → Functions/Logs**
  (locally, your `pnpm dev` terminal). These logs are **ephemeral** (short
  retention, not queryable history). There is no log database.
- **Error logs:** route handlers `console.error(...)` on failures (contact send
  failures, admin write errors) — same destination.

> If you want durable, queryable analytics history (views per post, totals),
> that requires adding a datastore — see roadmap item #12. Today it's logs + GA4.

---

## 5. Client analytics — what's collected and by whom

- **GA4** (`NEXT_PUBLIC_GA_ID`) via `gtag` and **GTM** (`NEXT_PUBLIC_GTM_ID`) via
  `dataLayer`, loaded by `components/layout/Analytics.tsx` (lazyOnload, only when
  the env var is set). **Microsoft Clarity** (`NEXT_PUBLIC_CLARITY_ID`) optional.
- `trackEvent(name, params)` pushes to both GA4 and the GTM dataLayer.
- **Data stored by Google/Microsoft** (not by us): page views, events, device/
  browser, approximate geo (IP-derived), and — if Clarity is enabled — session
  recordings/heatmaps. Governed by their policies; your privacy policy must
  disclose this.
- Events currently emitted: `cv_viewed`, `contact_form_submitted`,
  `github_link_clicked`, `resource_clicked`, `blog_post_read` (75% scroll).

---

## 6. Authentication & sessions (admin, local only)

- Library: **iron-session** (`lib/auth/session.ts`). The session is an
  **encrypted, HTTP-only cookie** (`devstash_admin`) — there is **no server-side
  session store**. Encrypted with `SESSION_SECRET` (≥32 chars).
- Login compares the submitted password to `ADMIN_PASSWORD` using
  `crypto.timingSafeEqual` (constant-time). Session payload is just
  `{ isAdmin: true }`.
- Cookies: `secure` in production, `sameSite=lax`, `httpOnly`. (The admin is
  disabled in production anyway, so this cookie is effectively dev-only.)

---

## 7. Storage inventory (everything that persists)

| What                     | Where                               | Owned by                | Persisted?            |
| ------------------------ | ----------------------------------- | ----------------------- | --------------------- |
| Blog posts               | `content/blogs/*.mdx`               | Git repo                | ✅ in version control |
| Projects                 | `content/projects/*.json`           | Git repo                | ✅                    |
| Page/metadata content    | `content/pages`, `content/metadata` | Git repo                | ✅                    |
| Blog images (uploaded)   | `public/images/blog/*`              | Git repo (after commit) | ✅ once committed     |
| Résumé                   | `public/resume-adesh-shukla.pdf`    | Git repo                | ✅                    |
| Contact messages         | Resend → your inbox                 | Resend + email          | external only         |
| Analytics events         | GA4 / GTM / (Clarity)               | Google / Microsoft      | external only         |
| Visit/error logs         | Vercel function logs / stdout       | Vercel                  | ⏳ ephemeral          |
| Admin session            | encrypted cookie in your browser    | client                  | session-lived         |
| **Application database** | —                                   | —                       | ❌ **none exists**    |

---

## 8. Environment variables (what reads what)

| Variable                   | Used by                          | Client-exposed?  | Secret?         |
| -------------------------- | -------------------------------- | ---------------- | --------------- |
| `NEXT_PUBLIC_SITE_URL`     | canonical URLs, sitemap, OG base | yes              | no              |
| `NEXT_PUBLIC_GA_ID`        | GA4 loader                       | yes              | no (public ID)  |
| `NEXT_PUBLIC_GTM_ID`       | GTM loader                       | yes              | no (public ID)  |
| `NEXT_PUBLIC_CLARITY_ID`   | Clarity loader (optional)        | yes              | no              |
| `RESEND_API_KEY`           | `/api/contact` email send        | **no**           | **yes**         |
| `GOOGLE_SITE_VERIFICATION` | `<meta>` in root layout          | rendered in HTML | no              |
| `BING_SITE_VERIFICATION`   | `<meta>` in root layout          | rendered in HTML | no              |
| `ADMIN_PASSWORD`           | `/api/admin/login`               | **no**           | **yes** (local) |
| `SESSION_SECRET`           | iron-session cookie encryption   | **no**           | **yes** (local) |

Rule: anything `NEXT_PUBLIC_*` is embedded in the client bundle — only public
IDs belong there. Real secrets (`RESEND_API_KEY`, `ADMIN_PASSWORD`,
`SESSION_SECRET`) must never get a `NEXT_PUBLIC_` prefix.

---

## 9. PII, privacy & retention

- **Contact form:** collects name + email + message → delivered by email, **not
  stored** by the app. Resend may retain delivery logs per its policy.
- **`/api/track` logs** include **IP address and User-Agent** (standard web
  server metadata) plus path/referrer. These live only in ephemeral Vercel logs.
- **Analytics/Clarity** collect behavioral data and (Clarity) session
  recordings. Your **privacy policy** (`app/(main)/privacy/page.tsx`) should
  disclose: GA4/GTM, Clarity (if enabled), IP in server logs, and the contact
  form. For EU/EEA visitors, consider a consent mechanism before loading
  Clarity/analytics.
- No passwords or personal data are stored in a database (there isn't one). The
  admin password is checked against an env var, never stored.

---

## 10. Quick "where does X go?" cheat sheet

- **A visitor submits the contact form** → `/api/contact` → Resend → your inbox.
  Also a GA4 event + a `/api/track` log line. Nothing saved in a DB.
- **A visitor downloads the résumé** → `cv_viewed` to GA4/GTM + a `/api/track`
  log line. The file is the static PDF in `/public`.
- **A visitor reads 75% of a post** → `blog_post_read` to GA4/GTM (no server
  log for this one by default).
- **You create a post in `/admin`** (local) → file written to `content/blogs/` →
  you commit + push → Vercel deploys → it's live.
- **You upload an image in `/admin`** (local) → file written to
  `public/images/blog/` → commit + push.
- **Someone hits `/api/admin/*` in production** → 404. Always.
