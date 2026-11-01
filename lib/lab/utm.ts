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

/** Lowercase, whitespace to hyphens, drop anything not URL-safe. GA4 is case-sensitive. */
export function normalizeValue(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
}

export interface BuildResult {
  url: string
  /** Fields whose value was changed by normalisation, e.g. "source: Google Ads → google-ads" */
  changes: string[]
  error: string
}

export function buildUtmUrl(fields: UtmFields): BuildResult {
  const empty = { url: '', changes: [], error: '' }
  const raw = fields.url.trim()
  if (!raw) return empty

  let base: URL
  try {
    base = new URL(raw)
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
    const value = normalizeValue(original)
    if (!value) continue
    if (value !== original) changes.push(`${key}: ${original} → ${value}`)
    params.set(`utm_${key}`, value)
  }
  base.search = params.toString()
  return { url: base.toString(), changes, error: '' }
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
}

// Mediums GA4's default channel grouping commonly recognises. Anything else
// tends to land in "Unassigned", which is the usual cause of "my campaign
// traffic is missing from the channel report".
const KNOWN_MEDIUMS = new Set([
  'cpc',
  'ppc',
  'paidsearch',
  'paid-search',
  'email',
  'social',
  'paid-social',
  'organic',
  'referral',
  'display',
  'cpm',
  'banner',
  'affiliate',
  'video',
  'sms',
  'push',
])

const SOURCE_ALIASES: Record<string, string> = {
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
    if (m && !KNOWN_MEDIUMS.has(m))
      out.push(
        `Row ${n}: medium "${m}" is not a standard GA4 medium, so it may land in Unassigned.`
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

const CSV_HEADER = ['url', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

function cell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toTable(rows: SheetRow[], sep: string, escape: (v: string) => string): string {
  const lines = rows.map((r) =>
    [r.url, ...UTM_KEYS.map((k) => normalizeValue(r.fields[k]))].map(escape).join(sep)
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
    const line = raw.trim()
    if (!line) return
    try {
      const u = new URL(line)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('protocol')
      if (!urls.includes(line)) urls.push(line)
    } catch {
      invalid.push({ line: i + 1, text: line })
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
  channels: ChannelPreset[]
): TaggedLink[] {
  const targets = channels.length
    ? channels.map((c) => ({ label: c.label, source: c.source, medium: c.medium }))
    : [{ label: '', source: base.source, medium: base.medium }]
  return urls.flatMap((url) =>
    targets.map((t) => {
      const fields = { ...base, url, source: t.source, medium: t.medium }
      return { label: t.label, fields, result: buildUtmUrl(fields) }
    })
  )
}

/** Adds "-YYYY-MM" to a campaign name unless it already ends with that month. */
export function withMonth(campaign: string, now: Date): string {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const name = normalizeValue(campaign)
  if (name.endsWith(month)) return name
  return name ? `${name}-${month}` : month
}

const NON_PAID = new Set(['email', 'social', 'organic', 'referral', 'sms', 'push'])

/** Soft hints about a finished link; none of them block copying. */
export function linkWarnings(fields: UtmFields, url: string): string[] {
  const out: string[] = []
  if (url.length > 2000)
    out.push(`This link is ${url.length} characters; some platforms cut links over about 2,000.`)
  if (fields.term.trim() && NON_PAID.has(normalizeValue(fields.medium)))
    out.push(
      'utm_term is meant for paid-search keywords; it is probably not needed for this medium.'
    )
  return out
}
