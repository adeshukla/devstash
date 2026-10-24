'use client'

import { useEffect, useRef } from 'react'

const DURATION_MS = 900

/**
 * A number that counts up from zero the first time it scrolls into view
 * (PageFacts). The real value is server-rendered for SEO and no-JS; CSS keeps
 * it invisible until the count starts (`.count-up` in globals.css) so it
 * never flashes value → 0 → value, with a timed fallback if JS never runs.
 * Reduced motion shows the value straight away.
 */
export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.dataset.done = ''
      return
    }
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        el.dataset.counting = ''
        const tick = (t: number) => {
          const k = Math.min(1, (t - t0) / DURATION_MS)
          el.textContent = `${Math.round(value * (1 - (1 - k) ** 3))}${suffix}`
          if (k < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, suffix])

  return (
    <span ref={ref} className="count-up tabular-nums">
      {`${value}${suffix}`}
    </span>
  )
}
