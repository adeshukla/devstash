// app/api/track/route.ts
//
// Lightweight server-side visit log. Receives fire-and-forget beacons from
// lib/analytics/events.ts `logVisit()` for key interactions (resume view/
// download, contact form submit) and writes a structured line to the server
// log (visible in Vercel → Functions logs). No database, no PII storage beyond
// the standard request metadata a web server already sees.

import { NextResponse } from 'next/server'

const KNOWN_EVENTS = new Set([
  'cv_viewed',
  'contact_form_submitted',
  'github_link_clicked',
  'blog_post_read',
  'resource_clicked',
])

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    // sendBeacon may deliver an empty/odd body — tolerate it.
  }

  const rawEvent = asString(body.event) ?? 'unknown'
  const event = KNOWN_EVENTS.has(rawEvent) ? rawEvent : 'unknown'

  const entry = {
    kind: 'visit',
    event,
    path: asString(body.path),
    href: asString(body.href),
    label: asString(body.label),
    method: asString(body.method),
    referrer: asString(body.referrer),
    ua: request.headers.get('user-agent') ?? undefined,
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined,
    at: new Date().toISOString(),
  }

  // Structured single-line log for easy filtering in Vercel logs.
  console.log(`[visit] ${JSON.stringify(entry)}`)

  // 204 No Content — beacons don't read the response.
  return new NextResponse(null, { status: 204 })
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
