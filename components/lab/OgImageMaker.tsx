'use client'

import { useId, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { contrastRatio } from '@/lib/lab/qr'
import {
  buildOgSvg,
  FONT_STACK,
  safeHex,
  SIZES,
  THEMES,
  type Align,
  type Measure,
  type OgOptions,
  type Pattern,
} from '@/lib/lab/ogImage'
import { saveBlob } from './saveFile'
import { trackLab } from './track'

const chip = (active: boolean) =>
  active
    ? 'bg-ds-cta rounded-lg px-3 py-1.5 text-sm font-medium text-white'
    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'

const field =
  'border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full rounded-lg border px-3 py-2 text-sm outline-none'

const PATTERNS: { id: Pattern; label: string }[] = [
  { id: 'none', label: 'Plain' },
  { id: 'grid', label: 'Grid' },
  { id: 'dots', label: 'Dots' },
  { id: 'rings', label: 'Rings' },
]

let ctx: CanvasRenderingContext2D | null | undefined
/** Real text width from a canvas, with the same system fonts the image uses. */
const measure: Measure = (text, size) => {
  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * size * 0.55
  ctx.font = `700 ${size}px ${FONT_STACK}`
  return ctx.measureText(text).width
}

const subscribe = () => () => {}

/**
 * Type a title, pick a look, download a PNG or SVG sized for social sharing or a blog cover.
 * Drawn in your browser from system fonts, so the preview is exactly the file you download.
 */
export function OgImageMaker() {
  const sizeId = useId()
  const [opts, setOpts] = useState<OgOptions>({
    title: '',
    subtitle: '',
    siteName: '',
    theme: 'night',
    accent: '',
    align: 'left',
    pattern: 'rings',
    size: 'og',
  })
  // Text is measured on a canvas, which only exists in the browser; render the preview there.
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const set = <K extends keyof OgOptions>(k: K, v: OgOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }))

  const svg = useMemo(() => (isClient ? buildOgSvg(opts, measure) : ''), [isClient, opts])
  const theme = THEMES.find((t) => t.id === opts.theme) ?? THEMES[0]
  const accent = safeHex(opts.accent, theme.accent)
  const size = SIZES.find((s) => s.id === opts.size) ?? SIZES[0]
  const lowAccent = contrastRatio(accent, theme.from) < 3

  async function downloadPng() {
    trackLab('og-image', 'download_png', opts.size)
    // data: URL, not blob: the site CSP only allows data: for images.
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image decode failed'))
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    })
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    canvas.getContext('2d')?.drawImage(img, 0, 0, size.width, size.height)
    canvas.toBlob((b) => b && saveBlob(b, `og-image-${size.width}x${size.height}.png`), 'image/png')
  }

  function downloadSvg() {
    trackLab('og-image', 'download_svg', opts.size)
    void saveBlob(
      new Blob([svg], { type: 'image/svg+xml' }),
      `og-image-${size.width}x${size.height}.svg`
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start">
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="og-title" className="text-ds-text mb-1.5 block text-[13px] font-medium">
            Title
          </label>
          <textarea
            id="og-title"
            rows={2}
            maxLength={160}
            value={opts.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Your title goes here"
            className={`${field} resize-y`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="og-sub" className="text-ds-text mb-1.5 block text-[13px] font-medium">
              Subtitle (optional)
            </label>
            <input
              id="og-sub"
              maxLength={160}
              value={opts.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              className={field}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="og-site" className="text-ds-text mb-1.5 block text-[13px] font-medium">
              Site name (optional)
            </label>
            <input
              id="og-site"
              maxLength={60}
              value={opts.siteName}
              onChange={(e) => set('siteName', e.target.value)}
              placeholder="yoursite.com"
              className={field}
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <p className="text-ds-text mb-1.5 text-[13px] font-medium">Look</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Colour theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={opts.theme === t.id}
                onClick={() => set('theme', t.id)}
                className={chip(opts.theme === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-ds-text flex flex-col gap-1.5 text-[13px] font-medium">
            Accent colour
            <input
              type="color"
              value={accent}
              onChange={(e) => set('accent', e.target.value)}
              className="h-9 w-full cursor-pointer"
            />
          </label>
          <div>
            <p className="text-ds-text mb-1.5 text-[13px] font-medium">Alignment</p>
            <div className="flex gap-2" role="group" aria-label="Text alignment">
              {(['left', 'center'] as Align[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={opts.align === a}
                  onClick={() => set('align', a)}
                  className={chip(opts.align === a)}
                >
                  {a === 'left' ? 'Left' : 'Centre'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor={sizeId} className="text-ds-text mb-1.5 block text-[13px] font-medium">
              Size
            </label>
            <select
              id={sizeId}
              value={opts.size}
              onChange={(e) => set('size', e.target.value)}
              className={field}
            >
              {SIZES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {lowAccent && (
          <p className="text-ds-warning-strong text-sm" role="alert">
            This accent colour is hard to see on the {theme.label} background. Pick a lighter or
            darker one.
          </p>
        )}

        <div>
          <p className="text-ds-text mb-1.5 text-[13px] font-medium">Background pattern</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Background pattern">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={opts.pattern === p.id}
                onClick={() => set('pattern', p.id)}
                className={chip(opts.pattern === p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-ds-accent/30 bg-ds-surface2 rounded-xl border p-4 sm:p-5 lg:sticky lg:top-6">
        <h2 className="text-ds-text mb-3 text-base font-semibold">Your image</h2>
        <div className="border-ds-border overflow-hidden rounded-lg border">
          {svg ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data: URL made here, not a file next/image can optimise
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
              alt={`Preview: ${opts.title.trim() || 'Your title goes here'}`}
              width={size.width}
              height={size.height}
              className="block h-auto w-full"
            />
          ) : (
            <div className="bg-ds-surface aspect-[1200/630] w-full" />
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={downloadPng} disabled={!svg}>
            Download PNG
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={downloadSvg} disabled={!svg}>
            Download SVG
          </Button>
        </div>
        <p className="text-ds-muted mt-4 text-xs leading-relaxed">
          Text is drawn with your device&apos;s own fonts, so the file looks like this preview.
          Hindi and other scripts work if your device has a font for them. Next.js uses a file named{' '}
          <code className="text-ds-accent-strong">opengraph-image.png</code> in a route folder as
          that page&apos;s share image; the{' '}
          <Link href="/lab/meta-tag-generator" className="text-ds-accent-strong underline">
            Next.js SEO Kit
          </Link>{' '}
          writes the rest.
        </p>
      </div>
    </div>
  )
}
