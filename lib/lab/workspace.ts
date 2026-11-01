// The UTM workspace as one file: saved links, channels, team rules, owner and
// remembered merges. Lets people move to another browser, back up before
// clearing site data, or hand a team the same setup. Pure, no React and no
// "@/" imports so node:test can run it.

import type { ChannelPreset, SheetRow } from './utm.ts'

export const WORKSPACE_APP = 'devstash-utm'
export const MAX_ALIASES = 2000

export interface Workspace {
  app: typeof WORKSPACE_APP
  version: 1
  exportedAt: string
  sheet: SheetRow[]
  presets: ChannelPreset[]
  /** Encoded team rules (see utmRules.encodeRules), or empty. */
  rules: string
  owner: string
  /** Remembered merges from the report cleaner: original label to clean label. */
  aliases: Record<string, string>
}

const isStr = (v: unknown): v is string => typeof v === 'string'

function isRow(v: unknown): v is SheetRow {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  if (!isStr(r.id) || !isStr(r.url) || typeof r.fields !== 'object' || r.fields === null)
    return false
  const f = r.fields as Record<string, unknown>
  return ['url', 'source', 'medium', 'campaign', 'term', 'content'].every((k) => isStr(f[k]))
}

const isPreset = (v: unknown): v is ChannelPreset =>
  typeof v === 'object' &&
  v !== null &&
  isStr((v as ChannelPreset).label) &&
  isStr((v as ChannelPreset).source) &&
  isStr((v as ChannelPreset).medium)

export function buildWorkspace(
  parts: Omit<Workspace, 'app' | 'version' | 'exportedAt'>,
  now: Date
): Workspace {
  return { app: WORKSPACE_APP, version: 1, exportedAt: now.toISOString(), ...parts }
}

/** Reads a backup file. Never throws; anything that is not a valid backup gives an error message. */
export function parseWorkspace(text: string): { data: Workspace | null; error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { data: null, error: 'That file is not a backup from this tool.' }
  }
  if (typeof raw !== 'object' || raw === null || (raw as Workspace).app !== WORKSPACE_APP)
    return { data: null, error: 'That file is not a backup from this tool.' }
  if ((raw as Workspace).version !== 1)
    return { data: null, error: 'This backup comes from a newer version of the tool.' }
  const w = raw as Record<string, unknown>
  const aliases: Record<string, string> = {}
  if (typeof w.aliases === 'object' && w.aliases !== null) {
    for (const [k, v] of Object.entries(w.aliases).slice(0, MAX_ALIASES))
      if (isStr(v) && k.length <= 200 && v.length <= 200) aliases[k] = v
  }
  return {
    error: '',
    data: {
      app: WORKSPACE_APP,
      version: 1,
      exportedAt: isStr(w.exportedAt) ? w.exportedAt : '',
      sheet: Array.isArray(w.sheet) ? w.sheet.filter(isRow) : [],
      presets: Array.isArray(w.presets) ? w.presets.filter(isPreset) : [],
      rules: isStr(w.rules) ? w.rules : '',
      owner: isStr(w.owner) ? w.owner.slice(0, 40) : '',
      aliases,
    },
  }
}

/** Adds backed-up rows to the current ones, skipping any whose link is already saved. */
export function mergeRows(
  current: SheetRow[],
  incoming: SheetRow[]
): { rows: SheetRow[]; added: number } {
  const seen = new Set(current.map((r) => r.url))
  const fresh = incoming.filter((r) => !seen.has(r.url) && seen.add(r.url))
  return { rows: [...current, ...fresh], added: fresh.length }
}
