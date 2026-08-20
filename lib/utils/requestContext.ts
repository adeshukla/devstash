// lib/utils/requestContext.ts
//
// Lightweight, dependency-free helpers for turning a raw Request into
// human-readable context for owner-facing notification emails — a device
// summary and a coarse location. No new npm packages: full UA parsing (e.g.
// ua-parser-js) is overkill for "Chrome on macOS" in an email, and Vercel's
// edge network already stamps geolocation onto every request for free.

/** "Chrome on macOS", "Safari on iPhone", "Mobile Safari on iOS", etc. —
 * good-enough for a notification email, not a full UA parse. */
export function summarizeUserAgent(ua: string | null | undefined): string {
  if (!ua) return 'Unknown device'

  const os = (() => {
    if (/iphone/i.test(ua)) return 'iPhone'
    if (/ipad/i.test(ua)) return 'iPad'
    if (/android/i.test(ua)) return 'Android'
    if (/mac os x/i.test(ua)) return 'macOS'
    if (/windows/i.test(ua)) return 'Windows'
    if (/linux/i.test(ua)) return 'Linux'
    return ''
  })()

  const browser = (() => {
    if (/edg\//i.test(ua)) return 'Edge'
    if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera'
    if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) return 'Chrome'
    if (/crios\//i.test(ua)) return 'Chrome'
    if (/fxios\//i.test(ua) || /firefox\//i.test(ua)) return 'Firefox'
    if (/safari\//i.test(ua) && /version\//i.test(ua)) return 'Safari'
    if (/bot|crawler|spider|slurp|bingpreview/i.test(ua)) return 'Bot/crawler'
    return ''
  })()

  if (browser && os) return `${browser} on ${os}`
  return browser || os || 'Unknown device'
}

export interface RequestGeo {
  city?: string
  region?: string
  country?: string
}

/** Vercel's edge network stamps these on every request — free, no external
 * geolocation API call, coarse enough (city/region/country) to be a useful
 * "who's looking" signal without being a precision-tracking concern. Empty
 * outside Vercel (e.g. local dev). */
export function getRequestGeo(headers: Headers): RequestGeo {
  const decode = (v: string | null) => {
    if (!v) return undefined
    try {
      return decodeURIComponent(v)
    } catch {
      return v
    }
  }
  return {
    city: decode(headers.get('x-vercel-ip-city')),
    region: decode(headers.get('x-vercel-ip-country-region')),
    country: decode(headers.get('x-vercel-ip-country')),
  }
}

export function formatGeo(geo: RequestGeo): string {
  const parts = [geo.city, geo.region, geo.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Unknown location'
}
