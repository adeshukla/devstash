import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { Redis } from '@upstash/redis'

// Three kinds of key:
//   qr:u:<name>  -> { url, email } or { retired: true }   (the permanent address)
//   qr:e:<email> -> <name>                                (one address per account)
//   qr:t:<hash>  -> <email>, expires in 15 minutes        (sign-in links, used once)

interface Kv {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, opts?: { nx?: boolean; ex?: number }): Promise<unknown>
  del(key: string): Promise<unknown>
  getdel<T>(key: string): Promise<T | null>
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
  }
}

let kv: Kv | null | undefined
/** The database, or null when it is not set up (production without the Upstash keys). */
function db(): Kv | null {
  if (kv !== undefined) return kv
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
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

/** Save a one-time sign-in token for this email and return the token to put in the link. */
export async function makeLoginToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await need().set(`qr:t:${hash(token)}`, normEmail(email), { ex: 15 * 60 })
  return token
}

const hash = (s: string) => createHash('sha256').update(s).digest('hex')

/** Use a sign-in token. Returns the email once; the token is gone afterwards. */
export async function consumeLoginToken(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null
  return need().getdel<string>(`qr:t:${hash(token)}`)
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
