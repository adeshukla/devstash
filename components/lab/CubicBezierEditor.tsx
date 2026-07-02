'use client'

import { useEffect, useRef, useState } from 'react'

export interface BezierPoint {
  x: number
  y: number
}

export const DEFAULT_BEZIER: [BezierPoint, BezierPoint] = [
  { x: 0.42, y: 0 },
  { x: 0.58, y: 1 },
]

const PRESETS: { label: string; value: [BezierPoint, BezierPoint] }[] = [
  {
    label: 'Ease',
    value: [
      { x: 0.25, y: 0.1 },
      { x: 0.25, y: 1 },
    ],
  },
  {
    label: 'Ease-in-out',
    value: [
      { x: 0.42, y: 0 },
      { x: 0.58, y: 1 },
    ],
  },
  {
    label: 'Back',
    value: [
      { x: 0.34, y: 1.56 },
      { x: 0.64, y: 1 },
    ],
  },
  {
    label: 'Anticipate',
    value: [
      { x: 0.68, y: -0.55 },
      { x: 0.27, y: 1.55 },
    ],
  },
]

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function bezierToCss(points: [BezierPoint, BezierPoint]): string {
  const [p1, p2] = points
  return `cubic-bezier(${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)}, ${p2.y.toFixed(2)})`
}

interface CubicBezierEditorProps {
  value: [BezierPoint, BezierPoint]
  onChange: (value: [BezierPoint, BezierPoint]) => void
}

/**
 * A real cubic-bezier(x1,y1,x2,y2) editor — drag either control handle on
 * the curve graph and the timing function updates live. y is allowed to
 * go outside 0–1 (overshoot/anticipate easing is valid CSS), x is clamped
 * to 0–1 since CSS requires that for the two x values.
 */
export function CubicBezierEditor({ value, onChange }: CubicBezierEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef(value)
  const [dragIndex, setDragIndex] = useState<0 | 1 | null>(null)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (dragIndex === null) return
    function onMove(e: PointerEvent) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
      // y=0 is the bottom of the graph (CSS bezier y=0), y=1 is the top —
      // graph is drawn with padding so overshoot past 0/1 stays visible.
      const y = clamp(1 - (e.clientY - rect.top) / rect.height, -0.6, 1.6)
      const next: [BezierPoint, BezierPoint] = [...valueRef.current] as [BezierPoint, BezierPoint]
      next[dragIndex as 0 | 1] = { x, y }
      onChange(next)
    }
    function onUp() {
      setDragIndex(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragIndex, onChange])

  const [p1, p2] = value
  // Map bezier space (x 0-1, y -0.6..1.6) into a 0-100 SVG viewBox.
  const toSvg = (p: BezierPoint) => ({
    x: p.x * 100,
    y: 100 - ((p.y + 0.6) / 2.2) * 100,
  })
  const origin = toSvg({ x: 0, y: 0 })
  const dest = toSvg({ x: 1, y: 1 })
  const sp1 = toSvg(p1)
  const sp2 = toSvg(p2)

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="border-ds-border bg-ds-surface2 relative aspect-[4/3] w-full max-w-[220px] overflow-visible rounded-lg border"
      >
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1={origin.x}
            y1={origin.y}
            x2={sp1.x}
            y2={sp1.y}
            className="stroke-ds-muted/50"
            strokeWidth={1}
          />
          <line
            x1={dest.x}
            y1={dest.y}
            x2={sp2.x}
            y2={sp2.y}
            className="stroke-ds-muted/50"
            strokeWidth={1}
          />
          <path
            d={`M ${origin.x} ${origin.y} C ${sp1.x} ${sp1.y}, ${sp2.x} ${sp2.y}, ${dest.x} ${dest.y}`}
            fill="none"
            className="stroke-ds-accent"
            strokeWidth={2}
          />
        </svg>
        {[sp1, sp2].map((p, i) => (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              setDragIndex(i as 0 | 1)
            }}
            aria-label={`Drag control point ${i + 1}`}
            className="bg-ds-accent border-ds-bg absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 shadow-sm active:cursor-grabbing"
            style={{
              left: `${(i === 0 ? sp1 : sp2).x}%`,
              top: `${(i === 0 ? sp1 : sp2).y}%`,
              touchAction: 'none',
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.value)}
            className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent rounded-md border px-2 py-1 text-xs transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className="text-ds-muted font-mono text-xs">{bezierToCss(value)}</p>
    </div>
  )
}
