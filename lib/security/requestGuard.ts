import 'server-only'

/** Browsers always send Origin on a cross-origin-capable POST. Accept it only
 * when it is this very host, so another site (or a form on a hacked page)
 * cannot post here from a visitor's browser. Works on prod, staging, previews
 * and localhost without a hard-coded list. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

// Best-effort, per server instance: serverless instances do not share memory,
// so this blunts a single client hammering one instance but is not airtight.
// ponytail: swap for Upstash/Vercel WAF rate limiting if real abuse shows up.
const hits = new Map<string, number[]>()

/** True when `key` has used up `max` calls inside the last `windowMs`. */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return true
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k)
  }
  return false
}

/** Request IP as Vercel reports it (used only as a rate-limit key, never stored). */
export function clientKey(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
