import fs from 'node:fs'
import path from 'node:path'

import { NextResponse } from 'next/server'

import { isAdminEnabled } from '@/lib/auth/adminEnabled'
import { getSession } from '@/lib/auth/session'
import { slugify } from '@/lib/automation/utils'

// ─── Constants ─────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Allowed MIME types → on-disk extension.
const TYPE_TO_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

// The final filename must look like this. Mirrors the extensions above.
const SAFE_NAME_RE = /^[a-z0-9][a-z0-9-]*\.(webp|png|jpg|gif|svg)$/

// ─── POST (upload) ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return new NextResponse(null, { status: 404 })
  }

  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  const ext = TYPE_TO_EXT[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 400 })
  }

  // Build a SAFE filename from an optional `name` field or the uploaded file name.
  const rawNameField = form.get('name')
  const rawName =
    typeof rawNameField === 'string' && rawNameField.trim() !== '' ? rawNameField : file.name
  // Strip any extension off the supplied base name before slugifying.
  const baseName = rawName.replace(/\.[^.]+$/, '')
  const slug = slugify(baseName) || `image-${Date.now()}`
  const filename = `${slug}.${ext}`

  if (!SAFE_NAME_RE.test(filename)) {
    return NextResponse.json({ error: 'Invalid file name.' }, { status: 400 })
  }

  const dir = path.join(process.cwd(), 'public', 'images', 'blog')
  fs.mkdirSync(dir, { recursive: true })

  const target = path.join(dir, filename)
  // Path-traversal guard: the resolved target must stay inside `dir`.
  if (!path.resolve(target).startsWith(path.resolve(dir) + path.sep)) {
    return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(target, bytes)

  return NextResponse.json({ ok: true, path: `/images/blog/${filename}` })
}

// ─── Block other methods ─────────────────────────────────────────────────────

export function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
