import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { callGroq, callWithFallback, hasAnyProviderConfigured, GroqCallError } from '@/lib/ai/groq'
import { AI_TELL_PHRASES, countAiTellPhrases } from '@/lib/ai/aiTellPhrases'
import { countHumanInputMarkers } from '@/lib/ai/humanInputMarkers'
import {
  renderArticleHtml,
  CONTACT_FORM_HTML,
  CONTACT_FORM_CSS,
  CONTACT_FORM_JS,
} from '@/lib/ai/landingPageParts'
import {
  THEME_CSS,
  LAYOUT_CSS,
  REVEAL_SAFE_CSS,
  THEME_TOGGLE_JS,
  HERO_VISUAL_CSS,
  HERO_VISUAL_HTML,
} from '@/lib/ai/landingPageChrome'
import { buildContentSections, CONTENT_SECTIONS_CSS } from '@/lib/ai/contentSections'
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

// Groq reserves prompt + max_tokens against the per-minute ceiling, and an
// UNSET max_tokens reserves the model default (~2048). Three text steps at the
// default therefore reserve ~8.2k against an 8k limit and the run 429s partway
// through — which is the intermittent "pipeline failed to complete" users hit.
// Sizing each step to what it actually needs (reasoning is pinned low, so
// these are close to the visible output) brings the run to well under half the
// budget and leaves room for the 120b page step on its own separate quota.
function textStepBudget(targetLengthWords: number) {
  // ~1.4 tokens per word, doubled for headroom, clamped to something sane.
  return Math.min(2200, Math.max(700, Math.round(targetLengthWords * 2.4)))
}

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

const ARTICLE_SECTION_CSS = `
  .article-section { padding: clamp(4rem,10vw,7rem) 1.5rem; }
  .article-inner { max-width: 720px; margin: 0 auto; }
  .article-inner h2 { margin: 2.5rem 0 .75rem; }
  .article-inner h3, .article-inner h4 { margin: 2rem 0 .5rem; }
  .article-inner p, .article-inner li { color: var(--muted); line-height: 1.8; }
  .article-inner p { margin: 0 0 1.1rem; }
  .article-inner ul, .article-inner ol { margin: 0 0 1.4rem; padding-left: 1.25rem; }
  .article-inner li { margin-bottom: .5rem; }
  .article-inner strong { color: var(--text); }
  .article-inner code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em;
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 5px; padding: .1em .35em;
  }
  .article-inner pre {
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: 12px; padding: 1rem; overflow-x: auto; margin: 0 0 1.4rem;
  }
  .article-inner pre code { background: none; border: 0; padding: 0; }
  .article-inner .table-wrap { overflow-x: auto; margin: 0 0 1.4rem; }
  .article-inner table { width: 100%; border-collapse: collapse; font-size: .925rem; }
  .article-inner th, .article-inner td {
    text-align: left; padding: .6rem .75rem; border-bottom: 1px solid var(--border);
  }
  .article-inner th { color: var(--text); font-weight: 600; background: var(--surface-2); }
  .article-inner td { color: var(--muted); }`

/**
 * Everything the page must contain regardless of what the model returned.
 *
 * The model is asked for these too, but asking is not the same as having: the
 * article body is injected verbatim from the pipeline's own output so all ~600-900
 * generated words actually reach the page instead of being summarised into three
 * cards, and the form ships hand-written so its validation behaves identically
 * on every run.
 */
function injectRuntimeGuards(html: string, articleMarkdown: string): string {
  // Order matters: theme tokens first, then layout, then the reveal override,
  // then section styles. This block is injected last in <head> so it wins on
  // equal specificity against whatever the model wrote.
  const injectedCss = `
<style>
${THEME_CSS}
${LAYOUT_CSS}
${REVEAL_SAFE_CSS}
${HERO_VISUAL_CSS}
${ARTICLE_SECTION_CSS}
${CONTENT_SECTIONS_CSS}
${CONTACT_FORM_CSS}
</style>`

  let out = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${SCROLL_GUARD_CSS}${injectedCss}\n</head>`)
    : /<body[^>]*>/i.test(html)
      ? html.replace(/(<body[^>]*>)/i, `$1${SCROLL_GUARD_CSS}${injectedCss}`)
      : html + SCROLL_GUARD_CSS + injectedCss

  // Without this meta the browser lays out at ~980px and then zooms the whole
  // page down to fit, which reads as "responsive" in a screenshot but is
  // actually just tiny and unreadable on a phone. Force it rather than trust
  // the model to have written it.
  if (!/<meta[^>]+name=["']viewport["']/i.test(out)) {
    const viewport = '\n<meta name="viewport" content="width=device-width, initial-scale=1">'
    out = /<head[^>]*>/i.test(out)
      ? out.replace(/(<head[^>]*>)/i, `$1${viewport}`)
      : `${viewport}\n${out}`
  }

  // Footer credits the brand, not the person.
  out = out.replace(/<footer\b[\s\S]*?<\/footer>/i, () => {
    const year = new Date().getFullYear()
    return `<footer class="ds-footer"><p>© ${year} DevStash. All rights reserved.</p></footer>`
  })

  // Hero visual: the model is told to leave a marker for it rather than build
  // its own showpiece, which previously ate a full screen of height. If the
  // marker is missing, drop it in after the first section so the hero still
  // gets its graphic.
  if (out.includes('<!--DS_HERO_VISUAL-->')) {
    out = out.replace('<!--DS_HERO_VISUAL-->', HERO_VISUAL_HTML)
  } else if (/<\/section>/i.test(out)) {
    out = out.replace(/<\/section>/i, `${HERO_VISUAL_HTML}\n</section>`)
  }

  // Article + form go before the footer when there is one, so the footer stays
  // last; otherwise append to the end of body.
  const contentSections = buildContentSections(articleMarkdown)

  // Reading order matters: hero -> the model's feature cards -> the real
  // content -> the model's closing CTA band -> the form. Appending everything
  // before the footer put the closing "ready to start?" band ahead of the
  // content it is supposed to close, so the content goes before the LAST
  // section the model wrote instead.
  const lastSection = out.lastIndexOf('<section')
  if (contentSections && lastSection > -1) {
    out = out.slice(0, lastSection) + contentSections + '\n' + out.slice(lastSection)
  } else if (contentSections) {
    out = /<footer[\s>]/i.test(out)
      ? out.replace(/(<footer[\s>])/i, `${contentSections}\n$1`)
      : out.replace(/<\/body>/i, `${contentSections}\n</body>`)
  }

  // The form always sits last, immediately before the footer.
  if (/<footer[\s>]/i.test(out)) {
    out = out.replace(/(<footer[\s>])/i, `${CONTACT_FORM_HTML}\n$1`)
  } else if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${CONTACT_FORM_HTML}\n</body>`)
  } else {
    out += CONTACT_FORM_HTML
  }

  // Every call to action points at the form. The prompt says so, but a
  // generated href="#" or a link to a page that doesn't exist is a dead end,
  // so this rewrites them rather than trusting it. Anything already aimed at a
  // real in-page anchor or an external URL is left alone.
  out = out.replace(
    /<a\b([^>]*?)href="([^"]*)"([^>]*)>/gi,
    (match, pre: string, href: string, post: string) => {
      const attrs = `${pre}${post}`
      const looksLikeCta = /class="[^"]*\bbtn|cta\b/i.test(attrs)
      const isDeadEnd = href === '#' || href === '' || href === 'javascript:void(0)'
      if (!looksLikeCta && !isDeadEnd) return match
      if (/^(https?:|mailto:|tel:)/i.test(href)) return match
      if (href.startsWith('#') && href !== '#') return match
      return `<a${pre}href="#contact"${post}>`
    }
  )

  // The reveal failsafe is gone: REVEAL_SAFE_CSS means nothing is ever hidden
  // by opacity, so there is no hidden state left to rescue. The theme toggle
  // script adopts and rebinds whatever control the model produced.
  const tailScripts = `${THEME_TOGGLE_JS}${CONTACT_FORM_JS}`
  out = /<\/body>/i.test(out)
    ? out.replace(/<\/body>/i, `${tailScripts}\n</body>`)
    : out + tailScripts

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
      { ...TEXT_STEP_OPTIONS, jsonMode: true, maxTokens: 500 }
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

      const htmlUserPrompt = `Design and build a single-file HTML LANDING PAGE from the article below.
Not a blog post — a landing page: short, punchy, section-based, centred.

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

## What is added AFTER you finish — do NOT write any of it
A stylesheet defining the full colour palette and every --token, a working
theme toggle, the entrance animation, the full article body, and a contact
form with id="contact" are all appended automatically.
Therefore you MUST NOT write: :root/palette CSS, any @media
prefers-color-scheme block, a theme-toggle script, a .reveal{opacity:0} rule,
the article text, or a form. Use the tokens; never define them.

## NON-NEGOTIABLE
1. Every CTA is <a href="#contact" class="cta">. No other href anywhere.
2. No nav menu, no nav links, no hamburger.
3. No <img>, no background-image:url(), no image URL of any kind.
4. No fixed height on html or body.
5. Never print a "[TODO: ...]" marker.
6. Put <!--DS_HERO_VISUAL--> immediately after the hero CTA — an animated SVG
   is injected there. Do NOT build your own large graphic, panel or showpiece.

## Required shell — use these exact class names
<header class="ds-header">
  <span class="ds-mark">1-3 word product-style name you derive from TITLE — never the words "SHORT WORDMARK"</span>
  <button class="ds-toggle" type="button"></button>
</header>
...sections...
<footer class="ds-footer">one short line</footer>
The toggle's contents and behaviour are injected — leave the button empty.

## Sections, in order
1. Hero, centred, inside <div class="ds-narrow">: a mono uppercase eyebrow
   showing CATEGORY, then h1 = TITLE verbatim, then DESCRIPTION verbatim as a
   muted lead, then tag chips + reading time, then ONE <a href="#contact"
   class="cta">CTA named for this subject</a>, then <!--DS_HERO_VISUAL-->.
   Behind the hero put ONE soft blob: position:absolute, z-index:-1,
   width:min(420px,70vw), aspect-ratio:1, border-radius:50%,
   background:radial-gradient(circle,var(--accent),transparent 70%),
   filter:blur(80px), opacity:.14, pointer-events:none.
2. A 3-card grid inside <div class="ds-wrap">, one column under 720px. Each
   card comes from a REAL point in ARTICLE: h3 heading of 2-5 words, then 1-2
   sentences of its actual substance. Never "Fast"/"Secure"/"Scalable". Each
   card gets a small inline SVG icon (stroke:currentColor, 20x20, no fill) —
   never emoji. Cards: background var(--surface), 1px solid var(--border),
   border-radius 14px, padding 1.5rem; hover translateY(-3px) + border-color
   var(--accent), transitioned.
3. A closing band on var(--surface-2) inside <div class="ds-narrow">, centred:
   an h2 naming this subject and one <a href="#contact" class="cta">CTA</a>.

## Style
Use ONLY var(--bg), --surface, --surface-2, --border, --text, --muted,
--accent, --accent-2. Never a raw hex, rgb() or hsl().
Eyebrow: font-family ui-monospace; font-size .8rem; letter-spacing .08em;
text-transform uppercase; color var(--accent).
.cta: inline-block; background var(--accent); color #fff; padding .8rem 1.5rem;
border-radius 10px; font-weight 600; text-decoration none.
Tag chips: font-size .75rem; padding .25rem .6rem; border-radius 999px;
border 1px solid var(--border); color var(--muted).
Keep total CSS tight — layout, header, footer and responsive basics are all
provided for you.

## Hard rules
- ONE file: one <style> in <head>, one <script> before </body> (or no script
  at all — you need none). Zero network requests.
- Must be unbroken at a 300px viewport: use clamp(), %, grid/flex, and
  min-width:0 on grid/flex children.
- <head> must carry: title=TITLE; meta description=DESCRIPTION; keywords=TAGS;
  author="Adesh Shukla"; robots=index,follow;
  canonical=https://devstash.me/blog/SLUG; og:type=article + og:title/
  og:description/og:url; twitter:card=summary_large_image + twitter:title/
  twitter:description; article:section=CATEGORY + one article:tag per TAG; and
  a JSON-LD BlogPosting (headline, description, keywords, articleSection,
  author Person "Adesh Shukla", mainEntityOfPage=canonical) with no image.
- Semantic landmarks, exactly one h1.
- Output the complete document, <!doctype html> to </html>. Do not
  truncate or abbreviate any section.`

      // Groq rejects the request outright with 413 — not a truncation —
      // when prompt + max_tokens exceeds the 8k-per-minute ceiling. This
      // prompt has grown twice already and each time silently pushed the
      // pipeline over, breaking every run. Derive the cap from the actual
      // prompt so that cannot happen again. ~3.5 chars/token deliberately
      // OVER-estimates the prompt, which errs toward a smaller, safe cap.
      const TPM_CEILING = 8000
      const SAFETY_MARGIN = 500
      const estimatedPromptTokens = Math.ceil((htmlUserPrompt.length + 400) / 3.5)
      const htmlMaxTokens = Math.max(
        2000,
        Math.min(5200, TPM_CEILING - estimatedPromptTokens - SAFETY_MARGIN)
      )

      htmlPageResult = await runStep(
        [
          {
            role: 'system',
            content:
              'You are a senior product designer who codes. You produce single-file HTML landing pages with the polish of a well-funded startup site — considered typography, a real dark palette, generous space, and motion that feels intentional. You never ship a generic centered-text template. Output ONLY the raw HTML — no markdown fences, no commentary.',
          },
          {
            role: 'user',
            content: htmlUserPrompt,
          },
        ],
        {
          modelOverride: 'openai/gpt-oss-120b',
          // Derived, not hard-coded. Groq rejects a request outright with 413
          // when prompt + max_tokens exceeds the per-minute ceiling, and this
          // prompt has grown twice already — each time silently pushing the
          // pipeline over and breaking every run. Computing the ceiling from
          // the actual prompt keeps that impossible.
          maxTokens: htmlMaxTokens,
          temperature: 0.6,
        }
      )
      htmlPage = injectRuntimeGuards(stripCodeFence(htmlPageResult.content), humanizeResult.content)

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

      if (err.status === 401) {
        return NextResponse.json(
          { error: 'That Groq API key was rejected. Double-check it and try again.' },
          { status: 401 }
        )
      }

      // A 429 that survived the retries means the shared free-tier minute
      // budget is genuinely saturated — one full run spends most of it. Say so
      // plainly instead of "failed to complete", which reads as a broken demo
      // and gives the visitor no idea that waiting actually fixes it.
      if (err.status === 429) {
        return NextResponse.json(
          {
            error:
              'The shared free tier is rate limited right now — one run uses most of its per-minute budget. Wait about a minute and try again, or paste your own Groq API key to skip the queue.',
            requiresByok: true,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'The AI pipeline failed to complete. Please try again.' },
        { status: 502 }
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
