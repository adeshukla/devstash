# US client and MNC market research (2026-10-31)

Goal: get hired by good MNCs and win US / non-India clients, using free data only.
No search volumes here. Nothing below is a ranking promise.

## How reliable is each source

| Source                             | What it tells us                                                                                                                                           | Limits                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Google Autocomplete (US, `gl=us`)  | Real phrases people type, in popularity order                                                                                                              | No volumes. Order is a hint, not a number                                                      |
| Job-board / resume-vendor analyses | Which skills postings list (React 66% of 21,135 postings in one analysis; TypeScript "80%+" claimed by a career guide)                                     | Vendor blogs, not primary data. Not freelance- or US-specific                                  |
| Accessibility-law write-ups        | The European Accessibility Act applied from 2025-06-28 and covers sites selling to EU consumers; US ADA web lawsuits are counted in the thousands per year | Vendor sources disagree on exact numbers. Check the EU text and court decisions before quoting |

Still missing: real volumes. Fix: Google Keyword Planner (free Ads account, no campaign) and Search Console after a few weeks of data.

## What US-side searchers actually type (autocomplete, US)

- `hire front end developer` → `hire freelance front end developer`, `hiring front end developer remote`, **`hire front end developer india`**
- `hire react developer` → `hire react developers`, **`hire react developer india`**, `hiring react developer remote`
- `landing page developer` → `landing page developer jobs remote`, `landing page developer upwork`, `landing page development services`
- `custom website developer` → `custom website developer near me`, `custom website design cost`
- `website speed optimization` → `... services`, `... checker`, `... wordpress`
- `core web vitals` → `core web vitals test`, `... checker`, `... inp`
- `wcag accessibility audit` → `wcag 2.1 / 2.2 accessibility audit`, `wcag 2.2 aa accessibility audit`
- `how much does a landing page cost` → `... should a landing page cost`, `... a simple landing page cost`
- `google ads landing page` → `best practices`, `examples`, `experience`, `template`, `tips`

Takeaways:

1. **Keep "India" visible on the hiring pages.** "hire react developer india" is a real query: buyers who search it want an India rate. Do not drop India from `/services`; just stop leading with a city.
2. The cost query has country variants (Nigeria, UK, India, South Africa). The generic form is open. The draft post is now slug `how-much-does-a-landing-page-cost`, not "in India".
3. "Remote" appears next to both "front end" and "react" hiring queries. Say "remote" plainly.
4. Landing pages are a recognised freelance category (`landing page developer upwork`). Tools like Webflow compete for simple pages, so lead with speed, accessibility and measured results, not "I can make a page".

## What MNC hiring pages emphasise

From the postings analyses: React, TypeScript, JavaScript, CSS, GraphQL. Accessibility and performance show up as secondary lines (accessible components, web performance). Core Web Vitals appears mostly as a resume bullet, not a stated requirement.

What the site already proves: React, Next.js, accessible markup, page speed, a documented process. What a recruiter scanning for TypeScript or testing will look for and may not find quickly: [TODO: Adesh, list TypeScript and testing evidence you can honestly show; do not add anything you have not shipped].

## Content plan (client-intent first, one post per query cluster)

Written and live: custom website vs template, why a website is slow on mobile, Google Ads landing page checklist.

| Priority | Working title                                                  | Targets                                                       | Needs from Adesh                    |
| -------- | -------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------- |
| 1        | How much does a landing page cost? (draft exists)              | `how much does a landing page cost`                           | Your real starting price            |
| 2        | Interaction to Next Paint: what 200 ms means and how to fix it | `core web vitals inp`, `core web vitals checker`              | A real INP fix from your work       |
| 3        | WCAG 2.2 AA audit: a checklist for a product team              | `wcag 2.2 aa accessibility audit`                             | Which checks you actually run       |
| 4        | Google Ads landing page experience: what is measured           | `google ads landing page experience`                          | Optional: one anonymised result     |
| 5        | Hiring a freelance front-end developer: 8 things to check      | `hire freelance front end developer`                          | Your terms (notice, hours, payment) |
| 6        | Landing page: freelancer, agency or Webflow?                   | `landing page developer`, `landing page development services` | Your honest view                    |
| 7        | When a business needs Next.js and when WordPress is fine       | `next.js developer for hire`, `hire nextjs developers`        | None                                |

Rule 5 applies: no invented metrics or client stories. Where only your experience fits, leave a `[TODO]`.

## Free next steps that are not code

1. Keyword Planner: paste the phrases above, send the volume screenshot, and I re-rank the table.
2. Search Console: submit the sitemap (done automatically on each production push) and use URL Inspection → Request indexing for new pages. Google offers no API for this on ordinary pages.
3. Backlinks: dev.to or Hashnode with `canonical` to devstash.me, LinkedIn headline, Peerlist, Contra, Clutch.
4. After 2–4 weeks: Search Console queries report, to see which phrases already show.
