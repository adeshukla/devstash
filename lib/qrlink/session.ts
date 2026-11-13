import 'server-only'
import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface QrSession {
  email?: string
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
