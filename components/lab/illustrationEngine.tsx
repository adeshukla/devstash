import type { ReactNode } from 'react'
import {
  cssVar,
  cssBgTint,
  resolveToken,
  resolveBgTint,
  type ColorKey,
  type Theme,
} from './designTokens'

export type MotifKey = 'geometric' | 'network' | 'bars' | 'terminal' | 'organic' | 'connectors'
export type PaletteKey = 'auto' | 'accent-purple' | 'warm' | 'cool' | 'mono'
export type AnimationKey = 'none' | 'float' | 'pulse' | 'drift'
export type Density = 1 | 2 | 3
type BgTint = 'surface2' | 'accentTint' | 'purpleTint'

export const ALL_MOTIFS: MotifKey[] = [
  'geometric',
  'network',
  'bars',
  'terminal',
  'organic',
  'connectors',
]

export const MOTIF_LABELS: Record<MotifKey, string> = {
  geometric: 'Geometric',
  network: 'Network',
  bars: 'Bars',
  terminal: 'Terminal',
  organic: 'Organic',
  connectors: 'Connectors',
}

export const MOTIF_KEYWORDS: Record<MotifKey, string[]> = {
  geometric: ['ui', 'component', 'design', 'frontend', 'interface', 'layout', 'grid', 'react'],
  network: ['ai', 'automation', 'workflow', 'agent', 'model', 'distributed', 'api', 'n8n', 'llm'],
  bars: ['performance', 'data', 'analytics', 'metrics', 'chart', 'growth', 'vitals', 'conversion'],
  terminal: ['devtools', 'cli', 'code', 'terminal', 'developer', 'script', 'build', 'nextjs'],
  organic: ['learn', 'tutorial', 'accessibility', 'guide', 'human', 'story', 'career'],
  connectors: ['link', 'integration', 'pipeline', 'chain', 'flow', 'connect', 'utm', 'url'],
}

export const PALETTE_LABELS: Record<PaletteKey, string> = {
  auto: 'Auto',
  'accent-purple': 'Accent + Purple',
  warm: 'Warm',
  cool: 'Cool',
  mono: 'Monochrome',
}

const PALETTES: Record<Exclude<PaletteKey, 'auto'>, [ColorKey, ColorKey]> = {
  'accent-purple': ['accent', 'purple'],
  warm: ['warning', 'error'],
  cool: ['accent', 'success'],
  mono: ['muted', 'muted'],
}

const AUTO_PALETTES: [ColorKey, ColorKey][] = [
  ['accent', 'purple'],
  ['accent', 'success'],
  ['purple', 'warning'],
  ['success', 'accent'],
]

const BG_TINTS: BgTint[] = ['surface2', 'accentTint', 'purpleTint']

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return Math.abs(hash)
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Shape =
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: ColorKey; opacity?: number }
  | {
      kind: 'rect'
      x: number
      y: number
      w: number
      h: number
      rx?: number
      fill: ColorKey
      opacity?: number
    }
  | {
      kind: 'line'
      x1: number
      y1: number
      x2: number
      y2: number
      stroke: ColorKey
      strokeWidth?: number
      opacity?: number
    }
  | { kind: 'path'; d: string; fill: ColorKey; opacity?: number }

type Rng = () => number
type MotifGenerator = (
  rng: Rng,
  cx: number,
  cy: number,
  colors: [ColorKey, ColorKey],
  density: Density
) => Shape[]

function geometric(rng: Rng, cx: number, cy: number, colors: [ColorKey, ColorKey]): Shape[] {
  const n = 3 + Math.floor(rng() * 2)
  const shapes: Shape[] = []
  for (let i = 0; i < n; i++) {
    const size = 14 + rng() * 22
    const dx = (rng() - 0.5) * 80
    const dy = (rng() - 0.5) * 55
    const fill = i % 2 === 0 ? colors[0] : colors[1]
    if (rng() > 0.5) {
      shapes.push({ kind: 'circle', cx: cx + dx, cy: cy + dy, r: size / 2, fill, opacity: 0.85 })
    } else {
      shapes.push({
        kind: 'rect',
        x: cx + dx - size / 2,
        y: cy + dy - size / 2,
        w: size,
        h: size,
        rx: 4,
        fill,
        opacity: 0.85,
      })
    }
  }
  return shapes
}

function network(
  rng: Rng,
  cx: number,
  cy: number,
  colors: [ColorKey, ColorKey],
  density: Density
): Shape[] {
  const n = 4 + density
  const nodes: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + rng() * 0.6
    const radius = 32 + rng() * 26
    nodes.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius * 0.6 })
  }
  const shapes: Shape[] = []
  nodes.forEach((n1, i) => {
    shapes.push({
      kind: 'line',
      x1: cx,
      y1: cy,
      x2: n1.x,
      y2: n1.y,
      stroke: colors[0],
      strokeWidth: 1,
      opacity: 0.4,
    })
    shapes.push({
      kind: 'circle',
      cx: n1.x,
      cy: n1.y,
      r: 4 + rng() * 4,
      fill: i % 3 === 0 ? colors[1] : colors[0],
    })
  })
  shapes.push({ kind: 'circle', cx, cy, r: 7, fill: colors[1] })
  return shapes
}

function bars(
  rng: Rng,
  cx: number,
  cy: number,
  colors: [ColorKey, ColorKey],
  density: Density
): Shape[] {
  const n = 4 + density
  const barWidth = 10
  const gap = 6
  const totalWidth = n * (barWidth + gap) - gap
  const startX = cx - totalWidth / 2
  const baseline = cy + 30
  const shapes: Shape[] = []
  for (let i = 0; i < n; i++) {
    const h = 15 + rng() * 55
    shapes.push({
      kind: 'rect',
      x: startX + i * (barWidth + gap),
      y: baseline - h,
      w: barWidth,
      h,
      rx: 2,
      fill: i === n - 1 ? colors[1] : colors[0],
      opacity: 0.9,
    })
  }
  return shapes
}

function terminal(
  rng: Rng,
  cx: number,
  cy: number,
  colors: [ColorKey, ColorKey],
  density: Density
): Shape[] {
  const w = 110 + density * 10
  const h = 70
  const x = cx - w / 2
  const y = cy - h / 2
  const shapes: Shape[] = [{ kind: 'rect', x, y, w, h, rx: 6, fill: 'surface', opacity: 1 }]
  const dotColors: ColorKey[] = [colors[1], colors[0], colors[0]]
  for (let i = 0; i < 3; i++) {
    shapes.push({
      kind: 'circle',
      cx: x + 12 + i * 12,
      cy: y + 12,
      r: 3,
      fill: dotColors[i],
      opacity: 0.9,
    })
  }
  const lineCount = 2 + Math.min(density, 2)
  for (let i = 0; i < lineCount; i++) {
    const lw = 40 + rng() * (w - 60)
    shapes.push({
      kind: 'rect',
      x: x + 12,
      y: y + 28 + i * 14,
      w: lw,
      h: 6,
      rx: 3,
      fill: i === lineCount - 1 ? colors[1] : colors[0],
      opacity: i === lineCount - 1 ? 0.9 : 0.4,
    })
  }
  return shapes
}

function blobPath(cx: number, cy: number, r: number, rng: Rng): string {
  const points = 8
  const coords: [number, number][] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2
    const rr = r * (0.8 + rng() * 0.4)
    coords.push([cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr])
  }
  let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)} `
  for (let i = 0; i < points; i++) {
    const [x1, y1] = coords[i]
    const [x2, y2] = coords[(i + 1) % points]
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    d += `Q ${x1.toFixed(1)} ${y1.toFixed(1)}, ${mx.toFixed(1)} ${my.toFixed(1)} `
  }
  return d + 'Z'
}

function organic(
  rng: Rng,
  cx: number,
  cy: number,
  colors: [ColorKey, ColorKey],
  density: Density
): Shape[] {
  const shapes: Shape[] = []
  for (let i = 0; i < density; i++) {
    const r = 26 + rng() * 20
    const bx = cx + (rng() - 0.5) * 50
    const by = cy + (rng() - 0.5) * 40
    shapes.push({
      kind: 'path',
      d: blobPath(bx, by, r, rng),
      fill: i % 2 === 0 ? colors[0] : colors[1],
      opacity: 0.5,
    })
  }
  return shapes
}

function connectors(
  rng: Rng,
  cx: number,
  cy: number,
  colors: [ColorKey, ColorKey],
  density: Density
): Shape[] {
  const n = 3 + density
  const points: [number, number][] = []
  let px = cx - ((n - 1) * 26) / 2
  for (let i = 0; i < n; i++) {
    const py = cy + (i % 2 === 0 ? -10 : 10) + (rng() - 0.5) * 10
    points.push([px, py])
    px += 26
  }
  const shapes: Shape[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    shapes.push({ kind: 'line', x1, y1, x2, y2, stroke: colors[0], strokeWidth: 2, opacity: 0.5 })
  }
  points.forEach(([x, y], i) => {
    shapes.push({ kind: 'circle', cx: x, cy: y, r: 6, fill: i % 2 === 0 ? colors[0] : colors[1] })
  })
  return shapes
}

const MOTIF_GENERATORS: Record<MotifKey, MotifGenerator> = {
  geometric,
  network,
  bars,
  terminal,
  organic,
  connectors,
}

function autoMotifs(topic: string, count: number): MotifKey[] {
  const lower = topic.toLowerCase()
  const scored = ALL_MOTIFS.map((m) => ({
    m,
    score: MOTIF_KEYWORDS[m].filter((kw) => lower.includes(kw)).length,
  })).sort((a, b) => b.score - a.score)
  const result = scored.filter((s) => s.score > 0).map((s) => s.m)
  for (const s of scored) {
    if (result.length >= count) break
    if (!result.includes(s.m)) result.push(s.m)
  }
  return result.slice(0, count)
}

export interface GeneratorOptions {
  topic: string
  nonce: number
  density: Density
  motifs: MotifKey[]
  palette: PaletteKey
  animation: AnimationKey
}

export interface Composition {
  seed: number
  background: BgTint
  shapes: Shape[]
  motifs: MotifKey[]
  matchedMotifs: MotifKey[]
}

/**
 * Composes a genuinely unique layout from motif primitives instead of
 * picking one of a fixed set of pre-drawn scenes. Same topic + nonce always
 * produces the same result (deterministic); bumping the nonce ("shuffle")
 * gives a new arrangement without changing anything else.
 */
export function generateComposition(options: GeneratorOptions): Composition {
  const { topic, nonce, density, motifs, palette, animation } = options
  const seed = hashSeed(`${topic}::${nonce}`)
  const rng = mulberry32(seed)
  const matchedMotifs = autoMotifs(topic, density + 1)
  const activeMotifs = motifs.length > 0 ? motifs : matchedMotifs
  const colors = palette === 'auto' ? AUTO_PALETTES[seed % AUTO_PALETTES.length] : PALETTES[palette]
  const background = BG_TINTS[seed % BG_TINTS.length]

  const shapes: Shape[] = []
  const bandWidth = 400 / Math.max(activeMotifs.length, 1)
  activeMotifs.forEach((motif, i) => {
    const cx = bandWidth * i + bandWidth / 2 + (rng() - 0.5) * bandWidth * 0.25
    const cy = 112.5 + (rng() - 0.5) * 50
    shapes.push(...MOTIF_GENERATORS[motif](rng, cx, cy, colors, density))
  })

  void animation // animation is applied at render time, not baked into the composition
  return { seed, background, shapes, motifs: activeMotifs, matchedMotifs }
}

const ANIMATION_NAME: Record<Exclude<AnimationKey, 'none'>, string> = {
  float: 'igFloat',
  pulse: 'igPulse',
  drift: 'igDrift',
}

// Per-animation easing — a generic `ease-in-out` makes every shape hit its
// extremes with the same mechanical rhythm. Sine-like curves (float/drift)
// read as organic bobbing; pulse gets a slightly snappier curve so the scale
// beat feels intentional rather than mushy.
const ANIMATION_EASING: Record<Exclude<AnimationKey, 'none'>, string> = {
  float: 'cubic-bezier(0.37, 0, 0.63, 1)',
  pulse: 'cubic-bezier(0.45, 0, 0.4, 1)',
  drift: 'cubic-bezier(0.37, 0, 0.63, 1)',
}

/** One timing source for BOTH the live preview and the exported SVG string —
 * if these ever diverge, the copied code stops matching what was previewed.
 * Durations use a fractional 4-step spread (3.2/4.1/5/5.9s) instead of flat
 * 3/4/5s so neighboring shapes don't sync up into a visible group beat. */
function animationTiming(index: number, animation: Exclude<AnimationKey, 'none'>) {
  return {
    name: ANIMATION_NAME[animation],
    duration: `${(3.2 + (index % 4) * 0.9).toFixed(1)}s`,
    easing: ANIMATION_EASING[animation],
    delay: `${((index * 0.35) % 2.1).toFixed(2)}s`,
  }
}

function shapeStyle(index: number, animation: AnimationKey): React.CSSProperties | undefined {
  if (animation === 'none') return undefined
  const t = animationTiming(index, animation)
  return {
    animation: `${t.name} ${t.duration} ${t.easing} infinite`,
    animationDelay: t.delay,
    transformBox: 'fill-box',
    transformOrigin: 'center',
  } as React.CSSProperties
}

/** Renders a composition as live React SVG content (used for the preview).
 * Colors resolve via CSS custom properties, so this stays theme-reactive in
 * the browser regardless of which theme is being previewed. */
export function renderComposition(comp: Composition, animation: AnimationKey): ReactNode {
  return (
    <>
      <rect width={400} height={225} fill={cssBgTint(comp.background)} />
      {comp.shapes.map((s, i) => {
        const style = shapeStyle(i, animation)
        if (s.kind === 'circle') {
          return (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill={cssVar(s.fill)}
              opacity={s.opacity}
              style={style}
            />
          )
        }
        if (s.kind === 'rect') {
          return (
            <rect
              key={i}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={s.rx}
              fill={cssVar(s.fill)}
              opacity={s.opacity}
              style={style}
            />
          )
        }
        if (s.kind === 'line') {
          return (
            <line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={cssVar(s.stroke)}
              strokeWidth={s.strokeWidth}
              opacity={s.opacity}
            />
          )
        }
        return <path key={i} d={s.d} fill={cssVar(s.fill)} opacity={s.opacity} style={style} />
      })}
    </>
  )
}

// Float gets a mid-keyframe so the bob isn't a straight up-down metronome;
// pulse breathes opacity along with scale; drift traces a small arc instead of
// a straight diagonal. The reduced-motion guard ships in the exported SVG too,
// so a pasted illustration respects the OS setting wherever it lands.
const KEYFRAMES_SOURCE = `
@keyframes igFloat { 0%, 100% { transform: translateY(0); } 35% { transform: translateY(-7px); } 65% { transform: translateY(-9px); } }
@keyframes igPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.09); opacity: 0.82; } }
@keyframes igDrift { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(3px, -5px) rotate(2.5deg); } 66% { transform: translate(-2px, -3px) rotate(-1.5deg); } }
@media (prefers-reduced-motion: reduce) { circle, rect, path, line { animation: none !important; } }
`.trim()

export function illustrationKeyframes(): string {
  return KEYFRAMES_SOURCE
}

function shapeToSvgTag(s: Shape, i: number, animation: AnimationKey, theme: Theme): string {
  let style = ''
  if (animation !== 'none') {
    const t = animationTiming(i, animation)
    style = ` style="animation: ${t.name} ${t.duration} ${t.easing} infinite; animation-delay: ${t.delay}; transform-box: fill-box; transform-origin: center;"`
  }
  const opacity = s.opacity !== undefined ? ` opacity="${s.opacity}"` : ''
  if (s.kind === 'circle') {
    return `<circle cx="${s.cx.toFixed(1)}" cy="${s.cy.toFixed(1)}" r="${s.r.toFixed(1)}" fill="${resolveToken(s.fill, theme)}"${opacity}${style} />`
  }
  if (s.kind === 'rect') {
    const rx = s.rx ? ` rx="${s.rx}"` : ''
    return `<rect x="${s.x.toFixed(1)}" y="${s.y.toFixed(1)}" width="${s.w.toFixed(1)}" height="${s.h.toFixed(1)}"${rx} fill="${resolveToken(s.fill, theme)}"${opacity}${style} />`
  }
  if (s.kind === 'line') {
    const sw = s.strokeWidth ? ` stroke-width="${s.strokeWidth}"` : ''
    return `<line x1="${s.x1.toFixed(1)}" y1="${s.y1.toFixed(1)}" x2="${s.x2.toFixed(1)}" y2="${s.y2.toFixed(1)}" stroke="${resolveToken(s.stroke, theme)}"${sw}${opacity} />`
  }
  return `<path d="${s.d}" fill="${resolveToken(s.fill, theme)}"${opacity}${style} />`
}

/** Serializes a composition to a standalone, self-contained SVG string for
 * ONE specific theme — literal hex values (not CSS custom properties), so
 * it renders correctly wherever it's pasted, matching whichever preview
 * (light/dark) the code was copied from. */
export function serializeComposition(
  comp: Composition,
  animation: AnimationKey,
  theme: Theme
): string {
  const styleTag = animation === 'none' ? '' : `\n  <style>${illustrationKeyframes()}</style>`
  const body = comp.shapes.map((s, i) => `  ${shapeToSvgTag(s, i, animation, theme)}`).join('\n')
  return `<svg viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg">${styleTag}
  <rect width="400" height="225" fill="${resolveBgTint(comp.background, theme)}" />
${body}
</svg>`
}
