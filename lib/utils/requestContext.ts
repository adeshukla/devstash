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
  /** IANA zone Vercel derives from the IP, e.g. "Asia/Kolkata". */
  timezone?: string
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
    timezone: decode(headers.get('x-vercel-ip-timezone')),
  }
}

// Country arrives as an ISO code ("IN") — spell it out for a human reader.
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

export function formatGeo(geo: RequestGeo): string {
  let country = geo.country
  if (country) {
    try {
      country = countryNames.of(country) ?? country
    } catch {
      // Not a valid region code — show it as-is.
    }
  }
  const parts = [geo.city, geo.region, country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Unknown location'
}

// Notification emails are read by the site owner in India. Vercel functions
// run in UTC, so formatting without an explicit zone printed UTC wall-clock
// time that looked like IST — 5h30m behind.
const OWNER_TIMEZONE = 'Asia/Kolkata'

/** A real IANA zone name, or undefined. The browser's zone arrives in the
 * request body, so it is untrusted input. */
export function validTimeZone(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) return undefined
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return value
  } catch {
    return undefined
  }
}

function formatInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date)
}

// Compare offsets, not names: browsers still report legacy aliases such as
// "Asia/Calcutta", which is the same zone as "Asia/Kolkata".
function utcOffset(date: Date, timeZone: string): string {
  return (
    new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'shortOffset' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  )
}

/** "16 Sept 2026, 3:42 pm IST" */
export function formatOwnerTime(date: Date): string {
  return `${formatInZone(date, OWNER_TIMEZONE)} IST`
}

/** The visitor's own wall-clock time, or undefined when it is IST anyway. */
export function formatVisitorTime(date: Date, browserTimeZone?: string): string | undefined {
  if (!browserTimeZone) return undefined
  if (utcOffset(date, browserTimeZone) === utcOffset(date, OWNER_TIMEZONE)) return undefined
  return `${formatInZone(date, browserTimeZone)} (${browserTimeZone})`
}

/** IP location can't be made precise, but it can be sanity-checked: when the
 * IP's zone and the browser's zone sit at different UTC offsets, the IP is
 * usually a VPN, proxy or corporate gateway — or the visitor is travelling. */
export function timezonesDisagree(
  date: Date,
  ipTimeZone?: string,
  browserTimeZone?: string
): boolean {
  const ip = validTimeZone(ipTimeZone)
  if (!ip || !browserTimeZone) return false
  return utcOffset(date, ip) !== utcOffset(date, browserTimeZone)
}
