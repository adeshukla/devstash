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
    const draftResult = await runStep([
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
    ])

    // ── Step 2: de-cliché copy-edit ──
    // NOT a "pretend to be a person" pass. It strips AI-writing tics and tightens
    // rhythm WITHOUT inventing opinions, anecdotes, or first-hand experience —
    // fabricated voice both reads as fake and still trips AI detectors, and it
    // would violate the project's no-hallucination rule. Genuine voice is added
    // by a human editing step afterwards, not manufactured here.
    const humanizeResult = await runStep([
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
    ])

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
      { jsonMode: true }
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
      htmlPageResult = await runStep(
        [
          {
            role: 'system',
            content:
              'You are a senior product designer who codes. You produce single-file HTML landing pages with the polish of a well-funded startup site — considered typography, a real dark palette, generous space, and motion that feels intentional. You never ship a generic centered-text template. Output ONLY the raw HTML — no markdown fences, no commentary.',
          },
          {
            role: 'user',
            content: `Design and build a single-file HTML landing page for the content below.

Post title: ${frontmatter.title}
Post description: ${frontmatter.description}
Source content — summarize into sections, do not paste verbatim:
"""
${humanizeResult.content}
"""

## Art direction — follow exactly

Dark theme. Put these on :root and use them everywhere; never hard-code a stray colour:
  --bg:#0B0F19; --surface:#111827; --surface-2:#161F2E;
  --border:#1F2937; --text:#F3F4F6; --muted:#9CA3AF;
  --accent:#3B82F6; --accent-2:#8B5CF6;
Body background is --bg. Never a white or light-grey page.

Type: system-ui stack, but set a real fluid scale with clamp() —
h1 clamp(2.5rem,7vw,4.5rem) with letter-spacing:-.03em and line-height:1.05;
h2 clamp(1.75rem,4vw,2.5rem); body 1rem/1.7; muted text uses --muted.
Give the h1 (or a span inside it) a background-clip:text gradient from
--accent to --accent-2.

Space: use a 4/8px rhythm. Sections get padding: clamp(4rem,10vw,7rem) 1.5rem.
Content max-width 1100px, centred. Nothing is cramped.

Surfaces: cards use --surface, 1px solid --border, border-radius 16px,
padding 1.5-2rem. On hover: translateY(-4px), border-color --accent,
and a soft accent glow via box-shadow. Always transition.

## Sections — build all of these, in order

1. Sticky header: small wordmark left, 3-4 nav links right, one accent
   button. background: rgba(11,15,25,.7) + backdrop-filter: blur(12px),
   bottom border. Nav links collapse into a working hamburger under 720px.
2. Hero: oversized h1, a --muted subheading (max-width ~60ch), two CTAs
   (one solid --accent, one bordered ghost). Behind it, 2-3 large blurred
   radial-gradient blobs (300-500px, filter:blur(90px), opacity .15-.25,
   ONLY --accent/--accent-2 hues, position:absolute, z-index:-1,
   pointer-events:none). Never yellow/green/pink.
3. Feature grid: 3 cards in an asymmetric/bento grid (grid-template-columns
   with a wider first card on desktop, single column on mobile). Each card
   gets a small icon drawn as INLINE SVG (stroke:currentColor) — never emoji.
4. A wide 16:9 [Image placeholder] block, dashed --border, --surface-2 fill,
   centred --muted label.
5. Closing CTA band on --surface-2 with a heading and one accent button.
6. Footer: one line, --muted, top border.

## Interactivity — implement all three in one inline script

- IntersectionObserver scroll-reveal: elements start opacity:0,
  translateY(24px) and animate in when 15% visible, staggered ~80ms by index.
- The mobile hamburger actually toggles the nav, with aria-expanded kept in sync.
- Cards respond on hover/focus per the surface rules above.
Wrap all motion in @media (prefers-reduced-motion: reduce) so it is disabled.

## Hard rules

- ONE file: all CSS in one <style> in <head>, all JS in one <script> before
  </body>. Zero network requests — no CDN, no external font, no src on script,
  no remote images.
- Responsive and unbroken down to a 300px viewport. Use clamp(), %, grid/flex,
  and min-width:0 on grid/flex children so long words cannot force overflow.
- Set overflow-x:hidden on body AND html, and size the decorative blobs with
  min() (e.g. width:min(420px,80vw)) so an absolutely-positioned blob can never
  push a horizontal scrollbar on a narrow screen. Also set
  overflow-wrap:break-word on body so a long unbroken word cannot overflow.
- Every image slot is a literal "[Image placeholder]" block. Never a real or
  fake image URL, never invented alt text for a photo that does not exist.
- Invent NOTHING factual: no testimonials, logos, pricing, company names, or
  statistics that are not in the source content above. If a section would
  normally need one, write a bracketed placeholder instead.
- Semantic landmarks (header/main/section/footer), exactly one h1, visible
  :focus-visible outline, and keyboard-reachable controls.
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
          // Groq's free tier caps at 8k tokens per minute and counts the
          // prompt toward it, so prompt (~1.2k) + max_tokens must stay under
          // that or the request is rejected outright rather than truncated.
          // The cap is per-model, so this budget is separate from the 20b one
          // the three text steps above are spending.
          maxTokens: 6500,
          temperature: 0.6,
        }
      )
      htmlPage = stripCodeFence(htmlPageResult.content)
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
