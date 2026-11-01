// Checks an existing tagged link: what each parameter says, which GA4 channel
// it lands in, what is wrong, and a cleaned version. Pure, no React and no
// "@/" imports so node:test can run it.

import {
  buildUtmUrl,
  ga4Channel,
  linkWarnings,
  normalizeValue,
  UTM_KEYS,
  type UtmFields,
} from './utm.ts'

export interface Issue {
  level: 'problem' | 'tip'
  text: string
}

export interface Analysis {
  input: string
  error: string
  params: { key: string; value: string }[]
  channel: string
  issues: Issue[]
  /** A tidied link, only when it differs from the input. */
  cleaned: string
}

// Parameters GA4 reads besides the five main ones.
const OTHER_UTM = new Set(['id', 'source_platform', 'creative_format', 'marketing_tactic'])
const MAIN = new Set<string>(UTM_KEYS)

export const MAX_CHECK_LINKS = 50

export function analyzeLink(raw: string): Analysis {
  const input = raw.trim()
  const blank: Analysis = { input, error: '', params: [], channel: '', issues: [], cleaned: '' }
  let u: URL
  try {
    u = new URL(input)
  } catch {
    return { ...blank, error: 'That does not look like a full link. Start with https://' }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:')
    return { ...blank, error: 'Use an http or https link.' }

  const issues: Issue[] = []
  const params = [...u.searchParams.entries()].map(([key, value]) => ({ key, value }))
  const counts = new Map<string, number>()
  params.forEach((p) => counts.set(p.key, (counts.get(p.key) ?? 0) + 1))

  // Read the five main values; a mistyped name such as UTM_Source is rescued for the cleaned link.
  const fields: UtmFields = { url: '', source: '', medium: '', campaign: '', term: '', content: '' }
  const rescued = { ...fields }
  const kept = new URLSearchParams()
  for (const { key, value } of params) {
    const lower = key.toLowerCase()
    if (!lower.startsWith('utm')) {
      kept.append(key, value)
      continue
    }
    const name = lower.replace(/^utm[-_ ]?/, '')
    const exact = key === `utm_${name}`
    if (MAIN.has(name)) {
      const k = name as keyof typeof rescued
      if (!rescued[k]) rescued[k] = value
      if (exact && !fields[k]) fields[k] = value
      if (!exact)
        issues.push({
          level: 'problem',
          text: `"${key}" will not be read. The name must be exactly utm_${name}, all lowercase.`,
        })
    } else if (exact && OTHER_UTM.has(name)) {
      kept.append(key, value)
    } else {
      issues.push({
        level: 'problem',
        text: `"${key}" is not a UTM parameter GA4 reads. Check the spelling.`,
      })
    }
  }

  for (const [key, n] of counts)
    if (n > 1 && key.toLowerCase().startsWith('utm'))
      issues.push({ level: 'problem', text: `${key} appears ${n} times. Keep one.` })

  if (u.hash.toLowerCase().includes('utm_'))
    issues.push({
      level: 'problem',
      text: 'The UTM parameters come after a # in this link. Analytics does not read that part; they must come before the #.',
    })

  const hasUtm = params.some((p) => p.key.toLowerCase().startsWith('utm'))
  if (!hasUtm) {
    issues.push({
      level: 'tip',
      text: 'This link has no UTM parameters, so visits from it cannot be told apart.',
    })
  } else {
    if (!fields.source)
      issues.push({
        level: 'problem',
        text: 'utm_source is missing. GA4 needs source and medium to sort the visit.',
      })
    if (!fields.medium)
      issues.push({
        level: 'problem',
        text: 'utm_medium is missing. GA4 needs source and medium to sort the visit.',
      })
    if (!fields.campaign)
      issues.push({
        level: 'tip',
        text: 'No utm_campaign. Reports cannot group this visit into a campaign.',
      })
  }

  for (const k of UTM_KEYS) {
    const v = fields[k]
    if (!v) continue
    if (/\s/.test(v))
      issues.push({ level: 'problem', text: `utm_${k} has spaces ("${v}"). Use hyphens.` })
    else if (v !== v.toLowerCase())
      issues.push({
        level: 'problem',
        text: `utm_${k} has capital letters ("${v}"). GA4 treats Email and email as two different rows.`,
      })
  }
  if (/[_]/.test(fields.campaign) && /-/.test(fields.campaign))
    issues.push({ level: 'tip', text: 'The campaign name mixes "_" and "-". Pick one separator.' })

  const channel = ga4Channel(fields.source, fields.medium)
  if (channel === 'Unassigned' && fields.source && fields.medium)
    issues.push({
      level: 'problem',
      text: `GA4 will file this under Unassigned: it does not recognise the medium "${normalizeValue(fields.medium)}" with source "${normalizeValue(fields.source)}".`,
    })
  for (const w of linkWarnings({ ...fields, url: input }, input))
    issues.push({ level: 'tip', text: w })

  let cleaned = ''
  if (hasUtm) {
    const base = new URL(input)
    base.search = kept.toString()
    const built = buildUtmUrl({ ...rescued, url: base.toString() })
    if (built.url && built.url !== input) cleaned = built.url
  }
  return { input, error: '', params, channel, issues, cleaned }
}

/** Only the utm_ parameters, without the "?": what Google Ads' Final URL suffix box expects. */
export function adsSuffix(url: string): string {
  const query = url.split('#')[0].split('?')[1] ?? ''
  return query
    .split('&')
    .filter((p) => p.startsWith('utm_'))
    .join('&')
}
