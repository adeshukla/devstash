import { NextResponse } from 'next/server'
import { findImageUrl } from '@/lib/lab/pageImage'
import { FetchRefused, safeGet } from '@/lib/lab/safeGet'
import { clientKey, isSameOrigin, rateLimited } from '@/lib/security/requestGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const LIMITS = { maxBytes: 8 * 1024 * 1024, htmlBytes: 600 * 1024, timeoutMs: 6000 }

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: { 'cache-control': 'no-store' } })

/**
 * The OG image maker's "take the style from a web address": fetch that page's share image (or the
 * image itself) so the browser can read its colours. The browser cannot do this alone, because
 * other sites do not allow it. Only public hosts are contacted; nothing is stored or logged.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail('Not allowed.', 403)
  if (rateLimited(`pageimg:${clientKey(request)}`, 12, 10 * 60 * 1000))
    return fail('Too many tries. Wait a few minutes and try again.', 429)

  let address = ''
  try {
    const body = (await request.json()) as { url?: unknown }
    address = typeof body.url === 'string' ? body.url.slice(0, 2048) : ''
  } catch {
    return fail('Send a web address.', 400)
  }

  try {
    const first = await safeGet(address, {
      ...LIMITS,
      accept: 'text/html,application/xhtml+xml,image/*;q=0.8',
    })
    let got = first
    if (!IMAGE_TYPES.includes(first.type)) {
      if (!/^text\/html|^application\/xhtml/.test(first.type))
        return fail('That address is neither a page nor a picture.', 422)
      const imageUrl = findImageUrl(first.body.toString('utf8'), first.url.toString())
      if (!imageUrl)
        return fail(
          'That page does not name a share image (og:image). Paste the address of a picture, or upload one.',
          422
        )
      got = await safeGet(imageUrl, { ...LIMITS, accept: 'image/*' })
    }
    if (!IMAGE_TYPES.includes(got.type))
      return fail('That picture is not a PNG, JPG, WebP or GIF, so it cannot be read.', 422)
    return new Response(new Uint8Array(got.body), {
      headers: {
        'content-type': got.type,
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (e) {
    if (e instanceof FetchRefused) return fail(e.message, 422)
    return fail('Something went wrong reading that address.', 502)
  }
}
