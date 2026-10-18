import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { callGroq, callWithFallback, hasAnyProviderConfigured, GroqCallError } from '@/lib/ai/groq'
import { AI_TELL_PHRASES, countAiTellPhrases } from '@/lib/ai/aiTellPhrases'
import { countHumanInputMarkers } from '@/lib/ai/humanInputMarkers'
import { articleOutline, firstSentence } from '@/lib/ai/contentSections'
import { DESIGNS, DESIGN_IDS, renderLandingPage } from '@/lib/ai/landingDesigns'
import { BLOG_CATEGORIES } from '@/types/blog'
import type {
  PipelineMetrics,
  DemoFrontmatter,
  PageCopy,
  HtmlVariant,
  PageDesignId,
} from '@/types/aiPipeline'

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
// budget, which leaves room for the small landing-page copy step.
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
  generateHtmlPage: z.boolean().optional().default(true),
  design: z
    .enum(['auto', ...DESIGN_IDS])
    .optional()
    .default('auto'),
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

// ─── Landing-page copy (the only part of the page the model writes) ─────────

// Lenient on length — the model overshoots — and clipped afterwards, so a
// near-miss still yields a page instead of falling back.
const PageCopyFromLlmSchema = z.object({
  brand: z.string().trim().min(1),
  heroTitle: z.string().trim().min(3),
  heroLead: z.string().trim().min(10),
  cta: z.string().trim().min(2),
  features: z
    .array(z.object({ title: z.string().trim().min(2), body: z.string().trim().min(8) }))
    .min(3),
  closingTitle: z.string().trim().min(3),
  closingLead: z.string().trim().default(''),
})

/** Strip anything that must never reach a page, then clip on a word boundary. */
function cleanCopy(s: string, max: number): string {
  const t = s
    .replace(/\[TODO:[^\]]*\]/gi, '')
    .replace(/\bTODO\b:?/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).replace(/[,;:—-]+$/, '') + '…'
}

function normaliseCopy(c: z.infer<typeof PageCopyFromLlmSchema>): PageCopy {
  return {
    brand: cleanCopy(c.brand, 32),
    heroTitle: cleanCopy(c.heroTitle, 90),
    heroLead: cleanCopy(c.heroLead, 240),
    cta: cleanCopy(c.cta, 32),
    features: c.features.slice(0, 3).map((f) => ({
      title: cleanCopy(f.title, 60),
      body: cleanCopy(f.body, 200),
    })),
    closingTitle: cleanCopy(c.closingTitle, 90),
    closingLead: cleanCopy(c.closingLead, 200),
  }
}

/**
 * Copy built from the article itself when the model's JSON doesn't validate:
 * the frontmatter for the hero and the article's own section headings and
 * first sentences for the three points. Plain, but never invented.
 */
function fallbackCopy(fm: DemoFrontmatter, article: string): PageCopy {
  const outline = articleOutline(article).filter((o) => o.summary)
  const sentences = article
    .replace(/\[TODO:[^\]]*\]/gi, '')
    .split(/\n{2,}/)
    .map(firstSentence)
    .filter((x) => x.length > 30)
  const points = outline.map((o) => ({ title: o.heading, body: o.summary }))
  for (const sentence of sentences) {
    if (points.length >= 3) break
    points.push({ title: sentence.split(/\s+/).slice(0, 4).join(' '), body: sentence })
  }
  while (points.length < 3)
    points.push({ title: fm.tags[points.length] ?? fm.category, body: fm.description })
  return normaliseCopy({
    brand: fm.title
      .split(/[\s:—-]+/)
      .slice(0, 2)
      .join(' '),
    heroTitle: fm.title,
    heroLead: fm.description,
    cta: 'Get in touch',
    features: points.slice(0, 3),
    closingTitle: `Want to talk about ${fm.title.toLowerCase()}?`,
    closingLead: 'Send a short note about what you are working on and I will reply.',
  })
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

  const { topic, keywords, tone, targetLength, userApiKey, generateHtmlPage, design } = parsed.data
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

    // ── Step 4 (on by default): landing page in every design ──
    // The model writes only the copy, as small validated JSON. The page itself
    // is rendered from hand-built designs (lib/ai/landingDesigns.ts), so it is
    // responsive by construction, never repeats one look, and always carries
    // the full humanised article. Rendering costs no tokens, so every design is
    // returned and the visitor picks; `design` only decides which shows first.
    let htmlPage: string | null = null
    let htmlVariants: HtmlVariant[] = []
    let htmlDesign: PageDesignId | null = null
    let copyResult: Awaited<ReturnType<typeof runStep>> | null = null
    if (generateHtmlPage) {
      // The copy only needs the argument's shape, not every sentence. Cut on a
      // paragraph break so a point is never sourced from a half-sentence.
      const EXCERPT_LIMIT = 2400
      const article = humanizeResult.content.trim()
      let excerpt = article
      if (article.length > EXCERPT_LIMIT) {
        const cut = article.slice(0, EXCERPT_LIMIT)
        const lastBreak = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '))
        excerpt = (lastBreak > EXCERPT_LIMIT * 0.5 ? cut.slice(0, lastBreak) : cut).trim()
      }
      const sections = articleOutline(article).map((o) => o.heading)

      copyResult = await runStep(
        [
          {
            role: 'system',
            content:
              'You write landing-page copy from an article. You only restate what the article actually says: no invented statistics, customers, testimonials, prices, guarantees or personal experience. Output only valid JSON.',
          },
          {
            role: 'user',
            content: `Write the copy for a landing page that presents the article below.
Return ONLY a JSON object with exactly these keys:
- brand: a 1-3 word name for the page, derived from the subject. Not "DevStash", not generic ("Solutions", "Hub").
- heroTitle: a headline of at most 70 characters that states the article's main point plainly.
- heroLead: one or two sentences, at most 220 characters, saying who this is for and what they get from it.
- cta: a 2-4 word button label that invites the reader to get in touch about this subject (for example "Talk through your setup").
- features: exactly 3 objects {"title","body"}, each a different real point from the article. title: 2-6 words. body: one sentence, at most 160 characters.
- closingTitle: a closing headline of at most 70 characters inviting the reader to talk about this subject.
- closingLead: one sentence, at most 160 characters.

Write like a person explaining it to a colleague: plain, specific, concrete.
Never use these phrases: ${AI_TELL_PHRASES.join(', ')}.
Never use empty claims such as "fast", "secure", "scalable", "seamless", "cutting-edge", "next-level", "unlock".
Never include any "[TODO ...]" text.

TITLE: ${frontmatter.title}
DESCRIPTION: ${frontmatter.description}
SECTIONS: ${sections.join(' | ') || 'none'}
ARTICLE:
"""
${excerpt}
"""`,
          },
        ],
        // The 120b model has its own per-minute quota; on the text model this
        // fourth call would push one run past the shared 8k-tokens ceiling.
        {
          ...TEXT_STEP_OPTIONS,
          jsonMode: true,
          maxTokens: 900,
          modelOverride: 'openai/gpt-oss-120b',
        }
      )

      let copy: PageCopy
      try {
        const validated = PageCopyFromLlmSchema.safeParse(JSON.parse(copyResult.content))
        copy = validated.success
          ? normaliseCopy(validated.data)
          : fallbackCopy(frontmatter, humanizeResult.content)
      } catch {
        copy = fallbackCopy(frontmatter, humanizeResult.content)
      }

      htmlVariants = DESIGNS.map((d) => ({
        id: d.id,
        name: d.name,
        blurb: d.blurb,
        html: renderLandingPage(d.id, copy, frontmatter, humanizeResult.content),
      }))
      htmlDesign =
        design === 'auto' ? DESIGN_IDS[Math.floor(Math.random() * DESIGN_IDS.length)] : design
      htmlPage = htmlVariants.find((v) => v.id === htmlDesign)?.html ?? htmlVariants[0].html
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
      htmlPage: copyResult
        ? {
            promptTokens: copyResult.promptTokens,
            completionTokens: copyResult.completionTokens,
            latencyMs: copyResult.latencyMs,
            provider: copyResult.provider,
          }
        : null,
      totalLatencyMs:
        draftResult.latencyMs +
        humanizeResult.latencyMs +
        frontmatterResult.latencyMs +
        (copyResult?.latencyMs ?? 0),
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
      htmlVariants,
      htmlDesign,
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
