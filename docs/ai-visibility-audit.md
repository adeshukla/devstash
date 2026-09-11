# AI Visibility Audit — devstash.me

_Run 2026-09-12. Entity under audit: **DevStash** (site) / **Adesh Shukla** (person).
Question: how likely is this site to be cited by ChatGPT, Gemini, Perplexity, or Claude?_

---

## 0. Method, and what this audit can and cannot claim

**What I actually measured:**

- Live retrieval + summarization of the brand and person queries through a real web
  search engine — the same retrieve-then-summarize shape that RAG-based AI answers use.
  This is a proxy, not a direct test, but it is a real measurement.
- The full on-site technical surface: `robots.ts`, `public/llms.txt`, JSON-LD coverage
  per route, schema builders, content structure.
- Third-party corroboration — whether anything on the open web references this site.

**What I did not measure, and will not invent:** I cannot query ChatGPT, Gemini,
Perplexity, or Claude directly from here. There are no "you were cited 3rd in ChatGPT"
numbers in this document because I did not observe any. Those dimensions are marked
**UNMEASURED**. Section 6 says how to test them yourself in about fifteen minutes.

This matters because the AI-visibility tooling market is full of precise-sounding
citation-rate percentages drawn from small proprietary samples. Do not anchor on those.

---

## 1. Score

| Dimension                      | Score      | Basis                                                                                             |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| **Presence — branded**         | 6/10       | `devstash.me` is retrieved for "DevStash", but ranks among 6+ unrelated products of the same name |
| **Presence — non-branded**     | 1/10       | Nothing from the site surfaced for technical queries it has posts about                           |
| **Accuracy**                   | 3/10       | **The retrieved summary described a project you deliberately deleted.** See §2                    |
| **Sentiment**                  | 7/10       | Neutral-to-positive, nothing adverse circulating                                                  |
| **Entity clarity**             | 2/10       | Name collision on _both_ the brand and the person. See §3                                         |
| **Technical extractability**   | 7/10       | llms.txt and JSON-LD are genuinely good; real gaps in §4                                          |
| **Third-party corroboration**  | 0/10       | Zero independent references                                                                       |
| **Cross-platform consistency** | UNMEASURED | Requires direct platform testing                                                                  |

**Measured composite: 37/100.**

Read that as "the technical groundwork is done and the entity groundwork is not started" —
which is a much better position to be in than the reverse, because the technical half is
the half that is expensive to retrofit.

---

## 2. The finding that matters most: you are being described with deleted content

The retrieved summary of devstash.me described it as featuring _"a Netflix clone powered
by Gemini AI for smart movie recommendations."_

That project does not exist on the site. `content/projects/netflix-gpt.json` was removed
in commit `248368f` — _"content(projects): drop the fictional-brand and clone case
studies."_ You removed it on purpose, and it is still what the web is telling retrieval
systems about you.

**Why this is the top finding:** AI answers are built from retrieval plus cached and
crawled context. Stale content persists in those caches far longer than it does in
Google's index, and an assistant that describes your work using a clone project you
judged not good enough to keep is actively working against the positioning you rewrote
your résumé and About page to fix.

**Related real bug, same root:** two QA specs still point at the dead route —
[tests/qa/a11y.spec.ts:18](tests/qa/a11y.spec.ts:18) and
[tests/qa/responsive.spec.ts:14](tests/qa/responsive.spec.ts:14) both list
`/projects/netflix-gpt`. `pnpm qa` is auditing a 404. Two-line fix, worth doing.

**What to do:** confirm the URL returns a proper 404 or a 301 to `/projects`, request
removal of the stale cached entry in GSC, and — most importantly — make sure the _live_
description of your work is stated plainly on `/` and `/about`, which is what fresh
crawls will pick up.

---

## 3. Entity clarity is the structural problem

For an AI assistant to cite you, it must first resolve _which_ "DevStash" and _which_
"Adesh Shukla" you are. Right now both are ambiguous — this is the single hardest
condition for entity resolution, and you have it on both axes at once.

**"DevStash" is a crowded name.** Live search returns, alongside yours:
`devstash.io` (Developer Knowledge Hub), `devstash.app` (bookmark manager),
`devstash.dev`, `devstash.itsmihir.me`, a Firefox extension named DevStash, a GitHub
repo `bugcacher/devstash`, and a PeerPush listing. An assistant asked "what is DevStash"
has at least seven candidates and no reason to pick yours.

**"Adesh Shukla" is not unique either.** Search surfaces several distinct people,
including a different `github.com/adeshshukla` (yours is `github.com/adeshukla` — one
`sh` apart) and multiple LinkedIn profiles, at least one of which also reads "UI
Developer." One namesake is described as a .NET developer with 10+ years' experience.
An assistant merging those profiles will describe you inaccurately.

**This is fixable without renaming anything.** The lever is _consistent co-occurrence_:
every property you control should state the same triple — name + role + site — in the
same words, so the entity graph has something to converge on.

| Property              | Should say                                            |
| --------------------- | ----------------------------------------------------- |
| GitHub profile bio    | `Frontend developer (React/Next.js) · devstash.me`    |
| GitHub pinned repos   | Each README links devstash.me                         |
| LinkedIn headline     | Same wording as the site H1                           |
| DEV.to / Hashnode bio | Same, with canonical links back                       |
| `llms.txt`            | Already correct ✅                                    |
| `Person` JSON-LD      | Already correct ✅, and should gain `sameAs` — see §4 |

Practical note: consider always writing it as **"DevStash (devstash.me)"** in third-party
bios and cross-posts. The bare word is taken; the domain is not.

---

## 4. Technical audit — what's done, what's missing

**Already correct. Do not redo these:**

- [app/robots.ts](app/robots.ts) allows all user agents — GPTBot, OAI-SearchBot,
  ClaudeBot, PerplexityBot, Google-Extended are all permitted. Only `/api/`, `/_next/`,
  `/admin/` are disallowed, which is right.
- [public/llms.txt](public/llms.txt) exists and is well-formed: author identity, section
  map, and an explicit note that JSON-LD is present and safe to cite. Better than most
  sites have.
- `Person`, `WebSite`, `BlogPosting`, `SoftwareApplication`/`CreativeWork`,
  `BreadcrumbList` schema via [lib/schema/builders.ts](lib/schema/builders.ts).

**Gaps, in priority order:**

1. **No JSON-LD on the `/lab` pages — all 8 of them.** Verified: zero `JsonLd` usage
   anywhere under `app/(lab)/`. These are your most citable pages — a free UTM builder or
   clip-path generator is exactly the kind of thing an assistant recommends — and they
   carry no `SoftwareApplication` markup saying what they are or that they are free.
   This is the highest-value technical fix on the list.

2. **`buildFAQSchema` is written but never called.** It is exported at
   [lib/schema/builders.ts:207](lib/schema/builders.ts:207) and has zero call sites.
   `FAQPage` markup is among the most directly extractable formats for AI answers.
   Your error-fix posts are already Q&A-shaped in substance — they just do not declare it.

3. **No JSON-LD on `/services`, `/uses`, or `/lab`.** Confirmed zero `JsonLd` in all
   three. `/services` in particular should carry `Person` + `offers`.

4. **No `dateModified` freshness signal on non-blog pages.** Retrieval systems favour
   recently-updated pages; blog posts have `updatedAt`, static pages have nothing.

**Checked and already correct — `Person.sameAs`:**
[lib/schema/builders.ts:38](lib/schema/builders.ts:38) already emits
`sameAs: [github, linkedin, x]`, alongside `jobTitle` and a full `PostalAddress`. That is
the machine-readable "these profiles are one person" statement, and it is the right fix
for §3 — it is simply already done. The remaining §3 work is therefore entirely off-site:
the _profiles themselves_ have to corroborate what the schema claims. `sameAs` pointing at
a GitHub bio that says nothing about DevStash asserts a link the destination does not
confirm.

---

## 5. Prompt targets — where citation is realistic

Reframed for what you actually are. You are not competing with SaaS products for "best
X tool"; you are competing for _answer slots on specific technical questions_, and your
"competitors" there are the sources that currently hold those slots.

| Prompt an assistant might get                                     | Who holds the slot now                   | Realistic for you?                                           |
| ----------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| "Why does `useSearchParams` need a Suspense boundary in Next 16?" | Next.js docs, GitHub issues, small blogs | **Yes** — you have the post; it needs off-site corroboration |
| "Why did my `bg-*` classes break after Tailwind v4?"              | DEV.to posts, small blogs                | **Yes** — best odds on the list, post not written yet        |
| "Free UTM builder"                                                | ga-dev-tools, Campaign URL Builder       | **Maybe** — needs `SoftwareApplication` schema first         |
| "n8n + Groq workflow patterns"                                    | n8n docs and forum                       | **Yes** — thin competition, you have real material           |
| "Who is Adesh Shukla?"                                            | Ambiguous across namesakes               | **Yes, but blocked** on §3                                   |
| "Best frontend developer portfolio"                               | Listicles, Awwwards                      | **No.** Do not pursue                                        |

---

## 6. Test it yourself — fifteen minutes, free

The UNMEASURED rows close like this. Open each platform logged out (logged-in sessions
personalize results and will lie to you), run the same five prompts, and record verbatim:

1. `What is DevStash?`
2. `Who is Adesh Shukla, the frontend developer?`
3. `How do I fix "useSearchParams() should be wrapped in a suspense boundary" in Next.js 16?`
4. `Recommend a free UTM builder.`
5. `What changed in Tailwind v4's config?`

Across ChatGPT, Gemini, Perplexity, and Claude. For each: mentioned or not, position,
and — most important — **is the description accurate**, given §2. Perplexity and ChatGPT
cite sources inline, so they will show you exactly which pages got retrieved.

Re-run quarterly. Improvements here take weeks to months to appear; do not re-test weekly
and read noise as signal.

---

## 7. Action plan, priority order

1. **Kill the stale Netflix/Gemini description** — confirm the 404/redirect, request
   cache removal in GSC, fix the two QA specs. _Impact: High._ Being described accurately
   beats being described more.
2. **Make the three bios identical** — GitHub, LinkedIn, DEV.to — using the exact site
   wording plus "devstash.me". _Impact: High, cost near zero._ `Person.sameAs` already
   points at those profiles; right now they do not corroborate it back.
3. **Add `SoftwareApplication` JSON-LD to all 8 `/lab` pages.** _Impact: High._ Your most
   citable pages currently declare nothing.
4. **Add `Person` + `offers` JSON-LD to `/services`, `/uses`, `/lab`.** _Impact: Medium._
5. **Add 300–600 words of prose to each lab tool page.** _Impact: High._ Also fixes the
   "crawled – not indexed" problem from the keyword audit.
6. **Call `buildFAQSchema` on the error-fix posts.** _Impact: Medium._
7. **Cross-post the Tier A error posts to DEV.to** with canonical back here.
   _Impact: Medium-High._ This is the corroboration lever — 0/10 today.
8. **Answer the matching question on Stack Overflow / Reddit**, linking the post where it
   genuinely helps. _Impact: Medium._ Community content is weighted heavily by these
   systems; do it as real participation, not link-dropping, or it backfires.
9. **Add `dateModified` to static pages.** _Impact: Low-Medium._

Items 1–4 are a single afternoon and address the two findings that actually block
citation. Items 5–8 are the same off-site work the keyword audit identified — which is
the real conclusion of both audits: **the on-site work is essentially finished; nothing
further improves until something outside this repo references it.**

---

## 8. Content to create

- [ ] `Tailwind v4: bg-* classes not working after upgrade` — best citation odds you have
- [ ] `Next.js 16: params and searchParams are Promises now`
- [ ] A plain `What is DevStash?` block on `/about` — literal, factual, disambiguating
      against the other DevStash products by name
- [ ] FAQ blocks (with `FAQPage` schema) on the three error-fix posts
- [ ] Lab tool page prose, ×8

Cross-reference: [docs/seo-keyword-map.md](docs/seo-keyword-map.md) — same off-site
bottleneck, different surface.
