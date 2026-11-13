// Layout and SVG for the Lab OG image / cover maker. Pure, no React and no "@/" imports so
// node:test can run it. Text width comes from a `measure` function the caller supplies (a canvas in
// the browser), so the same code is tested with a fake one.

import { readableOn } from './palette.ts'

export interface OgSize {
  id: string
  label: string
  width: number
  height: number
}

export const SIZES: OgSize[] = [
  { id: 'og', label: 'Social share, 1200 × 630', width: 1200, height: 630 },
  { id: 'cover', label: 'Blog cover, 1600 × 900', width: 1600, height: 900 },
  { id: 'square', label: 'Square, 1080 × 1080', width: 1080, height: 1080 },
  { id: 'story', label: 'Story, 1080 × 1920', width: 1080, height: 1920 },
  { id: 'custom', label: 'Custom size', width: 1200, height: 630 },
]

export type FontId = 'sans' | 'serif' | 'mono' | 'humanist' | 'heavy'

// Devanagari fallbacks come before the generic family, which ends the list.
export const FONTS: Record<FontId, { label: string; stack: string }> = {
  sans: {
    label: 'Sans',
    stack:
      "'Segoe UI','Helvetica Neue',Arial,'Nirmala UI','Noto Sans Devanagari','Noto Sans',sans-serif",
  },
  serif: {
    label: 'Serif',
    stack: "Georgia,'Times New Roman','Nirmala UI','Noto Serif Devanagari','Mangal',serif",
  },
  mono: {
    label: 'Mono',
    stack: "Consolas,'SF Mono','Courier New','Nirmala UI','Mangal',monospace",
  },
  humanist: {
    label: 'Humanist',
    stack: "'Trebuchet MS','Gill Sans','Segoe UI','Nirmala UI','Noto Sans Devanagari',sans-serif",
  },
  heavy: {
    label: 'Heavy display',
    stack: "Impact,'Arial Black','Haettenschweiler','Nirmala UI','Noto Sans Devanagari',sans-serif",
  },
}

/** One piece of text and how it looks. Sizes are a percentage of the image width. */
export interface TextEl {
  text: string
  font: FontId
  /** Title: the biggest size it may use (it shrinks to fit). Others: the size, shrunk only if too wide. */
  size: number
  weight: number
  /** Empty means "use the theme colour for this text". */
  color: string
  /** Percent, 10 to 100. */
  opacity: number
  /** Letter spacing in hundredths of an em. */
  spacing: number
  upper: boolean
  italic: boolean
  /** Line height as a multiple of the font size. */
  leading: number
}

export type ElName = 'eyebrow' | 'title' | 'subtitle' | 'badge' | 'footer'
export const EL_NAMES: ElName[] = ['eyebrow', 'title', 'subtitle', 'badge', 'footer']

export type Align = 'left' | 'center' | 'right'
export type VAnchor = 'top' | 'middle' | 'bottom'
export type Layout = 'stack' | 'split-left' | 'split-right'
export type BgType = 'solid' | 'linear' | 'radial' | 'glow' | 'photo'
export type Pattern = 'none' | 'grid' | 'dots' | 'rings' | 'stripes' | 'waves' | 'plus' | 'grain'
export type Mark = 'none' | 'bar' | 'side' | 'underline'
export type Decor = 'none' | 'circle' | 'quarter' | 'triangle' | 'blob'
export type Corner = 'tl' | 'tr' | 'bl' | 'br'

export interface OgOptions {
  sizeId: string
  width: number
  height: number
  layout: Layout
  align: Align
  vAnchor: VAnchor
  /** Page margin, percent of the width. */
  padding: number
  /** Width of the text column, percent of the room available. */
  textWidth: number
  /** Moves the title block up or down, percent of the height. */
  offsetY: number
  textColor: string
  accent: string

  bgType: BgType
  bgFrom: string
  bgTo: string
  bgAngle: number

  /** An uploaded picture as a data URL, with its pixel size. Used as the background or the split panel. */
  photo: string
  photoW: number
  photoH: number
  photoZoom: number
  photoX: number
  photoY: number
  photoBlur: number
  photoGray: boolean
  scrimColor: string
  scrimOpacity: number

  pattern: Pattern
  patternColor: string
  patternOpacity: number
  patternScale: number

  mark: Mark
  markColor: string
  markSize: number

  frame: boolean
  frameWidth: number
  frameInset: number
  frameRadius: number
  frameColor: string

  decor: Decor
  decorColor: string
  decorOpacity: number
  decorSize: number
  decorCorner: Corner

  panel: boolean
  panelColor: string
  panelOpacity: number
  panelRadius: number

  logo: string
  logoPos: Corner
  logoSize: number
  logoRound: boolean

  eyebrow: TextEl
  title: TextEl
  subtitle: TextEl
  badge: TextEl
  footer: TextEl
}

const el = (over: Partial<TextEl>): TextEl => ({
  text: '',
  font: 'sans',
  size: 3,
  weight: 400,
  color: '',
  opacity: 100,
  spacing: 0,
  upper: false,
  italic: false,
  leading: 1.2,
  ...over,
})

/** The starting look: warm paper, a serif title and a terracotta accent. */
export const DEFAULTS: OgOptions = {
  sizeId: 'og',
  width: 1200,
  height: 630,
  layout: 'stack',
  align: 'left',
  vAnchor: 'middle',
  padding: 7,
  textWidth: 100,
  offsetY: 0,
  textColor: '#1c1917',
  accent: '#c2410c',
  bgType: 'linear',
  bgFrom: '#f6f1e7',
  bgTo: '#ebe3d3',
  bgAngle: 135,
  photo: '',
  photoW: 0,
  photoH: 0,
  photoZoom: 100,
  photoX: 50,
  photoY: 50,
  photoBlur: 0,
  photoGray: false,
  scrimColor: '#000000',
  scrimOpacity: 0,
  pattern: 'none',
  patternColor: '',
  patternOpacity: 14,
  patternScale: 1,
  mark: 'bar',
  markColor: '',
  markSize: 2,
  frame: false,
  frameWidth: 6,
  frameInset: 3,
  frameRadius: 0,
  frameColor: '',
  decor: 'none',
  decorColor: '',
  decorOpacity: 22,
  decorSize: 40,
  decorCorner: 'tr',
  panel: false,
  panelColor: '#ffffff',
  panelOpacity: 80,
  panelRadius: 2,
  logo: '',
  logoPos: 'br',
  logoSize: 9,
  logoRound: false,
  eyebrow: el({ weight: 600, size: 2.6, spacing: 8, upper: true }),
  title: el({ font: 'serif', weight: 700, size: 8.2, spacing: -1, leading: 1.12 }),
  subtitle: el({ size: 3, opacity: 75, leading: 1.4 }),
  badge: el({ weight: 700, size: 2.2, spacing: 6, upper: true }),
  footer: el({ font: 'mono', weight: 500, size: 2.2, spacing: 2, opacity: 70 }),
}

type Style = Partial<Omit<OgOptions, ElName>> & { fonts?: Partial<Record<ElName, Partial<TextEl>>> }

export interface Preset {
  id: string
  label: string
  set: Style
}

export const PRESETS: Preset[] = [
  { id: 'editorial', label: 'Editorial', set: {} },
  {
    id: 'paper',
    label: 'Paper',
    set: {
      bgFrom: '#ffffff',
      bgTo: '#e2e8f0',
      textColor: '#0f172a',
      accent: '#1d4ed8',
      pattern: 'grid',
      fonts: { title: { font: 'sans', spacing: -2, leading: 1.1 }, footer: { font: 'sans' } },
    },
  },
  {
    id: 'navy',
    label: 'Navy',
    set: {
      bgFrom: '#14213d',
      bgTo: '#1d3557',
      textColor: '#f1f5f9',
      accent: '#fca311',
      decor: 'quarter',
      decorCorner: 'br',
      fonts: { title: { font: 'sans', spacing: -2 } },
    },
  },
  {
    id: 'indigo',
    label: 'Indigo',
    set: {
      bgFrom: '#312e81',
      bgTo: '#1e1b4b',
      textColor: '#ffffff',
      accent: '#c7d2fe',
      pattern: 'dots',
      fonts: { title: { font: 'sans', spacing: -2 } },
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    set: {
      bgType: 'glow',
      bgFrom: '#064e3b',
      bgTo: '#022c22',
      textColor: '#ecfdf5',
      accent: '#6ee7b7',
      fonts: { title: { font: 'humanist' } },
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    set: {
      bgFrom: '#9a3412',
      bgTo: '#431407',
      textColor: '#fff7ed',
      accent: '#fdba74',
      decor: 'circle',
      decorCorner: 'tr',
      decorOpacity: 18,
      fonts: { title: { font: 'serif' } },
    },
  },
  {
    id: 'poster',
    label: 'Poster',
    set: {
      bgType: 'solid',
      bgFrom: '#facc15',
      textColor: '#111111',
      accent: '#111111',
      vAnchor: 'bottom',
      mark: 'none',
      pattern: 'stripes',
      patternOpacity: 10,
      frame: true,
      frameColor: '#111111',
      fonts: {
        title: { font: 'heavy', weight: 400, size: 12, upper: true, spacing: 0, leading: 1 },
        eyebrow: { font: 'heavy', weight: 400 },
        footer: { font: 'heavy', weight: 400 },
      },
    },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    set: {
      bgType: 'solid',
      bgFrom: '#0d1117',
      textColor: '#c9d1d9',
      accent: '#3fb950',
      pattern: 'plus',
      patternOpacity: 8,
      fonts: {
        title: { font: 'mono', weight: 700, spacing: -2, size: 6.4 },
        subtitle: { font: 'mono' },
        eyebrow: { font: 'mono' },
      },
    },
  },
  {
    id: 'soft',
    label: 'Soft',
    set: {
      bgFrom: '#fde2e4',
      bgTo: '#e2ece9',
      textColor: '#3a3a4a',
      accent: '#e76f51',
      decor: 'blob',
      decorOpacity: 30,
      decorCorner: 'bl',
      fonts: { title: { font: 'serif', italic: true, weight: 400 } },
    },
  },
]

/** Content (text, picture, logo, size) is kept; everything that is only style is reset, then the preset applies. */
export function applyPreset(o: OgOptions, p: Preset): OgOptions {
  const keep: Partial<OgOptions> = {
    sizeId: o.sizeId,
    width: o.width,
    height: o.height,
    photo: o.photo,
    photoW: o.photoW,
    photoH: o.photoH,
    logo: o.logo,
  }
  const { fonts, ...style } = p.set
  const out: OgOptions = { ...DEFAULTS, ...keep, ...style }
  for (const n of EL_NAMES) out[n] = { ...DEFAULTS[n], ...fonts?.[n], text: o[n].text }
  // A picture used as the background stays the background unless the preset sets its own.
  if (o.photo && o.bgType === 'photo' && style.bgType === undefined) {
    out.bgType = 'photo'
    out.scrimColor = o.scrimColor
    out.scrimOpacity = o.scrimOpacity
  }
  return out
}

export type Measure = (text: string, fontSize: number) => number

/** Text width for a font setup. `spacing` is the letter spacing in pixels per character. */
export type FontMeasure = (
  text: string,
  f: { size: number; stack: string; weight: number; italic: boolean; spacing: number }
) => number

/** Splits text into user-visible characters, so a Hindi letter and its marks are never separated. */
function graphemes(text: string): string[] {
  const Seg = (
    Intl as unknown as {
      Segmenter?: new (
        l?: string,
        o?: object
      ) => { segment: (s: string) => Iterable<{ segment: string }> }
    }
  ).Segmenter
  return Seg
    ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
    : Array.from(text)
}

/** Greedy word wrap. A single word wider than the line is broken between characters. */
export function wrapLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  measure: Measure
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  const flush = () => {
    if (line) lines.push(line)
    line = ''
  }
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (measure(next, fontSize) <= maxWidth) {
      line = next
      continue
    }
    flush()
    if (measure(word, fontSize) <= maxWidth) {
      line = word
      continue
    }
    for (const ch of graphemes(word)) {
      if (line && measure(line + ch, fontSize) > maxWidth) flush()
      line += ch
    }
  }
  flush()
  return lines
}

export interface Fitted {
  lines: string[]
  fontSize: number
  truncated: boolean
}

/**
 * The biggest font size, from `max` down to `min`, at which the text fits the box in at most
 * `maxLines` lines. At the smallest size, text that still does not fit is cut with an ellipsis.
 */
export function fitText(
  text: string,
  box: { width: number; height: number },
  measure: Measure,
  o: { max: number; min: number; lineHeight: number; maxLines: number }
): Fitted {
  for (let size = o.max; size >= o.min; size -= 2) {
    const lines = wrapLines(text, box.width, size, measure)
    if (lines.length <= o.maxLines && lines.length * size * o.lineHeight <= box.height)
      return { lines, fontSize: size, truncated: false }
  }
  const lines = wrapLines(text, box.width, o.min, measure)
  const rows = Math.max(1, Math.min(o.maxLines, Math.floor(box.height / (o.min * o.lineHeight))))
  if (lines.length <= rows) return { lines, fontSize: o.min, truncated: false }
  const kept = lines.slice(0, rows)
  const chars = graphemes(kept[rows - 1])
  while (chars.length && measure(`${chars.join('')}…`, o.min) > box.width) chars.pop()
  kept[rows - 1] = `${chars.join('')}…`
  return { lines: kept, fontSize: o.min, truncated: true }
}

/** Accepts #rgb or #rrggbb only. */
export function safeHex(value: string, fallback: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : fallback
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo))
const num = (n: number) => Math.round(n * 100) / 100

/** Only data: images are embedded, so a typed value can never point the image at another site. */
const safeImage = (s: string) =>
  /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : ''

function patternSvg(
  p: Pattern,
  w: number,
  h: number,
  color: string,
  opacity: number,
  scale: number
): string {
  const sc = clamp(scale, 0.4, 3)
  if (p === 'grid') {
    const step = Math.round((w / 20) * sc)
    let d = ''
    for (let x = step; x < w; x += step) d += `M${x} 0V${h}`
    for (let y = step; y < h; y += step) d += `M0 ${y}H${w}`
    return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1"/>`
  }
  if (p === 'dots') {
    const step = Math.round((w / 24) * sc)
    let dots = ''
    for (let x = step; x < w; x += step)
      for (let y = step; y < h; y += step)
        dots += `<circle cx="${x}" cy="${y}" r="${num(2 * sc)}"/>`
    return `<g fill="${color}" fill-opacity="${opacity}">${dots}</g>`
  }
  if (p === 'plus') {
    const step = Math.round((w / 22) * sc)
    const a = num(4 * sc)
    let d = ''
    for (let x = step; x < w; x += step)
      for (let y = step; y < h; y += step) d += `M${x - a} ${y}H${x + a}M${x} ${y - a}V${y + a}`
    return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1.5"/>`
  }
  if (p === 'stripes') {
    const step = Math.round((w / 26) * sc)
    let d = ''
    for (let x = -h; x < w; x += step) d += `M${x} ${h}L${x + h} 0`
    return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${num(2 * sc)}"/>`
  }
  if (p === 'waves') {
    const rows = Math.max(3, Math.round(8 / sc))
    const amp = (h / rows) * 0.28
    const seg = w / 8
    let d = ''
    for (let r = 0; r <= rows; r++) {
      const y = (h / rows) * r
      d += `M0 ${num(y)}`
      for (let i = 0; i < 8; i++) d += `q${num(seg / 2)} ${num(i % 2 ? amp : -amp)} ${num(seg)} 0`
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="2"/>`
  }
  if (p === 'rings') {
    const cx = Math.round(w * 0.88)
    const cy = Math.round(h * 0.12)
    return [1, 2, 3, 4, 5, 6]
      .map(
        (i) =>
          `<circle cx="${cx}" cy="${cy}" r="${Math.round(w * 0.09 * i * sc)}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="2"/>`
      )
      .join('')
  }
  if (p === 'grain')
    return `<rect width="${w}" height="${h}" filter="url(#grain)" opacity="${clamp(opacity * 2.4, 0, 0.9)}"/>`
  return ''
}

function decorSvg(
  d: Decor,
  corner: Corner,
  w: number,
  h: number,
  size: number,
  color: string,
  opacity: number
): string {
  if (d === 'none') return ''
  const s = (w * size) / 100
  const x = corner === 'tl' || corner === 'bl' ? 0 : w
  const y = corner === 'tl' || corner === 'tr' ? 0 : h
  const sx = x === 0 ? 1 : -1
  const sy = y === 0 ? 1 : -1
  const fill = `fill="${color}" fill-opacity="${opacity}"`
  if (d === 'quarter') return `<circle cx="${x}" cy="${y}" r="${num(s)}" ${fill}/>`
  if (d === 'circle')
    return `<circle cx="${num(x + sx * s * 0.35)}" cy="${num(y + sy * s * 0.35)}" r="${num(s * 0.6)}" ${fill}/>`
  if (d === 'triangle')
    return `<path d="M${x} ${y}L${num(x + sx * s)} ${y}L${x} ${num(y + sy * s)}Z" ${fill}/>`
  const bx = x + sx * s * 0.1 - (sx === 1 ? 0 : s)
  const by = y + sy * s * 0.1 - (sy === 1 ? 0 : s)
  return `<path transform="translate(${num(bx)} ${num(by)}) scale(${num(s / 100)})" d="M50 4C74 2 96 20 96 46c0 26-20 48-46 50C26 98 4 80 4 54 4 28 26 6 50 4Z" ${fill}/>`
}

interface Placed {
  w: number
  h: number
}

/** Where a picture is drawn so it covers a box, enlarged by `zoom` percent and moved by x and y percent. */
function coverRect(
  box: { x: number; y: number; w: number; h: number },
  pic: Placed,
  zoom: number,
  px: number,
  py: number
) {
  const scale = Math.max(box.w / pic.w, box.h / pic.h) * (clamp(zoom, 100, 400) / 100)
  const w = pic.w * scale
  const h = pic.h * scale
  return {
    x: box.x + (box.w - w) * (clamp(px, 0, 100) / 100),
    y: box.y + (box.h - h) * (clamp(py, 0, 100) / 100),
    w,
    h,
  }
}

/** The finished image as an SVG string. */
export function buildOgSvg(o: OgOptions, measure: FontMeasure): string {
  const W = Math.round(clamp(o.width, 200, 4000))
  const H = Math.round(clamp(o.height, 200, 4000))
  // Sizes follow the smaller of the width and 1.91 x the height, so a wide, short banner is not given
  // type as big as a 1200 px wide share image would get.
  const U = Math.min(W, H * 1.91)
  const textC = safeHex(o.textColor, '#111111')
  const accent = safeHex(o.accent, '#c2410c')
  const P = Math.round((U * clamp(o.padding, 2, 16)) / 100)
  const photo = safeImage(o.photo)
  const hasPhoto = !!photo && o.photoW > 0 && o.photoH > 0
  const split = hasPhoto && o.layout !== 'stack'
  const panelW = split ? Math.round(W * 0.42) : 0
  const x0 = split && o.layout === 'split-left' ? panelW : 0
  const x1 = split && o.layout === 'split-right' ? W - panelW : W
  const innerX0 = x0 + P
  const innerX1 = x1 - P
  const boxW = Math.max(60, Math.round(((innerX1 - innerX0) * clamp(o.textWidth, 30, 100)) / 100))
  const boxX0 =
    o.align === 'left'
      ? innerX0
      : o.align === 'right'
        ? innerX1 - boxW
        : (innerX0 + innerX1) / 2 - boxW / 2
  const anchorX = o.align === 'left' ? boxX0 : o.align === 'right' ? boxX0 + boxW : boxX0 + boxW / 2
  const anchor = o.align === 'left' ? 'start' : o.align === 'right' ? 'end' : 'middle'

  const text = (e: TextEl) => (e.upper ? e.text.trim().toLocaleUpperCase() : e.text.trim())
  const fm =
    (e: TextEl): Measure =>
    (t, s) =>
      measure(t, {
        size: s,
        stack: FONTS[e.font].stack,
        weight: e.weight,
        italic: e.italic,
        spacing: (e.spacing / 100) * s,
      })
  const attrs = (e: TextEl, size: number, fill: string) =>
    `font-family="${FONTS[e.font].stack}" font-size="${size}" font-weight="${e.weight}"${e.italic ? ' font-style="italic"' : ''} letter-spacing="${num((e.spacing / 100) * size)}" fill="${fill}"${e.opacity < 100 ? ` fill-opacity="${num(clamp(e.opacity, 10, 100) / 100)}"` : ''}`
  const colorOf = (e: TextEl, def: string) => safeHex(e.color, def)

  /** One line of small text, shrunk to fit and cut with an ellipsis only if it still cannot. */
  const oneLine = (e: TextEl, maxW: number, def: string) => {
    const t = text(e)
    if (!t) return null
    const size = Math.round((U * clamp(e.size, 0.8, 10)) / 100)
    const f = fitText(t, { width: maxW, height: size * 2 }, fm(e), {
      max: size,
      min: Math.max(8, Math.round(size * 0.55)),
      lineHeight: 1.2,
      maxLines: 1,
    })
    return {
      text: f.lines[0] ?? '',
      size: f.fontSize,
      fill: colorOf(e, def),
      width: fm(e)(f.lines[0] ?? '', f.fontSize),
    }
  }

  const gap = Math.round(H * 0.035)
  const eyebrow = oneLine(o.eyebrow, boxW, accent)
  const footer = oneLine(o.footer, boxW, textC)
  const badge = oneLine(o.badge, boxW * 0.6, readableOn(accent))
  const badgePadX = badge ? Math.round(badge.size * 0.9) : 0
  const badgePadY = badge ? Math.round(badge.size * 0.45) : 0
  const badgeH = badge ? badge.size + badgePadY * 2 : 0
  const badgeW = badge ? badge.width + badgePadX * 2 : 0
  const badgeSide = !!badge && o.align !== 'center'
  const badgeInBlock = !!badge && o.align === 'center'

  const topH = Math.max(eyebrow ? eyebrow.size * 1.25 : 0, badgeSide ? badgeH : 0)
  const bandTop = P + (topH ? topH + gap : 0)
  const bandBottom = H - P - (footer ? footer.size * 1.25 + gap : 0)

  const subSize = Math.round((U * clamp(o.subtitle.size, 1, 10)) / 100)
  const subText = text(o.subtitle)
  const sub = subText
    ? fitText(subText, { width: boxW, height: subSize * o.subtitle.leading * 3 }, fm(o.subtitle), {
        max: subSize,
        min: Math.round(subSize * 0.7),
        lineHeight: o.subtitle.leading,
        maxLines: 3,
      })
    : null
  const subBlock = sub ? sub.lines.length * sub.fontSize * o.subtitle.leading + gap : 0

  const markUnit = Math.max(4, Math.round(U * 0.005 * clamp(o.markSize, 1, 5)))
  const markBar = o.mark === 'bar' || (o.mark === 'side' && o.align === 'center')
  const sideBar = o.mark === 'side' && o.align !== 'center'
  const underline = o.mark === 'underline'
  const sideW = sideBar ? markUnit + Math.round(U * 0.02) : 0
  const markH = markBar ? markUnit + gap : 0
  const ulH = underline ? markUnit + Math.round(gap * 0.9) : 0
  const badgeBlockH = badgeInBlock ? badgeH + gap : 0

  const titleSize = Math.round((U * clamp(o.title.size, 2, 20)) / 100)
  const title = fitText(
    text(o.title) || 'Your title goes here',
    {
      width: boxW - sideW,
      height: Math.max(40, bandBottom - bandTop - subBlock - markH - ulH - badgeBlockH),
    },
    fm(o.title),
    {
      max: titleSize,
      min: Math.max(10, Math.round(titleSize * 0.4)),
      lineHeight: o.title.leading,
      maxLines: 4,
    }
  )
  const titleH = title.lines.length * title.fontSize * o.title.leading
  const blockH = badgeBlockH + markH + titleH + ulH + subBlock
  const bandH = bandBottom - bandTop
  const free =
    o.vAnchor === 'top' ? 0 : o.vAnchor === 'bottom' ? bandH - blockH : (bandH - blockH) / 2
  const top = bandTop + free + (clamp(o.offsetY, -40, 40) / 100) * H

  const baseline = (start: number, i: number, size: number, leading: number) =>
    Math.round(start + (i + 0.5) * size * leading + size * 0.42)
  const markFill = safeHex(o.markColor, accent)
  const defs: string[] = []
  const layers: string[] = []

  // background
  const fromC = safeHex(o.bgFrom, '#f6f1e7')
  const toC = safeHex(o.bgTo, fromC)
  // In a split layout the picture has its own panel, so the background behind the text is a colour.
  const bgUsesPhoto = o.bgType === 'photo' && hasPhoto && !split
  const gradient =
    o.bgType === 'radial'
      ? `<radialGradient id="bg" cx="0.3" cy="0.3" r="0.9"><stop offset="0" stop-color="${fromC}"/><stop offset="1" stop-color="${toC}"/></radialGradient>`
      : `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(${num(clamp(o.bgAngle, 0, 360))} 0.5 0.5)"><stop offset="0" stop-color="${fromC}"/><stop offset="1" stop-color="${toC}"/></linearGradient>`
  if (o.bgType === 'solid') layers.push(`<rect width="${W}" height="${H}" fill="${fromC}"/>`)
  else if (o.bgType === 'glow') {
    defs.push(
      `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(W * 0.07)}"/></filter>`
    )
    layers.push(
      `<rect width="${W}" height="${H}" fill="${fromC}"/>`,
      `<g filter="url(#glow)"><circle cx="${Math.round(W * 0.18)}" cy="${Math.round(H * 0.25)}" r="${Math.round(W * 0.3)}" fill="${accent}" fill-opacity="0.5"/><circle cx="${Math.round(W * 0.85)}" cy="${Math.round(H * 0.85)}" r="${Math.round(W * 0.36)}" fill="${toC}"/><circle cx="${Math.round(W * 0.62)}" cy="${Math.round(H * 0.05)}" r="${Math.round(W * 0.22)}" fill="${accent}" fill-opacity="0.28"/></g>`
    )
  } else if (!bgUsesPhoto) {
    defs.push(gradient)
    layers.push(`<rect width="${W}" height="${H}" fill="url(#bg)"/>`)
  } else layers.push(`<rect width="${W}" height="${H}" fill="${fromC}"/>`)

  // the picture: full-bleed behind everything, or a panel beside the text
  const pic = { w: o.photoW, h: o.photoH }
  const drawPhoto = (box: { x: number; y: number; w: number; h: number }, id: string) => {
    const r = coverRect(box, pic, o.photoZoom, o.photoX, o.photoY)
    const blur = clamp(o.photoBlur, 0, 40)
    if (blur || o.photoGray)
      defs.push(
        `<filter id="pf${id}" x="-10%" y="-10%" width="120%" height="120%">${blur ? `<feGaussianBlur stdDeviation="${num((blur * U) / 1000)}"/>` : ''}${o.photoGray ? '<feColorMatrix type="saturate" values="0"/>' : ''}</filter>`
      )
    defs.push(
      `<clipPath id="pc${id}"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}"/></clipPath>`
    )
    layers.push(
      `<g clip-path="url(#pc${id})"><image href="${photo}" x="${num(r.x)}" y="${num(r.y)}" width="${num(r.w)}" height="${num(r.h)}" preserveAspectRatio="none"${blur || o.photoGray ? ` filter="url(#pf${id})"` : ''}/></g>`
    )
  }
  if (bgUsesPhoto) {
    drawPhoto({ x: 0, y: 0, w: W, h: H }, 'bg')
    if (o.scrimOpacity > 0)
      layers.push(
        `<rect width="${W}" height="${H}" fill="${safeHex(o.scrimColor, '#000000')}" fill-opacity="${num(clamp(o.scrimOpacity, 0, 100) / 100)}"/>`
      )
  }
  if (split)
    drawPhoto({ x: o.layout === 'split-left' ? 0 : W - panelW, y: 0, w: panelW, h: H }, 'sp')

  // graphics
  if (o.pattern === 'grain')
    defs.push(
      '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>'
    )
  const patColor = safeHex(o.patternColor, accent)
  const patternLayer = patternSvg(
    o.pattern,
    W,
    H,
    patColor,
    num(clamp(o.patternOpacity, 0, 100) / 100),
    o.patternScale
  )
  if (patternLayer)
    layers.push(split ? `<g clip-path="url(#pcpat)">${patternLayer}</g>` : patternLayer)
  if (split && patternLayer)
    defs.push(
      `<clipPath id="pcpat"><rect x="${x0}" y="0" width="${x1 - x0}" height="${H}"/></clipPath>`
    )
  layers.push(
    decorSvg(
      o.decor,
      o.decorCorner,
      W,
      H,
      clamp(o.decorSize, 5, 120),
      safeHex(o.decorColor, accent),
      num(clamp(o.decorOpacity, 0, 100) / 100)
    )
  )
  if (o.frame) {
    const inset = Math.round((U * clamp(o.frameInset, 0, 10)) / 100)
    const sw = num((U * clamp(o.frameWidth, 1, 30)) / 1200)
    layers.push(
      `<rect x="${inset + sw / 2}" y="${inset + sw / 2}" width="${W - inset * 2 - sw}" height="${H - inset * 2 - sw}" rx="${Math.round((U * clamp(o.frameRadius, 0, 10)) / 100)}" fill="none" stroke="${safeHex(o.frameColor, accent)}" stroke-width="${sw}"/>`
    )
  }

  // text panel
  const lineW = (e: TextEl, lines: string[], size: number) =>
    Math.max(0, ...lines.map((l) => fm(e)(l, size)))
  const tight = Math.min(
    boxW,
    Math.max(
      lineW(o.title, title.lines, title.fontSize) + sideW,
      sub ? lineW(o.subtitle, sub.lines, sub.fontSize) : 0,
      badgeInBlock ? badgeW : 0
    )
  )
  if (o.panel) {
    const pad = Math.round(U * 0.03)
    const px =
      o.align === 'left'
        ? anchorX - pad
        : o.align === 'right'
          ? anchorX - tight - pad
          : anchorX - tight / 2 - pad
    layers.push(
      `<rect x="${num(px)}" y="${num(top - pad)}" width="${num(tight + pad * 2)}" height="${num(blockH + pad * 2)}" rx="${Math.round((U * clamp(o.panelRadius, 0, 8)) / 100)}" fill="${safeHex(o.panelColor, '#ffffff')}" fill-opacity="${num(clamp(o.panelOpacity, 0, 100) / 100)}"/>`
    )
  }

  // text and marks
  if (eyebrow)
    layers.push(
      `<text x="${num(anchorX)}" y="${P + eyebrow.size}" ${attrs(o.eyebrow, eyebrow.size, eyebrow.fill)} text-anchor="${anchor}">${esc(eyebrow.text)}</text>`
    )
  const pill = (px: number, py: number) =>
    badge
      ? `<rect x="${num(px)}" y="${num(py)}" width="${num(badgeW)}" height="${badgeH}" rx="${num(badgeH / 2)}" fill="${accent}"/><text x="${num(px + badgeW / 2)}" y="${num(py + badgePadY + badge.size * 0.8)}" ${attrs(o.badge, badge.size, badge.fill)} text-anchor="middle">${esc(badge.text)}</text>`
      : ''
  if (badgeSide) layers.push(pill(o.align === 'left' ? innerX1 - badgeW : innerX0, P))
  let cursor = top
  if (badgeInBlock) {
    layers.push(pill(anchorX - badgeW / 2, cursor))
    cursor += badgeH + gap
  }
  if (markBar) {
    const bw = Math.round(U * 0.06)
    const bx =
      o.align === 'left' ? boxX0 : o.align === 'right' ? boxX0 + boxW - bw : anchorX - bw / 2
    layers.push(
      `<rect x="${num(bx)}" y="${num(cursor)}" width="${bw}" height="${markUnit}" rx="${num(markUnit / 2)}" fill="${markFill}"/>`
    )
    cursor += markUnit + gap
  }
  const titleTop = cursor
  if (sideBar)
    layers.push(
      `<rect x="${num(o.align === 'left' ? anchorX : anchorX - markUnit)}" y="${num(titleTop)}" width="${markUnit}" height="${num(titleH)}" rx="${num(markUnit / 2)}" fill="${markFill}"/>`
    )
  const tx = o.align === 'left' ? anchorX + sideW : o.align === 'right' ? anchorX - sideW : anchorX
  title.lines.forEach((line, i) =>
    layers.push(
      `<text x="${num(tx)}" y="${baseline(titleTop, i, title.fontSize, o.title.leading)}" ${attrs(o.title, title.fontSize, colorOf(o.title, textC))} text-anchor="${anchor}">${esc(line)}</text>`
    )
  )
  cursor += titleH
  if (underline) {
    const uw = Math.min(boxW, Math.round(U * 0.14))
    const ux =
      o.align === 'left' ? boxX0 : o.align === 'right' ? boxX0 + boxW - uw : anchorX - uw / 2
    layers.push(
      `<rect x="${num(ux)}" y="${num(cursor + Math.round(gap * 0.4))}" width="${uw}" height="${markUnit}" rx="${num(markUnit / 2)}" fill="${markFill}"/>`
    )
    cursor += ulH
  }
  if (sub) {
    const subTop = cursor + gap
    sub.lines.forEach((line, i) =>
      layers.push(
        `<text x="${num(anchorX)}" y="${baseline(subTop, i, sub.fontSize, o.subtitle.leading)}" ${attrs(o.subtitle, sub.fontSize, colorOf(o.subtitle, textC))} text-anchor="${anchor}">${esc(line)}</text>`
      )
    )
  }
  if (footer)
    layers.push(
      `<text x="${num(anchorX)}" y="${H - P}" ${attrs(o.footer, footer.size, footer.fill)} text-anchor="${anchor}">${esc(footer.text)}</text>`
    )

  // logo
  const logo = safeImage(o.logo)
  if (logo) {
    const s = Math.round((U * clamp(o.logoSize, 3, 30)) / 100)
    const lx = o.logoPos === 'tl' || o.logoPos === 'bl' ? P : W - P - s
    const ly = o.logoPos === 'tl' || o.logoPos === 'tr' ? P : H - P - s
    if (o.logoRound)
      defs.push(
        `<clipPath id="logoc"><circle cx="${lx + s / 2}" cy="${ly + s / 2}" r="${s / 2}"/></clipPath>`
      )
    layers.push(
      `<image href="${logo}" x="${lx}" y="${ly}" width="${s}" height="${s}" preserveAspectRatio="${o.logoRound ? 'xMidYMid slice' : 'xMidYMid meet'}"${o.logoRound ? ' clip-path="url(#logoc)"' : ''}/>`
    )
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs.join('')}</defs>${layers.join('')}</svg>`
}
