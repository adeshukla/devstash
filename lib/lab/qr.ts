// QR helpers for the Lab. Pure apart from the lazy import of the generator, no
// React and no "@/" imports so node:test can run it.

const QUIET = 4 // modules of blank border the QR spec asks for

export type QrLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrCode {
  /** SVG path of the dark modules, quiet zone included in the coordinates. */
  path: string
  /** Side length in modules, quiet zone included. */
  size: number
}

export interface QrStyle {
  fg: string
  bg: string
  /** Optional caption under the code, e.g. "Scan me". */
  label: string
}

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
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (code.isDark(r, c)) path += `M${c + QUIET} ${r + QUIET}h1v1h-1z`
  return { path, size: n + QUIET * 2 }
}

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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${h}"${dims} shape-rendering="crispEdges"><rect width="${qr.size}" height="${h}" fill="${xml(style.bg)}"/><path d="${qr.path}" fill="${xml(style.fg)}"/>${caption}</svg>`
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
