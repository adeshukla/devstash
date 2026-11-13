// Password rules and hashing, using node's built-in scrypt so there is no extra package. No
// "@/" imports, so node:test can run it.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const MIN_PASSWORD = 10
export const MAX_PASSWORD = 128

// The passwords attackers try first. Length and this list matter more than "must contain a symbol".
const COMMON = new Set(
  `password passw0rd p@ssword p@ssw0rd password1 password12 password123 password1234 12345678 123456789
1234567890 0123456789 11111111 111111111 1111111111 00000000 000000000 0000000000 123123123 1234512345
qwertyuiop qwerty123 qwerty1234 qwertyui asdfghjkl asdfghjk zxcvbnm123 1q2w3e4r5t 1q2w3e4r 1qaz2wsx
1qaz2wsx3edc qazwsxedc iloveyou iloveyou1 iloveyou123 letmein123 welcome123 welcome1234 admin123
admin1234 administrator changeme changeme123 abc12345 abcd1234 abcdefgh abcdefghi abcdefghij
monkey123 dragon123 football1 baseball1 superman1 batman123 trustno1 sunshine1 princess1 master123
shadow123 michael123 jennifer1 whatever1 freedom1 starwars1 pokemon123 computer1 internet1 samsung123
india123 india1234 indian123 delhi123 mumbai123 shivam123 krishna123 ganesh123 jaishreeram
jaishriram radhakrishna hanuman123 mahadev123 omnamah123 sairam123 devstash123 devstash1234 qrcode1234
changeable1 youknowwhat letmein1234 passpass12 password!1 password@1 password#1 test123456 testtest12`
    .split(/\s+/)
    .filter(Boolean)
)

const BANNED_PARTS = ['password', 'qwerty', '123456', 'letmein', 'devstash']

/** Returns an error message, or null when the password is acceptable. `email` stops "adesh2026" for adesh@... */
export function checkPassword(pw: string, email = ''): string | null {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`
  if (pw.length > MAX_PASSWORD) return `Use at most ${MAX_PASSWORD} characters.`
  const low = pw.toLowerCase()
  const bare = low.replace(/[\d!@#$%^&*?._-]+$/, '')
  if (COMMON.has(low) || COMMON.has(bare))
    return 'That password is too common. Pick something less guessable.'
  if (BANNED_PARTS.some((p) => low.includes(p)))
    return 'Avoid common words like "password" or "qwerty", and the site name.'
  if (new Set(low).size < 5) return 'Use more different characters.'
  if (/^(?:0123456789|abcdefghij|9876543210|jihgfedcba)/.test(low.replace(/\s/g, '')))
    return 'Avoid simple runs like 123456 or abcdef.'
  const local = email.split('@')[0].toLowerCase()
  if (local.length >= 4 && low.includes(local))
    return 'Do not include your email name in the password.'
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
