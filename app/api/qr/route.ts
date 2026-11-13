import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { checkPassword, hashPassword, verifyPassword } from '@/lib/qrlink/password'
import { checkDestination, checkUsername } from '@/lib/qrlink/rules'
import { qrSession, sessionReady } from '@/lib/qrlink/session'
import {
  claim,
  consumeToken,
  linkOf,
  makeToken,
  normEmail,
  passwordOf,
  retire,
  setPassword,
  storeReady,
  updateUrl,
} from '@/lib/qrlink/store'
import { clientKey, isSameOrigin, rateLimited } from '@/lib/security/requestGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } })
const ready = () => storeReady() && sessionReady
const TEN_MIN = 10 * 60 * 1000

/** Who is signed in, the link they own, and whether Google sign-in is switched on. */
export async function GET() {
  if (!ready()) return json({ available: false })
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const email = (await qrSession()).email
  if (!email) return json({ available: true, email: null, google })
  return json({ available: true, email, google, link: await linkOf(email) })
}

const email = z.email().max(254)
const password = z.string().max(200)
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('signup'), email, password }),
  z.object({ action: z.literal('login'), email, password }),
  z.object({ action: z.literal('forgot'), email }),
  z.object({ action: z.literal('confirm'), token: z.string().max(100) }),
  z.object({ action: z.literal('reset'), token: z.string().max(100), password }),
  z.object({ action: z.literal('claim'), name: z.string().max(40), url: z.string().max(2100) }),
  z.object({ action: z.literal('update'), url: z.string().max(2100) }),
  z.object({ action: z.literal('retire') }),
  z.object({ action: z.literal('logout') }),
])

/** Sends an email. In local development with no mail key, prints it instead. */
async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (process.env.RESEND_API_KEY) {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'DevStash <hello@devstash.me>',
      to,
      subject,
      text,
    })
    return !error
  }
  if (process.env.NODE_ENV === 'production') return false
  console.warn(`[qr] email to ${to}: ${subject}\n${text}`)
  return true
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'Not allowed.' }, 403)
  if (!ready()) return json({ error: 'Changeable QR links are not switched on yet.' }, 503)
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json({ error: 'Check the details and try again.' }, 400)
  const body = parsed.data
  const ip = clientKey(request)
  if (rateLimited(`qr:${ip}`, 40, TEN_MIN))
    return json({ error: 'Too many tries. Wait a few minutes.' }, 429)

  const session = await qrSession()
  const origin = new URL(request.headers.get('origin')!).origin
  const page = `${origin}/lab/changeable-qr`

  if (body.action === 'login') {
    const who = normEmail(body.email)
    if (rateLimited(`qrlogin:${who}`, 8, TEN_MIN))
      return json({ error: 'Too many tries. Wait a few minutes.' }, 429)
    if (!verifyPassword(body.password, await passwordOf(who)))
      return json(
        {
          error:
            'Wrong email or password. Signed up with Google? Use that button, or reset your password.',
        },
        401
      )
    session.email = who
    await session.save()
    return json({ ok: true })
  }

  if (body.action === 'signup' || body.action === 'forgot') {
    const who = normEmail(body.email)
    if (rateLimited(`qrmail:${who}`, 3, TEN_MIN) || rateLimited(`qrmailip:${ip}`, 5, TEN_MIN))
      return json({ error: 'Too many emails. Wait a few minutes.' }, 429)
    let sent: boolean
    if (body.action === 'signup') {
      const bad = checkPassword(body.password)
      if (bad) return json({ error: bad }, 422)
      if (await passwordOf(who)) {
        sent = await sendMail(
          who,
          'You already have a DevStash QR account',
          `Someone tried to create an account with this email, but one exists. Sign in at ${page}, or use "Forgot password" there.`
        )
      } else {
        const token = await makeToken({
          kind: 'signup',
          email: who,
          pw: hashPassword(body.password),
        })
        sent = await sendMail(
          who,
          'Confirm your email for changeable QR codes',
          `Open this link to confirm your email and finish creating your account. It works once and lasts an hour:\n\n${page}?confirm=${token}\n\nIf you did not ask for it, ignore this email.`
        )
      }
    } else {
      const token = await makeToken({ kind: 'reset', email: who })
      sent = await sendMail(
        who,
        'Reset your password for changeable QR codes',
        `Open this link to choose a new password. It works once and lasts an hour:\n\n${page}?reset=${token}\n\nIf you did not ask for it, ignore this email.`
      )
    }
    if (!sent) return json({ error: 'The email could not be sent. Try again later.' }, 502)
    // Same answer whether or not the address has an account.
    return json({ ok: true })
  }

  if (body.action === 'confirm' || body.action === 'reset') {
    // Check the new password first, so a weak one does not use up the emailed link.
    const weak = body.action === 'reset' ? checkPassword(body.password) : null
    if (weak) return json({ error: weak }, 422)
    const info = await consumeToken(body.token)
    const want = body.action === 'confirm' ? 'signup' : 'reset'
    if (!info || info.kind !== want)
      return json({ error: 'That link has expired or was already used.' }, 400)
    if (info.kind === 'signup') await setPassword(info.email, info.pw)
    else if (body.action === 'reset') await setPassword(info.email, hashPassword(body.password))
    session.email = info.email
    await session.save()
    return json({ ok: true })
  }

  if (body.action === 'logout') {
    session.destroy()
    return json({ ok: true })
  }

  const who = session.email
  if (!who) return json({ error: 'Sign in first.' }, 401)

  if (body.action === 'retire') {
    await retire(who)
    return json({ ok: true })
  }

  const dest = checkDestination(body.url)
  if ('error' in dest) return json({ error: dest.error }, 422)

  if (body.action === 'update') {
    return (await updateUrl(who, dest.url))
      ? json({ ok: true })
      : json({ error: 'Pick a name first.' }, 404)
  }

  const name = checkUsername(body.name)
  if ('error' in name) return json({ error: name.error }, 422)
  const result = await claim(who, name.name, dest.url)
  if (result === 'taken') return json({ error: 'That name is taken. Pick another.' }, 409)
  if (result === 'has-one') return json({ error: 'This account already has a QR address.' }, 409)
  return json({ ok: true })
}
