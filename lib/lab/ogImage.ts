// Layout and SVG for the Lab OG image / cover maker. Pure, no React and no "@/" imports so
// node:test can run it. Text width comes from a `measure` function the caller supplies (a canvas in
// the browser), so the same code is tested with a fake one.

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
]

export interface Theme {
  id: string
  label: string
  from: string
  to: string
  text: string
  accent: string
}

export const THEMES: Theme[] = [
  {
    id: 'night',
    label: 'Night',
    from: '#0b0f19',
    to: '#1b2540',
    text: '#f3f4f6',
    accent: '#60a5fa',
  },
  {
    id: 'paper',
    label: 'Paper',
    from: '#f8fafc',
    to: '#e2e8f0',
    text: '#0f172a',
    accent: '#1d4ed8',
  },
  {
    id: 'indigo',
    label: 'Indigo',
    from: '#312e81',
    to: '#1e1b4b',
    text: '#ffffff',
    accent: '#c7d2fe',
  },
  {
    id: 'forest',
    label: 'Forest',
    from: '#064e3b',
    to: '#022c22',
    text: '#ecfdf5',
    accent: '#6ee7b7',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    from: '#7c2d12',
    to: '#431407',
    text: '#fff7ed',
    accent: '#fdba74',
  },
]

export type Align = 'left' | 'center'
export type Pattern = 'none' | 'grid' | 'dots' | 'rings'

export interface OgOptions {
  title: string
  subtitle: string
  siteName: string
  theme: string
  /** Empty means "use the theme's accent". */
  accent: string
  align: Align
  pattern: Pattern
  size: string
}

export type Measure = (text: string, fontSize: number) => number

/** System fonts only: an SVG drawn as an image cannot load web fonts, so the preview and the PNG match. */
export const FONT_STACK =
  "'Segoe UI','Helvetica Neue',Arial,'Nirmala UI','Noto Sans Devanagari','Noto Sans',sans-serif"

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
  let last = kept[rows - 1]
  const chars = graphemes(last)
  while (chars.length && measure(`${chars.join('')}…`, o.min) > box.width) chars.pop()
  last = `${chars.join('')}…`
  kept[rows - 1] = last
  return { lines: kept, fontSize: o.min, truncated: true }
}

/** Accepts #rgb or #rrggbb only. */
export function safeHex(value: string, fallback: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : fallback
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function patternSvg(p: Pattern, w: number, h: number, color: string): string {
  const a = `stroke="${color}" stroke-opacity="0.12"`
  if (p === 'grid') {
    const step = Math.round(w / 20)
    let d = ''
    for (let x = step; x < w; x += step) d += `M${x} 0V${h}`
    for (let y = step; y < h; y += step) d += `M0 ${y}H${w}`
    return `<path d="${d}" fill="none" ${a} stroke-width="1"/>`
  }
  if (p === 'dots') {
    const step = Math.round(w / 24)
    let dots = ''
    for (let x = step; x < w; x += step)
      for (let y = step; y < h; y += step) dots += `<circle cx="${x}" cy="${y}" r="2"/>`
    return `<g fill="${color}" fill-opacity="0.16">${dots}</g>`
  }
  if (p === 'rings') {
    const cx = Math.round(w * 0.88)
    const cy = Math.round(h * 0.12)
    return [1, 2, 3, 4, 5]
      .map(
        (i) =>
          `<circle cx="${cx}" cy="${cy}" r="${Math.round(w * 0.1 * i)}" fill="none" ${a} stroke-width="2"/>`
      )
      .join('')
  }
  return ''
}

/** The finished image as an SVG string. */
export function buildOgSvg(o: OgOptions, measure: Measure): string {
  const size = SIZES.find((s) => s.id === o.size) ?? SIZES[0]
  const theme = THEMES.find((t) => t.id === o.theme) ?? THEMES[0]
  const accent = safeHex(o.accent, theme.accent)
  const { width: W, height: H } = size
  const pad = Math.round(W * 0.07)
  const innerW = W - pad * 2
  const center = o.align === 'center'
  const x = center ? W / 2 : pad
  const anchor = center ? 'middle' : 'start'

  const siteSize = Math.round(W * 0.026)
  const top = pad + (o.siteName.trim() ? siteSize + Math.round(H * 0.04) : 0)
  const availH = H - pad - top

  const subSize = Math.round(W * 0.03)
  const subLines = o.subtitle.trim()
    ? fitText(o.subtitle, { width: innerW, height: subSize * 1.4 * 2 }, measure, {
        max: subSize,
        min: Math.round(subSize * 0.7),
        lineHeight: 1.4,
        maxLines: 2,
      })
    : null
  const subBlock = subLines
    ? subLines.lines.length * subLines.fontSize * 1.4 + Math.round(H * 0.04)
    : 0
  // The short accent bar above the title is part of the layout, so it can never touch the site
  // name above it or the first line of the title below it.
  const barH = 6
  const barGap = Math.round(H * 0.04)
  const title = fitText(
    o.title.trim() || 'Your title goes here',
    { width: innerW, height: availH - subBlock - barH - barGap },
    measure,
    { max: Math.round(W * 0.085), min: Math.round(W * 0.04), lineHeight: 1.15, maxLines: 4 }
  )
  const titleBlock = title.lines.length * title.fontSize * 1.15
  const startY = top + (availH - (barH + barGap + titleBlock + subBlock)) / 2
  const titleY = startY + barH + barGap

  const texts: string[] = []
  if (o.siteName.trim())
    texts.push(
      `<text x="${x}" y="${pad + siteSize}" font-size="${siteSize}" font-weight="600" fill="${accent}" text-anchor="${anchor}" letter-spacing="1">${esc(o.siteName.trim())}</text>`
    )
  const bar = center ? W / 2 - 32 : pad
  texts.push(
    `<rect x="${bar}" y="${Math.round(startY)}" width="64" height="${barH}" rx="3" fill="${accent}"/>`
  )
  title.lines.forEach((line, i) => {
    // 1.02 em of headroom: Devanagari and other tall scripts rise higher above the baseline than Latin.
    const y = Math.round(titleY + title.fontSize * 1.02 + i * title.fontSize * 1.15)
    texts.push(
      `<text x="${x}" y="${y}" font-size="${title.fontSize}" font-weight="700" fill="${theme.text}" text-anchor="${anchor}">${esc(line)}</text>`
    )
  })
  subLines?.lines.forEach((line, i) => {
    const y = Math.round(
      titleY +
        titleBlock +
        Math.round(H * 0.04) +
        subLines.fontSize * 0.95 +
        i * subLines.fontSize * 1.4
    )
    texts.push(
      `<text x="${x}" y="${y}" font-size="${subLines.fontSize}" fill="${theme.text}" fill-opacity="0.75" text-anchor="${anchor}">${esc(line)}</text>`
    )
  })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT_STACK}">`,
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.from}"/><stop offset="1" stop-color="${theme.to}"/></linearGradient></defs>`,
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>`,
    patternSvg(o.pattern, W, H, accent),
    ...texts,
    '</svg>',
  ].join('')
}
