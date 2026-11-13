import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { checkDestination, checkUsername } from '@/lib/qrlink/rules'
import { qrSession, sessionReady } from '@/lib/qrlink/session'
import {
  claim,
  linkOf,
  makeLoginToken,
  normEmail,
  retire,
  storeReady,
  updateUrl,
  consumeLoginToken,
} from '@/lib/qrlink/store'
import { clientKey, isSameOrigin, rateLimited } from '@/lib/security/requestGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } })
const ready = () => storeReady() && sessionReady

/** Who is signed in, and the link they own. */
export async function GET() {
  if (!ready()) return json({ available: false })
  const email = (await qrSession()).email
  if (!email) return json({ available: true, email: null })
  return json({ available: true, email, link: await linkOf(email) })
}

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('login'), email: z.email().max(254) }),
  z.object({ action: z.literal('verify'), token: z.string().max(100) }),
  z.object({ action: z.literal('claim'), name: z.string().max(40), url: z.string().max(2100) }),
  z.object({ action: z.literal('update'), url: z.string().max(2100) }),
  z.object({ action: z.literal('retire') }),
  z.object({ action: z.literal('logout') }),
])

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'Not allowed.' }, 403)
  if (!ready()) return json({ error: 'Changeable QR links are not switched on yet.' }, 503)
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json({ error: 'Check the details and try again.' }, 400)
  const body = parsed.data
  const ip = clientKey(request)
  if (rateLimited(`qr:${ip}`, 40, 10 * 60 * 1000))
    return json({ error: 'Too many tries. Wait a few minutes.' }, 429)

  const session = await qrSession()

  if (body.action === 'login') {
    const email = normEmail(body.email)
    // Always answer the same, so this cannot be used to find out who has an account.
    if (
      rateLimited(`qrmail:${email}`, 3, 10 * 60 * 1000) ||
      rateLimited(`qrmailip:${ip}`, 5, 10 * 60 * 1000)
    )
      return json({ error: 'Too many sign-in emails. Wait a few minutes.' }, 429)
    const token = await makeLoginToken(email)
    const link = `${new URL(request.headers.get('origin')!).origin}/lab/changeable-qr?token=${token}`
    if (process.env.RESEND_API_KEY) {
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: 'DevStash <hello@devstash.me>',
        to: email,
        subject: 'Your sign-in link for changeable QR codes',
        text: `Open this link to sign in. It works once and expires in 15 minutes:\n\n${link}\n\nIf you did not ask for it, ignore this email.`,
      })
      if (error) return json({ error: 'The email could not be sent. Try again later.' }, 502)
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(`[qr] sign-in link for ${email}: ${link}`)
    } else {
      return json({ error: 'Email is not set up.' }, 503)
    }
    return json({ ok: true })
  }

  if (body.action === 'verify') {
    const email = await consumeLoginToken(body.token)
    if (!email) return json({ error: 'That sign-in link has expired or was already used.' }, 400)
    session.email = email
    await session.save()
    return json({ ok: true })
  }

  if (body.action === 'logout') {
    session.destroy()
    return json({ ok: true })
  }

  const email = session.email
  if (!email) return json({ error: 'Sign in first.' }, 401)

  if (body.action === 'retire') {
    await retire(email)
    return json({ ok: true })
  }

  const dest = checkDestination(body.url)
  if ('error' in dest) return json({ error: dest.error }, 422)

  if (body.action === 'update') {
    return (await updateUrl(email, dest.url))
      ? json({ ok: true })
      : json({ error: 'Pick a name first.' }, 404)
  }

  const name = checkUsername(body.name)
  if ('error' in name) return json({ error: name.error }, 422)
  const result = await claim(email, name.name, dest.url)
  if (result === 'taken') return json({ error: 'That name is taken. Pick another.' }, 409)
  if (result === 'has-one') return json({ error: 'This account already has a QR address.' }, 409)
  return json({ ok: true })
}
