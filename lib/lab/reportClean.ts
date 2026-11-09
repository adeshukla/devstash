// Finds rows in an analytics export that are really the same campaign, source
// or medium split apart by capital letters, spaces, separators or short names
// (fb / facebook), and merges them. Pure, no React and no "@/" imports so
// node:test can run it.

import {
  applySeparator,
  normalizeValue,
  parseDelimited,
  SOURCE_ALIASES,
  type Separator,
} from './utm.ts'

export const MAX_REPORT_ROWS = 5000

// Only these can be added together. Rates and averages (engagement rate, average session
// duration) cannot, and neither can users: one person can appear under two spellings, so
// adding them would count that person twice. "New users" is safe, since a person is new once.
// The rest are listed as skipped instead of summed.
const ADDITIVE =
  /^(sessions|engaged sessions|new users|event count|events|conversions|key events|views|clicks|impressions|cost|revenue|total revenue|purchases|transactions|orders)$/i
// A column header, not a data value that merely contains the word "content" or "campaign".
const DIMENSION =
  /^(utm_)?((session|first user|first|last click|user|manual)\s+)*(default channel group|channel group|source\s*\/\s*medium|source|medium|campaign|campaign name|term|ad content|content|channel)$/i

export interface Variant {
  /** The label as it appears in the export, e.g. "Spring_Sale". */
  raw: string
  rows: number
  metrics: number[]
  /** True when a remembered merge, not the automatic rules, put this label here. */
  remembered?: boolean
}

export interface Group {
  /** The clean label every variant would be merged into. */
  canonical: string
  variants: Variant[]
  totals: number[]
  split: boolean
}

export interface CleanResult {
  error: string
  /** Header names of the columns that were read as labels. */
  dims: string[]
  /** Header names of the columns that were added up. */
  metricNames: string[]
  /** Numeric columns left out because they are rates or averages. */
  skippedMetrics: string[]
  groups: Group[]
  rowCount: number
  /** Data rows in the export. More than rowCount means the rest were not read, so totals are short. */
  totalRows: number
  /** "Total" and "Grand total" lines left out, so they are not counted as a campaign or added twice. */
  totalLinesIgnored: number
}

/** A summary line GA4 adds under the data, not a real campaign, source or medium. */
const TOTAL_LINE = /^(grand\s+)?total$/i

const empty = (error: string): CleanResult => ({
  error,
  dims: [],
  metricNames: [],
  skippedMetrics: [],
  groups: [],
  rowCount: 0,
  totalRows: 0,
  totalLinesIgnored: 0,
})

/**
 * Reads a number the way the export wrote it. When a cell has both "." and ",", the one that
 * comes last is the decimal point ("1,234.50" and "1.234,50" are both 1234.5). With only one
 * kind, `european` (a semicolon-separated file) decides: "1.200" is twelve hundred there, but
 * 1.2 in a comma file.
 */
const toNumber = (s: string, european = false): number | null => {
  let t = s.replace(/[\s'’]/g, '')
  const dot = t.lastIndexOf('.')
  const comma = t.lastIndexOf(',')
  if (dot >= 0 && comma >= 0) {
    t = dot > comma ? t.replace(/,/g, '') : t.replace(/\./g, '').replace(',', '.')
  } else if (comma >= 0) {
    t = european ? t.replace(',', '.') : t.replace(/,/g, '')
  } else if (dot >= 0 && european && /^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, '')
  }
  return t !== '' && /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null
}

const isReserved = (s: string) => /^\(.+\)$/.test(s.trim())

function cleanPart(text: string, isSource: boolean, sep: Separator): string {
  if (isReserved(text)) return text.trim().toLowerCase()
  const v = normalizeValue(text)
  return applySeparator(isSource ? (SOURCE_ALIASES[v] ?? v) : v, sep)
}

/** Two labels are the same thing when they match once separators are ignored. */
const identity = (label: string) => label.replace(/[-_.\s]/g, '')

/**
 * Reads a pasted or uploaded export. A header row naming source, medium,
 * campaign, term, content or channel columns is used when present; otherwise
 * each line is one label. Comment lines starting with # (as GA4 writes them)
 * are skipped.
 */
export function cleanReport(
  text: string,
  sep: Separator,
  /** Merges remembered from earlier reports: original label to clean label. */
  saved: Record<string, string> = {}
): CleanResult {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('#'))
  const table = parseDelimited(lines.join('\n'))
  if (!table.length) return empty('')
  // A semicolon-separated file comes from a locale that writes 1.234,50.
  const first = lines.find((l) => l.trim()) ?? ''
  const european = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0)
  const num = (s: string) => toNumber(s, european)

  const headIdx = table.findIndex((r) => r.some((c) => DIMENSION.test(c.trim())))
  let dimCols: number[]
  let metricCols: number[] = []
  let skipped: string[] = []
  let dims: string[]
  let metricNames: string[] = []
  let body: string[][]
  if (headIdx >= 0) {
    // Group-by columns ("(not set)" style totals rows are ordinary data rows).
    const head = table[headIdx].map((c) => c.trim())
    body = table.slice(headIdx + 1)
    dimCols = head.map((h, i) => (DIMENSION.test(h) ? i : -1)).filter((i) => i >= 0)
    const numeric = head
      .map((h, i) => ({ h, i }))
      .filter(({ h, i }) => {
        if (!h || dimCols.includes(i)) return false
        const cells = body.map((r) => r[i] ?? '').filter((c) => c.trim() !== '')
        return cells.length > 0 && cells.filter((c) => num(c) !== null).length / cells.length >= 0.8
      })
    metricCols = numeric.filter(({ h }) => ADDITIVE.test(h)).map(({ i }) => i)
    skipped = numeric.filter(({ h }) => !ADDITIVE.test(h)).map(({ h }) => h)
    dims = dimCols.map((i) => head[i])
    metricNames = metricCols.map((i) => head[i])
  } else {
    // No header: a single column is a plain list of labels; more columns are ambiguous.
    if (table.some((r) => r.length > 1))
      return empty('No source, medium or campaign column found. Add a header row.')
    body = table
    dimCols = [0]
    dims = ['Value']
  }
  if (!dimCols.length) return empty('No source, medium or campaign column found. Add a header row.')

  const groups = new Map<string, Group>()
  let rowCount = 0
  let totalLinesIgnored = 0
  for (const cells of body.slice(0, MAX_REPORT_ROWS)) {
    const labels = dimCols.map((c) => (cells[c] ?? '').trim())
    if (labels.every((l) => !l)) continue
    if (labels[0] && TOTAL_LINE.test(labels[0])) {
      totalLinesIgnored++
      continue
    }
    rowCount++
    const raw = labels.join(' / ')
    const remembered = Object.prototype.hasOwnProperty.call(saved, raw)
    const parts = remembered
      ? saved[raw]
          .split('/')
          .map((p, pi) => ({ text: p.trim(), source: /source/i.test(dims[0] ?? '') && pi === 0 }))
      : dimCols.flatMap((c, di) =>
          labels[di].split('/').map((p, pi) => ({
            text: p.trim(),
            source: /source/i.test(dims[di] ?? '') && pi === 0,
          }))
        )
    const key = parts.map((p) => identity(cleanPart(p.text, p.source, '-'))).join('|')
    const canonical = parts.map((p) => cleanPart(p.text, p.source, sep)).join(' / ')
    const metrics = metricCols.map((c) => num(cells[c] ?? '') ?? 0)
    let g = groups.get(key)
    if (!g) {
      g = { canonical, variants: [], totals: metrics.map(() => 0), split: false }
      groups.set(key, g)
    }
    let v = g.variants.find((x) => x.raw === raw)
    if (!v) {
      v = { raw, rows: 0, metrics: metrics.map(() => 0), ...(remembered && { remembered: true }) }
      g.variants.push(v)
    }
    v.rows++
    metrics.forEach((m, i) => {
      v.metrics[i] += m
      g.totals[i] += m
    })
  }

  const list = [...groups.values()]
  for (const g of list) {
    g.split = g.variants.length > 1
    // The clean label follows the biggest variant so the result reads like the data.
    g.variants.sort((a, b) => (b.metrics[0] ?? 0) - (a.metrics[0] ?? 0) || b.rows - a.rows)
  }
  list.sort((a, b) => Number(b.split) - Number(a.split) || (b.totals[0] ?? 0) - (a.totals[0] ?? 0))
  return {
    error: '',
    dims,
    metricNames,
    skippedMetrics: skipped,
    groups: list,
    rowCount,
    totalRows: body.length,
    totalLinesIgnored,
  }
}

/** A copy of the result with some clean labels replaced by names the user typed. Keys are the automatic labels. */
export function applyNames(r: CleanResult, names: Record<string, string>): CleanResult {
  return {
    ...r,
    groups: r.groups.map((g) => {
      const custom = names[g.canonical]?.trim()
      return custom ? { ...g, canonical: custom } : g
    }),
  }
}

/** Original label to clean label, for every split spelling, ready to remember for next time. */
export function rememberable(r: CleanResult): Record<string, string> {
  const out: Record<string, string> = {}
  for (const g of r.groups)
    if (g.split) for (const v of g.variants) if (v.raw !== g.canonical) out[v.raw] = g.canonical
  return out
}

const tsvCell = (s: string) => s.replace(/[\t\r\n]/g, ' ')

/** Merged table, tab-separated, ready to paste into Google Sheets or Excel. */
export function mergedTsv(r: CleanResult): string {
  const head = [r.dims.join(' / ') || 'Label', 'Variants merged', ...r.metricNames]
  const lines = r.groups.map((g) =>
    [g.canonical, String(g.variants.length), ...g.totals.map(String)].map(tsvCell).join('\t')
  )
  return [head.map(tsvCell).join('\t'), ...lines].join('\n')
}

/** Every raw label next to its clean one, for a lookup in a sheet. */
export function mappingTsv(r: CleanResult): string {
  const lines = r.groups
    .flatMap((g) => g.variants.map((v) => [v.raw, g.canonical]))
    .map((cols) => cols.map(tsvCell).join('\t'))
  return ['Original\tClean', ...lines].join('\n')
}

const q = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

/**
 * How a field is named inside a Looker Studio formula. Google's examples use plain words and
 * spaces as they are ("Price * Quantity Sold"), so those stay bare. A name with a symbol, such
 * as "Session source / medium", would read as a division, so it goes in backticks. The docs do
 * not state this rule; it is the way Looker Studio's own field picker writes such names.
 */
export function lookerField(name: string): string {
  return /^[\p{L}\p{N}_ ]+$/u.test(name) ? name : `\`${name.replace(/`/g, '')}\``
}

/**
 * A Looker Studio calculated field that maps every label the table renames to its clean
 * label, including a lone "ig / paid_social" that became "instagram / paid-social", so a
 * Looker report and the merged table agree. Empty when the export has more than one label
 * column, because one field cannot cover two dimensions.
 */
export function lookerCase(r: CleanResult): string {
  if (r.dims.length !== 1) return ''
  const field = lookerField(r.dims[0])
  const whens = r.groups
    .map((g) => {
      const others = g.variants.map((v) => v.raw).filter((raw) => raw !== g.canonical)
      return others.length
        ? `  WHEN ${field} IN (${others.map(q).join(', ')}) THEN ${q(g.canonical)}`
        : ''
    })
    .filter(Boolean)
  return whens.length ? `CASE\n${whens.join('\n')}\n  ELSE ${field}\nEND` : ''
}
