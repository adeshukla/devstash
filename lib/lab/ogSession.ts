// Saving and restoring an OG image design as a session. Pure, no React and no "@/" imports so
// node:test can run it. Pictures (the background photo and the logo) are not kept: they are large
// and live in the page's memory only, so a restored design asks for them again.

import { DEFAULTS, type OgOptions } from './ogImage.ts'

const PICTURE_KEYS = ['photo', 'photoW', 'photoH', 'logo'] as const

/** The design as plain data, without pictures. */
export function ogToSession(o: OgOptions): Record<string, unknown> {
  const out: Record<string, unknown> = { ...o }
  for (const k of PICTURE_KEYS) delete out[k]
  return out
}

const isColourKey = (k: string) =>
  k === 'accent' || k === 'bgFrom' || k === 'bgTo' || /Color$/.test(k)
const HEX = /^#[0-9a-f]{3,8}$/i
// Names such as "stack", "tl" or "serif": letters, digits, dash or underscore, nothing else.
const WORD = /^[a-z0-9_-]{1,24}$/i

function pickValue(key: string, v: unknown, base: unknown): unknown {
  if (typeof base === 'number')
    return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 100_000 ? v : base
  if (typeof base === 'boolean') return typeof v === 'boolean' ? v : base
  if (typeof base === 'string') {
    if (typeof v !== 'string') return base
    if (key === 'text') return v.length <= 1000 ? v : base
    if (isColourKey(key)) return v === '' || HEX.test(v) ? v : base
    return WORD.test(v) ? v : base
  }
  return base
}

/** A design read back from saved data. Anything unexpected falls back to the default for that field. */
export function ogFromSession(d: Record<string, unknown>): OgOptions {
  const out: Record<string, unknown> = {}
  for (const [key, base] of Object.entries(DEFAULTS)) {
    const v = d[key]
    if (typeof base === 'object' && base !== null) {
      const src = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}
      const el: Record<string, unknown> = {}
      for (const [k, b] of Object.entries(base)) el[k] = pickValue(k, src[k], b)
      out[key] = el
    } else if ((PICTURE_KEYS as readonly string[]).includes(key)) {
      out[key] = base
    } else {
      out[key] = pickValue(key, v, base)
    }
  }
  const o = out as unknown as OgOptions
  // A photo background with no photo would draw nothing, so fall back to the default background.
  if (o.bgType === 'photo') o.bgType = DEFAULTS.bgType
  return o
}
