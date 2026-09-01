import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { callGroq, callWithFallback, hasAnyProviderConfigured, GroqCallError } from '@/lib/ai/groq'
import { AI_TELL_PHRASES, countAiTellPhrases } from '@/lib/ai/aiTellPhrases'
import { countHumanInputMarkers } from '@/lib/ai/humanInputMarkers'
import { BLOG_CATEGORIES } from '@/types/blog'
import type { PipelineMetrics, DemoFrontmatter } from '@/types/aiPipeline'

// ─── Config ─────────────────────────────────────────────────────────────────

const RUN_CAP_COOKIE = 'devstash_ai_pipeline_runs'
const DAILY_CAP = 3
const CATEGORY_VALUES = BLOG_CATEGORIES.map((c) => c.value) as [string, ...string[]]

// The three text steps run on a gpt-oss reasoning model, where hidden
// reasoning tokens are billed against the same completion budget as the
// answer. At default effort the copy-edit step was spending its whole
// ~2048-token default cap thinking and returning a 95-character fragment —
// which then starved every downstream step, including the HTML page, of
// content. These are mechanical transforms, not problems needing
// deliberation, so reasoning is pinned low. Leaving max_tokens unset keeps
// all three inside the shared per-model tokens-per-minute budget.
const TEXT_STEP_OPTIONS = { reasoningEffort: 'low' } as const

// ─── Zod schemas ────────────────────────────────────────────────────────────

const PipelineRequestSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, 'Topic must be at least 3 characters.')
    .max(200, 'Topic is too long.'),
  keywords: z.array(z.string().trim().min(1).max(40)).max(8, 'Use at most 8 keywords.').default([]),
  tone: z.enum(['technical', 'conversational', 'tutorial']),
  targetLength: z
    .number()
    .int()
    .min(150, 'Minimum 150 words.')
    .max(1200, 'Maximum 1200 words for this demo.'),
  userApiKey: z.string().trim().min(20).max(200).optional(),
  generateHtmlPage: z.boolean().optional().default(false),
})

const FrontmatterFromLlmSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z.string().min(3).max(100),
  description: z.string().min(10).max(300),
  category: z.enum(CATEGORY_VALUES),
  tags: z.array(z.string()).max(10),
  readingTime: z.number().int().min(1).max(60),
})

// ─── Run-cap cookie helpers ─────────────────────────────────────────────────

interface RunCounter {
  date: string // 'YYYY-MM-DD'
  count: number
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

async function readRunCounter(): Promise<RunCounter> {
  const store = await cookies()
  const raw = store.get(RUN_CAP_COOKIE)?.value
  if (!raw) return { date: todayKey(), count: 0 }
  try {
    const parsed = JSON.parse(raw) as RunCounter
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 }
    return parsed
  } catch {
    return { date: todayKey(), count: 0 }
  }
}

async function writeRunCounter(counter: RunCounter): Promise<void> {
  const store = await cookies()
  store.set(RUN_CAP_COOKIE, JSON.stringify(counter), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
}

// ─── Fallback frontmatter (used if the LLM's JSON step doesn't validate) ────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function fallbackFrontmatter(
  topic: string,
  humanized: string,
  keywords: string[]
): DemoFrontmatter {
  const wordCount = humanized.trim().split(/\s+/).filter(Boolean).length
  return {
    title: topic.slice(0, 100),
    slug: slugify(topic) || 'untitled-post',
    description: humanized.trim().slice(0, 155),
    category: 'ai-workflows',
    tags: keywords.slice(0, 6),
    readingTime: Math.max(1, Math.ceil(wordCount / 200)),
  }
}

// Models asked for "output only HTML" still sometimes wrap it in a ```html
// fence despite instructions — same defensive-parse posture as the JSON step.
function stripCodeFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

// A generation that pins html/body to height:100% (or 100vh) alongside an
// overflow rule clamps the scroll container to a single viewport — the page
// renders but everything below the hero is unreachable, which reads as "it
// only generated a hero". The prompt forbids it, but this class of breakage
// is severe enough to guarantee rather than request: a last stylesheet wins
// on equal specificity, and !important beats whatever the model wrote.
const SCROLL_GUARD_CSS = `
<style>
  /* injected: guarantees the document can always scroll vertically */
  html, body { height: auto !important; max-height: none !important; overflow-y: visible !important; }
  /* injected: if scripting is unavailable, never leave reveal content hidden */
  @media (scripting: none) {
    [class*="reveal"], [class*="fade"], [class*="animate"] { opacity: 1 !important; transform: none !important; }
  }
</style>`

// Scroll-reveal patterns start content at opacity:0 and depend on an
// IntersectionObserver to show it. When that observer never runs — a throttled
// background tab, a sandboxed preview frame, any JS error earlier on the page —
// every section below the hero stays invisible forever and the page reads as
// "it only generated a hero". The prompt now asks for a .js-gated fallback, but
// this failsafe guarantees it: anything still hidden after 1.5s gets shown.
const REVEAL_FAILSAFE_JS = `
<script>
  (function () {
    setTimeout(function () {
      var sel = '[class*="reveal"],[class*="fade"],[class*="animate"]'
      document.querySelectorAll(sel).forEach(function (el) {
        if (parseFloat(getComputedStyle(el).opacity) < 0.05) {
          el.style.setProperty('opacity', '1', 'important')
          el.style.setProperty('transform', 'none', 'important')
        }
      })
    }, 1500)
  })()
</script>`

function injectRuntimeGuards(html: string): string {
  let out = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${SCROLL_GUARD_CSS}\n</head>`)
    : /<body[^>]*>/i.test(html)
      ? html.replace(/(<body[^>]*>)/i, `$1${SCROLL_GUARD_CSS}`)
      : html + SCROLL_GUARD_CSS

  out = /<\/body>/i.test(out)
    ? out.replace(/<\/body>/i, `${REVEAL_FAILSAFE_JS}\n</body>`)
    : out + REVEAL_FAILSAFE_JS

  return out
}

// ─── POST handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  const parsed = PipelineRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { topic, keywords, tone, targetLength, userApiKey, generateHtmlPage } = parsed.data
  const counter = await readRunCounter()

  if (!userApiKey && counter.count >= DAILY_CAP) {
    return NextResponse.json(
      {
        error: "You've used today's free runs. Paste your own Groq API key to keep going.",
        requiresByok: true,
      },
      { status: 409 }
    )
  }

  if (!userApiKey && !hasAnyProviderConfigured()) {
    // Server has no provider configured and the visitor didn't supply a key —
    // same signal as the cap being hit, since the free tier is unavailable.
    return NextResponse.json(
      { error: 'This demo needs a Groq API key. Paste your own to try it.', requiresByok: true },
      { status: 409 }
    )
  }

  // BYOK always targets Groq directly with the visitor's key; the free tier
  // tries each configured provider in order, falling back automatically.
  const runStep = (
    messages: Parameters<typeof callGroq>[1],
    options?: Parameters<typeof callGroq>[2]
  ) => (userApiKey ? callGroq(userApiKey, messages, options) : callWithFallback(messages, options))

  try {
    // ── Step 1: scaffold (honest first draft) ──
    // NOT a "write the whole post" pass. An 8B model asked to "use real code
    // examples" will happily hallucinate code that doesn't run and invent
    // metrics/anecdotes — which reads as AI AND is dishonest (violates the
    // project's no-hallucination rule). So the scaffold writes only what it can
    // be correct about (accurate concept prose + standard, verifiable code) and
    // leaves [TODO: ...] placeholders wherever the post needs the author's real,
    // first-hand substance. The human fills those in before publishing.
    const draftResult = await runStep(
      [
        {
          role: 'system',
          content:
            'You are a technical writer producing an honest first-draft scaffold of a blog post for developers. You never fabricate code, benchmarks, metrics, results, opinions, or personal experience.',
        },
        {
          role: 'user',
          content: `Write a first-draft scaffold of a technical blog post for developers about "${topic}".
Target keywords to include naturally: ${keywords.join(', ') || 'none specified'}.
Tone: ${tone}.
Target length: approximately ${targetLength} words.

Rules:
- Explain the real concepts accurately. General, verifiable technical knowledge is welcome and should be genuinely useful — not filler.
- Include a code example only when it is short, standard, and you are confident it is correct and runnable exactly as written (e.g. documented usage of a well-known library, or a basic language feature). Keep snippets minimal and idiomatic.
- NEVER invent code that depends on the author's own project, private APIs, results, or setup, and never write code you are not sure runs. Where a real example from the author's own work would be more valuable, insert a placeholder on its own line instead: [TODO: your real, tested code — what it should show].
- NEVER fabricate performance numbers, benchmarks, metrics, personal anecdotes, opinions, or results. Insert a placeholder instead: [TODO: the real number / experience needed].
- Use [TODO: ...] placeholders wherever the post would be stronger with the author's first-hand substance. An honest placeholder is always better than an invented fact.
- No generic filler intros or outros, no empty hedging.

Output plain text only. No markdown frontmatter, no JSON.`,
        },
      ],
      TEXT_STEP_OPTIONS
    )

    // ── Step 2: de-cliché copy-edit ──
    // NOT a "pretend to be a person" pass. It strips AI-writing tics and tightens
    // rhythm WITHOUT inventing opinions, anecdotes, or first-hand experience —
    // fabricated voice both reads as fake and still trips AI detectors, and it
    // would violate the project's no-hallucination rule. Genuine voice is added
    // by a human editing step afterwards, not manufactured here.
    const humanizeResult = await runStep(
      [
        {
          role: 'system',
          content:
            'You are a copy-editor that removes AI-writing tics from technical content without changing its meaning or inventing anything new.',
        },
        {
          role: 'user',
          content: `Edit the following draft so it reads less like AI-generated text. Do only these things:
- Remove or plainly replace these cliché phrases: ${AI_TELL_PHRASES.join(', ')}.
- Cut filler intros/outros and empty hedging (e.g. "only time will tell", "in this article we will", "in today's world").
- Vary sentence length and rhythm so the prose isn't uniformly even.
- Tighten wordy or redundant phrasing.
Do NOT invent opinions, personal anecdotes, first-hand experience, frustration, humor, metrics, or any fact that is not already in the draft — fabricated voice reads as fake and is dishonest.
Preserve every [TODO: ...] placeholder EXACTLY as written — never remove, rephrase, fill in, or comment on them. They mark where the author will add real content.
Keep every code example intact and technically accurate, and preserve all real information. Do not shorten the post materially.
Output plain text only.

Draft:
"""
${draftResult.content}
"""`,
        },
      ],
      TEXT_STEP_OPTIONS
    )

    // ── Step 3: SEO frontmatter JSON (with deterministic fallback) ──
    const frontmatterResult = await runStep(
      [
        {
          role: 'system',
          content: 'You output only valid JSON, no markdown code fences, no commentary.',
        },
        {
          role: 'user',
          content: `Generate SEO frontmatter for the blog post below.
Return ONLY a JSON object with exactly these keys: title, slug, description, category, tags, readingTime.
- slug: lowercase kebab-case, no special characters
- description: 130-160 characters
- category: one of ${CATEGORY_VALUES.join(', ')}
- tags: array of 3-6 lowercase strings
- readingTime: integer estimate at 200 words per minute
Ignore any [TODO: ...] placeholders in the post — never include their text in any field.

Post:
"""
${humanizeResult.content}
"""`,
        },
      ],
      { ...TEXT_STEP_OPTIONS, jsonMode: true }
    )

    let frontmatter: DemoFrontmatter
    try {
      const parsedJson = JSON.parse(frontmatterResult.content)
      const validated = FrontmatterFromLlmSchema.safeParse(parsedJson)
      frontmatter = validated.success
        ? validated.data
        : fallbackFrontmatter(topic, humanizeResult.content, keywords)
    } catch {
      frontmatter = fallbackFrontmatter(topic, humanizeResult.content, keywords)
    }

    // ── Step 4 (opt-in only): standalone HTML landing page ──
    // Gated behind generateHtmlPage, which the UI only sets when the visitor
    // has explicitly checked a consent checkbox — this step is a heavier,
    // separate LLM call with its own token cost, not something that runs by
    // default just because a topic was submitted.
    let htmlPage: string | null = null
    let htmlPageResult: Awaited<ReturnType<typeof runStep>> | null = null
    if (generateHtmlPage) {
      // Groq's free tier caps at 8k tokens/minute counting the prompt, so the
      // article can't be pasted in whole — a 1200-word post would eat the
      // budget the page itself needs to be written. The landing page only
      // needs the argument's shape, not every sentence. Cut on a paragraph
      // break so a card is never sourced from a half-sentence.
      const ARTICLE_EXCERPT_LIMIT = 1500
      const rawArticle = humanizeResult.content.trim()
      let articleExcerpt = rawArticle
      if (rawArticle.length > ARTICLE_EXCERPT_LIMIT) {
        const cut = rawArticle.slice(0, ARTICLE_EXCERPT_LIMIT)
        const lastBreak = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '))
        articleExcerpt = (
          lastBreak > ARTICLE_EXCERPT_LIMIT * 0.5 ? cut.slice(0, lastBreak) : cut
        ).trim()
      }

      htmlPageResult = await runStep(
        [
          {
            role: 'system',
            content:
              'You are a senior product designer who codes. You produce single-file HTML landing pages with the polish of a well-funded startup site — considered typography, a real dark palette, generous space, and motion that feels intentional. You never ship a generic centered-text template. Output ONLY the raw HTML — no markdown fences, no commentary.',
          },
          {
            role: 'user',
            content: `Design and build a single-file HTML landing page from the article below.

TITLE: ${frontmatter.title}
DESCRIPTION: ${frontmatter.description}
SLUG: ${frontmatter.slug}
CATEGORY: ${frontmatter.category}
TAGS: ${frontmatter.tags.join(', ')}
READING TIME: ${frontmatter.readingTime} min
ARTICLE:
"""
${articleExcerpt}
"""

## <head> — emit the frontmatter as real SEO tags

Build the head from the values above, not invented ones:
  <title> = TITLE
  <meta name="description" content="DESCRIPTION">
  <meta name="keywords" content="TAGS">
  <meta name="author" content="Adesh Shukla">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="https://devstash.me/blog/SLUG">
  Open Graph: og:type=article, og:title, og:description, og:url (the canonical)
  Twitter: twitter:card=summary_large_image, twitter:title, twitter:description
  <meta name="article:section" content="CATEGORY"> and one article:tag per TAG
Also emit a JSON-LD <script type="application/ld+json"> BlogPosting with
headline, description, keywords, articleSection, author (Person "Adesh
Shukla") and mainEntityOfPage set to the canonical URL. Omit any image field
entirely rather than pointing it at something that is not an image.

## Use the real content — the most important rule

A reader must be able to tell what the article covers from the page alone.
Generic startup filler is a failure.
- h1 = TITLE verbatim. Hero lead = DESCRIPTION verbatim.
- CATEGORY as a small uppercase eyebrow above the h1; each TAG as a rounded
  chip; READING TIME beside them.
- Every card comes from a REAL point in ARTICLE: heading = that point in 2-5
  words, body = 1-2 sentences of its actual substance. Never generic benefits
  ("Fast", "Secure", "Scalable"). Fewer cards beats invented ones.
- Headings and CTA labels reflect this subject — never "Explore"/"Get Started".
- Never print a "[TODO: ...]" marker from ARTICLE, and never write copy around
  one as if filled in; skip that point and use another.
- Invent NOTHING factual — no testimonials, logos, pricing, or statistics.

## Theme — light AND dark, with a working toggle

Use EXACTLY this three-block structure — the media query MUST be guarded with
:not([data-theme="light"]), or a visitor whose OS is in dark mode can never
switch the page to light and the toggle silently does nothing for them:

  :root { <LIGHT tokens> }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { <DARK tokens> }
  }
  :root[data-theme="dark"] { <DARK tokens> }

That way the system preference drives the first paint, and an explicit choice
wins in BOTH directions. Never give a colour its only definition inside one of
those blocks.
  LIGHT: --bg:#FFFFFF; --surface:#F8FAFC; --surface-2:#F1F5F9;
         --border:#E2E8F0; --text:#0F172A; --muted:#64748B;
  DARK:  --bg:#0B0F19; --surface:#111827; --surface-2:#161F2E;
         --border:#1F2937; --text:#F3F4F6; --muted:#9CA3AF;
  BOTH:  --accent:#3B82F6; --accent-2:#8B5CF6;
Every colour in the page comes from these tokens — never hard-code a stray hex,
including translucent ones. The sticky header must tint itself from a token
(e.g. color-mix(in srgb, var(--bg) 70%, transparent)), NOT a literal
rgba(0,0,0,...). Any colour whose only definition sits inside a
prefers-color-scheme block will not update when the toggle is used — so define
every colour through the tokens above and never re-declare one per media query.
Give body a token background and a colour transition so switching feels smooth.

## Art direction

Type: system-ui stack with a fluid scale — h1 clamp(2.5rem,7vw,4.5rem),
letter-spacing:-.03em, line-height:1.05; h2 clamp(1.75rem,4vw,2.5rem);
body 1rem/1.7. Give the h1 (or a span in it) a background-clip:text gradient
from --accent to --accent-2.
Space: sections padding clamp(4rem,10vw,7rem) 1.5rem; content max-width 1100px,
centred; nothing cramped.
Surfaces: cards use --surface, 1px solid --border, radius 16px, padding
1.5-2rem; on hover translateY(-4px), border-color --accent, soft accent glow.

## Sections — in this order. This is a standalone landing page: NO nav menu,
## no nav links, no hamburger. Nothing should link to a page that doesn't exist.

1. Minimal header: a short wordmark derived from the title on the left, and the
   theme toggle button on the right. No navigation links at all.
   Sticky, translucent via backdrop-filter: blur(12px), bottom border.
2. Hero: category eyebrow, oversized h1, the description as a --muted lead
   (max-width ~60ch), tag chips + reading time, and ONE primary accent CTA
   whose label fits this subject. Behind it 2-3 large blurred radial-gradient
   blobs — width:min(420px,80vw), filter:blur(90px), opacity .15-.25, ONLY
   --accent/--accent-2 hues, position:absolute, z-index:-1, pointer-events:none.
   Never yellow/green/pink.
3. Feature grid: 2-4 cards sourced from ARTICLE per the content rule above, in a
   responsive grid (single column on mobile). Each card gets a small INLINE SVG
   icon (stroke:currentColor, no fill) — never emoji.
4. A wide 16:9 SHOWPIECE — not an empty grey box. Build it from CSS only:
   a --surface-2 panel, rounded corners, --border edge, overflow:hidden,
   containing EXACTLY 3 overlapping radial-gradient blobs in --accent and
   --accent-2. Each blob MUST have filter:blur(60px) and opacity between .35
   and .55, and be smaller than the panel (roughly 45-65% of its width) — the
   effect is soft ambient light pooling behind glass, never one hard-edged
   solid ellipse filling the frame. Each drifts on its own @keyframes at a
   different duration (18s / 24s / 30s, ease-in-out, infinite alternate),
   animating transform translate/scale AND morphing border-radius. Add a faint
   grid or scanline overlay at low opacity for depth. Overlay one short caption
   line drawn from the article. It must read as deliberate art direction — a
   visitor should never think an image failed to load.
5. Closing band on --surface-2: a heading about this subject and one accent CTA.
6. Footer: one --muted line with a top border.

## Interactivity — all three, in one inline script

- Theme toggle: sets data-theme on <html>, swaps its icon and aria-pressed,
  persists the choice to localStorage inside try/catch (it can throw in private
  mode), and restores it on load before first paint where possible. Its sun and
  moon icons are INLINE SVG like every other icon — never the emoji characters
  and never any emoji anywhere on the page. Give it an aria-label.
- IntersectionObserver scroll-reveal, but content MUST NEVER depend on JS to
  become visible. Never write a bare \`.reveal{opacity:0}\`: if the observer
  does not run — throttled tab, sandboxed preview, a JS error — the whole page
  below the hero stays permanently invisible. Put \`<script>document
  .documentElement.classList.add('js')</script>\` as the FIRST thing in <head>,
  then gate the hidden state on it:
    .reveal{opacity:1}
    .js .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
    .js .reveal.revealed{opacity:1;transform:none}
  Reveal at 15% visibility, staggered ~80ms by index.
- Cards respond on hover and keyboard focus.
Wrap all motion in @media (prefers-reduced-motion: reduce) so it is disabled.

## Hard rules

- ONE file: all CSS in one <style> in <head>, all JS in one <script> before
  </body>. Zero network requests — no CDN, no external font, no src on script,
  no remote images.
- Responsive and unbroken down to a 300px viewport. Use clamp(), %, grid/flex,
  and min-width:0 on grid/flex children so long words cannot force overflow.
- NEVER set a fixed height on html or body — no height:100%, no height:100vh,
  no overflow:hidden on both axes. Any of those clamps the scroll container to
  one viewport and makes everything below the hero unreachable. Use
  min-height:100vh at most, and only on body.
- Set overflow-x:hidden on body AND html, and size the decorative blobs with
  min() (e.g. width:min(420px,80vw)) so an absolutely-positioned blob can never
  push a horizontal scrollbar on a narrow screen. Also set
  overflow-wrap:break-word on body so a long unbroken word cannot overflow.
- Never reference an image file: no <img>, no background-image: url(), no real
  or fake image URL, and no invented alt text for a photo that does not exist.
  Every visual is drawn with CSS gradients and inline SVG. If a spot genuinely
  needs a photograph the author must supply, render a small dashed
  "[Image placeholder]" block — but prefer a CSS visual, and never make the
  page's main visual an empty placeholder box.
- Invent NOTHING factual: no testimonials, logos, pricing, company names, or
  statistics that are not in the source content above. If a section would
  normally need one, write a bracketed placeholder instead.
- Semantic landmarks (header/main/section/footer), exactly one h1, and every
  control keyboard-reachable. You MUST include an explicit
  \`:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\` rule —
  a page with no visible focus ring is not acceptable.
- Output the complete document, <!doctype html> through </html>. Do not
  truncate or abbreviate any section.`,
          },
        ],
        {
          // The default 20b model reliably emits a 2010-era template here —
          // white background, centered grey header, clashing blob colours, and
          // a dark-mode toggle as its idea of "interactivity". A page this
          // detailed needs the larger model and real output room; the short
          // text steps above are fine on the cheaper default.
          modelOverride: 'openai/gpt-oss-120b',
          // 8k tokens/minute, prompt included, or the request is rejected
          // outright rather than truncated. Budget: ~1.4k instructions + up to
          // ~0.7k article excerpt leaves comfortably over 5.6k for the page,
          // and a full page measured ~3.2k completion tokens. The cap is
          // per-model, so this is separate from the 20b budget the three text
          // steps above spend.
          maxTokens: 5200,
          temperature: 0.6,
        }
      )
      htmlPage = injectRuntimeGuards(stripCodeFence(htmlPageResult.content))

      // If the model hit the token ceiling mid-document the HTML is cut off
      // mid-tag and renders as a broken fragment. Close it so the preview and
      // the downloaded file are at least valid, rather than handing back
      // something that silently looks finished but isn't.
      const truncated = htmlPageResult.finishReason === 'length' || !/<\/html>\s*$/i.test(htmlPage)
      if (truncated) {
        if (!/<\/body>/i.test(htmlPage)) htmlPage += '\n</body>'
        if (!/<\/html>/i.test(htmlPage)) htmlPage += '\n</html>'
        htmlPage +=
          '\n<!-- NOTE: generation hit the token limit and this document was closed automatically. Re-run to get a complete page. -->'
      }
    }

    const metrics: PipelineMetrics = {
      draft: {
        promptTokens: draftResult.promptTokens,
        completionTokens: draftResult.completionTokens,
        latencyMs: draftResult.latencyMs,
        provider: draftResult.provider,
      },
      humanize: {
        promptTokens: humanizeResult.promptTokens,
        completionTokens: humanizeResult.completionTokens,
        latencyMs: humanizeResult.latencyMs,
        provider: humanizeResult.provider,
      },
      frontmatter: {
        promptTokens: frontmatterResult.promptTokens,
        completionTokens: frontmatterResult.completionTokens,
        latencyMs: frontmatterResult.latencyMs,
        provider: frontmatterResult.provider,
      },
      htmlPage: htmlPageResult
        ? {
            promptTokens: htmlPageResult.promptTokens,
            completionTokens: htmlPageResult.completionTokens,
            latencyMs: htmlPageResult.latencyMs,
            provider: htmlPageResult.provider,
          }
        : null,
      totalLatencyMs:
        draftResult.latencyMs +
        humanizeResult.latencyMs +
        frontmatterResult.latencyMs +
        (htmlPageResult?.latencyMs ?? 0),
      aiTellEval: {
        beforeCount: countAiTellPhrases(draftResult.content),
        afterCount: countAiTellPhrases(humanizeResult.content),
      },
      humanInputMarkers: countHumanInputMarkers(humanizeResult.content),
    }

    let remainingFreeRuns = DAILY_CAP - counter.count
    if (!userApiKey) {
      const nextCount = counter.count + 1
      await writeRunCounter({ date: todayKey(), count: nextCount })
      remainingFreeRuns = Math.max(0, DAILY_CAP - nextCount)
    }

    return NextResponse.json({
      draft: draftResult.content,
      humanized: humanizeResult.content,
      frontmatter,
      htmlPage,
      metrics,
      remainingFreeRuns,
      usedByok: Boolean(userApiKey),
    })
  } catch (err) {
    // Never log the request body or the API key — status/message only.
    if (err instanceof GroqCallError) {
      console.error('[api/ai-pipeline] Groq call failed:', err.status, err.message)
      const status = err.status === 401 ? 401 : 502
      return NextResponse.json(
        {
          error:
            status === 401
              ? 'That Groq API key was rejected. Double-check it and try again.'
              : 'The AI pipeline failed to complete. Please try again.',
        },
        { status }
      )
    }
    console.error(
      '[api/ai-pipeline] Unexpected error:',
      err instanceof Error ? err.message : 'unknown'
    )
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
