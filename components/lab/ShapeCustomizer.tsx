'use client'

import { useMemo, useState } from 'react'
import { CssCodeBlock } from './CssCodeBlock'
import {
  PolygonShapeEditor,
  DEFAULT_POLYGON,
  randomizePolygon,
  addPolygonPoint,
  removePolygonPoint,
  type Point,
} from './PolygonShapeEditor'
import {
  CubicBezierEditor,
  DEFAULT_BEZIER,
  bezierToCss,
  type BezierPoint,
} from './CubicBezierEditor'

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
]

const SHAPES = {
  circle: {
    label: 'Circle',
    style: { borderRadius: '50%' },
    css: 'border-radius: 50%;',
  },
  blob: {
    label: 'Blob',
    style: { borderRadius: '42% 58% 65% 35% / 45% 45% 55% 55%' },
    css: 'border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%;',
  },
  squircle: {
    label: 'Squircle',
    style: { borderRadius: '30%' },
    css: 'border-radius: 30%;',
  },
  hexagon: {
    label: 'Hexagon',
    style: { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
    css: 'clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);',
  },
  pentagon: {
    label: 'Pentagon',
    style: { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
    css: 'clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);',
  },
  triangle: {
    label: 'Triangle',
    style: { clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' },
    css: 'clip-path: polygon(50% 0%, 100% 100%, 0% 100%);',
  },
  diamond: {
    label: 'Diamond',
    style: { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
    css: 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);',
  },
  star: {
    label: 'Star',
    style: {
      clipPath:
        'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    },
    css: 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);',
  },
  parallelogram: {
    label: 'Parallelogram',
    style: { clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)' },
    css: 'clip-path: polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%);',
  },
  arrow: {
    label: 'Arrow',
    style: {
      clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
    },
    css: 'clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%);',
  },
  bubble: {
    label: 'Message bubble',
    style: {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 25% 75%, 15% 100%, 15% 75%, 0% 75%)',
    },
    css: 'clip-path: polygon(0% 0%, 100% 0%, 100% 75%, 25% 75%, 15% 100%, 15% 75%, 0% 75%);',
  },
} as const

type ShapeKey = keyof typeof SHAPES
type Mode = 'preset' | 'corners' | 'polygon'
type Animation = 'none' | 'spin' | 'pulse' | 'float' | 'wobble' | 'shake' | 'bounce'
type Easing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'custom'

const MODES: { key: Mode; label: string }[] = [
  { key: 'preset', label: 'Presets' },
  { key: 'corners', label: 'Corner radius' },
  { key: 'polygon', label: 'Draw your own' },
]

const EASINGS: Easing[] = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'custom']

const ANIMATION_KEYFRAMES: Record<Exclude<Animation, 'none'>, { name: string; body: string }> = {
  spin: { name: 'csShapeSpin', body: '  to { transform: rotate(360deg); }' },
  pulse: {
    name: 'csShapePulse',
    body: '  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.08); }',
  },
  float: {
    name: 'csShapeFloat',
    body: '  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-12px); }',
  },
  wobble: {
    name: 'csShapeWobble',
    body: '  0%, 100% { transform: rotate(0deg); }\n  25% { transform: rotate(-8deg); }\n  75% { transform: rotate(8deg); }',
  },
  shake: {
    name: 'csShapeShake',
    body: '  0%, 100% { transform: translateX(0); }\n  25% { transform: translateX(-8px); }\n  75% { transform: translateX(8px); }',
  },
  bounce: {
    name: 'csShapeBounce',
    body: '  0%, 100% { transform: translateY(0) scaleY(1); }\n  30% { transform: translateY(-22px) scaleY(1.05); }\n  50% { transform: translateY(0) scaleY(0.9); }\n  70% { transform: translateY(-8px) scaleY(1.02); }',
  },
}

/**
 * The real interactive centerpiece — pick a color, then shape it three
 * different ways (preset, per-corner radius, or a drag-to-build polygon),
 * add an animation, and copy the exact CSS for what's on screen.
 */
export function ShapeCustomizer() {
  const [color, setColor] = useState(COLORS[0].value)
  const [mode, setMode] = useState<Mode>('preset')
  const [shape, setShape] = useState<ShapeKey>('blob')
  const [corners, setCorners] = useState({ tl: 30, tr: 30, br: 30, bl: 30 })
  const [polygonPoints, setPolygonPoints] = useState<Point[]>(DEFAULT_POLYGON)
  const [animation, setAnimation] = useState<Animation>('none')
  const [duration, setDuration] = useState(4)
  const [easing, setEasing] = useState<Easing>('ease-in-out')
  const [bezier, setBezier] = useState<[BezierPoint, BezierPoint]>(DEFAULT_BEZIER)

  const shapeInfo = useMemo(() => {
    if (mode === 'preset') {
      const s = SHAPES[shape]
      return { style: s.style as React.CSSProperties, css: s.css }
    }
    if (mode === 'corners') {
      const value = `${corners.tl}% ${corners.tr}% ${corners.br}% ${corners.bl}%`
      return {
        style: { borderRadius: value } as React.CSSProperties,
        css: `border-radius: ${value};`,
      }
    }
    const pointsStr = polygonPoints.map((p) => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(', ')
    return {
      style: { clipPath: `polygon(${pointsStr})` } as React.CSSProperties,
      css: `clip-path: polygon(${pointsStr});`,
    }
  }, [mode, shape, corners, polygonPoints])

  const easingCss = easing === 'custom' ? bezierToCss(bezier) : easing

  const animationValue =
    animation === 'none'
      ? undefined
      : `${ANIMATION_KEYFRAMES[animation].name} ${duration}s ${easingCss} infinite`

  const css = useMemo(() => {
    const lines = [
      '.my-shape {',
      '  width: 220px;',
      '  height: 220px;',
      `  background: ${color};`,
      `  ${shapeInfo.css}`,
    ]
    if (animation !== 'none') lines.push(`  animation: ${animationValue};`)
    lines.push('  transition: border-radius 0.4s ease, clip-path 0.4s ease;')
    lines.push('}')
    if (animation !== 'none') {
      const kf = ANIMATION_KEYFRAMES[animation]
      lines.push('', `@keyframes ${kf.name} {`, kf.body, '}')
    }
    return lines.join('\n')
  }, [color, shapeInfo, animation, animationValue])

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_1fr]">
      {/* Live preview */}
      <div className="border-ds-border bg-ds-surface flex aspect-square items-center justify-center rounded-2xl border p-8">
        {mode === 'polygon' ? (
          <PolygonShapeEditor
            points={polygonPoints}
            onChange={setPolygonPoints}
            color={color}
            animation={animationValue}
          />
        ) : (
          <div
            className="h-full w-full transition-[border-radius,clip-path] duration-500 ease-out"
            style={{
              background: color,
              ...shapeInfo.style,
              animation: animationValue,
            }}
          />
        )}
      </div>

      {/* Controls + code */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">Color</p>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={`Set color to ${c.name}`}
                aria-pressed={color === c.value}
                className="h-9 w-9 shrink-0 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c.value,
                  boxShadow:
                    color === c.value
                      ? `0 0 0 2px var(--color-ds-bg), 0 0 0 4px ${c.value}`
                      : undefined,
                }}
              />
            ))}
            <label className="border-ds-border text-ds-muted flex h-9 items-center gap-2 rounded-full border px-3 text-xs">
              Custom
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-5 w-5 cursor-pointer border-none bg-transparent p-0"
                aria-label="Pick a custom color"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">Shape mode</p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                aria-pressed={mode === m.key}
                className={
                  mode === m.key
                    ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                    : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'preset' && (
          <div>
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
              Shape ({Object.keys(SHAPES).length} presets)
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(SHAPES) as [ShapeKey, (typeof SHAPES)[ShapeKey]][]).map(
                ([key, s]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setShape(key)}
                    aria-pressed={shape === key}
                    className={
                      shape === key
                        ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                        : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                    }
                  >
                    {s.label}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {mode === 'corners' && (
          <div>
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
              Corner radius (%)
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {(
                [
                  ['tl', 'Top left'],
                  ['tr', 'Top right'],
                  ['bl', 'Bottom left'],
                  ['br', 'Bottom right'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-ds-muted flex flex-col gap-1 text-xs">
                  <span>
                    {label} — {corners[key]}%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={corners[key]}
                    onChange={(e) =>
                      setCorners((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                    className="accent-ds-accent"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {mode === 'polygon' && (
          <div>
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
              {polygonPoints.length} points — drag any dot on the preview
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPolygonPoints((p) => addPolygonPoint(p))}
                className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors"
              >
                Add point
              </button>
              <button
                type="button"
                onClick={() => setPolygonPoints((p) => removePolygonPoint(p))}
                className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors"
              >
                Remove point
              </button>
              <button
                type="button"
                onClick={() => setPolygonPoints((p) => randomizePolygon(p))}
                className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors"
              >
                Randomize
              </button>
              <button
                type="button"
                onClick={() => setPolygonPoints(DEFAULT_POLYGON)}
                className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">
            Animation ({Object.keys(ANIMATION_KEYFRAMES).length} functions)
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {(['none', 'spin', 'pulse', 'float', 'wobble', 'shake', 'bounce'] as Animation[]).map(
              (a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAnimation(a)}
                  aria-pressed={animation === a}
                  className={
                    animation === a
                      ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white capitalize'
                      : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors'
                  }
                >
                  {a}
                </button>
              )
            )}
          </div>
          {animation !== 'none' && (
            <label className="text-ds-muted mt-3 flex w-fit items-center gap-2 text-xs">
              Speed
              <input
                type="range"
                min={1}
                max={10}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="accent-ds-accent"
              />
              {duration}s
            </label>
          )}
        </div>

        {animation !== 'none' && (
          <div>
            <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">Easing</p>
            <div className="flex flex-wrap gap-2">
              {EASINGS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEasing(e)}
                  aria-pressed={easing === e}
                  className={
                    easing === e
                      ? 'bg-ds-accent rounded-lg px-3 py-1.5 text-sm font-medium text-white'
                      : 'border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-lg border px-3 py-1.5 text-sm transition-colors'
                  }
                >
                  {e}
                </button>
              ))}
            </div>
            {easing === 'custom' && (
              <div className="mt-3">
                <CubicBezierEditor value={bezier} onChange={setBezier} />
              </div>
            )}
          </div>
        )}

        <CssCodeBlock code={css} />
      </div>

      <style>{`
        @keyframes csShapeSpin { to { transform: rotate(360deg); } }
        @keyframes csShapePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes csShapeFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes csShapeWobble { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
        @keyframes csShapeShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        @keyframes csShapeBounce {
          0%, 100% { transform: translateY(0) scaleY(1); }
          30% { transform: translateY(-22px) scaleY(1.05); }
          50% { transform: translateY(0) scaleY(0.9); }
          70% { transform: translateY(-8px) scaleY(1.02); }
        }
      `}</style>
    </div>
  )
}
