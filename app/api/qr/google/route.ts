import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { sessionReady, signIn } from '@/lib/qrlink/session'
import { siteBase } from '@/lib/qrlink/site'
import { limited, storeReady } from '@/lib/qrlink/store'
import { clientKey } from '@/lib/security/requestGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PAGE = '/lab/changeable-qr'

const site = siteBase
const fail = (request: Request, why: string) =>
  NextResponse.redirect(`${site(request)}${PAGE}?error=${why}`)

/** Step 1: send the visitor to Google, remembering a random `state` in a cookie. */
export async function GET(request: Request) {
  const id = process.env.GOOGLE_CLIENT_ID
  if (!id || !process.env.GOOGLE_CLIENT_SECRET || !storeReady() || !sessionReady)
    return fail(request, 'google-off')
  if (await limited(`google:${clientKey(request)}`, 30, 600)) return fail(request, 'google')
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const jar = request.headers.get('cookie') ?? ''
  const saved = /(?:^|; )qr_state=([\w-]+)/.exec(jar)?.[1]

  if (!code) {
    const state = randomBytes(24).toString('base64url')
    const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    auth.search = new URLSearchParams({
      client_id: id,
      redirect_uri: `${site(request)}/api/qr/google`,
      response_type: 'code',
      scope: 'openid email',
      state,
      prompt: 'select_account',
    }).toString()
    const res = NextResponse.redirect(auth)
    res.cookies.set('qr_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/qr/google',
      maxAge: 600,
    })
    return res
  }

  // Step 2: Google sent them back with a code. The state must match what we stored.
  if (!saved || saved !== url.searchParams.get('state')) return fail(request, 'google')
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: id,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${site(request)}/api/qr/google`,
        grant_type: 'authorization_code',
      }),
    })
    const { id_token } = (await tokenRes.json()) as { id_token?: string }
    if (!tokenRes.ok || !id_token) return fail(request, 'google')
    // The token came straight from Google over TLS in exchange for our secret, so its content can be trusted.
    const claims = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64url').toString()) as {
      aud?: string
      iss?: string
      email?: string
      email_verified?: boolean
    }
    if (
      claims.aud !== id ||
      !/^(https:\/\/)?accounts\.google\.com$/.test(claims.iss ?? '') ||
      !claims.email ||
      claims.email_verified !== true
    )
      return fail(request, 'google')
    await signIn(claims.email.trim().toLowerCase())
    const res = NextResponse.redirect(`${site(request)}${PAGE}`)
    res.cookies.delete({ name: 'qr_state', path: '/api/qr/google' })
    return res
  } catch {
    return fail(request, 'google')
  }
}
