import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { callGroq, callWithFallback, hasAnyProviderConfigured, GroqCallError } from '@/lib/ai/groq'
import { AI_TELL_PHRASES, countAiTellPhrases } from '@/lib/ai/aiTellPhrases'
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

  const { topic, keywords, tone, targetLength, userApiKey } = parsed.data
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
    // ── Step 1: draft ──
    const draftResult = await runStep([
      {
        role: 'system',
        content: 'You are a technical writer producing a blog post draft for developers.',
      },
      {
        role: 'user',
        content: `Write a technical blog post for developers about "${topic}".
Target keywords to naturally include: ${keywords.join(', ') || 'none specified'}.
Tone: ${tone}.
Target length: approximately ${targetLength} words.
Use real, concrete code examples where relevant. No fluff, no generic filler intros.
Output plain text only, no markdown frontmatter, no JSON.`,
      },
    ])

    // ── Step 2: humanize ──
    const humanizeResult = await runStep([
      {
        role: 'system',
        content:
          'You rewrite AI-drafted technical content so it reads like a real developer wrote it.',
      },
      {
        role: 'user',
        content: `Rewrite the following draft so it sounds like a real developer wrote it, not an AI.
Avoid these phrases entirely: ${AI_TELL_PHRASES.join(', ')}.
Add natural opinions, real-world frustration, or dry humor where it fits organically.
Keep every code example intact and technically accurate. Do not shorten the post materially.
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
      totalLatencyMs:
        draftResult.latencyMs + humanizeResult.latencyMs + frontmatterResult.latencyMs,
      aiTellEval: {
        beforeCount: countAiTellPhrases(draftResult.content),
        afterCount: countAiTellPhrases(humanizeResult.content),
      },
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
