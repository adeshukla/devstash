# Handoff: Lab upgrade session (written 2026-11-01)

Paste-ready brief for a fresh session. Read this file first, then CLAUDE.md.

## Where things stand

- Branch state: `main` == `dev` == `73fd9f7` (everything below is live on https://devstash.me and on staging).
- `debug.log` in the repo root is untracked and must never be committed.
- Never merge `dev` into `main` on your own (RULE 9). Adesh says "ship"; then `git checkout main && git merge --ff-only origin/dev && git push origin main && git checkout dev`, and verify the deploy with `curl` against https://devstash.me.
- Use full URLs (with https://devstash.me) whenever you give Adesh a link; Search Console rejects bare paths.
- Do not run Prettier on `.mdx` files. Heredocs with apostrophes break in the Bash tool here; use the Write tool for files and a small `node` script for multi-line patches (handle CRLF).
- Verify before ship: `pnpm tsc --noEmit`, `pnpm lint` (0 warnings), `pnpm test:unit` (10 tests), `pnpm lint:content`, `pnpm check:links`, `pnpm next build --webpack` (143 pages). A local prod build on port 3100 plus Playwright works for screenshots (the browser pane screenshots were unreliable); check 200, 300, 360, 768, 1440 px and assert `window.scrollX` after `scrollTo`, not `scrollWidth`.

## What was done in the last sessions (all live)

SEO and discovery

- Home, /services, llms.txt and Person/Service schema now target "freelance UI developer / custom websites / landing pages / speed fixes" for US and worldwide clients. City names removed (footer says "crafted with a coffee cup in India"); Terms jurisdiction and schema addressLocality still say Ghaziabad on purpose.
- 3 client-intent posts published, 1 draft: `how-much-does-a-landing-page-cost` (`draft: true`, two `[TODO]` markers need Adesh's real rate).
- Interlinking audit done: posts link to each other, projects show "Related writing", post category badge links to its archive, category pages have real intros.
- Editor note "Images to add" removed from 6 live posts (it was visible to readers).
- `docs/us-market-research.md` has the free-data keyword research and a 7-post content plan.
- Indexing: sitemap is auto-submitted to Search Console and IndexNow on every `main` push. There is NO API to request indexing for ordinary pages. `scripts/indexing/check-index-status.mjs` + weekly `index-status.yml` report which URLs are indexed (read-only). Adesh does "Request indexing" by hand.

Design

- /services rebuilt to match home and projects: hero with at-a-glance panel, `ServicesExplorer` (list + sticky detail with cursor-follow cover), "every build" bento, process, ways to work, FAQ, `CtaBand`.
- Shared `FaqSection` (numbered accordion, sticky intro, "Not answered here?" card) is used on Services, Projects, Contact and Lab. Blog posts keep their own "Quick answers" block.
- `CtaBand` (closing CTA with "what happens next") is on Services and every project case study.
- Navbar now has Services. Links to /services also from every blog post, contact page, lab page.
- Project and service covers no longer clip on phones (stat chips wrap whole).
- Three new unique blog thumbnails (`template-vs-custom`, `slow-phone`, `ads-checklist`) in `components/illustrations/CategoryIllustration.tsx`.

## What Adesh still owns (do not do for him)

Search Console "Request indexing" for new URLs, real pricing for the draft post, Keyword Planner screenshots, backlinks (dev.to/Hashnode with canonical, LinkedIn, Peerlist), a real photo, real testimonials (`content/testimonials/testimonials.json` still holds `[TODO]` placeholders; they are filtered out and not shown).

## The next job: upgrade the Lab

Adesh's words: upgrade the Lab section, build advanced-feature tools, but first make the existing tools more worth it.

### Current Lab (read before changing)

- Hub: `app/(main)/lab/page.tsx` (flagship + 4 tools, `LabTools` filter/expand cards, `LabPreview` animated previews, principles, FAQ via `FaqSection`).
- Tool routes live in `app/(lab)/lab/<slug>/page.tsx` with `app/(lab)/lab/layout.tsx`. `components/lab/` holds the UI and engines.
- Flagship: `ai-content-pipeline` (3-step Groq chain in `app/api/ai-pipeline/route.ts`, Cerebras fallback in `lib/ai/groq.ts`; honest scaffold with `[TODO]` markers, never fabricates; copy-edit strips AI-tell phrases from `lib/ai/aiTellPhrases.ts`).
- Tools (all client-side, nothing sent anywhere): `css-shapes-playground`, `illustration-generator` (procedural SVG, `characterEngine.tsx` and `illustrationEngine.tsx` are large), `meta-tag-generator` (`metaDraftEngine.ts`), `utm-builder`.
- Each has a project case study in `content/projects/*.json` (with `relatedPosts`) and a unit/QA surface. Empty leftover folders `app/(lab)/lab/marketing-lead-gen`, `real-estate-listing`, `saas-trial-signup` and `app/api/lab` are not tracked by git; `next.config.ts` redirects those old slugs to /lab.

### Constraints that apply to every Lab change

- RULE 5: no invented metrics, clients or "human" claims; use `[TODO]`.
- RULE 1: do not overengineer. Server Components by default, `use client` only for interactivity.
- Design system tokens only (`ds-*`), Tailwind v4 in `app/globals.css`. Editing `globals.css` can serve stale CSS in dev; verify against a production build.
- Tool pages need metadata via `buildMetadata`, JSON-LD (`LabToolSchema`), breadcrumb, sitemap entry, a case study and FAQ. Titles <= 60 chars, descriptions 130-160.
- Mobile: first-fold CTA inside 375x667; nothing may clip at 300px; verify with Playwright.
- Performance: Lighthouse > 90, no non-composited continuous animations on mobile, never wrap the hero H1 in a reveal.
- AI features: server-side keys only, Groq with Cerebras fallback, rate limit, and keep the honesty stance (no detector-evasion, no fabricated voice).

### Suggested order of work

1. Audit each existing tool as a user and as a recruiter: what is the one thing it does better than a free alternative, where does it feel toy-like, what is missing (export, share link, presets, copy buttons, keyboard support, saved state in localStorage with try/catch, empty/error states, accessibility, mobile layout at 300px).
2. Write the findings into `docs/lab-audit.md` with a ranked list and get Adesh's pick before building.
3. Upgrade the weakest/most valuable existing tools first (UTM builder is the most client-relevant: link set/CSV export, validation, shortener-free QR, presets; Meta tag generator: image preview, JSON-LD output; CSS playground: more generators, share URL; Illustration generator: export PNG/SVG, theme variants).
4. Then propose 2-3 new advanced tools, chosen from the client-intent research (landing page speed checker front end over PageSpeed API, Core Web Vitals explainer/budget calculator, WCAG contrast and focus checker, schema/JSON-LD generator, landing-page cost estimator once real pricing exists). Each needs the full tool checklist above.
5. Update the Lab hub (`LabTools`, `LabPreview`, FAQ copy), sitemap, `llms.txt` and `docs/` as tools ship. Interlink new tools from relevant blog posts and /services.

Always deliver on `dev`, show Adesh screenshots, and wait for "ship" before touching `main`.

## Known outdated notes in CLAUDE.md

- It says no Lighthouse workflow exists; `.github/workflows/lighthouse.yml` now exists.
- Next.js is 16.4.3 per package.json; React 19.2.x pinned.
