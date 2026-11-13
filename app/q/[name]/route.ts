import { NextResponse } from 'next/server'
import { isBlocked } from '@/lib/qrlink/safety'
import { resolve, storeReady } from '@/lib/qrlink/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WEB = /^https?:\/\//i

/** The address inside a changeable QR code. Looks the name up and sends the visitor on. */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params
  const found = storeReady() && /^[a-z0-9-]{3,20}$/.test(name) ? await resolve(name) : null
  // Re-check at scan time: only web pages, and nothing on the blocklist, whatever was saved before.
  const target = found && WEB.test(found) && !isBlocked(name, found) ? found : null
  if (!target)
    return new NextResponse('This QR link is not active.', {
      status: 404,
      headers: { 'x-robots-tag': 'noindex' },
    })
  // 307 and no-store: the destination can change, so nothing may remember it.
  return new NextResponse(null, {
    status: 307,
    headers: { location: target, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  })
}
