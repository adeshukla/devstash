import 'server-only'
import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionStillValid } from './store'

export interface QrSession {
  email?: string
  /** When this sign-in happened, so a password reset can end older ones. */
  at?: number
}

const secret = process.env.SESSION_SECRET ?? ''
/** False when SESSION_SECRET is missing or too short: sign-in is switched off rather than insecure. */
export const sessionReady = secret.length >= 32

const options: SessionOptions = {
  password: secret,
  cookieName: 'devstash_qr',
  ttl: 60 * 60 * 24 * 30,
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
}

export async function qrSession() {
  return getIronSession<QrSession>(await cookies(), options)
}

/** The signed-in email, or null. A sign-in that predates a password reset no longer counts. */
export async function signedInEmail(): Promise<string | null> {
  const s = await qrSession()
  if (!s.email) return null
  if (await sessionStillValid(s.email, s.at)) return s.email
  s.destroy()
  return null
}

export async function signIn(email: string): Promise<void> {
  const s = await qrSession()
  s.email = email
  s.at = Date.now()
  await s.save()
}
