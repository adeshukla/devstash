# DevStash Phase 10 — Research-Grounded Content Pipeline (Groq)

> Upgrade to `docs/phase-10-blog-automation.md` §4 prompt.
> Same JSON contract, same `/api/admin/posts` target — this just adds a real
> research step and a QA step so the model can't quietly make things up.
>
> **Scope note:** This applies to the **n8n workflow**, not the public
> `/lab/ai-content-pipeline` demo. The demo intentionally stays lean (3
> runs/day free tier, snappy UX) and does not do web-search grounding — adding
> `groq/compound` + a QA model + retries there would 3–4× its latency and token
> cost per run. Grounding belongs in the n8n publishing pipeline.

---

## 1. Why the current single-call prompt can hallucinate

The existing §4 prompt tells `llama-3.3-70b-versatile` to "choose strong,
currently-trending keywords" and write facts about them — but that model has
**no live web access**. It's working purely off training data, so anything
about a recent version, a stat, a "trending" claim, or "as of 2026" is a guess
dressed up as a fact. One prompt, however well-worded, can't fix that — the
fix is giving the model something real to ground on _before_ it writes.

Good news: Groq has a system built exactly for this — **`groq/compound`**,
which does real web search server-side (Tavily-powered) and returns
`executed_tools` showing what it actually searched and found. That's the
piece to insert as **Node 1**, before your generate node.

Pipeline goes from 1 node to 4:

```
[Trigger] → [Pick topic] → [① Research: groq/compound]
          → [② Generate: llama-3.3-70b-versatile]
          → [③ Fact-check & QA: openai/gpt-oss-120b]
          → [④ Code: parse, validate, strip QA fields]
          → Path A/B publish → Notify
```

Extra Groq calls, but all still inside the free tier — no Claude Sonnet
needed for this part (fits the Groq-first / Ollama / Sonnet-only-for-final-review
routing).

---

## 2. Node ① — Research (`groq/compound`)

**Settings:** model `groq/compound` (use `groq/compound-mini` for simple/narrow
topics — 3x lower latency, one search instead of many), `temperature: 0.2`.

Optionally set `compound_custom.tools.enabled_tools: ["web_search"]` and use
`search_settings` to exclude known content-farm/SEO-spam domains, or include
official docs domains when you know the category (e.g. bias toward
`nextjs.org`, `developer.mozilla.org`, `github.com` for `frontend`/`devtools`
posts). Confirm the exact `search_settings` field names against
`console.groq.com/docs/tool-use/built-in-tools/web-search` since Groq has
changed this API before.

**System prompt:**

```
You are a fact-gathering research assistant for a technical blog (DevStash,
devstash.me). You do NOT write blog content. Your only job is to use web
search to collect current, verifiable facts about the given topic, each tied
to a real source you found. If you are not confident a fact is correct and
sourced, do not include it. Never invent statistics, version numbers, dates,
quotes, or sources. If search turns up nothing solid, say so plainly instead
of guessing.
```

**User prompt:**

```
TOPIC: {{ $json.topic }}
CATEGORY: {{ $json.category }}
KEYWORDS (optional, use if given, else find good ones yourself): {{ $json.keywords }}

Search the web and gather:
1. 5-8 concrete, current facts relevant to this topic (version numbers,
   release dates, benchmarks, official statements, common gotchas, adoption
   info). Each fact must trace to a specific source you actually found.
2. Anything that changed in the last 6-12 months that a writer should know,
   since a non-search model's training data may be stale.
3. Any sources that disagree with each other — do not silently pick one.
4. 1-3 candidate external links worth citing (prefer official docs, maintainer
   blogs, or established engineering blogs over SEO content farms).
5. If the topic is too vague, too niche, or results are thin/unreliable, set
   "sufficient_research" to false and explain the gap in "notes_for_writer" —
   do not pad with guesses.

Return ONLY this JSON object, nothing else:
{
  "sufficient_research": true or false,
  "facts": [
    { "claim": "one sentence, specific", "source_name": "...", "source_url": "...", "date_or_recency": "..." }
  ],
  "conflicts": ["describe any conflicting info found"],
  "suggested_external_links": [{ "url": "...", "why": "..." }],
  "notes_for_writer": "anything the writer should know, including gaps"
}
```

---

## 3. Node ② — Generate (upgrade of your existing node)

Same model (`llama-3.3-70b-versatile`), same output contract you already have
(`title/slug/description/category/tags/featuredImage/readingTime/draft/body`)
— plus two new fields for internal QA that **you strip before POSTing to
`/api/admin/posts`** (that endpoint doesn't expect them).

**System prompt (extends yours):**

```
You generate blog posts for DevStash (devstash.me), Adesh Shukla's developer
site. Voice: first person, practical, opinionated, no corporate fluff. Writing
for experienced developers, not beginners.

You will be given verified research facts. These are your ONLY source of
truth for any factual claim, statistic, version number, or date you state as
fact. If something isn't in the research and isn't stable, common knowledge
(e.g. "React is a JS library"), do not assert it — omit it, phrase it as your
own opinion/experience, or write around it.

You ALWAYS return a single valid JSON object and nothing else.
```

**User prompt:**

```
TOPIC: {{ $json.topic }}
CATEGORY: {{ $json.category }}

RESEARCH (your only source of truth for anything factual):
{{ $json.research_json }}

If research_json.sufficient_research is false: do not invent facts to
compensate. Lean on general, stable, well-established knowledge and favor
first-person experience/opinion over specific claims. Set "low_confidence":
true in your output.

Return ONLY a JSON object with these keys:
- title, slug, description, category, tags, featuredImage: "", readingTime, draft: true
- low_confidence: true/false   (true only if research was insufficient)
- sources_used: array of source_url strings you actually referenced
- body: MDX content, no frontmatter, starts at "##"

BODY rules (unchanged from your existing prompt):
- No H1. Start sections at "##", sub-sections at "###". Never skip levels.
- Markdown + GFM only. NO import/export, NO live React/JS, NO <script>, NO raw HTML.
- Fenced code blocks with a language hint. Code is displayed, not executed.
- <Callout type="tip|info|warning|danger" title="Optional"> allowed (blank line before/after).
- Images: ![alt](/images/blog/<slug>-1.webp), local paths only, 1-3 placeholders.
- 1000-2000 words. Primary + long-tail keywords in title, first 100 words, one
  ## heading, and description. No keyword stuffing.
- 1-3 internal links (/blog, /projects, /about).
- 1-3 external links — ONLY from suggested_external_links or facts' source_url
  values. Never invent a URL.

FACTUAL GROUNDING rules (new):
- Every specific number, version, date, or named claim must trace to RESEARCH,
  or be phrased as opinion/experience ("in my experience...", "I'd guess...").
- Don't cite a URL that isn't in RESEARCH.
- If unsure a detail is accurate, leave it out rather than guess.

HUMANIZE (expanded from your existing list):
- Vary sentence length hard — mix short (4-8 word) and long (25-35 word)
  sentences in the same paragraph. Avoid uniform rhythm.
- First person, specific: real versions, filenames, error messages, numbers,
  a mistake or tradeoff you actually hit.
- Avoid: "in today's fast-paced world", "it is important to note", "moreover",
  "furthermore", "delve", "leverage", "robust", "seamless", "unleash", "in the
  realm of", "unlock the power of", "not only... but also", "whether you're a
  beginner or an expert".
- Avoid perfectly symmetric bullet lists (every bullet the same length/shape)
  and stacking 3+ transition words in a row.
- Max 1-2 em-dashes per section. Use contractions naturally.
- Open with a real problem/scenario, not a dictionary definition. End with a
  concrete takeaway, not "In conclusion".
- The occasional fragment or rhetorical question is fine — don't overuse either.

Output: a single JSON object. No markdown fences, no commentary.
```

> The `lib/ai/aiTellPhrases.ts` list in this repo mirrors the "Avoid:" line
> above so the live demo's humanize pass and its before/after AI-tell metric
> stay in sync with this spec. Keep the two lists aligned when either changes.

---

## 4. Node ③ — Fact-check & QA (`openai/gpt-oss-120b`)

New node. `temperature: 0.1`. This is what "keeps checking until it's right"
in practice — it doesn't rewrite anything, it flags problems so the retry
logic (or you, in review) can fix them fast.

**System prompt:**

```
You are a strict fact-checker and editor for a technical blog. You compare a
draft article against a list of verified research facts and flag anything
that looks invented, unsupported, or still reads as generic AI writing. You
do not rewrite the post — you flag specific issues.
```

**User prompt:**

```
RESEARCH FACTS:
{{ $json.research_json.facts }}

DRAFT BODY:
{{ $json.body }}

Return ONLY this JSON:
{
  "unsupported_claims": ["exact sentence making a factual claim not backed by RESEARCH FACTS or common stable knowledge"],
  "ai_pattern_flags": ["exact sentence/phrase that still reads as generic/robotic AI writing"],
  "broken_link_risk": ["any external link URL in the draft not in RESEARCH FACTS or suggested_external_links"],
  "word_count": <integer>,
  "passes_qa": true or false
}
```

**Retry logic (Code node, cap at 2 retries):** if `passes_qa` is false, re-call
Node ② with the flags appended as `FIX THESE ISSUES: {{ qa_json }}`. After 2
failed attempts, stop retrying and just attach the QA report to the
notification — cheaper than an infinite loop, and `draft: true` means nothing
goes live unreviewed anyway.

---

## 5. Node ④ — Code: parse, validate, strip

Everything you already have (JSON-parse with fence-stripping, slug kebab-case,
tags 2-5, category enum, description ≤160 chars, `draft: true`), plus:

```js
// Strip internal-only fields before POSTing to /api/admin/posts
const { low_confidence, sources_used, ...payload } = post

// word count guard
if (payload.body.split(/\s+/).length < 800) {
  // flag for "needs expansion" — don't auto-publish thin content
}

// banned-word regex as a cheap final safety net, independent of the LLM QA pass
const banned = /\b(delve|leverage|robust|seamless|unleash|in the realm of)\b/i
if (banned.test(payload.body)) {
  /* flag in notification */
}
```

---

## 6. Edge cases — what happens, where it's handled

| Trigger                                          | What happens                                                                                                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sufficient_research: false`                     | Generate node falls back to opinion/experience framing, sets `low_confidence: true` → notification shows "⚠️ low confidence, verify facts manually"                    |
| Conflicting sources found                        | `conflicts[]` populated by research node; generate node is told to hedge/attribute rather than silently pick one                                                       |
| JSON parse failure (fences, truncation, chatter) | Code node strips fences (existing); retry once with "STRICT JSON only, no prose" appended; after 2 failures, notify and stop                                           |
| `category` not in the 7-value enum               | Code node validates against whitelist, maps to nearest or defaults, flags in notification                                                                              |
| Slug collision                                   | Existing 409 handling — regenerate with suffix or re-run title                                                                                                         |
| Word count outside 1000-2000                     | Code node checks length; too short → "expand" follow-up call; too long → trim pass                                                                                     |
| QA flags unsupported claims / AI patterns        | Auto-retry Node ② with fixes (max 2), else flag for manual review                                                                                                      |
| Topic too niche, thin search results             | Same as `sufficient_research: false` path above                                                                                                                        |
| Near-duplicate of an existing post               | Not automatic — check your topic queue Google Sheet before running, or maintain a used-slugs list                                                                      |
| `groq/compound` rate-limited or down             | Wrap in n8n error workflow with retry/backoff; fall back to `groq/compound-mini`, or to a plain `llama-3.3-70b-versatile` call forced into `low_confidence: true` mode |
| Banned filler word slips past the LLM QA         | Regex safety net in Code node (§5)                                                                                                                                     |

---

## 7. On "zero AI-detector-detectable" — a straight answer

No prompt can honestly promise that, and framing this as a guarantee would be
dishonest. Detectors like GPTZero and Originality.ai are known to be
unreliable in both directions — including flagging genuinely human writing as
AI — and they keep retraining, so anything tuned against today's version can
fail against tomorrow's.

What actually works, and is what this pipeline is built around, is making the
content **genuinely specific and grounded** — real facts, real sourced
numbers, real first-person detail a generic model wouldn't invent, varied
rhythm instead of the flat "AI cadence." That's the same thing that makes it
good, trustworthy content for readers and for Google. Passing a detector ends
up being a side effect of that, not something worth optimizing for directly.

---

## 8. Wiring it up — time estimate

| Step                                                           | Time        |
| -------------------------------------------------------------- | ----------- |
| Add Node ① (Research, `groq/compound`)                         | ~10 min     |
| Update Node ② prompt (Generate)                                | ~10 min     |
| Add Node ③ (QA, `gpt-oss-120b`) + retry logic                  | ~20 min     |
| Update Code node (strip fields, word count, banned-word regex) | ~10 min     |
| Test end-to-end on 2-3 real topics                             | ~20 min     |
| **Total first pass**                                           | **~70 min** |

Model routing stays 100% Groq free tier — no Claude Sonnet calls added. If you
want an extra confidence layer before flipping `draft: false`, that's where
the existing "Sonnet for final review only" rule fits — run it manually on
the finished draft, not in the automated loop.

---

_This extends `docs/phase-10-blog-automation.md` §4 rather than replacing its
admin API contract, MDX rules, or JSON shape._
