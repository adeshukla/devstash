// Reads a pasted CSS shape back into what the shape tool can edit. Pure, no React and no "@/"
// imports so node:test can run it.

export interface ShapePoint {
  x: number
  y: number
}

export type ParsedShape =
  | { mode: 'polygon'; points: ShapePoint[] }
  | { mode: 'corners'; corners: { tl: number; tr: number; br: number; bl: number } }
  | { mode: 'preset'; key: string }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const squash = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Understands `clip-path: polygon(...)` (3 to 12 percentage points), a percentage `border-radius`
 * of 1, 2 or 4 values, and the exact CSS of any preset. Anything else (pixels, an elliptical
 * "a / b" radius, circle() on its own) returns null so the page can say what is supported.
 */
export function parseShapeCss(text: string, presets: Record<string, string>): ParsedShape | null {
  const css = squash(text)
  for (const [key, value] of Object.entries(presets))
    if (css.replace(/;$/, '') === squash(value).replace(/;$/, '')) return { mode: 'preset', key }

  const poly = css.match(/polygon\(([^)]*)\)/)
  if (poly) {
    const points: ShapePoint[] = []
    for (const part of poly[1].split(',')) {
      const m = part.trim().match(/^(-?[\d.]+)%\s+(-?[\d.]+)%$/)
      if (!m) return null
      points.push({ x: clamp(Number(m[1]), 0, 100), y: clamp(Number(m[2]), 0, 100) })
    }
    return points.length >= 3 && points.length <= 12 ? { mode: 'polygon', points } : null
  }

  const radius = css.match(/border-radius:\s*([^;}]*)/)
  if (radius && !radius[1].includes('/')) {
    const v = radius[1].trim().split(' ')
    if (![1, 2, 4].includes(v.length) || !v.every((x) => /^[\d.]+%$/.test(x))) return null
    const n = v.map((x) => clamp(parseFloat(x), 0, 50))
    const [tl, tr, br, bl] =
      n.length === 1 ? [n[0], n[0], n[0], n[0]] : n.length === 2 ? [n[0], n[1], n[0], n[1]] : n
    return { mode: 'corners', corners: { tl, tr, br, bl } }
  }
  return null
}
