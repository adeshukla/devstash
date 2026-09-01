'use client'

import { useMemo, useState } from 'react'
import { CssCodeBlock } from './CssCodeBlock'

/**
 * Three surface treatments the playground had no answer for, chosen because
 * they are the CSS people actually paste into their own projects: a glass
 * panel, a gradient, and a layered shadow.
 *
 * Every control takes a real colour rather than a fixed brand swatch — the
 * whole point is that the output is usable with the visitor's own palette —
 * and every panel emits both raw CSS and a Tailwind arbitrary-value class
 * string, since which one is useful depends on the project it's going into.
 */

type Tab = 'glass' | 'gradient' | 'shadow'

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'glass', label: 'Glass', hint: 'Frosted panel over a busy background' },
  { key: 'gradient', label: 'Gradient', hint: 'Linear, radial or conic with real stops' },
  { key: 'shadow', label: 'Layered shadow', hint: 'Stacked layers, not one flat blur' },
]

const tabBtn = (active: boolean) =>
  active
    ? 'bg-ds-accent rounded-lg px-4 py-2 text-sm font-medium text-white'
    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-4 py-2 text-sm transition-colors'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * Tailwind arbitrary values cannot contain raw spaces — `bg-[rgba(255, 255,
 * 255, .12)]` is silently inert when pasted. Emit the compact form for class
 * strings while the CSS output keeps the readable spacing.
 */
const rgbaCompact = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

/** Shared numeric control — one labelled slider with its live value. */
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-ds-muted flex items-center justify-between font-mono text-xs tracking-wide uppercase">
        {label}
        <span className="text-ds-text">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-ds-accent w-full"
      />
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-ds-muted font-mono text-xs tracking-wide uppercase">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour`}
          className="border-ds-border h-9 w-12 cursor-pointer rounded border bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex value`}
          spellCheck={false}
          className="border-ds-border bg-ds-surface2 text-ds-text focus:border-ds-accent w-28 rounded border px-2 py-1.5 font-mono text-xs outline-none"
        />
      </span>
    </label>
  )
}

// ─── Glass ───────────────────────────────────────────────────────────────────

function GlassPanel() {
  const [blur, setBlur] = useState(14)
  const [saturate, setSaturate] = useState(160)
  const [tint, setTint] = useState('#ffffff')
  const [tintAlpha, setTintAlpha] = useState(0.12)
  const [borderAlpha, setBorderAlpha] = useState(0.25)
  const [radius, setRadius] = useState(18)
  const [highlight, setHighlight] = useState(true)

  const style: React.CSSProperties = {
    backdropFilter: `blur(${blur}px) saturate(${saturate}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturate}%)`,
    background: rgba(tint, tintAlpha),
    border: `1px solid ${rgba(tint, borderAlpha)}`,
    borderRadius: radius,
    boxShadow: highlight
      ? `inset 0 1px 0 ${rgba('#ffffff', 0.35)}, 0 8px 32px rgba(0,0,0,0.18)`
      : '0 8px 32px rgba(0,0,0,0.18)',
  }

  const css = `.glass {
  backdrop-filter: blur(${blur}px) saturate(${saturate}%);
  -webkit-backdrop-filter: blur(${blur}px) saturate(${saturate}%);
  background: ${rgba(tint, tintAlpha)};
  border: 1px solid ${rgba(tint, borderAlpha)};
  border-radius: ${radius}px;${
    highlight
      ? `
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 8px 32px rgba(0, 0, 0, 0.18);`
      : `
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);`
  }
}`

  const tw = `backdrop-blur-[${blur}px] backdrop-saturate-[${saturate}%] bg-[${rgbaCompact(tint, tintAlpha)}] border border-[${rgbaCompact(tint, borderAlpha)}] rounded-[${radius}px] shadow-[0_8px_32px_rgba(0,0,0,0.18)]`

  return (
    <div className="flex flex-col gap-6">
      {/* Glass only reads against something busy — a flat panel behind it would
          make any blur setting look identical. */}
      <div
        className="relative grid min-h-56 place-items-center overflow-hidden rounded-xl p-8"
        style={{
          background:
            'radial-gradient(circle at 20% 25%, #6366f1 0%, transparent 45%), radial-gradient(circle at 80% 30%, #ec4899 0%, transparent 45%), radial-gradient(circle at 50% 85%, #14b8a6 0%, transparent 50%), #0f172a',
        }}
      >
        <div style={style} className="px-8 py-7 text-center">
          <p className="text-sm font-semibold text-white">Frosted panel</p>
          <p className="mt-1 text-xs text-white/70">backdrop-filter over live content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Slider label="Blur" value={blur} min={0} max={40} unit="px" onChange={setBlur} />
        <Slider
          label="Saturation"
          value={saturate}
          min={100}
          max={260}
          step={5}
          unit="%"
          onChange={setSaturate}
        />
        <ColorField label="Tint" value={tint} onChange={setTint} />
        <Slider
          label="Tint opacity"
          value={tintAlpha}
          min={0}
          max={0.5}
          step={0.01}
          onChange={setTintAlpha}
        />
        <Slider
          label="Border opacity"
          value={borderAlpha}
          min={0}
          max={0.8}
          step={0.01}
          onChange={setBorderAlpha}
        />
        <Slider label="Radius" value={radius} min={0} max={40} unit="px" onChange={setRadius} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={highlight}
          onChange={(e) => setHighlight(e.target.checked)}
          className="accent-ds-accent h-4 w-4"
        />
        <span className="text-ds-text">
          Inner top highlight
          <span className="text-ds-muted"> — the inset line that sells the glass edge</span>
        </span>
      </label>

      <Output css={css} tw={tw} />
    </div>
  )
}

// ─── Gradient ────────────────────────────────────────────────────────────────

type GradKind = 'linear' | 'radial' | 'conic'

function GradientPanel() {
  const [kind, setKind] = useState<GradKind>('linear')
  const [angle, setAngle] = useState(135)
  const [from, setFrom] = useState('#6366f1')
  const [via, setVia] = useState('#a855f7')
  const [to, setTo] = useState('#ec4899')
  const [useVia, setUseVia] = useState(true)
  const [midpoint, setMidpoint] = useState(50)

  const stops = useVia ? `${from} 0%, ${via} ${midpoint}%, ${to} 100%` : `${from} 0%, ${to} 100%`

  const value =
    kind === 'linear'
      ? `linear-gradient(${angle}deg, ${stops})`
      : kind === 'radial'
        ? `radial-gradient(circle at 50% 50%, ${stops})`
        : `conic-gradient(from ${angle}deg at 50% 50%, ${stops})`

  const css = `.gradient {
  background-image: ${value};
}`
  const tw = `bg-[${value.replace(/\s+/g, '_')}]`

  return (
    <div className="flex flex-col gap-6">
      <div
        className="min-h-56 rounded-xl"
        style={{ backgroundImage: value }}
        role="img"
        aria-label={`${kind} gradient preview`}
      />

      <div className="flex flex-wrap gap-2">
        {(['linear', 'radial', 'conic'] as GradKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={tabBtn(kind === k)}
          >
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {kind !== 'radial' && (
          <Slider label="Angle" value={angle} min={0} max={360} unit="deg" onChange={setAngle} />
        )}
        <ColorField label="From" value={from} onChange={setFrom} />
        {useVia && <ColorField label="Via" value={via} onChange={setVia} />}
        <ColorField label="To" value={to} onChange={setTo} />
        {useVia && (
          <Slider
            label="Via position"
            value={midpoint}
            min={5}
            max={95}
            unit="%"
            onChange={setMidpoint}
          />
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useVia}
          onChange={(e) => setUseVia(e.target.checked)}
          className="accent-ds-accent h-4 w-4"
        />
        <span className="text-ds-text">
          Three-stop
          <span className="text-ds-muted">
            {' '}
            — a middle stop is what stops a two-colour blend going muddy
          </span>
        </span>
      </label>

      <Output css={css} tw={tw} />
    </div>
  )
}

// ─── Layered shadow ──────────────────────────────────────────────────────────

/**
 * A single large blur reads as a grey smudge. Real depth comes from stacking
 * several shadows whose offset and blur grow non-linearly while opacity falls —
 * the near layers give contact, the far layers give ambience.
 */
function shadowLayers(elevation: number, color: string, intensity: number, sharpness: number) {
  const layers = Math.max(2, Math.min(6, elevation))
  return Array.from({ length: layers }, (_, i) => {
    const t = (i + 1) / layers
    const y = +(elevation * t * t * 1.4).toFixed(1)
    const blur = +(elevation * t * t * 2.6 + 1).toFixed(1)
    const spread = +(-elevation * t * 0.12).toFixed(1)
    // Opacity falls as layers move out, tuned by sharpness: higher sharpness
    // keeps the near layers dense and fades the far ones faster.
    const alpha = +(intensity * Math.pow(1 - t, sharpness / 100) * 0.5).toFixed(3)
    return `${0} ${y}px ${blur}px ${spread}px ${rgba(color, alpha)}`
  })
}

function ShadowPanel() {
  const [elevation, setElevation] = useState(16)
  const [color, setColor] = useState('#0f172a')
  const [intensity, setIntensity] = useState(0.5)
  const [sharpness, setSharpness] = useState(60)
  const [radius, setRadius] = useState(16)

  const layers = useMemo(
    () => shadowLayers(elevation, color, intensity, sharpness),
    [elevation, color, intensity, sharpness]
  )
  const shadow = layers.join(', ')

  const css = `.elevated {
  border-radius: ${radius}px;
  box-shadow:
${layers.map((l) => `    ${l}`).join(',\n')};
}`
  const tw = `rounded-[${radius}px] shadow-[${shadow.replace(/\s+/g, '_')}]`

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-ds-surface2 grid min-h-56 place-items-center rounded-xl p-10">
        <div
          className="grid h-28 w-44 place-items-center bg-white text-sm font-medium text-slate-900"
          style={{ boxShadow: shadow, borderRadius: radius }}
        >
          {layers.length} layers
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Slider
          label="Elevation"
          value={elevation}
          min={2}
          max={48}
          unit="px"
          onChange={setElevation}
        />
        <ColorField label="Shadow colour" value={color} onChange={setColor} />
        <Slider
          label="Intensity"
          value={intensity}
          min={0.05}
          max={1}
          step={0.05}
          onChange={setIntensity}
        />
        <Slider
          label="Falloff"
          value={sharpness}
          min={10}
          max={200}
          step={5}
          onChange={setSharpness}
        />
        <Slider label="Radius" value={radius} min={0} max={40} unit="px" onChange={setRadius} />
      </div>

      <p className="text-ds-muted text-sm">
        Tinting the shadow with your background&apos;s hue instead of black is the difference
        between depth and dirt — try a deep navy on a light-blue page.
      </p>

      <Output css={css} tw={tw} />
    </div>
  )
}

// ─── Output ──────────────────────────────────────────────────────────────────

function Output({ css, tw }: { css: string; tw: string }) {
  const [format, setFormat] = useState<'css' | 'tailwind'>('css')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(['css', 'tailwind'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            aria-pressed={format === f}
            className={tabBtn(format === f)}
          >
            {f === 'css' ? 'CSS' : 'Tailwind'}
          </button>
        ))}
      </div>
      <CssCodeBlock
        code={format === 'css' ? css : tw}
        label={format === 'css' ? 'CSS' : 'Tailwind'}
      />
    </div>
  )
}

export function SurfaceStudio() {
  const [tab, setTab] = useState<Tab>('glass')
  const active = TABS.find((t) => t.key === tab)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={tabBtn(tab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active && <p className="text-ds-muted -mt-2 text-sm">{active.hint}</p>}

      {tab === 'glass' && <GlassPanel />}
      {tab === 'gradient' && <GradientPanel />}
      {tab === 'shadow' && <ShadowPanel />}
    </div>
  )
}
