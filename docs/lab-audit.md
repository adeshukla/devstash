# Lab audit (2026-11-01)

Scope: the 5 existing Lab tools plus the hub, checked against https://devstash.me (identical to `dev` at `8e84b5b`). Method: read every tool component, probe two tools in a real browser (Playwright), screenshot hub + tools at 1440px and 300px (`docs/lab-audit-shots/`).

Not verified: I did not run the AI pipeline (spends Groq quota), and I read the CSS playground's sub-editors by grep rather than clicking every control. Items from those are marked _(unverified)_.

## What holds across all tools

Good: no horizontal overflow at 300px on any page (`scrollX` = 0, one H1 each), everything client-side except the pipeline, copy buttons work, real SEO/JSON-LD/case studies exist.

Weak, and shared by most tools:

1. **No shareable state.** Nothing is in the URL, nothing survives a refresh. The single biggest "toy vs tool" gap.
2. **Fixed "devstash.me/lab" pill overlaps content at 300px** (seen on the CSS page heading). Needs bottom padding or hiding when it would collide.
3. **Tool sits below a tall hero.** On UTM at 1440x900 the form starts ~530px down; on a phone the tool is several screens away. Hero should shrink so the tool is in the first fold.
4. `AiContentPipeline.tsx:59-67` reads/writes `localStorage` with no try/catch (breaks in private mode / blocked storage).
5. Zero keyboard or `aria-live` feedback on copy/export results.

## Per tool

### 1. UTM builder — most client-relevant, weakest build (144 lines)

Probed live: input `Google Ads` / `CPC` / `Spring Sale 2026` produced
`?utm_source=Google+Ads&utm_medium=CPC&utm_campaign=Spring+Sale+2026`.
That is the exact mistake the tool exists to prevent: GA4 treats `CPC` and `cpc` as different mediums, and `+` spaces fragment campaign reports.

- No normalisation (lowercase, spaces to hyphens/underscores), no warnings.
- No required-field enforcement: the empty-state text says "at least a source", but source is never required.
- Only one link at a time. No presets (Google Ads, Meta, newsletter, LinkedIn), no bulk, no CSV, no history, no QR, no "open link" check.
- Fields are not remembered between visits.
- Nothing differentiates it from Google's own Campaign URL Builder.

**What would make it worth using:** auto-normalise with a visible "we changed X" note, channel presets that fill source/medium correctly, a campaign sheet (add rows, table, export CSV / copy as TSV for Sheets), saved naming convention in localStorage, shareable URL, naming-consistency lint (flags `Facebook` vs `facebook` across rows). The "campaign sheet + lint" is the differentiator no free builder does well.

### 2. Meta tag generator (360 lines + 331-line draft engine)

Probed live: title `He said "hi" & <b>left</b>` outputs
`<title>He said "hi" & <b>left</b></title>` and the same unescaped value inside `content="..."` attributes. **Real bug: output can be invalid HTML / injectable markup the moment a title or description has a quote or ampersand.** Same for URL, site name, image.

- Prefilled with DevStash's own title/description/`https://example.com/page`, so a visitor copies someone else's text unless they overwrite everything.
- `og:type` hard-coded `website`; no article type, no locale, no robots, no `theme-color`.
- Google preview: no mobile/desktop toggle, no pixel-width truncation (real Google truncates by pixels, not 60 chars), no favicon.
- Social cards show a placeholder unless an image URL is pasted; no 1200x630 checker.
- No JSON-LD output (the handoff lists it). No Next.js `metadata` export format, which is the format its audience actually pastes.
- The "draft from content" extractive drafter is honest and a real differentiator; keep it.

**What would make it worth using:** escape output (must-fix), pixel-width SERP truncation with desktop/mobile toggle, output tabs (HTML / Next.js `metadata` / JSON-LD Article/Product/FAQ), clean empty defaults, shareable state.

### 3. CSS shapes playground (page 479 lines + 6 customizers)

Strengths: large for a free tool: shape presets, 4-corner sliders, draggable polygon, cubic-bezier editor, border / shadow / glass / gradient studio, Tailwind arbitrary-value export. Likely the strongest _depth_ in the Lab.

- Page is a long scroll of unrelated generators with no navigation between them _(layout read from source; hero + customizer confirmed in screenshots)_.
- Gallery demos (blob, clip morph, ring, flip, six CTA buttons) are static snippets. They are copy-only, not editable.
- No shareable state, no "export all as one stylesheet", no reduced-motion note on animation snippets _(unverified in generated CSS)_.
- Shapes cannot be exported as SVG or as an inline `clip-path` with fallback.

**What would make it worth using:** sticky section nav (Shapes / Surfaces / Borders / Shadows / Easing), share link, one "export collection" that merges what you built, `prefers-reduced-motion` wrapper in generated animation CSS.

### 4. Illustration generator (952-line UI + ~2,100 lines of engines)

Strengths: the most original piece. Procedural abstract and character scenes, skin tone, palette, themes, PNG export (`downloadPng`, CSP-aware) and copyable SVG.

- Seed is in the PNG filename but not recoverable: you cannot reopen a result you liked.
- 7 character scenes only; no SVG file download (copy only), no transparent-background PNG option, no export size beyond presets.
- Heavy page: three large client modules loaded up front _(bundle size unmeasured)_.
- Intro paragraph is dense and jargon-heavy; first fold at 1440px is text, tool is below.
- Licence/usage statement for generated art is not on the page.

**What would make it worth using:** seed + options in the URL (reopenable/shareable), SVG download, transparent PNG, an explicit "free for commercial use" line, lazy-load the character engine.

### 5. AI content pipeline (flagship; route 563 lines, honest-scaffold design)

Strengths: real 3-step chain, `[TODO]` markers, Cerebras fallback, daily cap + BYOK, sandboxed iframe preview, HTML download. Strong recruiter piece and the honesty stance is a genuine differentiator.

- BYOK asks visitors to paste a Groq key into a web form. It goes only to the server route and is not stored, but a first-time visitor reasonably hesitates; the page should say so plainly next to the field and link to key revocation.
- Cap state is a cookie (`Run-cap cookie helpers`), so clearing cookies resets it. Acceptable, but IP/edge rate limiting is the real protection _(not checked whether it exists)_.
- No history: a run's output disappears on refresh. No "copy as MDX with frontmatter" shown as one action _(unverified)_.
- Onboarding tour auto-opens on first visit and blocks the tool _(seen via code; localStorage unguarded, see above)_.

**What would make it worth using:** persist last result locally, one-click export to MDX with the project's frontmatter schema, clearer key-handling copy, guard storage.

### Hub (`/lab`)

Filterable, expandable cards and animated previews are good. Gaps: no "newest / most used" signal (and we have no honest usage numbers, so do not invent them, RULE 5); cards do not say what each tool does better than the free alternative; no email/RSS for new tools.

## Ranked recommendation

Ranked by (client value) x (gap size) / (effort). Effort: S under half a day, M about a day, L multi-day.

| #   | Upgrade                                                                        | Why                                                                               | Effort |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------ |
| 1   | **Meta tag: escape output + pixel truncation + Next.js/JSON-LD output tabs**   | Fixes a correctness bug and adds the format users actually paste                  | M      |
| 2   | **UTM: normalise + presets + campaign sheet + CSV + naming lint**              | Most client-relevant; current output actively causes bad analytics                | M      |
| 3   | **Shared infrastructure: URL-state helper + 300px pill fix + tool-first hero** | One small helper unlocks "shareable" for all 5 tools; the pill bug is visible now | S      |
| 4   | **Illustration: seed in URL, SVG download, transparent PNG, lazy-load**        | Turns a demo into something reusable                                              | S-M    |
| 5   | **CSS playground: sticky section nav, share link, export collection**          | Strongest tool; mostly navigation and export polish                               | S-M    |
| 6   | **Pipeline: storage guard, key-handling copy, MDX export, local history**      | Already strong; small trust and usability fixes                                   | S      |

Suggested bundles:

- **A (smallest, fixes real problems):** #3 + #1 + #2.
- **B (A plus polish):** A + #4 + #5.
- **C (everything):** A + #4 + #5 + #6, then propose new tools.

Items that need Adesh (not invented by me): whether to keep BYOK, what "free for commercial use" wording he wants on illustrations, and any real usage numbers for the hub.

## Next-tool candidates (for after the upgrades; no build yet)

From the handoff's client-intent list, in order of fit with the existing Lab: schema / JSON-LD generator (reuses #1's output tab), WCAG contrast + focus checker, landing-page speed checker front end over the PageSpeed API (needs server key + rate limit), Core Web Vitals budget calculator. Landing-page cost estimator stays blocked until real pricing exists.
