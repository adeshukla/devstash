# DevStash Future Roadmap

> A market-informed plan for what to build next to make DevStash a genuine
> career and brand asset — not just a portfolio. Ordered by **return on effort**.
> Pick from the top; everything below "Now" is optional and sequenced.

## Where DevStash is today (done)

Foundation, design system, content layer, all marketing pages, full blog system,
SEO + dynamic OG images, automation scripts (lint/link-check/Lighthouse CI),
analytics (GA4 + GTM + visit logs), a local-only blog admin (create/edit/delete +
image upload), a real home page, and a contact form (Resend). Strong base.

## The positioning to protect

> "A senior-minded frontend engineer who ships fast, writes clearly, and
> automates the boring parts."

Every addition should reinforce **proof of work + clear thinking + execution**.
Recruiters skim, founders test depth, devs want usefulness. Optimize for those.

---

## NOW — highest leverage, do these first

These convert visitors and cost little.

1. **Make the home/hero real.** Replace placeholder copy + stats in
   `HeroSection`, mark your best 3–6 projects `featured: true`. (See
   `docs/home-page-strategy.md`.) Nothing else matters if the front door is
   generic.
2. **Ship 3–5 strong case-study projects.** Not just "a clone" — each project
   page should tell: problem → approach → architecture → result/metrics →
   what you'd do differently. This is what founders actually read. Add real
   interface/GIFs.
3. **Publish 5–8 quality blog posts** on topics you can speak to (Next.js 16,
   automation with n8n, AI workflows, performance). Use the AI pipeline to draft,
   then humanize. Consistency > volume. This is your organic-traffic engine.
4. **Finish launch hygiene** (see `docs/launch-checklist.md`): GA4 property +
   GSC/Bing verified, sitemap submitted, custom domain on Cloudflare grey-cloud,
   real résumé reviewed.
5. **Add measurable social proof** as it appears: a shipped product link, a
   metric ("cut LCP from 4.1s → 1.8s"), a recommendation quote. Never fabricate.

---

## NEXT — 1 to 3 months

6. **Newsletter / subscribe** (e.g. Buttondown, ConvertKit, or Resend
   Audiences). Capture the traffic your posts earn. Add a tasteful inline +
   end-of-post signup. Wire a `newsletter_signup` analytics event.
7. **Project detail upgrade:** MDX-powered case studies (you already render MDX),
   `SoftwareApplication`/`CreativeWork` JSON-LD (already wired), live demo embeds,
   and a "tech decisions" section.
8. **Search / filter on the blog** as post count grows (client-side fuzzy search
   over titles/tags). Improves dwell time + UX signal.
9. **RSS feed** (`/feed.xml`) — cheap, helps distribution and shows craft.
10. **Uses / "stack" page** (developers love these; great for long-tail SEO and
    affiliate-free authority). You already have `/tools`; deepen it.
11. **Production blog ingest** (token-protected `POST /api/ingest/post` → GitHub
    commit) so the n8n pipeline can publish without your laptop (see Phase 10
    doc §6).

---

## LATER — 3 to 6 months (pick based on goals)

12. **Lightweight DB for engagement data** (Vercel KV or Postgres / Turso) to
    persist what `/api/track` currently only logs: views per post, résumé
    downloads, contact submissions. Build a tiny private `/admin/stats` view.
    (Today there is **no database** — see `docs/backend-overview.md`.)
13. **Comments / reactions** on posts (giscus = GitHub Discussions, zero backend)
    to build community signal.
14. **Interactive demos / playgrounds** embedded in posts (Sandpack) — strong
    differentiator for a frontend dev.
15. **Open-source a small useful library or CLI** and feature it. OSS is the
    single most credible proof for senior/lead roles.
16. **Case-study-driven "Work with me" page** if you want freelance — packages,
    process, a calendar booking link.
17. **Internationalization / performance deep-dives** only if they serve your
    audience; don't add complexity for its own sake.

---

## AUTOMATION to integrate (ranked)

You already have: MDX lint, link check, Lighthouse CI, OG image generation,
analytics, local admin.

1. **Blog draft pipeline (Phase 10)** — n8n + Groq → draft → review → publish.
   Biggest time-saver for content cadence.
2. **Auto social posts** — on publish, n8n posts the new article to LinkedIn/X
   with the OG image. Turns one post into distribution.
3. **Indexing pings** — on publish, ping Google/Bing (sitemap re-submit or URL
   inspection) so new posts get crawled faster. (`scripts/indexing/` exists.)
4. **Scheduled link-check + Lighthouse** in CI on a cron (catch rot weekly).
5. **Dependabot / renovate** for dependency hygiene (keep "Next.js N" honest).
6. **Weekly analytics digest** — n8n pulls GA4 + your `/api/track` logs and
   emails you a one-paragraph summary.

---

## Content strategy (what actually ranks + converts)

- **Pillar + cluster:** one deep guide per theme (e.g. "Next.js App Router in
  production") + several focused posts linking back to it. Builds topical
  authority.
- **Write what you debug:** real problems you solved rank well and are easy to
  make authentic (and humanized).
- **Cadence:** 2–4 posts/month, consistently, beats sporadic bursts.
- **Update, don't just add:** refresh top posts (bump `updatedAt`) — Google
  rewards freshness.
- **Every post:** one keyword theme, internal links, a real takeaway, an image.

---

## Anti-goals (what NOT to do)

- Don't add a heavy CMS/DB before you have traffic or a real need.
- Don't fabricate metrics, testimonials, or logos.
- Don't chase framework churn in copy — let `lib/site/stack.ts` keep versions
  honest automatically.
- Don't gate good content behind a newsletter wall early.
- Don't expose the local-only admin to production.

---

## Suggested 90-day sequence

- **Weeks 1–2:** real hero copy + stats, feature best projects, launch hygiene.
- **Weeks 3–6:** 2 case-study projects + 4 blog posts; stand up the n8n draft
  pipeline.
- **Weeks 7–10:** newsletter + RSS + blog search; auto social-post on publish.
- **Weeks 11–13:** production ingest route + a tiny stats DB + `/admin/stats`.

Re-evaluate against your actual goal (job vs freelance vs audience) every month
and reorder.
