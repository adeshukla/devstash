# Launch posts and backlink kit

Drafts for getting real links to each project. Every claim below comes from the
project files in `content/projects/`. Do not add numbers that are not there (RULE 5):
there are no user counts, and Praxis says so itself.

**Order that works:** GitHub README links first (free, 10 minutes), then dev.to /
Hashnode write-ups, then one Show HN, then Reddit. Do not post everywhere on the
same day. Reddit and HN reward a genuine first comment from you, not link-dropping.

**Before posting:** each subdomain added to Search Console as its own property, with
its sitemap submitted.

---

## 1. GitHub README link block

Paste near the top of each repo README, and into your GitHub profile README.

```md
**Live:** https://pare.devstash.me · **Case study:** https://devstash.me/projects/pare
```

Swap the slug and URL per project:

| Project          | Live                                 | Case study                                    |
| ---------------- | ------------------------------------ | --------------------------------------------- |
| Pare             | https://pare.devstash.me             | https://devstash.me/projects/pare             |
| Praxis           | https://praxis.devstash.me           | https://devstash.me/projects/praxis           |
| Build Components | https://build-components.devstash.me | https://devstash.me/projects/build-components |
| Motion Lab       | https://showcase.devstash.me         | https://devstash.me/projects/motion-lab       |

Profile README line:

```md
Building at [devstash.me](https://devstash.me): [Pare](https://pare.devstash.me) (browser-only asset optimiser), [Praxis](https://praxis.devstash.me) (frontend interview practice), [Build Components](https://build-components.devstash.me) and the [Motion Lab](https://showcase.devstash.me).
```

Also set each repo's "Website" field and add topics (`webassembly`, `image-optimization`,
`nextjs`, `accessibility`, `wcag`).

---

## 2. Show HN — Pare (strongest fit: public repo, concrete, no signup)

**Title:** `Show HN: Pare – optimise images, fonts and code in the browser, no upload`

**URL:** https://pare.devstash.me

**First comment (post immediately):**

> I built Pare because I kept pushing client files through upload-based
> optimisers. Everything here runs in your browser: the codecs are compiled to
> WebAssembly and run in a worker pool, nothing is sent to a server, and it works
> offline after the first load.
>
> What it does: resizes images into AVIF/WebP plus an optimised original and gives
> you a paste-ready `<picture>` tag with width and height; splits fonts by
> writing system or subsets them to the characters you use (WOFF2 with
> unicode-range); and a whole-site mode that rewrites references and renders each
> page before and after so you can compare.
>
> A deliberate rule: minifiers only rewrite, never remove. Unused CSS rules,
> `alt=""` and SVG ids all survive, and CSS purging is permanently out of scope,
> because the failure mode of "the tool broke my site" is worse than a few
> extra bytes.
>
> Some numbers I can stand behind: 97.8 KB gzipped initial JS against a 150 KB
> budget enforced in CI, 228 unit tests and 87 browser tests across Chromium,
> Firefox and WebKit. Running Firefox and WebKit found a bug Chromium hid: in
> WebKit a dropped folder silently did nothing.
>
> Code is public: https://github.com/adeshukla/pare. It has no users yet beyond
> me, so I would genuinely like to hear where it breaks on your files.

---

## 3. dev.to / Hashnode article — Praxis

**Title:** `I built an interview-prep site around the part that actually fails: the second follow-up question`

**Canonical URL (set this so the link counts for your site):**
`https://devstash.me/projects/praxis`

**Body outline (write in your own voice, these are the true beats):**

1. The wall: recognising a concept and still falling apart on the follow-up.
2. Why recall tools (flashcards, MCQs, answer keys) train recognition, not defence.
3. The four-part loop: quizzes where every option carries its reasoning, a genealogy
   view tracing an API back to the idea under it (`useState` → closures → lexical
   environment), a mock interviewer that cross-questions shallow answers, and SM-2
   spaced repetition.
4. Decisions: self-hosted Supabase (no monthly bill, and the auth/DB layer is the part
   worth understanding); 755 lessons as MDX + JSON on disk so they stay diffable in PRs.
5. Honest ending (keep this, it is what makes the post credible): it has no users, was
   built for my own prep, and the implementation was built with AI assistance I directed
   and reviewed. Lighthouse mobile: Accessibility 100, Best Practices 100, SEO 100.
6. Link: `https://praxis.devstash.me`

**Tags:** `frontend`, `career`, `webdev`, `learning`

---

## 4. dev.to / Hashnode article — Motion Lab

**Title:** `Heavy animation on a performance budget: 17 landing pages, INP under 200ms`

**Canonical:** `https://devstash.me/projects/motion-lab`

**Beats:**

1. INP is the metric heavy animation actually breaks (scroll-linked JS, WebGL loops,
   layout thrash), so it is budgeted, not hoped for.
2. Five deliberately different techniques: image-sequence canvas scrub, WebGL via React
   Three Fiber, kinetic typography, horizontal scroll with parallax, SVG storytelling.
3. The budget: LCP < 2.5s, INP < 200ms, CLS < 0.1, measured by Lighthouse CI on a
   Moto G Power-class profile at 4x CPU slowdown; Accessibility 95+ and SEO 100 as
   blocking CI gates.
4. The reduced-motion contract: every route still shows its complete final content.
5. Say it is a work in progress and designs are still changing. Link `https://showcase.devstash.me`.

**Tags:** `webdev`, `performance`, `animation`, `webgl`

---

## 5. dev.to / Hashnode article — Build Components

**Title:** `125 accessible UI parts you configure visually and take as plain code`

**Canonical:** `https://devstash.me/projects/build-components`

**Beats:** every part built against a named WAI-ARIA Authoring Practices pattern; the
exported code is what gets tested (Playwright + axe up to WCAG 2.2 AA, keyboard flows,
Chromium/WebKit/iPhone profile); two outputs (React + Tailwind v4, plain HTML/CSS/JS)
with zero runtime dependencies; install by URL through a shadcn-compatible registry.
Say plainly: no usage numbers exist yet. Link `https://build-components.devstash.me`.

**Tags:** `a11y`, `react`, `tailwindcss`, `webdev`

---

## 6. Reddit (one post, a few days after HN, not on the same day)

**Subreddit:** r/webdev has a "Showoff Saturday" thread; use it rather than a standalone
post. r/javascript and r/reactjs restrict self-promotion, so read each sidebar first.

**Comment/post text:**

> Showoff Saturday: Pare, an image/font/code optimiser that runs entirely in the
> browser (WebAssembly, no upload, works offline). I wanted something I could point at
> client files without sending them anywhere. Repo is public and I am looking for files
> it handles badly: https://pare.devstash.me · https://github.com/adeshukla/pare

Reply to every comment for the first day. Do not delete critical feedback.

---

## 7. Product Hunt (optional, lower fit)

Better for Praxis or Build Components than for a developer tool like Pare. Needs a
tagline, a maker comment and a few screenshots. Skip unless you want the launch-day
traffic, since Product Hunt links are `nofollow`.

---

## Rules for all of these

- Never state a user count, revenue, or "loved by". There are none.
- Mention AI assistance where it applies (Praxis says so). It builds trust.
- Use the canonical URL on any cross-post so the link equity points at devstash.me.
- Track what works in Search Console: new referring domains show up under Links.
