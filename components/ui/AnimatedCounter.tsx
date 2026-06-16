'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  /** e.g. "6+", "200+", "90+", "100%". The numeric part is counted up. */
  value: string
  /** Animation duration in ms. */
  duration?: number
  className?: string
}

function parse(value: string): { prefix: string; target: number; suffix: string } | null {
  const match = value.match(/^(\D*)(\d+)(.*)$/)
  if (!match) return null
  return { prefix: match[1] ?? '', target: Number(match[2]), suffix: match[3] ?? '' }
}

/**
 * Counts the numeric part of `value` up from 0 — exactly once — when it scrolls
 * into view, preserving any non-numeric prefix/suffix (e.g. "+", "%"). Respects
 * prefers-reduced-motion by rendering the final value immediately.
 */
export function AnimatedCounter({ value, duration = 1200, className }: AnimatedCounterProps) {
  const parsed = parse(value)
  const target = parsed?.target ?? 0
  const isNumeric = parsed !== null

  const ref = useRef<HTMLSpanElement | null>(null)
  const hasRun = useRef(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    // Non-numeric values or already-animated → nothing to do.
    if (!isNumeric || hasRun.current) return
    const el = ref.current
    if (!el) return

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      hasRun.current = true
      setDisplay(target)
      return
    }

    let raf = 0

    const animate = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        setDisplay(Math.round(eased * target))
        if (progress < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasRun.current) {
            hasRun.current = true // run exactly once
            animate()
            observer.disconnect()
          }
        }
      },
      { threshold: 0.4 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
    // Depend only on primitives so re-renders from setDisplay don't restart it.
  }, [target, duration, isNumeric])

  if (!parsed) {
    return <span className={className}>{value}</span>
  }

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      {display}
      {parsed.suffix}
    </span>
  )
}
