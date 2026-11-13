import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { checkPassword, hashPassword, verifyPassword } from '@/lib/qrlink/password'
import { checkDestination, checkUsername } from '@/lib/qrlink/rules'
import { isBlocked, isFlaggedUnsafe } from '@/lib/qrlink/safety'
import { qrSession, sessionReady, signIn, signedInEmail } from '@/lib/qrlink/session'
import { siteBase } from '@/lib/qrlink/site'
import {
  claim,
  consumeToken,
  limited,
  linkOf,
  makeToken,
  normEmail,
  passwordOf,
  peekToken,
  retire,
  revokeSessions,
  setPassword,
  storeReady,
  updateUrl,
} from '@/lib/qrlink/store'
import { clientKey, isSameOrigin } from '@/lib/security/requestGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } })
const ready = () => storeReady() && sessionReady
const MAX_BODY = 10_000
const TEN_MIN = 600

/** Who is signed in, the link they own, and whether Google sign-in is switched on. */
export async function GET() {
  if (!ready()) return json({ available: false })
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const email = await signedInEmail()
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

/** Addresses ending in @example.test are for automated tests: never emailed, kept in memory (not in production). */
const isTestAddress = (to: string) =>
  process.env.NODE_ENV !== 'production' && /@example\.test$/i.test(to)

/** Sends an email. In local development with no mail key, prints it instead. */
async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (isTestAddress(to)) {
    const g = globalThis as unknown as { __qrMail?: Record<string, string> }
    ;(g.__qrMail ??= {})[to.toLowerCase()] = text
    return true
  }
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

const tooMany = () => json({ error: 'Too many tries. Wait a few minutes.' }, 429)

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: 'Not allowed.' }, 403)
  if (!ready()) return json({ error: 'Changeable QR links are not switched on yet.' }, 503)

  const raw = await request.text()
  if (raw.length > MAX_BODY) return json({ error: 'Request too large.' }, 413)
  let data: unknown = null
  try {
    data = JSON.parse(raw)
  } catch {
    // falls through to the validation error
  }
  const parsed = Body.safeParse(data)
  if (!parsed.success) return json({ error: 'Check the details and try again.' }, 400)
  const body = parsed.data

  const ip = clientKey(request)
  if (await limited(`ip:${ip}`, 60, TEN_MIN)) return tooMany()

  const page = `${siteBase(request)}/lab/changeable-qr`

  if (body.action === 'login') {
    const who = normEmail(body.email)
    if (
      (await limited(`login:${who}`, 10, 15 * 60)) ||
      (await limited(`loginip:${ip}`, 30, TEN_MIN))
    )
      return tooMany()
    if (!verifyPassword(body.password, await passwordOf(who)))
      return json(
        {
          error:
            'Wrong email or password. Signed up with Google? Use that button, or reset your password.',
        },
        401
      )
    await signIn(who)
    return json({ ok: true })
  }

  if (body.action === 'signup' || body.action === 'forgot') {
    const who = normEmail(body.email)
    if (
      (await limited(`mail:${who}`, 3, TEN_MIN)) ||
      (await limited(`maildaily:${who}`, 10, 24 * 3600)) ||
      (await limited(`mailip:${ip}`, 8, TEN_MIN))
    )
      return json({ error: 'Too many emails. Wait a few minutes.' }, 429)
    let sent: boolean
    if (body.action === 'signup') {
      const bad = checkPassword(body.password, who)
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
    const want = body.action === 'confirm' ? 'signup' : 'reset'
    // Look before using: a weak new password must not cost the person their reset link.
    const peek = await peekToken(body.token)
    if (!peek || peek.kind !== want)
      return json({ error: 'That link has expired or was already used.' }, 400)
    if (body.action === 'reset') {
      const bad = checkPassword(body.password, peek.email)
      if (bad) return json({ error: bad }, 422)
    }
    const info = await consumeToken(body.token)
    if (!info || info.kind !== want)
      return json({ error: 'That link has expired or was already used.' }, 400)
    if (info.kind === 'signup') await setPassword(info.email, info.pw)
    else if (body.action === 'reset') {
      await setPassword(info.email, hashPassword(body.password))
      await revokeSessions(info.email)
    }
    await signIn(info.email)
    return json({ ok: true })
  }

  if (body.action === 'logout') {
    ;(await qrSession()).destroy()
    return json({ ok: true })
  }

  const who = await signedInEmail()
  if (!who) return json({ error: 'Sign in first.' }, 401)

  if (body.action === 'retire') {
    await retire(who)
    return json({ ok: true })
  }

  if (await limited(`write:${who}`, 30, 3600)) return tooMany()
  const dest = checkDestination(body.url)
  if ('error' in dest) return json({ error: dest.error }, 422)
  if (isBlocked('', dest.url) || (await isFlaggedUnsafe(dest.url)))
    return json({ error: 'That page is not allowed. It is blocked or flagged as unsafe.' }, 422)

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
