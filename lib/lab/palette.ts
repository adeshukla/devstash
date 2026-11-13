// Colours from an image, for the Lab OG image maker. Pure, no React and no "@/" imports so
// node:test can run it. Pixels come in as RGBA (a small thumbnail is plenty); out come the
// dominant colours and a theme that keeps the text readable.

import { contrastRatio } from './qr.ts'

export interface Swatch {
  hex: string
  /** Share of the image, 0 to 1. */
  share: number
}

export interface Suggestion {
  bgFrom: string
  bgTo: string
  accent: string
  text: string
  /** True when the background is dark, so light text is used. */
  dark: boolean
}

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.replace(/./g, '$&$&') : h
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]
}

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

function toHsl([r, g, b]: number[]): [number, number, number] {
  const [x, y, z] = [r / 255, g / 255, b / 255]
  const max = Math.max(x, y, z)
  const min = Math.min(x, y, z)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === x ? ((y - z) / d) % 6 : max === y ? (z - x) / d + 2 : (x - y) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

/** Relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = toRgb(hex)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Mixes two colours; `t` is how much of `b` (0 to 1). */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [toRgb(a), toRgb(b)]
  return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t)
}

/** Average colour of the opaque pixels. */
export function meanColor(data: Uint8ClampedArray): string {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
    n++
  }
  return n ? toHex(r / n, g / n, b / n) : '#808080'
}

/**
 * The dominant colours by median cut: repeatedly split the box of pixels with the widest colour
 * range at its median, then average each box. Deterministic, so the same image always gives the
 * same palette. Near-identical results are merged.
 */
export function extractPalette(data: Uint8ClampedArray, k = 6): Swatch[] {
  const px: number[][] = []
  const step = Math.max(1, Math.floor(data.length / 4 / 6000))
  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i + 3] < 128) continue
    px.push([data[i], data[i + 1], data[i + 2]])
  }
  if (!px.length) return []
  let boxes: number[][][] = [px]
  while (boxes.length < k) {
    let pick = -1
    let best = 0
    boxes.forEach((box, i) => {
      if (box.length < 2) return
      const range = [0, 1, 2].map(
        (c) => Math.max(...box.map((p) => p[c])) - Math.min(...box.map((p) => p[c]))
      )
      const score = Math.max(...range) * Math.sqrt(box.length)
      if (score > best) {
        best = score
        pick = i
      }
    })
    if (pick < 0 || best < 8) break
    const box = boxes[pick]
    const ch = [0, 1, 2]
      .map((c) => ({ c, r: Math.max(...box.map((p) => p[c])) - Math.min(...box.map((p) => p[c])) }))
      .sort((a, b) => b.r - a.r)[0].c
    const sorted = [...box].sort((a, b) => a[ch] - b[ch])
    const mid = Math.floor(sorted.length / 2)
    boxes = [
      ...boxes.slice(0, pick),
      sorted.slice(0, mid),
      sorted.slice(mid),
      ...boxes.slice(pick + 1),
    ]
  }
  // Median cut can split inside one colour; a few k-means passes settle each centre on a real one.
  let centres = boxes.map((box) =>
    [0, 1, 2].map((i) => box.reduce((s, q) => s + q[i], 0) / box.length)
  )
  let counts: number[] = []
  for (let iter = 0; iter < 8; iter++) {
    const sums = centres.map(() => [0, 0, 0, 0])
    for (const q of px) {
      let best = 0
      let bd = Infinity
      centres.forEach((c, i) => {
        const d = dist(c, q)
        if (d < bd) {
          bd = d
          best = i
        }
      })
      sums[best][0] += q[0]
      sums[best][1] += q[1]
      sums[best][2] += q[2]
      sums[best][3]++
    }
    counts = sums.map((s) => s[3])
    centres = sums.map((s, i) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centres[i]))
  }
  const total = px.length
  const out: { c: number[]; n: number }[] = []
  centres.forEach((c, i) => {
    if (!counts[i]) return
    const near = out.find((o) => dist(o.c, c) < 28)
    if (near) {
      const n = near.n + counts[i]
      near.c = near.c.map((v, k) => (v * near.n + c[k] * counts[i]) / n)
      near.n = n
    } else out.push({ c, n: counts[i] })
  })
  return out
    .sort((x, y) => y.n - x.n)
    .map((o) => ({ hex: toHex(o.c[0], o.c[1], o.c[2]), share: o.n / total }))
}

const WHITE = '#ffffff'
const INK = '#111827'

/** The text colour, white or near-black, that reads best on a background. */
export function readableOn(bg: string): string {
  return contrastRatio(WHITE, bg) >= contrastRatio(INK, bg) ? WHITE : INK
}

/**
 * A theme from a palette: the biggest colour is the background, a different one blends in as the
 * gradient end, the most vivid colour that stands apart from the background is the accent, and
 * the text is whichever of white or near-black is easier to read.
 */
export function suggestStyle(palette: Swatch[]): Suggestion | null {
  if (!palette.length) return null
  const first = palette[0].hex
  let text = readableOn(first)
  // For some mid-tones neither white nor near-black reaches 4.5:1. Move the background away from the
  // text colour, in small steps, until it does.
  let bgFrom = first
  for (let t = 0.05; contrastRatio(text, bgFrom) < 4.5 && t <= 1.001; t += 0.05) {
    bgFrom = mix(first, text === WHITE ? '#000000' : '#ffffff', t)
  }
  const dark = luminance(bgFrom) < 0.4
  const second = palette.slice(1).find((s) => dist(toRgb(s.hex), toRgb(first)) > 60)
  const bgTo = second
    ? second.hex
    : dark
      ? mix(bgFrom, '#000000', 0.45)
      : mix(bgFrom, '#ffffff', 0.4)
  const vivid = palette
    .map((s) => ({ s, sat: toHsl(toRgb(s.hex))[1] * (0.4 + 0.6 * Math.min(1, s.share * 6 + 0.3)) }))
    .filter(({ s }) => s.hex !== first && contrastRatio(s.hex, bgFrom) >= 3)
    .sort((x, y) => y.sat - x.sat)[0]
  let accent = vivid ? vivid.s.hex : ''
  if (!accent) {
    // No colour stands apart: take the background's hue, made strong and moved away from it.
    const [h, sat] = toHsl(toRgb(bgFrom))
    accent = fromHsl(h, Math.max(0.6, sat), dark ? 0.7 : 0.32)
    if (contrastRatio(accent, bgFrom) < 3) accent = text
  }
  text = contrastRatio(text, bgFrom) >= 4.5 ? text : readableOn(bgFrom)
  return { bgFrom, bgTo, accent, text, dark }
}

/**
 * A darkening or lightening layer to put over a photo so text stays readable: the lowest opacity,
 * from 15% up to 85%, at which the text reaches 4.5:1 against the photo's average colour.
 */
export function scrimFor(photoMean: string, textHex: string): { color: string; opacity: number } {
  const color = luminance(textHex) > 0.5 ? '#000000' : '#ffffff'
  for (let o = 0.15; o <= 0.851; o += 0.05) {
    if (contrastRatio(textHex, mix(photoMean, color, o)) >= 4.5)
      return { color, opacity: Math.round(o * 100) / 100 }
  }
  return { color, opacity: 0.85 }
}
