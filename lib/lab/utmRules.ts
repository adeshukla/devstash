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
}

export const NO_RULES: UtmRules = { channels: [], separator: '-' }
export const MAX_RULE_CHANNELS = 30

export const rulesActive = (r: UtmRules) => r.channels.length > 0

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
  })
  return b64(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Null for anything that is not a well-formed rule set; never throws. */
export function decodeRules(encoded: string): UtmRules | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const data: unknown = JSON.parse(unb64(padded + '='.repeat((4 - (padded.length % 4)) % 4)))
    if (typeof data !== 'object' || data === null) return null
    const { s, c } = data as { s?: unknown; c?: unknown }
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
    return channels.length ? { channels, separator: s } : null
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
  })
  return out
}
