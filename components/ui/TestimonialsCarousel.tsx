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
  const drag = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null)

  // Scrolls the track element directly (never the outer page) — deliberately
  // NOT card.scrollIntoView(), which was scrolling the whole homepage down to
  // the testimonials section on load: with block:'nearest' it still lets the
  // browser adjust the page's vertical scroll if it judges the card isn't
  // fully in the viewport, which it often isn't during entrance animation.
  function scrollToIndex(index: number) {
    const el = trackRef.current
    const card = el?.querySelectorAll<HTMLElement>('[data-testimonial-card]')[index]
    if (!el || !card) return
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }

  function scrollByCard(direction: 1 | -1) {
    scrollToIndex(Math.min(Math.max(activeIndex + direction, 0), testimonials.length - 1))
  }

  // Track which card is centered/leading in the viewport, to drive the dots —
  // works for scroll, drag, and swipe alike since it just observes position.
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const cards = [...el.querySelectorAll<HTMLElement>('[data-testimonial-card]')]

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (mostVisible) {
          setActiveIndex(cards.indexOf(mostVisible.target as HTMLElement))
        }
      },
      { root: el, threshold: [0.6] }
    )
    cards.forEach((c) => observer.observe(c))
    return () => observer.disconnect()
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
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] active:cursor-grabbing sm:cursor-grab [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((t) => (
          <article
            key={t.linkedinUrl + t.name}
            data-testimonial-card
            className="border-ds-border bg-ds-surface gradient-border-animated flex w-[85vw] shrink-0 snap-start flex-col gap-6 rounded-2xl border p-7 shadow-sm select-none sm:w-[400px]"
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

      {testimonials.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
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
                onClick={() => scrollToIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeIndex ? 'bg-ds-accent w-6' : 'bg-ds-border hover:bg-ds-muted w-2'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByCard(1)}
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
