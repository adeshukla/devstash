// Team naming rules for the UTM builder. Pure, no React and no "@/" imports so
// node:test can run it. A rule set travels in a share link, so a team needs
// no login, server or shared account.

import {
  applySeparator,
  channelKey,
  normalizeValue,
  type ChannelPreset,
  type Separator,
  type SheetRow,
} from './utm.ts'

export interface UtmRules {
  /** The only channels the form offers. Empty means no rules are active. */
  channels: ChannelPreset[]
  separator: Separator
  /** Optional shape for campaign names, e.g. "{name}-{yyyy}-{mm}". */
  pattern?: string
}

export const NO_RULES: UtmRules = { channels: [], separator: '-' }
export const MAX_RULE_CHANNELS = 30

export const rulesActive = (r: UtmRules) => r.channels.length > 0

// ─── Campaign name pattern ───────────────────────────────────────────────────
// Parts a pattern may use. Anything else outside braces is written as typed.

const PATTERN_PARTS: Record<string, { regex: string; example: (now: Date) => string }> = {
  name: { regex: '[a-z0-9]+(?:[-_][a-z0-9]+)*', example: () => 'spring-sale' },
  yyyy: { regex: '\\d{4}', example: (d) => String(d.getFullYear()) },
  mm: { regex: '\\d{2}', example: (d) => String(d.getMonth() + 1).padStart(2, '0') },
  dd: { regex: '\\d{2}', example: (d) => String(d.getDate()).padStart(2, '0') },
  n: { regex: '\\d+', example: () => '1' },
}

export const MAX_PATTERN = 60

/** Empty string when the pattern is usable, otherwise what is wrong with it. */
export function patternError(pattern: string): string {
  const p = pattern.trim()
  if (!p) return ''
  if (p.length > MAX_PATTERN) return `Keep the pattern under ${MAX_PATTERN} characters.`
  const parts = p.split(/(\{[^{}]*\})/)
  let tokens = 0
  for (const part of parts) {
    if (part.startsWith('{')) {
      if (!PATTERN_PARTS[part.slice(1, -1)])
        return `Unknown part ${part}. Use {name}, {yyyy}, {mm}, {dd} or {n}.`
      tokens++
    } else if (/[^a-z0-9_-]/.test(part)) {
      return 'Between the parts use only lowercase letters, digits, "-" and "_".'
    }
  }
  return tokens ? '' : 'Add at least one part, for example {name}-{yyyy}-{mm}.'
}

function patternRegex(pattern: string): RegExp {
  const body = pattern
    .trim()
    .split(/(\{[^{}]*\})/)
    .map((part) =>
      part.startsWith('{')
        ? PATTERN_PARTS[part.slice(1, -1)].regex
        : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    .join('')
  return new RegExp(`^${body}$`)
}

/** True when there is no pattern, or the (already cleaned) name fits it. */
export function matchesPattern(name: string, rules: UtmRules): boolean {
  const p = rules.pattern?.trim()
  if (!p || patternError(p)) return true
  return patternRegex(p).test(name)
}

/** A sample name that fits the pattern, for hints. */
export function patternExample(pattern: string, sep: Separator, now: Date): string {
  const out = pattern
    .trim()
    .split(/(\{[^{}]*\})/)
    .map((part) =>
      part.startsWith('{') ? (PATTERN_PARTS[part.slice(1, -1)]?.example(now) ?? '') : part
    )
    .join('')
  return applySeparator(out, sep)
}

/** One channel per line: "Label, source, medium". */
export function parseChannelLines(text: string): {
  channels: ChannelPreset[]
  errors: { line: number; text: string }[]
} {
  const channels: ChannelPreset[] = []
  const errors: { line: number; text: string }[] = []
  const seen = new Set<string>()
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    const [label = '', source = '', medium = ''] = line.split(',').map((s) => s.trim())
    const channel = {
      label: label.slice(0, 40),
      source: normalizeValue(source),
      medium: normalizeValue(medium),
    }
    if (!channel.label || !channel.source || !channel.medium) {
      errors.push({ line: i + 1, text: line })
      return
    }
    const key = channelKey(channel)
    if (seen.has(key)) return
    seen.add(key)
    channels.push(channel)
  })
  return { channels: channels.slice(0, MAX_RULE_CHANNELS), errors }
}

export const channelLines = (channels: ChannelPreset[]) =>
  channels.map((c) => `${c.label}, ${c.source}, ${c.medium}`).join('\n')

/** Short, stable id for a rule set, written into exports so rows say which rules they followed. */
export function rulesVersion(rules: UtmRules): string {
  const text = JSON.stringify([
    rules.separator,
    rules.pattern?.trim() ?? '',
    ...rules.channels.map((c) => [c.label, c.source, c.medium]),
  ])
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(8, '0').slice(0, 6)
}

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)))
const unb64 = (s: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)))

export function encodeRules(rules: UtmRules): string {
  const json = JSON.stringify({
    s: rules.separator,
    c: rules.channels.map((c) => [c.label, c.source, c.medium]),
    ...(rules.pattern?.trim() && { p: rules.pattern.trim() }),
  })
  return b64(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Null for anything that is not a well-formed rule set; never throws. */
export function decodeRules(encoded: string): UtmRules | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const data: unknown = JSON.parse(unb64(padded + '='.repeat((4 - (padded.length % 4)) % 4)))
    if (typeof data !== 'object' || data === null) return null
    const { s, c, p } = data as { s?: unknown; c?: unknown; p?: unknown }
    if ((s !== '-' && s !== '_') || !Array.isArray(c)) return null
    const channels = c
      .filter(
        (x): x is string[] =>
          Array.isArray(x) && x.length === 3 && x.every((v) => typeof v === 'string')
      )
      .map(([label, source, medium]) => ({
        label: label.slice(0, 40),
        source: normalizeValue(source),
        medium: normalizeValue(medium),
      }))
      .filter((x) => x.label && x.source && x.medium)
      .slice(0, MAX_RULE_CHANNELS)
    const pattern = typeof p === 'string' && p.trim() && !patternError(p) ? p.trim() : ''
    return channels.length ? { channels, separator: s, ...(pattern && { pattern }) } : null
  } catch {
    return null
  }
}

/** Problems with saved rows when rules are active: wrong channel or wrong separator. */
export function ruleIssues(rows: SheetRow[], rules: UtmRules): string[] {
  if (!rulesActive(rules)) return []
  const allowed = new Set(rules.channels.map(channelKey))
  const out: string[] = []
  rows.forEach((row, i) => {
    const n = i + 1
    if (!allowed.has(channelKey(row.fields)))
      out.push(
        `Row ${n}: ${row.fields.source}/${row.fields.medium} is not one of the team's channels.`
      )
    for (const key of ['campaign', 'term', 'content'] as const) {
      const v = normalizeValue(row.fields[key])
      if (v && applySeparator(v, rules.separator) !== v)
        out.push(`Row ${n}: ${key} "${v}" should use "${rules.separator}" between words.`)
    }
    const campaign = normalizeValue(row.fields.campaign)
    if (campaign && !matchesPattern(campaign, rules))
      out.push(
        `Row ${n}: campaign "${campaign}" does not follow the team pattern ${rules.pattern}.`
      )
  })
  return out
}
