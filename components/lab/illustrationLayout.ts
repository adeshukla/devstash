// components/lab/illustrationLayout.ts
//
// Composition, background and output-size vocabulary for the illustration
// generator.
//
// Why this exists: the engine used to place every motif in an equal-width
// vertical band at the same vertical centre —
//
//   const bandWidth = 400 / motifs.length
//   cx = bandWidth * i + bandWidth / 2 + tiny jitter
//   cy = 112.5 + tiny jitter
//
// — so no number of palette/density/animation controls could stop every result
// reading as "N clusters in a row, evenly spaced". Layout, scale hierarchy and
// depth are what make a composition look designed, and none of them existed.
//
// The motif generators draw around whatever (cx, cy) they are handed, so they
// need no changes: this module only decides where each motif goes, how large it
// is, and how far back it sits.

export type LayoutKey = 'auto' | 'focal' | 'diagonal' | 'orbit' | 'thirds' | 'drift'

export const LAYOUT_LABELS: Record<LayoutKey, string> = {
  auto: 'Auto',
  focal: 'Focal point',
  diagonal: 'Diagonal',
  orbit: 'Orbit',
  thirds: 'Rule of thirds',
  drift: 'Drift',
}

export const ALL_LAYOUTS: Exclude<LayoutKey, 'auto'>[] = [
  'focal',
  'diagonal',
  'orbit',
  'thirds',
  'drift',
]

/** Where one motif cluster goes, how big it is, and how far back it sits. */
export interface Placement {
  cx: number
  cy: number
  /** Scale about (cx, cy). Hierarchy is what stops everything reading as equal. */
  scale: number
  /** Depth cue — lower means further back. */
  opacity: number
}

export interface Canvas {
  w: number
  h: number
}

type Rng = () => number

const jitter = (rng: Rng, amount: number) => (rng() - 0.5) * amount

/**
 * One dominant cluster with smaller satellites. The classic hero arrangement:
 * a clear subject, supporting elements that do not compete.
 */
function focal(n: number, c: Canvas, rng: Rng): Placement[] {
  // Off-centre so it does not read as a bullseye.
  const hero = {
    cx: c.w * (rng() < 0.5 ? 0.38 : 0.62) + jitter(rng, c.w * 0.04),
    cy: c.h * 0.5 + jitter(rng, c.h * 0.08),
    scale: 1.25,
    opacity: 1,
  }
  const rest: Placement[] = []
  for (let i = 1; i < n; i++) {
    const side = i % 2 === 0 ? 1 : -1
    rest.push({
      cx: hero.cx + side * c.w * (0.24 + rng() * 0.12),
      cy: c.h * (0.3 + rng() * 0.4),
      scale: 0.5 + rng() * 0.2,
      opacity: 0.55 + rng() * 0.2,
    })
  }
  return [hero, ...rest]
}

/** A corner-to-corner run with scale growing along it — gives direction. */
function diagonal(n: number, c: Canvas, rng: Rng): Placement[] {
  const downhill = rng() < 0.5
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1)
    return {
      cx: c.w * (0.18 + t * 0.64) + jitter(rng, c.w * 0.03),
      cy: c.h * (downhill ? 0.24 + t * 0.5 : 0.74 - t * 0.5) + jitter(rng, c.h * 0.05),
      scale: 0.62 + t * 0.68,
      opacity: 0.65 + t * 0.35,
    }
  })
}

/** A centre with the rest on a ring — reads as a system with a hub. */
function orbit(n: number, c: Canvas, rng: Rng): Placement[] {
  const cx = c.w * 0.5 + jitter(rng, c.w * 0.03)
  const cy = c.h * 0.5 + jitter(rng, c.h * 0.04)
  if (n === 1) return [{ cx, cy, scale: 1.2, opacity: 1 }]
  const start = rng() * Math.PI * 2
  const rx = c.w * 0.3
  const ry = c.h * 0.3
  const ring = Array.from({ length: n - 1 }, (_, i) => {
    const a = start + (i / (n - 1)) * Math.PI * 2
    return {
      cx: cx + Math.cos(a) * rx,
      cy: cy + Math.sin(a) * ry,
      scale: 0.5 + rng() * 0.18,
      opacity: 0.6 + rng() * 0.2,
    }
  })
  return [{ cx, cy, scale: 1.15, opacity: 1 }, ...ring]
}

/** Placed on rule-of-thirds intersections, deliberately leaving space empty. */
function thirds(n: number, c: Canvas, rng: Rng): Placement[] {
  const points = [
    { cx: c.w / 3, cy: c.h / 3 },
    { cx: (c.w * 2) / 3, cy: c.h / 3 },
    { cx: c.w / 3, cy: (c.h * 2) / 3 },
    { cx: (c.w * 2) / 3, cy: (c.h * 2) / 3 },
  ]
  // Rotate the starting point so the same topic doesn't always fill top-left.
  const offset = Math.floor(rng() * points.length)
  return Array.from({ length: n }, (_, i) => {
    const p = points[(i + offset) % points.length]
    const lead = i === 0
    return {
      cx: p.cx + jitter(rng, c.w * 0.05),
      cy: p.cy + jitter(rng, c.h * 0.06),
      scale: lead ? 1.15 : 0.55 + rng() * 0.25,
      opacity: lead ? 1 : 0.6 + rng() * 0.2,
    }
  })
}

/**
 * Loose organic placement with real size variance. Still the least structured
 * option, but unlike the old equal bands it varies scale and depth, so one
 * element leads.
 */
function drift(n: number, c: Canvas, rng: Rng): Placement[] {
  const placed: Placement[] = []
  for (let i = 0; i < n; i++) {
    // Reject positions that crowd an existing cluster, so shapes breathe.
    let best = { cx: 0, cy: 0, d: -1 }
    for (let attempt = 0; attempt < 12; attempt++) {
      const cx = c.w * (0.18 + rng() * 0.64)
      const cy = c.h * (0.22 + rng() * 0.56)
      const d = placed.length
        ? Math.min(...placed.map((p) => Math.hypot(p.cx - cx, p.cy - cy)))
        : Infinity
      if (d > best.d) best = { cx, cy, d }
      if (d > c.w * 0.22) break
    }
    const lead = i === 0
    placed.push({
      cx: best.cx,
      cy: best.cy,
      scale: lead ? 1.15 + rng() * 0.15 : 0.5 + rng() * 0.35,
      opacity: lead ? 1 : 0.55 + rng() * 0.3,
    })
  }
  return placed
}

const LAYOUTS: Record<
  Exclude<LayoutKey, 'auto'>,
  (n: number, c: Canvas, rng: Rng) => Placement[]
> = { focal, diagonal, orbit, thirds, drift }

/** Resolve 'auto' deterministically from the seed so a topic keeps its layout. */
export function resolveLayout(layout: LayoutKey, seed: number): Exclude<LayoutKey, 'auto'> {
  return layout === 'auto' ? ALL_LAYOUTS[seed % ALL_LAYOUTS.length] : layout
}

export function layoutPlacements(
  layout: Exclude<LayoutKey, 'auto'>,
  n: number,
  canvas: Canvas,
  rng: Rng
): Placement[] {
  return LAYOUTS[layout](Math.max(n, 1), canvas, rng)
}

// ─── Backgrounds ─────────────────────────────────────────────────────────────
//
// Previously a single flat tint, which left every composition sitting on the
// same dead field. These are drawn behind the motifs and deliberately low
// contrast — they add depth without competing with the subject.

export type BackgroundKey = 'flat' | 'grid' | 'dots' | 'rings' | 'wash'

export const BACKGROUND_LABELS: Record<BackgroundKey, string> = {
  flat: 'Flat',
  grid: 'Grid',
  dots: 'Dots',
  rings: 'Rings',
  wash: 'Wash',
}

export const ALL_BACKGROUNDS: BackgroundKey[] = ['flat', 'grid', 'dots', 'rings', 'wash']

export interface BackgroundPrimitive {
  kind: 'line' | 'circle'
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  cx?: number
  cy?: number
  r?: number
  fill?: boolean
  opacity: number
}

/**
 * Geometry only — the caller supplies the colour, so the same background works
 * against any palette and in either theme.
 */
export function backgroundPrimitives(kind: BackgroundKey, c: Canvas): BackgroundPrimitive[] {
  if (kind === 'grid') {
    const step = c.w / 16
    const out: BackgroundPrimitive[] = []
    for (let x = step; x < c.w; x += step) {
      out.push({ kind: 'line', x1: x, y1: 0, x2: x, y2: c.h, opacity: 0.07 })
    }
    for (let y = step; y < c.h; y += step) {
      out.push({ kind: 'line', x1: 0, y1: y, x2: c.w, y2: y, opacity: 0.07 })
    }
    return out
  }
  if (kind === 'dots') {
    const step = c.w / 20
    const out: BackgroundPrimitive[] = []
    for (let x = step; x < c.w; x += step) {
      for (let y = step; y < c.h; y += step) {
        out.push({ kind: 'circle', cx: x, cy: y, r: 1, fill: true, opacity: 0.1 })
      }
    }
    return out
  }
  if (kind === 'rings') {
    const cx = c.w * 0.5
    const cy = c.h * 0.5
    return [0.28, 0.45, 0.62, 0.8].map((f) => ({
      kind: 'circle' as const,
      cx,
      cy,
      r: c.h * f,
      fill: false,
      opacity: 0.09,
    }))
  }
  return []
}

/** 'wash' is a soft radial gradient rather than primitives. */
export function backgroundUsesWash(kind: BackgroundKey): boolean {
  return kind === 'wash'
}

// ─── Output sizes ────────────────────────────────────────────────────────────
//
// The canvas was hard-coded to 400x225. Because the motif generators are
// position-agnostic, the composition can simply be generated at the target
// aspect instead of being cropped to it — which is why an Open Graph card
// composed here is actually composed for 1200x630, not a letterboxed 16:9.

export interface SizePreset {
  key: string
  label: string
  hint: string
  w: number
  h: number
}

export const SIZE_PRESETS: SizePreset[] = [
  { key: 'wide', label: 'Wide', hint: '400×225 · 16:9', w: 400, h: 225 },
  { key: 'og', label: 'Open Graph', hint: '1200×630 · social card', w: 1200, h: 630 },
  { key: 'square', label: 'Square', hint: '1080×1080 · social post', w: 1080, h: 1080 },
  { key: 'banner', label: 'Banner', hint: '1500×500 · profile header', w: 1500, h: 500 },
]

export const DEFAULT_SIZE = SIZE_PRESETS[0]
