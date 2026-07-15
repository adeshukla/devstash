'use client'

import { useRef } from 'react'
import { Icon } from '@/components/icons/Icon'
import type { Testimonial } from '@/types/testimonial'

interface TestimonialsCarouselProps {
  testimonials: Testimonial[]
}

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  function scrollByCard(direction: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-testimonial-card]')
    const amount = (card?.offsetWidth ?? 360) + 24
    el.scrollBy({ left: amount * direction, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((t) => (
          <article
            key={t.linkedinUrl + t.name}
            data-testimonial-card
            className="border-ds-border bg-ds-surface gradient-border-animated flex w-[85vw] shrink-0 snap-start flex-col gap-5 rounded-2xl border p-6 shadow-sm sm:w-[380px]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-ds-accent/40 h-6 w-6"
              aria-hidden="true"
            >
              <path d="M9.5 7C6.5 8 5 10.3 5 13.2c0 2.4 1.6 3.8 3.4 3.8 1.7 0 3-1.2 3-2.9 0-1.5-1-2.6-2.5-2.7.3-1.4 1.4-2.5 2.9-3.1L9.5 7Zm9 0c-3 1-4.5 3.3-4.5 6.2 0 2.4 1.6 3.8 3.4 3.8 1.7 0 3-1.2 3-2.9 0-1.5-1-2.6-2.5-2.7.3-1.4 1.4-2.5 2.9-3.1L18.5 7Z" />
            </svg>
            <p className="text-ds-text flex-1 text-[15px] leading-relaxed italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="border-ds-border flex items-center gap-3 border-t pt-4">
              <div className="border-ds-border bg-ds-surface2 text-ds-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-sans text-sm font-bold select-none">
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
                className="text-ds-muted hover:text-ds-accent shrink-0 transition-colors"
              >
                <Icon name="linkedin" className="h-5 w-5" />
              </a>
            </div>
          </article>
        ))}
      </div>

      {testimonials.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous testimonial"
            className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
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
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Next testimonial"
            className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
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
