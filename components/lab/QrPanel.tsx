'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { makeQr, qrSvg, scanWarning, MAX_LABEL, type QrCode, type QrLevel } from '@/lib/lab/qr'
import { printQrSheet } from './qrPrint'
import { saveBlob } from './saveFile'
import { trackLab } from './track'

const LEVELS: { value: QrLevel; label: string }[] = [
  { value: 'L', label: 'Smallest code' },
  { value: 'M', label: 'Standard' },
  { value: 'Q', label: 'Tougher (for print)' },
  { value: 'H', label: 'Toughest' },
]
const SIZES = [512, 1024, 2048]

const field =
  'border-ds-border bg-ds-surface2 text-ds-text rounded-md border px-2 py-1 text-xs focus-visible:ring-ds-accent focus-visible:ring-2 focus-visible:outline-none'

/**
 * Preview, style options and save / print buttons for one QR code. Static: the
 * text is stored inside the pattern, so the code never expires and nothing is
 * sent anywhere. Used inside the UTM dialog and on the QR generator page.
 * Remount with a new key when `text` should reset the style.
 */
export function QrPanel({
  text,
  fileBase,
  printCaption = 'Scan to open',
  showText = false,
  tool = 'qr',
  kind,
  children,
}: {
  text: string
  /** File name without extension, e.g. qr-google-spring-sale. */
  fileBase: string
  printCaption?: string
  /** Show the encoded text under the code (useful for links, not for passwords). */
  showText?: boolean
  /** Tool name for usage tracking, and the kind of code when there is one. */
  tool?: string
  kind?: string
  /** Extra buttons at the end of the action row, such as Close. */
  children?: React.ReactNode
}) {
  const [qr, setQr] = useState<QrCode | null>(null)
  const [error, setError] = useState('')
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [label, setLabel] = useState('')
  const [level, setLevel] = useState<QrLevel>('M')
  const [size, setSize] = useState(1024)
  const style = { fg, bg, label }
  const warning = scanWarning(style)

  useEffect(() => {
    let live = true
    makeQr(text, level)
      .then((code) => {
        if (!live) return
        setQr(code)
        setError('')
      })
      .catch(() => {
        if (live) {
          setQr(null)
          setError('This is too long to fit in a QR code. Shorten it.')
        }
      })
    return () => {
      live = false
    }
  }, [text, level])

  async function downloadPng() {
    if (!qr) return
    trackLab(tool, 'download_png', kind)
    // data: URL, not blob: the site CSP only allows data: for images.
    const svg = qrSvg(qr, style, size)
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('qr decode failed'))
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    })
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = Math.round((size * img.naturalHeight) / img.naturalWidth)
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((b) => b && saveBlob(b, `${fileBase}.png`), 'image/png')
  }

  return (
    <div>
      <div className="w-full overflow-hidden rounded-lg">
        {qr && (
          <div
            role="img"
            aria-label="QR code"
            // Our own SVG markup; the caption and colours are XML-escaped in qrSvg.
            dangerouslySetInnerHTML={{ __html: qrSvg(qr, style) }}
            className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          />
        )}
        {error && <p className="bg-white p-4 text-sm text-black">{error}</p>}
      </div>

      {warning && (
        <p className="text-ds-warning-strong mt-3 text-sm" role="alert">
          {warning}
        </p>
      )}

      {showText && <p className="text-ds-muted mt-3 font-mono text-xs break-all">{text}</p>}

      <details className="mt-4">
        <summary className="text-ds-muted hover:text-ds-accent cursor-pointer text-sm select-none">
          Style and size (optional)
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <label className="text-ds-muted flex flex-col gap-1">
            Code colour
            <input
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="h-8 w-full cursor-pointer"
            />
          </label>
          <label className="text-ds-muted flex flex-col gap-1">
            Background
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-8 w-full cursor-pointer"
            />
          </label>
          <label className="text-ds-muted col-span-2 flex flex-col gap-1">
            Text under the code
            <input
              type="text"
              value={label}
              maxLength={MAX_LABEL}
              placeholder="Scan me"
              onChange={(e) => setLabel(e.target.value)}
              className={field}
            />
          </label>
          <label className="text-ds-muted flex flex-col gap-1">
            PNG width
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className={field}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}px{s === 2048 ? ' (large print)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-ds-muted flex flex-col gap-1">
            Damage tolerance
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as QrLevel)}
              className={field}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={!qr} onClick={downloadPng}>
          Download PNG
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!qr}
          onClick={() => {
            if (!qr) return
            trackLab(tool, 'download_svg', kind)
            saveBlob(new Blob([qrSvg(qr, style)], { type: 'image/svg+xml' }), `${fileBase}.svg`)
          }}
        >
          Download SVG
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!qr}
          onClick={() => {
            if (!qr) return
            trackLab(tool, 'print', kind)
            printQrSheet([{ qr, style, caption: label || printCaption, url: showText ? text : '' }])
          }}
        >
          Print
        </Button>
        {children}
      </div>
    </div>
  )
}
