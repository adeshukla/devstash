'use client'

import { useEffect, useRef, useState } from 'react'

export interface Point {
  x: number
  y: number
}

export const DEFAULT_POLYGON: Point[] = [
  { x: 25, y: 0 },
  { x: 75, y: 0 },
  { x: 100, y: 50 },
  { x: 75, y: 100 },
  { x: 25, y: 100 },
  { x: 0, y: 50 },
]

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function randomizePolygon(points: Point[]): Point[] {
  return points.map((p) => ({
    x: clamp(p.x + (Math.random() * 30 - 15), 0, 100),
    y: clamp(p.y + (Math.random() * 30 - 15), 0, 100),
  }))
}

export function addPolygonPoint(points: Point[]): Point[] {
  if (points.length >= 12) return points
  let maxLen = -1
  let insertAt = points.length
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len > maxLen) {
      maxLen = len
      insertAt = i + 1
    }
  }
  const a = points[(insertAt - 1 + points.length) % points.length]
  const b = points[insertAt % points.length]
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  return [...points.slice(0, insertAt), mid, ...points.slice(insertAt)]
}

export function removePolygonPoint(points: Point[]): Point[] {
  if (points.length <= 3) return points
  return points.slice(0, -1)
}

interface PolygonShapeEditorProps {
  points: Point[]
  onChange: (points: Point[]) => void
  color: string
  animation?: string
}

/**
 * Drag-to-build shape editor — grab any vertex and drop it wherever you
 * want, and clip-path updates live to match. This is the "build your own"
 * mode: not a preset, an arbitrary polygon from wherever the cursor left it.
 */
export function PolygonShapeEditor({
  points,
  onChange,
  color,
  animation,
}: PolygonShapeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pointsRef = useRef(points)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    pointsRef.current = points
  }, [points])

  useEffect(() => {
    if (dragIndex === null) return

    function onMove(e: PointerEvent) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
      const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
      onChange(pointsRef.current.map((p, i) => (i === dragIndex ? { x, y } : p)))
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

  const clipPath = `polygon(${points.map((p) => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(', ')})`
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="h-full w-full" style={{ background: color, clipPath, animation }} />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <polygon
          points={polylinePoints}
          fill="none"
          className="stroke-ds-accent/50"
          strokeWidth={0.6}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {points.map((p, i) => (
        <button
          key={i}
          type="button"
          onPointerDown={(e) => {
            e.preventDefault()
            setDragIndex(i)
          }}
          aria-label={`Drag point ${i + 1}`}
          className="border-ds-bg bg-ds-accent absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 shadow-sm active:cursor-grabbing"
          style={{ left: `${p.x}%`, top: `${p.y}%`, touchAction: 'none' }}
        />
      ))}
    </div>
  )
}
