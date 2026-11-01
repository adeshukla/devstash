'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { makeQr, qrSvg, scanWarning, MAX_LABEL, type QrCode, type QrLevel } from '@/lib/lab/qr'
import { printQrSheet } from './qrPrint'

interface SaveHandle {
  createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }>
}
type SavePicker = (opts: {
  suggestedName: string
  types: { description: string; accept: Record<string, string[]> }[]
}) => Promise<SaveHandle>

/** Readable file name from the link, e.g. qr-google-spring-sale.png. */
function fileName(url: string, ext: string) {
  try {
    const p = new URL(url).searchParams
    const parts = [p.get('utm_source'), p.get('utm_campaign')].filter(Boolean)
    if (parts.length) return `qr-${parts.join('-')}.${ext}`.slice(0, 80)
  } catch {}
  return `utm-qr.${ext}`
}

/**
 * Opens the system "Save as" dialog where the browser has one (Chrome, Edge,
 * Opera) so the user picks the folder. Firefox and Safari have no such API and
 * fall back to a normal download.
 */
async function save(blob: Blob, name: string) {
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker
  if (picker) {
    try {
      const ext = name.slice(name.lastIndexOf('.'))
      const handle = await picker({
        suggestedName: name,
        types: [
          { description: ext.slice(1).toUpperCase() + ' image', accept: { [blob.type]: [ext] } },
        ],
      })
      const file = await handle.createWritable()
      await file.write(blob)
      await file.close()
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return // user cancelled
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

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
 * QR code for one tagged link, in a native modal <dialog> (focus trap and Esc
 * come with it). The generator is loaded only when this opens. The code is
 * static: it holds the full link, so it never expires, there is no shortener
 * and nothing is stored. Colours, caption, size and error correction are
 * optional. Mount it with key={url} so each link starts from fresh state.
 */
export function UtmQr({ url, onClose }: { url: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
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
    dialog.current?.showModal()
  }, [])

  useEffect(() => {
    let live = true
    makeQr(url, level)
      .then((code) => {
        if (!live) return
        setQr(code)
        setError('')
      })
      .catch(() => {
        if (live)
          setError(
            'This link is too long to fit in a QR code. Shorten the campaign name or the page URL.'
          )
      })
    return () => {
      live = false
    }
  }, [url, level])

  async function downloadPng() {
    if (!qr) return
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
    canvas.toBlob((b) => b && save(b, fileName(url, 'png')), 'image/png')
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      aria-label="QR code for this link"
      className="border-ds-border bg-ds-surface text-ds-text m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border p-5 backdrop:bg-black/60"
    >
      <h2 className="text-lg font-semibold">QR code</h2>
      <p className="text-ds-muted mt-1 text-sm">
        A static code: the link is stored inside the pattern, so it never expires and there is no
        subscription.
      </p>

      <div className="mt-4 w-full overflow-hidden rounded-lg">
        {qr && (
          <div
            role="img"
            aria-label="QR code"
            // Our own SVG markup; the caption is XML-escaped in qrSvg.
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

      <p className="text-ds-muted mt-3 font-mono text-xs break-all">{url}</p>

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
          onClick={() =>
            qr &&
            save(new Blob([qrSvg(qr, style)], { type: 'image/svg+xml' }), fileName(url, 'svg'))
          }
        >
          Download SVG
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!qr}
          onClick={() => qr && printQrSheet([{ qr, style, caption: label || 'Scan to open', url }])}
        >
          Print
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => dialog.current?.close()}>
          Close
        </Button>
      </div>
    </dialog>
  )
}
