// The visitor's analytics choice, kept in this browser only. Safe to import anywhere on the client.
// 'granted' = GA4, Clarity and the visit log may run. 'denied' = they never load. 'unset' = not asked yet.

export const CONSENT_KEY = 'devstash-consent'
export const CONSENT_EVENT = 'devstash-consent'
export const CONSENT_OPEN_EVENT = 'devstash-consent-open'

export type Consent = 'granted' | 'denied' | 'unset'

export function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : 'unset'
  } catch {
    return 'unset'
  }
}

export function subscribeConsent(cb: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(CONSENT_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

// Cookies the analytics tools set. Matched by name, since the exact suffix varies per property.
const ANALYTICS_COOKIE = /^(_ga|_gid|_gat|_gcl|_clck|_clsk|CLID|ANONCHK|MR|MUID|SM|SRM_B)/

function clearAnalyticsCookies() {
  const parts = window.location.hostname.split('.')
  const domains = ['', window.location.hostname]
  for (let i = 1; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'))
  for (const pair of document.cookie.split(';')) {
    const name = pair.split('=')[0]?.trim()
    if (!name || !ANALYTICS_COOKIE.test(name)) continue
    for (const d of domains)
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`
  }
}

/** Save the choice. Turning analytics off also removes their cookies and reloads so nothing keeps running. */
export function writeConsent(next: 'granted' | 'denied'): void {
  const before = readConsent()
  try {
    window.localStorage.setItem(CONSENT_KEY, next)
  } catch {
    // Storage blocked: the choice lasts until the page closes, and nothing loads for 'unset'.
  }
  if (next === 'denied') {
    clearAnalyticsCookies()
    if (before === 'granted') {
      window.location.reload()
      return
    }
  }
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

/** Ask the banner to open again (footer "Cookie settings"). */
export function openConsent(): void {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}
