'use client'

import { useEffect, useRef, useState } from 'react'

// Built by scripts/footer-room/build.mjs: one inline-able <svg>, CSS scoped under
// .fs-root, starting paused (.is-paused). Same-origin, so CSP's style-src
// 'unsafe-inline' covers its <style>.
const SRC = '/images/animations/footer-room.svg'
// The room is 1920×560. Narrower screens crop toward the desk rather than
// shrinking the whole room; the aspect classes on the frame below must match.
const VIEWS = [
  { query: '(min-width: 1024px)', box: '0 0 1920 560' },
  { query: '(min-width: 640px)', box: '560 0 1360 560' },
  { query: 'all', box: '1010 0 700 560' }, // phones: the brief's 5:4 mobile frame, on the desk
]

function setPlaying(svg: SVGSVGElement | null, play: boolean) {
  svg?.classList.toggle('is-paused', !play)
}

/**
 * The footer room: an animated night scene (walk-in, lights, desk, the city
 * outside). Costs nothing on page load: the scene loads only when the visitor
 * is within ~600px of the footer, plays its intro on every page load when it
 * is on screen (it used to play once per tab; a refresh opened on the finished
 * scene), and pauses whenever it is off screen. Visitors can pause it (WCAG
 * 2.2.2); reduced motion gets the finished frame from the scene's own CSS.
 */
export function FooterScene() {
  const host = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const visible = useRef(false)
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
    setPlaying(svgRef.current, !paused && visible.current)
  }, [paused])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    const queries = VIEWS.map((v) => window.matchMedia(v.query))
    const fit = () => {
      const view = VIEWS[queries.findIndex((q) => q.matches)]
      if (view) svgRef.current?.setAttribute('viewBox', view.box)
    }
    queries.forEach((q) => q.addEventListener('change', fit))

    const onScreen = new IntersectionObserver(
      ([entry]) => {
        visible.current = !!entry?.isIntersecting
        setPlaying(svgRef.current, !pausedRef.current && visible.current)
      },
      { threshold: 0.35 }
    )

    const near = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return
        near.disconnect()
        try {
          const markup = await fetch(SRC).then((r) => (r.ok ? r.text() : Promise.reject()))
          if (cancelled) return
          el.innerHTML = markup
          const svg = el.querySelector('svg')
          if (!svg) return
          svgRef.current = svg
          fit()
          setReady(true)
          // Reduced motion: the scene's CSS collapses every animation to its end frame.
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return setPlaying(svg, true)
          // Phones crop to the desk, so the walk across the room is off frame: start
          // the intro as he walks in under the third light instead of on an empty desk.
          if (!queries[1]?.matches) {
            for (const a of svg.getAnimations({ subtree: true }))
              if (
                a.effect?.getComputedTiming().iterations !== Infinity &&
                Number(a.currentTime ?? 0) < 4200
              )
                a.currentTime = 4200
          }
          onScreen.observe(el)
        } catch {
          // Decorative: if it can't load, the footer simply has no scene.
        }
      },
      { rootMargin: '600px 0px' }
    )
    near.observe(el)

    return () => {
      cancelled = true
      near.disconnect()
      onScreen.disconnect()
      queries.forEach((q) => q.removeEventListener('change', fit))
    }
  }, [])

  return (
    <div className="border-ds-border bg-ds-surface2 relative aspect-[700/560] overflow-hidden rounded-2xl border sm:aspect-[1360/560] lg:aspect-[1920/560]">
      <div ref={host} className="absolute inset-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full" />
      {ready && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="border-ds-border2 bg-ds-bg/80 text-ds-text hover:border-ds-accent focus-visible:outline-ds-accent absolute right-3 bottom-3 inline-flex h-10 items-center gap-2 rounded-full border px-4 font-mono text-xs backdrop-blur-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:hidden"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
            {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M4 2.5h3v11H4zm5 0h3v11H9z" />}
          </svg>
          {paused ? 'Play animation' : 'Pause animation'}
        </button>
      )}
    </div>
  )
}
