// Pure helpers for "take the style from a web address": which addresses are safe to fetch, and
// which picture on a page stands for it. No imports, so node:test can run it.

/** Expand an IPv6 text address into 8 16-bit groups, or null if it is not valid. */
function groups6(ip: string): number[] | null {
  let s = ip.toLowerCase()
  const zone = s.indexOf('%')
  if (zone >= 0) s = s.slice(0, zone)
  // An embedded IPv4 tail (::ffff:1.2.3.4) becomes two groups.
  const v4 = s.match(/^(.*:)(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const b = v4.slice(2, 6).map(Number)
    if (b.some((n) => n > 255)) return null
    s = `${v4[1]}${((b[0] << 8) | b[1]).toString(16)}:${((b[2] << 8) | b[3]).toString(16)}`
  }
  const halves = s.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null
  const all = [...head, ...Array(fill).fill('0'), ...tail]
  if (all.length !== 8) return null
  const out = all.map((h) => (/^[0-9a-f]{1,4}$/.test(h) ? parseInt(h, 16) : NaN))
  return out.some(Number.isNaN) ? null : out
}

function isPrivate4(a: number, b: number): boolean {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast and reserved
  )
}

/** True for any address a public page fetch must never touch: loopback, private, link-local, etc. */
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const n = v4.slice(1, 5).map(Number)
    if (n.some((x) => x > 255)) return true
    return isPrivate4(n[0], n[1])
  }
  const g = groups6(ip)
  if (!g) return true // anything we cannot read is treated as unsafe
  if (g.every((x) => x === 0)) return true // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true // ::1
  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible: judge the embedded v4 address.
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) {
    return isPrivate4(g[6] >> 8, g[6] & 255)
  }
  if ((g[0] & 0xfe00) === 0xfc00) return true // unique local fc00::/7
  if ((g[0] & 0xffc0) === 0xfe80) return true // link-local fe80::/10
  if ((g[0] & 0xff00) === 0xff00) return true // multicast
  if (g[0] === 0x64 && g[1] === 0xff9b) return true // NAT64 can reach IPv4 space
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true // documentation
  return false
}

/** Parse what a visitor typed into an http(s) address, or explain in plain words why not. */
export function parseWebAddress(input: string): { url: URL } | { error: string } {
  let raw = input.trim()
  if (!raw) return { error: 'Type a web address first.' }
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { error: 'That does not look like a web address.' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    return { error: 'Only http and https addresses work.' }
  if (url.username || url.password) return { error: 'Leave the username and password out.' }
  if (url.port && url.port !== '80' && url.port !== '443')
    return { error: 'Only the normal web ports (80 and 443) are allowed.' }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (!host.includes('.') && !host.includes(':')) return { error: 'That address has no domain.' }
  if (/^(localhost|.*\.(localhost|local|internal|lan|home))$/i.test(host))
    return { error: 'Only public web addresses work.' }
  if (/^[\d.]+$|:/.test(host) && isPrivateAddress(host))
    return { error: 'Only public web addresses work.' }
  return { url }
}

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '')
  return out
}

const IMAGE_META = [
  'og:image',
  'og:image:secure_url',
  'og:image:url',
  'twitter:image',
  'twitter:image:src',
]

/** The picture a page offers for sharing (og:image, then twitter:image, then image_src), as an absolute URL. */
export function findImageUrl(html: string, base: string): string | null {
  const metas: { key: string; value: string }[] = []
  let link = ''
  for (const m of html.matchAll(/<(meta|link)\b[^>]*>/gi)) {
    const a = attrs(m[0])
    if (m[1].toLowerCase() === 'meta') {
      const key = (a.property || a.name || '').toLowerCase()
      if (IMAGE_META.includes(key) && a.content) metas.push({ key, value: a.content })
    } else if (!link && /\bimage_src\b/i.test(a.rel || '') && a.href) {
      link = a.href
    }
  }
  metas.sort((x, y) => IMAGE_META.indexOf(x.key) - IMAGE_META.indexOf(y.key))
  for (const raw of [...metas.map((m) => m.value), link]) {
    if (!raw.trim()) continue
    try {
      const u = new URL(raw.trim(), base)
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString()
    } catch {
      // try the next candidate
    }
  }
  return null
}
