import { NextResponse } from 'next/server'
import { z } from 'zod'

import { isAdminEnabled } from '@/lib/auth/adminEnabled'
import { getSession } from '@/lib/auth/session'
import { getPostBySlug } from '@/lib/markdown/blog'
import { deletePost, writePost } from '@/lib/markdown/writePost'
import { readingTime } from '@/lib/automation/utils'
import type { BlogCategory, BlogFrontmatter } from '@/types/blog'

// ─── Constants ─────────────────────────────────────────────────────────────

const AUTHOR = 'Adesh Shukla'

const CATEGORY_VALUES = [
  'automation',
  'frontend',
  'performance',
  'ai-workflows',
  'devtools',
  'tutorials',
  'career',
] as const satisfies readonly BlogCategory[]

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// ─── Zod schema (PostFormValues) ─────────────────────────────────────────────

const PostSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  slug: z.string().regex(SLUG_RE, 'Slug must be lowercase kebab-case.'),
  description: z.string().min(1, 'Description is required.'),
  category: z.enum(CATEGORY_VALUES),
  tags: z
    .array(z.string())
    .min(1, 'At least one tag is required.')
    .max(5, 'No more than 5 tags allowed.'),
  featuredImage: z.string(),
  readingTime: z.number().int().positive().optional(),
  draft: z.boolean(),
  featured: z.boolean(),
  body: z.string(),
  createdAt: z.string().optional(),
})

type PostFormValues = z.infer<typeof PostSchema>

// ─── Shared helpers ──────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function buildFrontmatter(
  payload: PostFormValues,
  createdAt: string,
  updatedAt: string
): BlogFrontmatter {
  return {
    title: payload.title,
    slug: payload.slug,
    description: payload.description,
    author: AUTHOR,
    createdAt,
    updatedAt,
    category: payload.category,
    tags: payload.tags,
    featuredImage: payload.featuredImage,
    readingTime: payload.readingTime ?? readingTime(payload.body),
    canonical: `https://devstash.me/blog/${payload.slug}`,
    draft: payload.draft,
    featured: payload.featured,
  }
}

/** Map a thrown error message from writePost to an HTTP status. */
function statusForError(err: unknown): number {
  const message = err instanceof Error ? err.message : ''
  switch (message) {
    case 'INVALID_SLUG':
    case 'PATH_TRAVERSAL':
      return 400
    case 'SLUG_EXISTS':
      return 409
    case 'NOT_FOUND':
      return 404
    default:
      return 500
  }
}

function errorResponse(err: unknown): NextResponse {
  const status = statusForError(err)
  if (status === 500) {
    console.error('[admin/posts] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status })
  }
  const message = err instanceof Error ? err.message : 'Request failed.'
  return NextResponse.json({ error: message }, { status })
}

/**
 * Run the shared guards (admin enabled + authenticated) and parse the body.
 * Returns either an early `response` to send, or the validated `data`.
 */
async function guardAndParse(
  request: Request
): Promise<{ response: NextResponse } | { data: PostFormValues }> {
  if (!isAdminEnabled()) {
    return { response: new NextResponse(null, { status: 404 }) }
  }

  const session = await getSession()
  if (!session.isAdmin) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      response: NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 }),
    }
  }

  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      ),
    }
  }

  return { data: parsed.data }
}

// ─── POST (create) ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const result = await guardAndParse(request)
  if ('response' in result) return result.response

  const payload = result.data
  const date = today()
  const frontmatter = buildFrontmatter(payload, date, date)

  try {
    writePost(frontmatter, payload.body, { overwrite: false })
    return NextResponse.json({ ok: true, slug: payload.slug })
  } catch (err) {
    return errorResponse(err)
  }
}

// ─── PUT (update) ────────────────────────────────────────────────────────────

export async function PUT(request: Request) {
  const result = await guardAndParse(request)
  if ('response' in result) return result.response

  const payload = result.data

  const existing = getPostBySlug(payload.slug)
  if (!existing) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const frontmatter = buildFrontmatter(payload, existing.createdAt, today())

  try {
    writePost(frontmatter, payload.body, { overwrite: true })
    return NextResponse.json({ ok: true, slug: payload.slug })
  } catch (err) {
    return errorResponse(err)
  }
}

// ─── DELETE (remove) ─────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  if (!isAdminEnabled()) {
    return new NextResponse(null, { status: 404 })
  }

  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = new URL(request.url).searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug.' }, { status: 400 })
  }

  try {
    deletePost(slug)
    return NextResponse.json({ ok: true, slug })
  } catch (err) {
    return errorResponse(err)
  }
}

// ─── Block other methods ─────────────────────────────────────────────────────

export function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
