// QR helpers for the Lab. Pure apart from the lazy import of the generator, no
// React and no "@/" imports so node:test can run it.

const QUIET = 4 // modules of blank border the QR spec asks for

export type QrLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrCode {
  /** SVG path of the dark modules, quiet zone included in the coordinates. */
  path: string
  /** Side length in modules, quiet zone included. */
  size: number
  /** Dark modules as [column, row] pairs in the same coordinates, for the rounded styles. */
  cells?: [number, number][]
}

export type QrShape = 'square' | 'dots' | 'rounded'

export interface QrStyle {
  fg: string
  bg: string
  /** Optional caption under the code, e.g. "Scan me". */
  label: string
  /** Module shape. The three corner squares stay square so phones find the code fast. */
  shape?: QrShape
  /** A PNG, JPEG or WebP data URL shown in the middle; needs the toughest damage tolerance. */
  logo?: string
}

/** Share of the code's width the logo may cover; level H survives about 30% of the area. */
const LOGO_SHARE = 0.2

export const MAX_LABEL = 24

/**
 * The generator's default text encoding is a single-byte one that cannot represent Hindi or
 * other non-Latin text: a code made from "दिवाली" scans back as garbage. Phone cameras read
 * byte-mode text as UTF-8, so the text is encoded that way.
 */
const utf8Bytes = (s: string): number[] => Array.from(new TextEncoder().encode(s))

/** Throws when the text does not fit in a QR code at that level. */
export async function makeQr(text: string, level: QrLevel): Promise<QrCode> {
  const { default: qrcode } = await import('qrcode-generator')
  qrcode.stringToBytes = utf8Bytes
  const code = qrcode(0, level)
  code.addData(text)
  code.make()
  const n = code.getModuleCount()
  let path = ''
  const cells: [number, number][] = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (code.isDark(r, c)) {
        path += `M${c + QUIET} ${r + QUIET}h1v1h-1z`
        cells.push([c + QUIET, r + QUIET])
      }
  return { path, size: n + QUIET * 2, cells }
}

/** True for the three 7x7 corner squares (and their gap), which are always drawn square. */
function inFinder(x: number, y: number, size: number): boolean {
  const a = QUIET
  const b = size - QUIET - 7
  return (x < a + 7 && y < a + 7) || (x >= b && y < a + 7) || (x < a + 7 && y >= b)
}

/** Path of the dark modules in the chosen shape. */
function modulePath(qr: QrCode, shape: QrShape): string {
  if (shape === 'square' || !qr.cells) return qr.path
  let d = ''
  for (const [x, y] of qr.cells) {
    if (inFinder(x, y, qr.size)) {
      d += `M${x} ${y}h1v1h-1z`
    } else if (shape === 'dots') {
      d += `M${x + 0.5} ${y + 0.03}a.47 .47 0 1 1 0 .94a.47 .47 0 1 1 0 -.94z`
    } else {
      const r = 0.3
      d += `M${x + r} ${y}h${1 - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${1 - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${1 - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${1 - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`
    }
  }
  return d
}

/** Only small raster images; anything else is dropped so the SVG stays plain and safe. */
export const isLogoDataUrl = (s: string) =>
  /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s)

const xml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Height of the caption strip, in modules; zero without a label. */
const captionHeight = (qr: QrCode, label: string) => (label ? Math.round(qr.size * 0.2) : 0)

/** Standalone SVG. `px` sets the width; height follows. */
export function qrSvg(qr: QrCode, style: QrStyle, px?: number): string {
  const label = style.label.trim().slice(0, MAX_LABEL)
  const extra = captionHeight(qr, label)
  const h = qr.size + extra
  const dims = px ? ` width="${px}" height="${Math.round((px * h) / qr.size)}"` : ''
  const caption = label
    ? `<text x="${qr.size / 2}" y="${qr.size + extra * 0.62}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${Math.min(extra * 0.5, (qr.size * 0.9) / (label.length * 0.6)).toFixed(2)}" fill="${xml(style.fg)}">${xml(label)}</text>`
    : ''
  const shape = style.shape ?? 'square'
  let logo = ''
  if (style.logo && isLogoDataUrl(style.logo)) {
    const side = (qr.size - QUIET * 2) * LOGO_SHARE
    const o = (qr.size - side) / 2
    const pad = side * 0.12
    logo = `<rect x="${o - pad}" y="${o - pad}" width="${side + pad * 2}" height="${side + pad * 2}" rx="${pad}" fill="${xml(style.bg)}"/><image href="${style.logo}" x="${o}" y="${o}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet"/>`
  }
  const render = shape === 'square' ? ' shape-rendering="crispEdges"' : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${h}"${dims}${render}><rect width="${qr.size}" height="${h}" fill="${xml(style.bg)}"/><path d="${modulePath(qr, shape)}" fill="${xml(style.fg)}"/>${logo}${caption}</svg>`
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) return 0
  const n = parseInt(m[1], 16)
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}

/** WCAG contrast ratio, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Plain-language warning when the colours risk an unreadable code; empty when fine. */
export function scanWarning(style: Pick<QrStyle, 'fg' | 'bg'>): string {
  if (luminance(style.fg) >= luminance(style.bg))
    return 'A light code on a dark background fails on many phone cameras. Use a dark code on a light background.'
  if (contrastRatio(style.fg, style.bg) < 4)
    return 'These colours are too close together; the code may not scan. Pick a darker code or a lighter background.'
  return ''
}
