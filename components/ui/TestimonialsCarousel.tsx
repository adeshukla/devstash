'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Icon } from '@/components/icons/Icon'
import type { Testimonial } from '@/types/testimonial'

interface TestimonialsCarouselProps {
  testimonials: Testimonial[]
}

const AUTOPLAY_MS = 5000

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const drag = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null)

  // Scrolls the track element directly (never the outer page) using a
  // PROPORTIONAL target rather than each card's own offsetLeft. With N cards
  // wider than container/N (a "peek" carousel — 2+ cards visible at once),
  // the last card's own offsetLeft often exceeds the track's actual maximum
  // scrollLeft, so targeting it directly clamps to the same position as the
  // second-to-last card — clicking Next did nothing at that boundary, and
  // the last dot could never become active. Mapping index proportionally
  // across [0, maxScrollLeft] guarantees every index is independently
  // reachable and dot N always corresponds to genuinely scrolling further.
  function scrollToIndex(index: number) {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    if (max <= 0) return
    const clamped = Math.min(Math.max(index, 0), testimonials.length - 1)
    const target = testimonials.length > 1 ? (clamped / (testimonials.length - 1)) * max : 0
    el.scrollTo({ left: target, behavior: 'smooth' })
  }

  function scrollByCard(direction: 1 | -1) {
    scrollToIndex(Math.min(Math.max(activeIndex + direction, 0), testimonials.length - 1))
  }

  // Derives the active dot from actual scroll position using the same
  // proportional mapping scrollToIndex targets, instead of IntersectionObserver
  // ratio comparisons — those tied whenever 2+ cards were simultaneously
  // fully visible (the normal case in a peek carousel), which made the
  // last dot never win the tie and never light up.
  //
  // Debounced via setTimeout, not requestAnimationFrame: rAF callbacks are
  // throttled/paused entirely while the tab is backgrounded (not just this
  // dev sandbox — any real visitor who switches tabs mid-scroll hits the
  // same stall), so the dots would silently stop updating. setTimeout still
  // fires in a background tab.
  useEffect(() => {
    const el = trackRef.current
    if (!el || testimonials.length < 2) return

    let timeout: ReturnType<typeof setTimeout>
    function onScroll() {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const max = el!.scrollWidth - el!.clientWidth
        if (max <= 0) return
        const ratio = el!.scrollLeft / max
        const idx = Math.round(ratio * (testimonials.length - 1))
        setActiveIndex(Math.min(Math.max(idx, 0), testimonials.length - 1))
      }, 50)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      clearTimeout(timeout)
    }
  }, [testimonials.length])

  // Autoplay — off entirely under prefers-reduced-motion, and paused for a
  // while after any manual interaction (drag, arrow click, dot click) rather
  // than fighting the user's own navigation.
  useEffect(() => {
    if (testimonials.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    const interval = setInterval(() => {
      if (cancelled) return
      const el = trackRef.current
      if (!el) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
      scrollToIndex(atEnd ? 0 : activeIndex + 1)
    }, AUTOPLAY_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- interval re-arms on every activeIndex change, keeping the "next" target current
  }, [activeIndex, testimonials.length])

  // Desktop mouse-drag — native scroll-snap already gets touch/trackpad
  // swipe for free, but a plain mouse has no built-in drag-to-scroll.
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    setHasInteracted(true)
    if (e.pointerType === 'touch') return
    const el = trackRef.current
    if (!el) return
    drag.current = { startX: e.clientX, startScrollLeft: el.scrollLeft, moved: false }
    el.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = trackRef.current
    if (!el || !drag.current) return
    const delta = e.clientX - drag.current.startX
    if (Math.abs(delta) > 3) drag.current.moved = true
    el.scrollLeft = drag.current.startScrollLeft - delta
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const el = trackRef.current
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    drag.current = null
  }

  return (
    <div className="relative">
      {/* No CSS scroll-snap here — deliberately. Snap points are defined by
          each card's own position (snap-start), so with cards wider than
          container/N (2 cards visible at once, only 3 cards total), any
          intermediate target scrollToIndex computes gets silently pulled to
          whichever real card boundary is nearest — true under EITHER
          snap-mandatory or snap-proximity, since both still snap toward
          actual child positions, not arbitrary JS-computed offsets. With
          only 2 genuinely independent snap positions reachable at this
          card:container ratio, every "middle" dot target got overridden
          back to 0 or the max. Free (non-snapping) scroll lets the
          proportional math in scrollToIndex reach the position it actually
          asked for; native touch/trackpad momentum scroll still works fine
          without snap. */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="flex [scrollbar-width:none] gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] active:cursor-grabbing sm:cursor-grab [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((t) => (
          <article
            key={t.linkedinUrl + t.name}
            data-testimonial-card
            className="border-ds-border bg-ds-surface gradient-border-animated flex w-[85vw] shrink-0 flex-col gap-6 rounded-2xl border p-7 shadow-sm select-none sm:w-[400px]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-ds-accent/35 h-9 w-9"
              aria-hidden="true"
            >
              <path d="M9.5 7C6.5 8 5 10.3 5 13.2c0 2.4 1.6 3.8 3.4 3.8 1.7 0 3-1.2 3-2.9 0-1.5-1-2.6-2.5-2.7.3-1.4 1.4-2.5 2.9-3.1L9.5 7Zm9 0c-3 1-4.5 3.3-4.5 6.2 0 2.4 1.6 3.8 3.4 3.8 1.7 0 3-1.2 3-2.9 0-1.5-1-2.6-2.5-2.7.3-1.4 1.4-2.5 2.9-3.1L18.5 7Z" />
            </svg>
            <p className="text-ds-text flex-1 text-[17px] leading-[1.6] font-medium italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="border-ds-border flex items-center gap-3 border-t pt-5">
              <div className="border-ds-border bg-ds-surface2 text-ds-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-sans text-sm font-bold">
                {t.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-ds-text truncate text-sm font-semibold">{t.name}</p>
                <p className="text-ds-muted truncate text-xs">
                  {t.role} · {t.company}
                </p>
              </div>
              <a
                href={t.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t.name} on LinkedIn`}
                onClick={(e) => {
                  if (drag.current?.moved) e.preventDefault()
                }}
                className="text-ds-muted hover:text-ds-accent shrink-0 transition-colors"
              >
                <Icon name="linkedin" className="h-5 w-5" />
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Drag hint — see .drag-hint-icon in globals.css for why this exists
          instead of relying on the native cursor:grab glyph. Sits over the
          boundary between the first two cards, fades out permanently after
          the first real drag/click. */}
      {testimonials.length > 1 && !hasInteracted && (
        <div
          className="drag-hint-icon pointer-events-none absolute top-1/2 left-1/2 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 sm:block"
          aria-hidden="true"
        />
      )}

      {testimonials.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => {
              setHasInteracted(true)
              scrollByCard(-1)
            }}
            aria-label="Previous testimonial"
            className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Testimonial slides">
            {testimonials.map((t, i) => (
              <button
                key={t.linkedinUrl + t.name}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => {
                  setHasInteracted(true)
                  scrollToIndex(i)
                }}
                className={`h-2 rounded-full transition-all ${
                  i === activeIndex ? 'bg-ds-accent w-6' : 'bg-ds-border hover:bg-ds-muted w-2'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setHasInteracted(true)
              scrollByCard(1)
            }}
            aria-label="Next testimonial"
            className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
