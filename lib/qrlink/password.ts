// Password hashing with node's built-in scrypt, so no extra package. Relative-free, so node:test
// can run it.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const MIN_PASSWORD = 8
export const MAX_PASSWORD = 128

/** Returns an error message, or null when the password is acceptable. */
export function checkPassword(pw: string): string | null {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`
  if (pw.length > MAX_PASSWORD) return `Use at most ${MAX_PASSWORD} characters.`
  return null
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  return `s1$${salt.toString('base64url')}$${scryptSync(pw, salt, 64).toString('base64url')}`
}

const DUMMY = hashPassword('not-a-real-password')

/** Constant-time check. Pass null for "no password on file": it still does the same work. */
export function verifyPassword(pw: string, stored: string | null): boolean {
  const [v, salt, want] = (stored ?? DUMMY).split('$')
  if (v !== 's1' || !salt || !want || pw.length > MAX_PASSWORD) return false
  const a = scryptSync(pw, Buffer.from(salt, 'base64url'), 64)
  const ok = timingSafeEqual(a, Buffer.from(want, 'base64url'))
  return ok && stored !== null
}
