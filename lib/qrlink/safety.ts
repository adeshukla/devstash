import 'server-only'

/** Names or hostnames you want switched off, comma separated in QR_BLOCKLIST. Takes effect at once, no deploy of code. */
export function isBlocked(name: string, target: string): boolean {
  const list = (process.env.QR_BLOCKLIST ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (!list.length) return false
  let host = ''
  try {
    host = new URL(target).hostname.toLowerCase()
  } catch {
    // an unreadable target is refused elsewhere
  }
  return list.some((x) => x === name || (host && (host === x || host.endsWith(`.${x}`))))
}

/**
 * Asks Google Safe Browsing whether a page is known for phishing or malware. Off unless
 * SAFE_BROWSING_API_KEY is set, and it never blocks a save because Google was slow or down.
 */
export async function isFlaggedUnsafe(url: string): Promise<boolean> {
  const key = process.env.SAFE_BROWSING_API_KEY
  if (!key) return false
  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: AbortSignal.timeout(3000),
        body: JSON.stringify({
          client: { clientId: 'devstash-qr', clientVersion: '1.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      }
    )
    if (!res.ok) return false
    const data = (await res.json()) as { matches?: unknown[] }
    return Boolean(data.matches?.length)
  } catch {
    return false
  }
}
