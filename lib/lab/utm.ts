// UTM logic for the Lab builder. Pure, no React and no "@/" imports so
// node:test can run it.

export interface UtmFields {
  url: string
  source: string
  medium: string
  campaign: string
  term: string
  content: string
}

export const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const
export type UtmKey = (typeof UTM_KEYS)[number]

export interface AdPlaceholder {
  token: string
  label: string
}

// Google Ads ValueTrack parameters (support.google.com/google-ads/answer/2375447).
export const GOOGLE_PLACEHOLDERS: AdPlaceholder[] = [
  { token: '{campaignid}', label: 'Campaign ID' },
  { token: '{adgroupid}', label: 'Ad group ID' },
  { token: '{keyword}', label: 'Keyword' },
  { token: '{matchtype}', label: 'Match type' },
  { token: '{creative}', label: 'Ad ID' },
]

// Meta dynamic URL parameters, as listed by secondary sources; Meta's own page was not reachable.
export const META_PLACEHOLDERS: AdPlaceholder[] = [
  { token: '{{campaign.name}}', label: 'Campaign name' },
  { token: '{{adset.name}}', label: 'Ad set name' },
  { token: '{{ad.name}}', label: 'Ad name' },
  { token: '{{placement}}', label: 'Placement' },
]

const ALL_TOKENS = new Set([...GOOGLE_PLACEHOLDERS, ...META_PLACEHOLDERS].map((p) => p.token))
const TOKEN_RE = /\{\{?[a-z_.]+\}\}?/g
const ENCODED_TOKEN_RE = /%7B(?:%7B)?[a-z_.]+%7D(?:%7D)?/gi

/** Ad-platform placeholders offered for a source; empty when the platform has none we know. */
export function placeholdersFor(source: string): AdPlaceholder[] {
  const s = source.trim().toLowerCase()
  if (s === 'google') return GOOGLE_PLACEHOLDERS
  if (['facebook', 'fb', 'instagram', 'ig'].includes(s)) return META_PLACEHOLDERS
  return []
}

/** Known placeholders found in a value or link. */
export const tokensIn = (value: string) =>
  (value.match(TOKEN_RE) ?? []).filter((t) => ALL_TOKENS.has(t))

/** "-" or "_" between words; undefined leaves the value as typed. Not applied to source or medium. */
export type Separator = '-' | '_'
export const applySeparator = (value: string, sep?: Separator) =>
  sep === '_' ? value.replace(/-/g, '_') : sep === '-' ? value.replace(/_/g, '-') : value

const BARE_HOST = /^(localhost|[^\s/?#:@]+\.[^\s/?#:@]+)(:\d+)?([/?#]\S*)?$/i

/**
 * Adds https:// when a bare domain was typed ("example.com/pricing"). Anything that already
 * has a scheme, or is not a plausible address, is returned as typed so the caller's own
 * checks still reject mailto:, javascript: and plain words.
 */
export function withScheme(raw: string): string {
  const s = raw.trim()
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) return s
  return BARE_HOST.test(s) ? `https://${s}` : s
}

/**
 * Lowercase, whitespace to hyphens, drop anything not URL-safe. GA4 is
 * case-sensitive. Letters and digits from any language are kept (a Hindi or
 * accented campaign name stays readable); symbols and emoji are dropped. Known
 * ad-platform placeholders such as {keyword} pass through untouched so the ad
 * platform can fill them in.
 */
export function normalizeValue(raw: string): string {
  const kept: string[] = []
  const guarded = raw.replace(TOKEN_RE, (m) =>
    ALL_TOKENS.has(m) ? `zzph${kept.push(m) - 1}zz` : m
  )
  return guarded
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}\-_.]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
    .replace(/zzph(\d+)zz/g, (_, i) => kept[Number(i)])
}

export interface BuildResult {
  url: string
  /** Fields whose value was changed by normalisation, e.g. "source: Google Ads → google-ads" */
  changes: string[]
  error: string
}

export function buildUtmUrl(fields: UtmFields, sep?: Separator): BuildResult {
  const empty = { url: '', changes: [], error: '' }
  const raw = fields.url.trim()
  if (!raw) return empty

  let base: URL
  try {
    base = new URL(withScheme(raw))
  } catch {
    return { ...empty, error: 'That URL looks incomplete — include https://' }
  }
  if (base.protocol !== 'http:' && base.protocol !== 'https:') {
    return { ...empty, error: 'Use an http or https URL.' }
  }

  const params = new URLSearchParams(base.search)
  const changes: string[] = []
  for (const key of UTM_KEYS) {
    const original = fields[key].trim()
    if (!original) continue
    const clean = normalizeValue(original)
    const value = key === 'source' || key === 'medium' ? clean : applySeparator(clean, sep)
    if (!value) continue
    if (value !== original) changes.push(`${key}: ${original} → ${value}`)
    params.set(`utm_${key}`, value)
  }
  base.search = params.toString()
  // URLSearchParams encodes the braces of a placeholder; the ad platform needs them raw.
  const url = base
    .toString()
    .replace(ENCODED_TOKEN_RE, (m) =>
      ALL_TOKENS.has(decodeURIComponent(m)) ? decodeURIComponent(m) : m
    )
  return { url, changes, error: '' }
}

export interface ChannelPreset {
  label: string
  source: string
  medium: string
}

export const PRESETS: ChannelPreset[] = [
  { label: 'Google Ads', source: 'google', medium: 'cpc' },
  { label: 'Bing Ads', source: 'bing', medium: 'cpc' },
  { label: 'Meta Ads', source: 'facebook', medium: 'paid-social' },
  { label: 'Instagram Ads', source: 'instagram', medium: 'paid-social' },
  { label: 'LinkedIn Ads', source: 'linkedin', medium: 'paid-social' },
  { label: 'Newsletter', source: 'newsletter', medium: 'email' },
  { label: 'Organic social', source: 'linkedin', medium: 'social' },
]

export interface SheetRow {
  id: string
  fields: UtmFields
  url: string
  /** Audit trail, filled when the row is saved: YYYY-MM-DD, who, which team-rules version. */
  createdAt?: string
  owner?: string
  rules?: string
}

const SEARCH = new Set([
  'google',
  'bing',
  'yahoo',
  'baidu',
  'duckduckgo',
  'yandex',
  'ecosia',
  'naver',
  'ask',
  'aol',
  'brave',
  'startpage',
])
const SOCIAL = new Set([
  'facebook',
  'fb',
  'instagram',
  'ig',
  'linkedin',
  'twitter',
  'x',
  'pinterest',
  'reddit',
  'tiktok',
  'snapchat',
  'whatsapp',
  'threads',
  'quora',
  'tumblr',
  'mastodon',
])
const VIDEO = new Set(['youtube', 'vimeo', 'twitch'])
const PAID_MEDIUM = /^(.*cp.*|ppc|retargeting|paid.*)$/

/**
 * Which GA4 default channel a source/medium pair lands in. Follows Google's
 * documented rules in their evaluation order, simplified: it ignores the
 * Direct, Shopping and Cross-network cases and any custom channel groups the
 * property defines. "Unassigned" is the usual cause of campaign traffic
 * missing from the channel report.
 */
export function ga4Channel(source: string, medium: string): string {
  const s = normalizeValue(source)
  const m = normalizeValue(medium)
  if (!s && !m) return ''
  const paid = PAID_MEDIUM.test(m)
  if (paid && SEARCH.has(s)) return 'Paid Search'
  if (paid && SOCIAL.has(s)) return 'Paid Social'
  if (paid && VIDEO.has(s)) return 'Paid Video'
  if (/^(display|banner|expandable|interstitial|cpm)$/.test(m)) return 'Display'
  if (paid) return 'Paid Other'
  if (SOCIAL.has(s) && /^(social|social-network|social-media|sm)$/.test(m)) return 'Organic Social'
  if (VIDEO.has(s) && m.includes('video')) return 'Organic Video'
  if (SEARCH.has(s) && m === 'organic') return 'Organic Search'
  if (/^(referral|app|link)$/.test(m)) return 'Referral'
  if (/^e-?mail$/.test(m)) return 'Email'
  if (m === 'affiliate') return 'Affiliates'
  if (m === 'audio') return 'Audio'
  if (s === 'sms' || m === 'sms') return 'SMS'
  if (m.endsWith('push') || /mobile|notification/.test(m)) return 'Mobile Push Notifications'
  return 'Unassigned'
}

export const SOURCE_ALIASES: Record<string, string> = {
  fb: 'facebook',
  ig: 'instagram',
  li: 'linkedin',
  adwords: 'google',
  gads: 'google',
}

/** Consistency problems normalisation cannot fix, across the whole sheet. */
export function lintRows(rows: SheetRow[]): string[] {
  const out: string[] = []
  const seen = new Map<string, number>()
  rows.forEach((row, i) => {
    const n = i + 1
    const { source, medium } = row.fields
    const s = normalizeValue(source)
    const m = normalizeValue(medium)
    if (ga4Channel(s, m) === 'Unassigned')
      out.push(
        `Row ${n}: GA4 will file source "${s}" / medium "${m}" under Unassigned. Use a standard medium such as cpc, email or social.`
      )
    if (s && SOURCE_ALIASES[s])
      out.push(`Row ${n}: source "${s}" — use "${SOURCE_ALIASES[s]}" so it groups with other rows.`)
    const prev = seen.get(row.url)
    if (prev) out.push(`Row ${n}: same link as row ${prev}.`)
    else seen.set(row.url, n)
  })
  const campaigns = rows.map((r) => normalizeValue(r.fields.campaign)).filter(Boolean)
  if (campaigns.some((c) => c.includes('_')) && campaigns.some((c) => c.includes('-')))
    out.push(
      'Campaign names mix "_" and "-". Pick one separator so names sort and filter together.'
    )
  return out
}

const CSV_HEADER = [
  'url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ga4_channel',
  'created_at',
  'owner',
  'rules_version',
]

function cell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toTable(rows: SheetRow[], sep: string, escape: (v: string) => string): string {
  const lines = rows.map((r) =>
    [
      r.url,
      ...UTM_KEYS.map((k) => normalizeValue(r.fields[k])),
      ga4Channel(r.fields.source, r.fields.medium),
      r.createdAt ?? '',
      r.owner ?? '',
      r.rules ?? '',
    ]
      .map(escape)
      .join(sep)
  )
  return [CSV_HEADER.join(sep), ...lines].join('\n')
}

export const toCsv = (rows: SheetRow[]) => toTable(rows, ',', cell)
/** Tab-separated, pastes straight into Google Sheets or Excel. */
export const toTsv = (rows: SheetRow[]) => toTable(rows, '\t', (v) => v.replace(/[\t\n]/g, ' '))

/**
 * A pasted link that already carries utm_ params: returns the link without
 * them plus their values, so the visitor can adjust instead of retype.
 * Null when there is nothing to import.
 */
export function splitUtm(raw: string): { base: string; fields: Omit<UtmFields, 'url'> } | null {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  const fields = { source: '', medium: '', campaign: '', term: '', content: '' }
  let found = false
  for (const key of UTM_KEYS) {
    const v = u.searchParams.get(`utm_${key}`)
    if (v) {
      fields[key] = v
      found = true
    }
    u.searchParams.delete(`utm_${key}`)
  }
  return found ? { base: u.toString(), fields } : null
}

export interface TaggedLink {
  /** Channel name shown next to the link; empty for a single custom channel. */
  label: string
  fields: UtmFields
  result: BuildResult
}

export const channelKey = (p: { source: string; medium: string }) =>
  `${normalizeValue(p.source)}/${normalizeValue(p.medium)}`

/** The preset whose source and medium match, e.g. after pasting a tagged link. */
export function matchPreset(
  source: string,
  medium: string,
  presets: ChannelPreset[]
): ChannelPreset | undefined {
  const key = channelKey({ source, medium })
  return presets.find((p) => channelKey(p) === key)
}

export const MAX_BULK_URLS = 50

/** One link per line. Blank lines and repeats are dropped; invalid lines are reported. */
export function parseUrlList(text: string): {
  urls: string[]
  invalid: { line: number; text: string }[]
  truncated: boolean
} {
  const urls: string[] = []
  const invalid: { line: number; text: string }[] = []
  text.split(/\r?\n/).forEach((raw, i) => {
    const typed = raw.trim()
    if (!typed) return
    const line = withScheme(typed)
    try {
      const u = new URL(line)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('protocol')
      if (!urls.includes(line)) urls.push(line)
    } catch {
      invalid.push({ line: i + 1, text: typed })
    }
  })
  return { urls: urls.slice(0, MAX_BULK_URLS), invalid, truncated: urls.length > MAX_BULK_URLS }
}

/**
 * Every landing page x every chosen channel. With no channel chosen, one link
 * per page using the custom source and medium in `base`.
 */
export function buildMatrix(
  urls: string[],
  base: UtmFields,
  channels: ChannelPreset[],
  sep?: Separator,
  /** Ad versions to test; each becomes its own utm_content and its own link. */
  variants: string[] = []
): TaggedLink[] {
  const targets = channels.length
    ? channels.map((c) => ({ label: c.label, source: c.source, medium: c.medium }))
    : [{ label: '', source: base.source, medium: base.medium }]
  const versions: (string | null)[] = variants.length ? variants : [null]
  const out: TaggedLink[] = []
  for (const url of urls)
    for (const t of targets)
      for (const v of versions) {
        const fields = {
          ...base,
          url,
          source: t.source,
          medium: t.medium,
          ...(v !== null && { content: v }),
        }
        out.push({
          label: [t.label, v].filter(Boolean).join(' · '),
          fields,
          result: buildUtmUrl(fields, sep),
        })
        if (out.length >= MAX_LINKS) return out
      }
  return out
}

/** Pages x channels x versions can multiply fast; past this the list is cut. */
export const MAX_LINKS = 300
export const MAX_VARIANTS = 10

/** "blue-button, green-button" or one per line, cleaned, without repeats. */
export function parseVariants(text: string): string[] {
  const seen = new Set<string>()
  for (const part of text.split(/[,\n]/)) {
    const v = normalizeValue(part)
    if (v) seen.add(v)
  }
  return [...seen].slice(0, MAX_VARIANTS)
}

/** Adds "-YYYY-MM" to a campaign name unless it already ends with that month. */
export function withMonth(campaign: string, now: Date, sep: Separator = '-'): string {
  const month = `${now.getFullYear()}${sep}${String(now.getMonth() + 1).padStart(2, '0')}`
  const name = applySeparator(normalizeValue(campaign), sep)
  if (name.endsWith(month)) return name
  return name ? `${name}${sep}${month}` : month
}

const NON_PAID = new Set(['email', 'social', 'organic', 'referral', 'sms', 'push'])

/** Soft hints about a finished link; none of them block copying. */
export function linkWarnings(fields: UtmFields, url: string): string[] {
  const out: string[] = []
  if (url.length > 2000)
    out.push(`This link is ${url.length} characters; some platforms cut links over about 2,000.`)
  const tokens = tokensIn(url)
  if (tokens.length) {
    out.push(
      'This link has ad-platform placeholders. Paste it into the ad platform; opened directly it shows the placeholder text, and a QR code would not work.'
    )
    const google = tokens.some((t) => GOOGLE_PLACEHOLDERS.some((p) => p.token === t))
    const meta = tokens.some((t) => META_PLACEHOLDERS.some((p) => p.token === t))
    const owner = placeholdersFor(fields.source)
    if ((google && owner !== GOOGLE_PLACEHOLDERS) || (meta && owner !== META_PLACEHOLDERS))
      out.push('A placeholder here belongs to a different ad platform than the source you chose.')
  }
  if (fields.term.trim() && NON_PAID.has(normalizeValue(fields.medium)))
    out.push(
      'utm_term is meant for paid-search keywords; it is probably not needed for this medium.'
    )
  return out
}

/** Splits CSV or tab-separated text into cells; handles quotes and escaped quotes. */
export function parseDelimited(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0]
  const sep = first.includes('\t')
    ? '\t'
    : first.split(';').length > first.split(',').length
      ? ';'
      : ','
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"' && !cur) quoted = true
    else if (ch === sep) {
      row.push(cur)
      cur = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
    } else cur += ch
  }
  if (cur || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim()))
}

export const MAX_IMPORT_ROWS = 500

/**
 * A pasted or uploaded sheet of links. A header row is optional and may name
 * columns "url, source, medium, campaign, term, content" with or without the
 * utm_ prefix, in any order; without one the order is exactly that. Links that
 * already carry utm_ params fill any blank cell. Values are cleaned the same
 * way as in the form; rows that cannot be built are reported by line number.
 */
export function parseSheet(text: string): {
  rows: Omit<SheetRow, 'id'>[]
  errors: { line: number; message: string }[]
  fixed: number
  truncated: boolean
} {
  const table = parseDelimited(text.replace(/^﻿/, ''))
  const cols: Record<string, number> = {}
  const names = ['url', ...UTM_KEYS]
  const head = table[0]?.map((c) => c.trim().toLowerCase().replace(/^utm_/, '')) ?? []
  const hasHeader = head.includes('url') || head.includes('link')
  if (hasHeader) head.forEach((h, i) => (cols[h === 'link' ? 'url' : h] ??= i))
  else names.forEach((n, i) => (cols[n] = i))

  const rows: Omit<SheetRow, 'id'>[] = []
  const errors: { line: number; message: string }[] = []
  let fixed = 0
  const body = hasHeader ? table.slice(1) : table
  body.slice(0, MAX_IMPORT_ROWS).forEach((cells, i) => {
    const line = i + 1 + (hasHeader ? 1 : 0)
    const get = (k: string) => (cols[k] === undefined ? '' : (cells[cols[k]] ?? '').trim())
    const split = splitUtm(get('url'))
    const fields: UtmFields = {
      url: split ? split.base : get('url'),
      source: get('source') || split?.fields.source || '',
      medium: get('medium') || split?.fields.medium || '',
      campaign: get('campaign') || split?.fields.campaign || '',
      term: get('term') || split?.fields.term || '',
      content: get('content') || split?.fields.content || '',
    }
    const built = buildUtmUrl(fields)
    if (built.error || !built.url) {
      errors.push({ line, message: built.error || 'No link on this line.' })
      return
    }
    if (built.changes.length) fixed++
    rows.push({ fields, url: built.url })
  })
  return { rows, errors, fixed, truncated: body.length > MAX_IMPORT_ROWS }
}
