# Analytics & Monitoring

> **Location:** `/docs/seo/analytics-and-monitoring.md`
> **Purpose:** Setup, configuration, and event tracking guide for all analytics and monitoring tools used on DevStash.

---

## Tools Overview

| Tool | Purpose | Cost |
|---|---|---|
| Google Search Console | SEO monitoring, indexing, keyword data | Free |
| Google Analytics 4 (GA4) | User behaviour, traffic, conversions | Free |
| Bing Webmaster Tools | Bing/Edge search coverage | Free |
| Ahrefs Webmaster Tools | Backlinks, keyword rankings, site audit | Free (limited) |
| Microsoft Clarity | Heatmaps, session recordings, scroll depth | Free |

---

## 1. Google Search Console

### Purpose
- Monitor which pages are indexed and which are not.
- Identify crawl errors and coverage issues.
- Track keyword impressions and click-through rates.
- Submit sitemaps.
- Request priority indexing for new/updated pages.

### Setup Steps
1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. Add property: **URL prefix** → `https://devstash.me`.
3. Verify ownership via one of:
   - HTML tag in `<head>` (recommended — add to `app/layout.tsx` metadata).
   - DNS TXT record.
   - Google Analytics (if GA4 is already connected).
4. Submit sitemap: **Sitemaps** → enter `https://devstash.me/sitemap.xml` → Submit.
5. Verify no important pages are blocked in **Coverage** report.

### Verification via Next.js Metadata
```tsx
// app/layout.tsx
export const metadata = {
  verification: {
    google: 'TODO: your-google-verification-code',
  },
}
```

### Key Reports to Monitor Weekly
- **Coverage** — Indexed vs excluded pages. Investigate any "Excluded" pages that should be indexed.
- **Performance** — Impressions, clicks, CTR, average position per keyword and URL.
- **Core Web Vitals** — LCP, CLS, INP scores from real user data.
- **Sitemaps** — Confirm sitemap is submitted and processed correctly.

---

## 2. Google Analytics 4 (GA4)

### Purpose
- Track overall traffic volume, sources, and session behaviour.
- Measure key user actions (conversion events).
- Understand which content drives engagement.

### Setup Steps
1. Go to [analytics.google.com](https://analytics.google.com) → create a new GA4 property for `devstash.me`.
2. Get your **Measurement ID** (`G-XXXXXXXXXX`).
3. Add tracking to Next.js:

**Recommended approach — `next/script` (no third-party libs):**
```tsx
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="lazyOnload"
        />
        <Script id="ga4-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { page_path: window.location.pathname });
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}
```

4. Add `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` to `.env.local` and hosting environment variables.

### Key Conversion Events to Track

| Event Name | Trigger |
|---|---|
| `cv_viewed` | User clicks to view/download CV/resume |
| `contact_form_submitted` | Contact form successfully submitted |
| `github_link_clicked` | User clicks outbound GitHub project link |
| `blog_post_read` | User reaches bottom of a blog post (75% scroll depth) |
| `resource_clicked` | User clicks an outbound resource link |

**Event tracking helper:**
```ts
// lib/analytics/events.ts
export function trackEvent(name: string, params?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params)
  }
}

// Usage:
trackEvent('cv_viewed', { method: 'header_button' })
trackEvent('github_link_clicked', { project: 'devstash-portfolio' })
```

### Key Reports to Monitor
- **Acquisition** — Where traffic comes from (organic search, direct, referral, social).
- **Engagement** — Pages per session, time on page, scroll depth.
- **Conversions** — Track the events above as conversion goals in GA4.
- **Pages and screens** — Top performing pages and blog posts.

---

## 3. Bing Webmaster Tools

### Purpose
- Ensure DevStash is indexed in Bing and Microsoft Edge search.
- Access Bing-specific keyword data and crawl reports.

### Setup Steps
1. Go to [bing.com/webmasters](https://www.bing.com/webmasters).
2. Add site: `https://devstash.me`.
3. Verify via XML file or auto-import from Google Search Console (easiest if GSC is already set up).
4. Submit sitemap: **Sitemaps** → `https://devstash.me/sitemap.xml`.

---

## 4. Ahrefs Webmaster Tools

### Purpose
- Monitor backlink profile (who links to DevStash).
- Track keyword rankings beyond GSC's limited data.
- Run site audits to catch technical SEO issues.

### Setup Steps
1. Go to [ahrefs.com/webmaster-tools](https://ahrefs.com/webmaster-tools) (free account).
2. Verify ownership via HTML file or DNS TXT record.
3. Run a site audit — resolve any critical or high-severity issues.

### Key Uses
- **Site Audit** — Run monthly to catch broken pages, missing metas, redirect chains.
- **Backlinks** — Monitor new and lost links; spot spammy links.
- **Organic Keywords** — Track ranking positions for target keywords.

---

## 5. Microsoft Clarity (Optional)

### Purpose
- Understand how real users interact with pages.
- Heatmaps, scroll maps, and session recordings.
- Identify UX friction points (rage clicks, dead clicks, excessive scrolling).

### Setup Steps
1. Go to [clarity.microsoft.com](https://clarity.microsoft.com) → create a project.
2. Get your **Project ID**.
3. Add via `next/script` with `strategy="lazyOnload"` — same pattern as GA4.

```tsx
<Script id="clarity" strategy="lazyOnload">
  {`
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "TODO: YOUR_CLARITY_ID");
  `}
</Script>
```

> **GDPR Note:** Clarity records session data. If you serve EU users, ensure this is disclosed in your Privacy Policy and loaded with appropriate consent.

---

## Monitoring Checklist (Monthly)

- [ ] Google Search Console: Review Coverage — no important pages excluded.
- [ ] Google Search Console: Review Core Web Vitals — all passing.
- [ ] Google Search Console: Check for any manual actions or security issues.
- [ ] GA4: Review top pages and traffic sources.
- [ ] GA4: Confirm key conversion events are firing correctly.
- [ ] Ahrefs: Run site audit — resolve any new critical issues.
- [ ] Ahrefs: Review new backlinks.
- [ ] Bing Webmaster: Review crawl errors.
- [ ] Sitemap: Confirm sitemap is valid and all new pages are included.
- [ ] Broken links: Run link checker script, resolve any 404s.

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity Project ID |
| `GOOGLE_VERIFICATION` | Google Search Console verification meta tag value |
