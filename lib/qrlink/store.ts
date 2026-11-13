import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { Redis } from '@upstash/redis'

// Three kinds of key:
//   qr:u:<name>  -> { url, email } or { retired: true }   (the permanent address)
//   qr:e:<email> -> <name>                                (one address per account)
//   qr:t:<hash>  -> what an emailed link is for, 1 hour   (used once)
//   qr:a:<email> -> password hash                         (absent for Google-only accounts)
//   qr:s:<email> -> time of the last password reset       (older sign-ins stop working)
//   qr:l:<key>   -> attempt counter with an expiry        (rate limits, shared by every server)

interface Kv {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, opts?: { nx?: boolean; ex?: number }): Promise<unknown>
  del(key: string): Promise<unknown>
  getdel<T>(key: string): Promise<T | null>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<unknown>
}

/** Local development only: lives in memory so the tool works without an account. */
function memoryKv(): Kv {
  const g = globalThis as unknown as { __qrMem?: Map<string, { v: unknown; exp: number }> }
  const m = (g.__qrMem ??= new Map())
  const live = (k: string) => {
    const e = m.get(k)
    if (e && e.exp && e.exp < Date.now()) m.delete(k)
    return m.get(k)
  }
  return {
    async get<T>(k: string) {
      return (live(k)?.v as T) ?? null
    },
    async set(k, v, o) {
      if (o?.nx && live(k)) return null
      m.set(k, { v, exp: o?.ex ? Date.now() + o.ex * 1000 : 0 })
      return 'OK'
    },
    async del(k) {
      m.delete(k)
    },
    async getdel<T>(k: string) {
      const v = (live(k)?.v as T) ?? null
      m.delete(k)
      return v
    },
    async incr(k) {
      const n = (((live(k)?.v as number) ?? 0) + 1) as number
      m.set(k, { v: n, exp: m.get(k)?.exp ?? 0 })
      return n
    },
    async expire(k, sec) {
      const e = m.get(k)
      if (e) e.exp = Date.now() + sec * 1000
    },
  }
}

let kv: Kv | null | undefined
/** The database, or null when it is not set up (production without the Upstash keys). */
function db(): Kv | null {
  if (kv !== undefined) return kv
  // The Vercel marketplace integration names them KV_REST_API_*; a database made on upstash.com uses UPSTASH_*.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (url && token) kv = new Redis({ url, token }) as unknown as Kv
  else kv = process.env.NODE_ENV === 'production' ? null : memoryKv()
  return kv
}

export const storeReady = () => db() !== null
const need = () => {
  const d = db()
  if (!d) throw new Error('The link store is not set up.')
  return d
}

type Entry = { url: string; email: string } | { retired: true }

export const normEmail = (e: string) => e.trim().toLowerCase()

const hash = (s: string) => createHash('sha256').update(s).digest('hex')

/** What an emailed link is for: confirming a new account (with its password hash) or resetting one. */
export type TokenInfo =
  { kind: 'signup'; email: string; pw: string } | { kind: 'reset'; email: string }

/** Save a one-time token and return it for the email link. Lasts one hour. */
export async function makeToken(info: TokenInfo): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await need().set(
    `qr:t:${hash(token)}`,
    { ...info, email: normEmail(info.email) },
    { ex: 60 * 60 }
  )
  return token
}

/** Use a token. Returns what it was for, once; the token is gone afterwards. */
export async function consumeToken(token: string): Promise<TokenInfo | null> {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null
  return need().getdel<TokenInfo>(`qr:t:${hash(token)}`)
}

/** Read a token without using it up. */
export async function peekToken(token: string): Promise<TokenInfo | null> {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null
  return need().get<TokenInfo>(`qr:t:${hash(token)}`)
}

/** Password hash for an email, or null when that email has only ever used Google. */
export async function passwordOf(email: string): Promise<string | null> {
  return need().get<string>(`qr:a:${normEmail(email)}`)
}

export async function setPassword(email: string, pw: string): Promise<void> {
  await need().set(`qr:a:${normEmail(email)}`, pw)
}

export async function linkOf(email: string): Promise<{ name: string; url: string } | null> {
  const d = need()
  const name = await d.get<string>(`qr:e:${normEmail(email)}`)
  if (!name) return null
  const e = await d.get<Entry>(`qr:u:${name}`)
  return e && 'url' in e ? { name, url: e.url } : null
}

/** Where a QR address goes, or null when it is unknown or retired. */
export async function resolve(name: string): Promise<string | null> {
  const e = await need().get<Entry>(`qr:u:${name}`)
  return e && 'url' in e ? e.url : null
}

/** Claim a name for this account. One name per account; names are never handed out twice. */
export async function claim(
  email: string,
  name: string,
  url: string
): Promise<'ok' | 'taken' | 'has-one'> {
  const d = need()
  const key = `qr:e:${normEmail(email)}`
  if (await d.get(key)) return 'has-one'
  const won = await d.set(`qr:u:${name}`, { url, email: normEmail(email) }, { nx: true })
  if (!won) return 'taken'
  if (!(await d.set(key, name, { nx: true }))) {
    await d.del(`qr:u:${name}`)
    return 'has-one'
  }
  return 'ok'
}

/** Point the account's address somewhere else. The QR code itself does not change. */
export async function updateUrl(email: string, url: string): Promise<boolean> {
  const mine = await linkOf(email)
  if (!mine) return false
  await need().set(`qr:u:${mine.name}`, { url, email: normEmail(email) })
  return true
}

/** Stop the address for good. The name stays reserved so nobody else can inherit a printed code. */
export async function retire(email: string): Promise<boolean> {
  const mine = await linkOf(email)
  if (!mine) return false
  const d = need()
  await d.set(`qr:u:${mine.name}`, { retired: true })
  await d.del(`qr:e:${normEmail(email)}`)
  return true
}

/**
 * True when `key` has been used more than `max` times in the last `windowSec` seconds. The counter
 * lives in the database, so it holds across every server instance (an in-memory counter would not).
 */
export async function limited(key: string, max: number, windowSec: number): Promise<boolean> {
  const d = need()
  const k = `qr:l:${key}`
  const n = await d.incr(k)
  if (n === 1) await d.expire(k, windowSec)
  return n > max
}

/** Every sign-in made before now stops working for this email (called after a password reset). */
export async function revokeSessions(email: string): Promise<void> {
  await need().set(`qr:s:${normEmail(email)}`, Date.now())
}

/** False when this sign-in is older than the account's last password reset. */
export async function sessionStillValid(
  email: string,
  issuedAt: number | undefined
): Promise<boolean> {
  const cutoff = await need().get<number>(`qr:s:${normEmail(email)}`)
  return !cutoff || (typeof issuedAt === 'number' && issuedAt >= cutoff)
}
