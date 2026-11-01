'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'

const QUIET = 4 // modules of blank border the QR spec asks for

interface Qr {
  path: string
  size: number
}

function svgMarkup(qr: Qr, px?: number) {
  const dims = px ? ` width="${px}" height="${px}"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${qr.size}"${dims} shape-rendering="crispEdges"><rect width="${qr.size}" height="${qr.size}" fill="#fff"/><path d="${qr.path}" fill="#000"/></svg>`
}

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

/**
 * QR code for one tagged link, in a native modal <dialog> (focus trap and Esc
 * come with it). The generator is loaded only when this opens. The code holds
 * the full link, so there is no shortener and nothing is stored anywhere.
 * Mount it with key={url} so each link starts from fresh state.
 */
export function UtmQr({ url, onClose }: { url: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [qr, setQr] = useState<Qr | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    dialog.current?.showModal()
    let live = true
    import('qrcode-generator').then(({ default: qrcode }) => {
      if (!live) return
      try {
        const code = qrcode(0, 'M')
        code.addData(url)
        code.make()
        const n = code.getModuleCount()
        let path = ''
        for (let r = 0; r < n; r++)
          for (let c = 0; c < n; c++)
            if (code.isDark(r, c)) path += `M${c + QUIET} ${r + QUIET}h1v1h-1z`
        setQr({ path, size: n + QUIET * 2 })
      } catch {
        setError(
          'This link is too long to fit in a QR code. Shorten the campaign name or the page URL.'
        )
      }
    })
    return () => {
      live = false
    }
  }, [url])

  async function downloadPng() {
    if (!qr) return
    // data: URL, not blob: the site CSP only allows data: for images.
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup(qr, 1024))}`
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('qr decode failed'))
      img.src = src
    })
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1024
    canvas.getContext('2d')?.drawImage(img, 0, 0, 1024, 1024)
    canvas.toBlob((b) => b && save(b, fileName(url, 'png')), 'image/png')
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      aria-label="QR code for this link"
      className="border-ds-border bg-ds-surface text-ds-text m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border p-5 backdrop:bg-black/60"
    >
      <h2 className="text-lg font-semibold">QR code</h2>
      <p className="text-ds-muted mt-1 text-sm">
        Scanning it opens the tagged link below. No shortener, nothing stored.
      </p>

      <div className="mt-4 aspect-square w-full overflow-hidden rounded-lg bg-white">
        {qr && (
          <svg
            viewBox={`0 0 ${qr.size} ${qr.size}`}
            role="img"
            aria-label="QR code"
            className="h-full w-full"
            shapeRendering="crispEdges"
          >
            <path d={qr.path} fill="#000" />
          </svg>
        )}
        {error && <p className="p-4 text-sm text-black">{error}</p>}
      </div>

      <p className="text-ds-muted mt-3 font-mono text-xs break-all">{url}</p>

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
            qr && save(new Blob([svgMarkup(qr)], { type: 'image/svg+xml' }), fileName(url, 'svg'))
          }
        >
          Download SVG
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => dialog.current?.close()}>
          Close
        </Button>
      </div>
    </dialog>
  )
}
