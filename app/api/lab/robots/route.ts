import { NextResponse } from 'next/server'
import { FetchRefused, safeGet } from '@/lib/lab/safeGet'
import { clientKey, isSameOrigin, rateLimited } from '@/lib/security/requestGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LIMITS = { maxBytes: 512 * 1024, htmlBytes: 512 * 1024, timeoutMs: 6000 }

const send = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } })

/**
 * The AI crawler check's "read my site's robots.txt for me". The browser cannot fetch another
 * site's file, so the server does, to public hosts only. Nothing is stored or logged.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return send({ error: 'Not allowed.' }, 403)
  if (rateLimited(`robots:${clientKey(request)}`, 15, 10 * 60 * 1000))
    return send({ error: 'Too many tries. Wait a few minutes and try again.' }, 429)

  let origin: string
  try {
    const body = (await request.json()) as { url?: unknown }
    const raw = typeof body.url === 'string' ? body.url.trim().slice(0, 2048) : ''
    origin = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin
  } catch {
    return send({ error: 'Enter a site address such as example.com.' }, 400)
  }

  try {
    const got = await safeGet(`${origin}/robots.txt`, { ...LIMITS, accept: 'text/plain,*/*;q=0.5' })
    if (/^text\/html|^application\/xhtml/.test(got.type))
      return send(
        { error: 'That site answered with a web page instead of a robots.txt file.' },
        422
      )
    return send({ origin, text: got.body.toString('utf8') })
  } catch (e) {
    if (e instanceof FetchRefused) {
      // A missing file is a real answer: with no robots.txt every crawler is allowed.
      if (/\((404|410)\)/.test(e.message)) return send({ origin, text: '', missing: true })
      return send({ error: e.message }, 422)
    }
    return send({ error: 'Something went wrong reading that address.' }, 502)
  }
}
