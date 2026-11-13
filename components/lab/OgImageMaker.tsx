'use client'

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { contrastRatio } from '@/lib/lab/qr'
import {
  applyPreset,
  buildOgSvg,
  DEFAULTS,
  PRESETS,
  safeHex,
  SIZES,
  type Align,
  type BgType,
  type Corner,
  type Decor,
  type ElName,
  type FontMeasure,
  type Layout,
  type Mark,
  type OgOptions,
  type Pattern,
  type TextEl,
  type VAnchor,
} from '@/lib/lab/ogImage'
import { extractPalette, meanColor, scrimFor, suggestStyle, type Swatch } from '@/lib/lab/palette'
import {
  ColorField,
  Range,
  Section,
  Seg,
  SelectField,
  TextControls,
  Toggle,
  chip,
} from './OgControls'
import { loadImage } from './ogImageFile'
import { saveBlob } from './saveFile'
import { trackLab } from './track'

let ctx: CanvasRenderingContext2D | null | undefined
const Segmenter = (
  Intl as unknown as {
    Segmenter?: new (l?: string, o?: object) => { segment: (s: string) => Iterable<unknown> }
  }
).Segmenter
const countChars = (t: string) =>
  Segmenter
    ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(t)).length
    : Array.from(t).length

/** Real text width from a canvas, with the same fonts and letter spacing the image uses. */
const measure: FontMeasure = (text, f) => {
  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * f.size * 0.55
  ctx.font = `${f.italic ? 'italic ' : ''}${f.weight} ${f.size}px ${f.stack}`
  return ctx.measureText(text).width + f.spacing * countChars(text)
}

const subscribe = () => () => {}
const clampDim = (v: number) => Math.min(4000, Math.max(200, Math.round(v) || 200))

const ALIGN: { id: Align; label: string }[] = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Centre' },
  { id: 'right', label: 'Right' },
]
const VANCHOR: { id: VAnchor; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'middle', label: 'Middle' },
  { id: 'bottom', label: 'Bottom' },
]
const LAYOUTS: { id: Layout; label: string }[] = [
  { id: 'stack', label: 'Text over background' },
  { id: 'split-left', label: 'Picture on the left' },
  { id: 'split-right', label: 'Picture on the right' },
]
const BGS: { id: BgType; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'linear', label: 'Gradient' },
  { id: 'radial', label: 'Radial' },
  { id: 'glow', label: 'Glow' },
  { id: 'photo', label: 'Picture' },
]
const PATTERNS: { id: Pattern; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'grid', label: 'Grid' },
  { id: 'dots', label: 'Dots' },
  { id: 'rings', label: 'Rings' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'waves', label: 'Waves' },
  { id: 'plus', label: 'Crosses' },
  { id: 'grain', label: 'Grain' },
]
const MARKS: { id: Mark; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'bar', label: 'Bar above' },
  { id: 'side', label: 'Side bar' },
  { id: 'underline', label: 'Underline' },
]
const DECORS: { id: Decor; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'circle', label: 'Circle' },
  { id: 'quarter', label: 'Quarter circle' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'blob', label: 'Blob' },
]
const CORNERS: { id: Corner; label: string }[] = [
  { id: 'tl', label: 'Top left' },
  { id: 'tr', label: 'Top right' },
  { id: 'bl', label: 'Bottom left' },
  { id: 'br', label: 'Bottom right' },
]

const fileButton =
  'border-ds-border text-ds-text hover:border-ds-accent hover:text-ds-accent inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-[var(--color-ds-accent)]'

/**
 * Make a share image or cover: every text has its own font, size, weight, colour and spacing;
 * the background can be a colour, a gradient, a glow or your own picture; patterns, marks, shapes,
 * a frame, a text panel and a logo can be added; and the colours can be taken from a picture.
 * Drawn in your browser from system fonts, so the preview is exactly the file you download.
 */
export function OgImageMaker() {
  const [opts, setOpts] = useState<OgOptions>(DEFAULTS)
  const [swatches, setSwatches] = useState<Swatch[]>([])
  const [photoMean, setPhotoMean] = useState('')
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [scale, setScale] = useState<'1' | '2'>('1')
  const [quality, setQuality] = useState(92)
  // Text is measured on a canvas, which only exists in the browser; render the preview there.
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const live = useDeferredValue(opts)

  const set = <K extends keyof OgOptions>(k: K, v: OgOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }))
  const setEl = (n: ElName) => (patch: Partial<TextEl>) =>
    setOpts((o) => ({ ...o, [n]: { ...o[n], ...patch } }))

  const W = clampDim(live.width)
  const H = clampDim(live.height)
  const svg = useMemo(() => (isClient ? buildOgSvg(live, measure) : ''), [isClient, live])
  const textHex = safeHex(opts.textColor, '#111111')
  const bgHex = safeHex(opts.bgFrom, '#ffffff')
  const accentHex = safeHex(opts.accent, '#c2410c')
  const hasPhoto = !!opts.photo
  const lowText = opts.bgType !== 'photo' && contrastRatio(textHex, bgHex) < 4.5
  const lowAccent = opts.bgType !== 'photo' && contrastRatio(accentHex, bgHex) < 3

  async function onPhoto(file?: File) {
    if (!file) return
    try {
      const img = await loadImage(file, { maxDim: 2000, as: 'jpeg', quality: 0.88 })
      setSwatches(extractPalette(img.thumb, 6))
      setPhotoMean(meanColor(img.thumb))
      setOpts((o) => ({
        ...o,
        photo: img.dataUrl,
        photoW: img.width,
        photoH: img.height,
        photoX: 50,
        photoY: 50,
        photoZoom: 100,
      }))
      setNote({
        ok: true,
        text: `Picture added (${img.width} × ${img.height}). Choose below how to use it.`,
      })
      trackLab('og-image', 'photo_added')
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message })
    }
  }

  async function onLogo(file?: File) {
    if (!file) return
    try {
      const img = await loadImage(file, { maxDim: 512, as: 'png' })
      set('logo', img.dataUrl)
      setNote({ ok: true, text: 'Logo added. Place and size it under Graphics.' })
      trackLab('og-image', 'logo_added')
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message })
    }
  }

  /** A split layout gives the picture its own panel, so it is no longer also the background. */
  function chooseLayout(layout: Layout) {
    setOpts((o) => ({
      ...o,
      layout,
      bgType: layout !== 'stack' && o.bgType === 'photo' ? 'linear' : o.bgType,
    }))
  }

  function removePhoto() {
    setSwatches([])
    setPhotoMean('')
    setOpts((o) => ({
      ...o,
      photo: '',
      photoW: 0,
      photoH: 0,
      bgType: o.bgType === 'photo' ? 'linear' : o.bgType,
      layout: 'stack',
      scrimOpacity: 0,
    }))
    setNote({ ok: true, text: 'Picture removed.' })
  }

  /** The darkening layer that keeps the text readable over this picture. */
  const scrimFrom = (text: string) => {
    const s = scrimFor(photoMean || '#808080', text)
    return { scrimColor: s.color, scrimOpacity: Math.round(s.opacity * 100) }
  }

  function photoAsBackground() {
    setOpts((o) => ({
      ...o,
      bgType: 'photo',
      layout: 'stack',
      ...scrimFrom(safeHex(o.textColor, '#111111')),
    }))
    trackLab('og-image', 'photo_background')
  }

  function matchColours() {
    const s = suggestStyle(swatches)
    if (!s) return
    setOpts((o) => ({
      ...o,
      bgFrom: s.bgFrom,
      bgTo: s.bgTo,
      accent: s.accent,
      textColor: s.text,
      bgType: o.bgType === 'photo' ? 'photo' : o.bgType === 'solid' ? 'solid' : 'linear',
      ...(o.bgType === 'photo' ? scrimFrom(s.text) : {}),
    }))
    setNote({
      ok: true,
      text: `Colours taken from the picture. The text is ${s.dark ? 'light' : 'dark'} so it stays readable.`,
    })
    trackLab('og-image', 'match_colours')
  }

  const role = (hex: string, what: 'bg' | 'accent' | 'text') =>
    setOpts((o) =>
      what === 'bg'
        ? { ...o, bgFrom: hex }
        : what === 'accent'
          ? { ...o, accent: hex }
          : { ...o, textColor: hex, ...(o.bgType === 'photo' ? scrimFrom(hex) : {}) }
    )

  function surprise() {
    const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
    setOpts((o) => ({
      ...applyPreset(o, pick(PRESETS)),
      pattern: pick(PATTERNS).id,
      mark: pick(MARKS).id,
      decor: pick(DECORS).id,
      decorCorner: pick(CORNERS).id,
      align: pick(ALIGN).id,
      vAnchor: pick(VANCHOR).id,
    }))
    trackLab('og-image', 'surprise')
  }

  const sizeOf = () => ({ w: clampDim(opts.width), h: clampDim(opts.height) })

  async function rasterize(): Promise<HTMLCanvasElement> {
    const { w, h } = sizeOf()
    const k = Math.min(Number(scale), 8000 / Math.max(w, h))
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image decode failed'))
      // data: URL, not blob: the site CSP only allows data: for images.
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildOgSvg(opts, measure))}`
    })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * k)
    canvas.height = Math.round(h * k)
    const c = canvas.getContext('2d')
    if (format === 'jpeg' && c) {
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, canvas.width, canvas.height)
    }
    c?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  async function download() {
    trackLab('og-image', 'download', `${format}_${scale}x`)
    const { w, h } = sizeOf()
    const canvas = await rasterize()
    const type = format === 'png' ? 'image/png' : 'image/jpeg'
    canvas.toBlob(
      (b) =>
        b &&
        saveBlob(
          b,
          `og-image-${w}x${h}${scale === '2' ? '@2x' : ''}.${format === 'png' ? 'png' : 'jpg'}`
        ),
      type,
      quality / 100
    )
  }

  function downloadSvg() {
    trackLab('og-image', 'download_svg')
    const { w, h } = sizeOf()
    void saveBlob(
      new Blob([buildOgSvg(opts, measure)], { type: 'image/svg+xml' }),
      `og-image-${w}x${h}.svg`
    )
  }

  const dataUrl = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : ''

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-start">
      <div className="flex flex-col gap-3">
        <Section title="Start from a look" open>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Looks">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setOpts((o) => applyPreset(o, p))
                  trackLab('og-image', 'preset', p.id)
                }}
                className={chip(false)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={surprise}>
              Surprise me
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpts((o) => applyPreset(o, PRESETS[0]))}
            >
              Reset the style
            </Button>
          </div>
          <p className="text-ds-muted text-xs">
            A look changes colours, fonts and graphics. Your texts, picture and logo stay.
          </p>
        </Section>

        <Section title="Take the style from a picture" hint="your hero image, a photo, a logo" open>
          <div className="flex flex-wrap items-center gap-3">
            <label className={fileButton}>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Choose a picture"
                onChange={(e) => {
                  void onPhoto(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              {hasPhoto ? 'Choose another picture' : 'Choose a picture'}
            </label>
            {hasPhoto && (
              <Button type="button" size="sm" variant="ghost" onClick={removePhoto}>
                Remove the picture
              </Button>
            )}
          </div>
          <p className="text-ds-muted text-xs">
            PNG, JPG, WebP or SVG up to 15 MB. It stays in your browser and is never uploaded.
          </p>
          {note && (
            <p
              className={note.ok ? 'text-ds-muted text-sm' : 'text-ds-warning-strong text-sm'}
              role={note.ok ? 'status' : 'alert'}
            >
              {note.text}
            </p>
          )}
          {hasPhoto && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL made here, not a file next/image can optimise */}
                <img
                  src={opts.photo}
                  alt="The picture you chose"
                  className="border-ds-border h-16 w-auto rounded-md border"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={matchColours}
                    disabled={!swatches.length}
                  >
                    Match its colours
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={photoAsBackground}>
                    Use as background
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => chooseLayout('split-left')}
                  >
                    Beside the text
                  </Button>
                </div>
              </div>
              {swatches.length > 0 && (
                <div>
                  <p className="text-ds-text mb-1.5 text-[13px] font-medium">Colours found</p>
                  <ul
                    className="grid gap-2 sm:grid-cols-2"
                    aria-label="Colours found in the picture"
                  >
                    {swatches.map((s) => (
                      <li
                        key={s.hex}
                        className="border-ds-border flex items-center gap-2 rounded-lg border p-2"
                      >
                        <span
                          className="border-ds-border h-8 w-8 shrink-0 rounded-md border"
                          style={{ background: s.hex }}
                          aria-hidden="true"
                        />
                        <span className="text-ds-muted font-mono text-xs">{s.hex}</span>
                        <span className="ml-auto flex gap-1">
                          {(['bg', 'accent', 'text'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              aria-label={`Use ${s.hex} as ${r === 'bg' ? 'background' : r === 'accent' ? 'accent' : 'text'} colour`}
                              onClick={() => role(s.hex, r)}
                              className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-md border px-1.5 py-0.5 text-[11px]"
                            >
                              {r === 'bg' ? 'Bg' : r === 'accent' ? 'Accent' : 'Text'}
                            </button>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Range
                  label="Picture zoom"
                  value={opts.photoZoom}
                  min={100}
                  max={300}
                  unit="%"
                  onChange={(v) => set('photoZoom', v)}
                />
                <Range
                  label="Picture blur"
                  value={opts.photoBlur}
                  min={0}
                  max={30}
                  onChange={(v) => set('photoBlur', v)}
                />
                <Range
                  label="Picture, move left or right"
                  value={opts.photoX}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => set('photoX', v)}
                />
                <Range
                  label="Picture, move up or down"
                  value={opts.photoY}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => set('photoY', v)}
                />
                <ColorField
                  label="Darkening layer colour"
                  value={opts.scrimColor}
                  fallback="#000000"
                  onChange={(v) => set('scrimColor', v)}
                />
                <Range
                  label="Darkening layer strength"
                  value={opts.scrimOpacity}
                  min={0}
                  max={90}
                  unit="%"
                  onChange={(v) => set('scrimOpacity', v)}
                />
              </div>
              <Toggle
                label="Black and white picture"
                checked={opts.photoGray}
                onChange={(v) => set('photoGray', v)}
              />
            </>
          )}
        </Section>

        <Section title="Text" hint="every line has its own controls" open>
          <Section title="Title" open>
            <TextControls
              label="Title"
              el={opts.title}
              onChange={setEl('title')}
              multiline
              hasLeading
              defaultColorName="main text"
              defaultColor={textHex}
              sizeLabel="biggest size"
              sizeMin={2}
              sizeMax={20}
              placeholder="Your title goes here"
            />
            <p className="text-ds-muted -mt-2 text-xs">
              The title shrinks to fit, never below 40% of this size.
            </p>
          </Section>
          <Section title="Subtitle">
            <TextControls
              label="Subtitle"
              el={opts.subtitle}
              onChange={setEl('subtitle')}
              multiline
              hasLeading
              defaultColorName="main text"
              defaultColor={textHex}
              sizeLabel="size"
              sizeMin={1}
              sizeMax={10}
            />
          </Section>
          <Section title="Tag line" hint="top of the image">
            <TextControls
              label="Tag line"
              el={opts.eyebrow}
              onChange={setEl('eyebrow')}
              defaultColorName="accent"
              defaultColor={accentHex}
              sizeLabel="size"
              sizeMin={0.8}
              sizeMax={6}
              placeholder="yoursite.com"
            />
          </Section>
          <Section title="Badge" hint="a small label, such as New">
            <TextControls
              label="Badge"
              el={opts.badge}
              onChange={setEl('badge')}
              defaultColorName="readable-on-accent"
              defaultColor="#ffffff"
              sizeLabel="size"
              sizeMin={0.8}
              sizeMax={6}
            />
          </Section>
          <Section title="Footer" hint="bottom of the image">
            <TextControls
              label="Footer"
              el={opts.footer}
              onChange={setEl('footer')}
              defaultColorName="main text"
              defaultColor={textHex}
              sizeLabel="size"
              sizeMin={0.8}
              sizeMax={6}
              placeholder="devstash.me/blog"
            />
          </Section>
        </Section>

        <Section title="Layout and size">
          <SelectField
            label="Size"
            value={opts.sizeId}
            options={SIZES.map((s) => ({ id: s.id, label: s.label }))}
            onChange={(id) => {
              const s = SIZES.find((x) => x.id === id) ?? SIZES[0]
              setOpts((o) => ({
                ...o,
                sizeId: s.id,
                ...(s.id === 'custom' ? {} : { width: s.width, height: s.height }),
              }))
            }}
          />
          {opts.sizeId === 'custom' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberBox
                label="Width in pixels"
                value={opts.width}
                onChange={(v) => set('width', v)}
              />
              <NumberBox
                label="Height in pixels"
                value={opts.height}
                onChange={(v) => set('height', v)}
              />
            </div>
          )}
          <Seg
            label="Layout"
            value={opts.layout}
            options={LAYOUTS}
            onChange={(v) => chooseLayout(v)}
          />
          {!hasPhoto && opts.layout !== 'stack' && (
            <p className="text-ds-muted text-xs">A split layout needs a picture. Add one above.</p>
          )}
          <Seg
            label="Text alignment"
            value={opts.align}
            options={ALIGN}
            onChange={(v) => set('align', v)}
          />
          <Seg
            label="Where the title sits"
            value={opts.vAnchor}
            options={VANCHOR}
            onChange={(v) => set('vAnchor', v)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Range
              label="Margin"
              value={opts.padding}
              min={2}
              max={16}
              step={0.5}
              unit="%"
              onChange={(v) => set('padding', v)}
            />
            <Range
              label="Text column width"
              value={opts.textWidth}
              min={30}
              max={100}
              unit="%"
              onChange={(v) => set('textWidth', v)}
            />
            <Range
              label="Move the title block up or down"
              value={opts.offsetY}
              min={-40}
              max={40}
              unit="%"
              onChange={(v) => set('offsetY', v)}
            />
          </div>
        </Section>

        <Section title="Colours and background">
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Text colour"
              value={opts.textColor}
              fallback="#1c1917"
              onChange={(v) => set('textColor', v)}
            />
            <ColorField
              label="Accent colour"
              value={opts.accent}
              fallback="#c2410c"
              onChange={(v) => set('accent', v)}
            />
          </div>
          {lowText && (
            <p className="text-ds-warning-strong text-sm" role="alert">
              The text colour is hard to read on this background. Pick a lighter or darker one.
            </p>
          )}
          {lowAccent && (
            <p className="text-ds-warning-strong text-sm" role="alert">
              This accent colour is hard to see on the background. Pick a lighter or darker one.
            </p>
          )}
          <Seg
            label="Background"
            value={opts.bgType}
            options={BGS.filter((b) => b.id !== 'photo' || hasPhoto)}
            onChange={(v) => (v === 'photo' ? photoAsBackground() : set('bgType', v))}
          />
          {opts.bgType !== 'photo' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label={opts.bgType === 'solid' ? 'Background colour' : 'Background, first colour'}
                value={opts.bgFrom}
                fallback="#f6f1e7"
                onChange={(v) => set('bgFrom', v)}
              />
              {opts.bgType !== 'solid' && (
                <ColorField
                  label="Background, second colour"
                  value={opts.bgTo}
                  fallback="#ebe3d3"
                  onChange={(v) => set('bgTo', v)}
                />
              )}
              {opts.bgType === 'linear' && (
                <Range
                  label="Gradient angle"
                  value={opts.bgAngle}
                  min={0}
                  max={360}
                  unit="°"
                  onChange={(v) => set('bgAngle', v)}
                />
              )}
            </div>
          )}
        </Section>

        <Section title="Graphics" hint="patterns, marks, shapes, frame, panel, logo">
          <Seg
            label="Pattern"
            value={opts.pattern}
            options={PATTERNS}
            onChange={(v) => set('pattern', v)}
          />
          {opts.pattern !== 'none' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label="Pattern colour"
                value={opts.patternColor}
                fallback={accentHex}
                allowEmpty
                onChange={(v) => set('patternColor', v)}
              />
              <Range
                label="Pattern strength"
                value={opts.patternOpacity}
                min={2}
                max={60}
                unit="%"
                onChange={(v) => set('patternOpacity', v)}
              />
              <Range
                label="Pattern scale"
                value={opts.patternScale}
                min={0.5}
                max={3}
                step={0.1}
                onChange={(v) => set('patternScale', v)}
              />
            </div>
          )}
          <Seg
            label="Mark by the title"
            value={opts.mark}
            options={MARKS}
            onChange={(v) => set('mark', v)}
          />
          {opts.mark !== 'none' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label="Mark colour"
                value={opts.markColor}
                fallback={accentHex}
                allowEmpty
                onChange={(v) => set('markColor', v)}
              />
              <Range
                label="Mark thickness"
                value={opts.markSize}
                min={1}
                max={5}
                step={0.5}
                onChange={(v) => set('markSize', v)}
              />
            </div>
          )}
          <Seg
            label="Corner shape"
            value={opts.decor}
            options={DECORS}
            onChange={(v) => set('decor', v)}
          />
          {opts.decor !== 'none' && (
            <>
              <Seg
                label="Corner for the shape"
                value={opts.decorCorner}
                options={CORNERS}
                onChange={(v) => set('decorCorner', v)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField
                  label="Shape colour"
                  value={opts.decorColor}
                  fallback={accentHex}
                  allowEmpty
                  onChange={(v) => set('decorColor', v)}
                />
                <Range
                  label="Shape size"
                  value={opts.decorSize}
                  min={10}
                  max={90}
                  unit="%"
                  onChange={(v) => set('decorSize', v)}
                />
                <Range
                  label="Shape strength"
                  value={opts.decorOpacity}
                  min={4}
                  max={100}
                  unit="%"
                  onChange={(v) => set('decorOpacity', v)}
                />
              </div>
            </>
          )}
          <Toggle
            label="Frame around the image"
            checked={opts.frame}
            onChange={(v) => set('frame', v)}
          />
          {opts.frame && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label="Frame colour"
                value={opts.frameColor}
                fallback={accentHex}
                allowEmpty
                onChange={(v) => set('frameColor', v)}
              />
              <Range
                label="Frame thickness"
                value={opts.frameWidth}
                min={1}
                max={30}
                onChange={(v) => set('frameWidth', v)}
              />
              <Range
                label="Frame distance from the edge"
                value={opts.frameInset}
                min={0}
                max={10}
                step={0.5}
                unit="%"
                onChange={(v) => set('frameInset', v)}
              />
              <Range
                label="Frame corner rounding"
                value={opts.frameRadius}
                min={0}
                max={10}
                step={0.5}
                unit="%"
                onChange={(v) => set('frameRadius', v)}
              />
            </div>
          )}
          <Toggle
            label="Panel behind the text"
            checked={opts.panel}
            onChange={(v) => set('panel', v)}
          />
          {opts.panel && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label="Panel colour"
                value={opts.panelColor}
                fallback="#ffffff"
                onChange={(v) => set('panelColor', v)}
              />
              <Range
                label="Panel strength"
                value={opts.panelOpacity}
                min={10}
                max={100}
                unit="%"
                onChange={(v) => set('panelOpacity', v)}
              />
              <Range
                label="Panel corner rounding"
                value={opts.panelRadius}
                min={0}
                max={8}
                step={0.5}
                unit="%"
                onChange={(v) => set('panelRadius', v)}
              />
            </div>
          )}
          <div className="border-ds-border flex flex-col gap-3 border-t pt-4">
            <p className="text-ds-text text-[13px] font-medium">Logo</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className={fileButton}>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Choose a logo"
                  onChange={(e) => {
                    void onLogo(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                {opts.logo ? 'Choose another logo' : 'Choose a logo'}
              </label>
              {opts.logo && (
                <Button type="button" size="sm" variant="ghost" onClick={() => set('logo', '')}>
                  Remove the logo
                </Button>
              )}
            </div>
            {opts.logo && (
              <>
                <Seg
                  label="Logo corner"
                  value={opts.logoPos}
                  options={CORNERS}
                  onChange={(v) => set('logoPos', v)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Range
                    label="Logo size"
                    value={opts.logoSize}
                    min={3}
                    max={30}
                    unit="%"
                    onChange={(v) => set('logoSize', v)}
                  />
                </div>
                <Toggle
                  label="Round logo"
                  checked={opts.logoRound}
                  onChange={(v) => set('logoRound', v)}
                />
              </>
            )}
          </div>
        </Section>

        <Section title="Download" open>
          <Seg
            label="File type"
            value={format}
            options={[
              { id: 'png', label: 'PNG' },
              { id: 'jpeg', label: 'JPG (smaller)' },
            ]}
            onChange={setFormat}
          />
          <Seg
            label="Resolution"
            value={scale}
            options={[
              { id: '1', label: 'Normal' },
              { id: '2', label: 'Double (sharper)' },
            ]}
            onChange={setScale}
          />
          {format === 'jpeg' && (
            <Range
              label="JPG quality"
              value={quality}
              min={50}
              max={100}
              unit="%"
              onChange={setQuality}
            />
          )}
        </Section>
      </div>

      <div className="border-ds-accent/30 bg-ds-surface2 order-first rounded-xl border p-4 sm:p-5 lg:sticky lg:top-6 lg:order-none">
        <h2 className="text-ds-text mb-3 text-base font-semibold">Your image</h2>
        <div className="border-ds-border overflow-hidden rounded-lg border">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data: URL made here, not a file next/image can optimise
            <img
              src={dataUrl}
              alt={`Preview: ${opts.title.text.trim() || 'Your title goes here'}`}
              width={W}
              height={H}
              className="block h-auto w-full"
            />
          ) : (
            <div className="bg-ds-surface w-full" style={{ aspectRatio: `${W} / ${H}` }} />
          )}
        </div>
        <p className="text-ds-muted mt-2 font-mono text-xs">
          {W} × {H}
          {scale === '2' ? ` · saved at ${W * 2} × ${H * 2}` : ''}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void download()} disabled={!svg}>
            {format === 'png' ? 'Download PNG' : 'Download JPG'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={downloadSvg} disabled={!svg}>
            Download SVG
          </Button>
        </div>
        <p className="text-ds-muted mt-4 text-xs leading-relaxed">
          Text is drawn with your device&apos;s own fonts, so the file looks like this preview, but
          a different device may pick a different font for the same setting. Hindi and other scripts
          work if your device has a font for them. A picture is embedded in the SVG, which makes
          that file large. Next.js uses a file named{' '}
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

function NumberBox({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="text-ds-text block text-[13px] font-medium">
      {label}
      <input
        type="number"
        min={200}
        max={4000}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal outline-none"
      />
      <span className="text-ds-muted mt-1 block text-xs font-normal">200 to 4000</span>
    </label>
  )
}
