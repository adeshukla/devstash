'use client'

import { useMemo, useState } from 'react'
import { CssCodeBlock } from './CssCodeBlock'

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
  star: {
    label: 'Star',
    style: {
      clipPath:
        'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    },
    css: 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);',
  },
} as const

type ShapeKey = keyof typeof SHAPES

/**
 * The real interactive centerpiece — pick a color AND a shape, see it live,
 * copy the exact CSS for that combination. Not a passive animation loop.
 */
export function ShapeCustomizer() {
  const [color, setColor] = useState(COLORS[0].value)
  const [shape, setShape] = useState<ShapeKey>('blob')
  const [spin, setSpin] = useState(false)

  const activeShape = SHAPES[shape]

  const css = useMemo(() => {
    return [
      '.my-shape {',
      '  width: 220px;',
      '  height: 220px;',
      `  background: ${color};`,
      `  ${activeShape.css}`,
      spin ? '  animation: spin 6s linear infinite;' : '',
      '  transition: border-radius 0.4s ease, clip-path 0.4s ease;',
      '}',
      spin ? '' : null,
      spin ? '@keyframes spin {' : null,
      spin ? '  to { transform: rotate(360deg); }' : null,
      spin ? '}' : null,
    ]
      .filter((line) => line !== null)
      .join('\n')
  }, [color, activeShape, spin])

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_1fr]">
      {/* Live preview */}
      <div className="border-ds-border bg-ds-surface flex aspect-square items-center justify-center rounded-2xl border p-8">
        <div
          className="h-full w-full transition-[border-radius,clip-path] duration-500 ease-out"
          style={{
            background: color,
            ...activeShape.style,
            animation: spin ? 'spin 6s linear infinite' : undefined,
          }}
        />
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
          <p className="text-ds-muted mb-3 font-mono text-xs tracking-wide uppercase">Shape</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SHAPES) as [ShapeKey, (typeof SHAPES)[ShapeKey]][]).map(([key, s]) => (
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
            ))}
          </div>
        </div>

        <label className="text-ds-muted flex w-fit items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={spin}
            onChange={(e) => setSpin(e.target.checked)}
            className="accent-ds-accent h-4 w-4"
          />
          Spin animation
        </label>

        <CssCodeBlock code={css} />
      </div>
    </div>
  )
}
