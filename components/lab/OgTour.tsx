'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'

export interface TourStep {
  /** CSS selector of what to point at. A step whose target is not on the page is skipped. */
  target: string
  title: string
  body: string
  /** An optional "try it" button that does the thing for the visitor. */
  action?: { label: string; run: () => void }
}

const CARD_W = 320
const GAP = 14

/**
 * A guided tour: dims the page, outlines one part at a time and explains it. Next and Back move
 * between steps, Escape or "Skip tour" closes it. Steps whose target is hidden (for example,
 * advanced controls in the simple view) are left out, so the tour only talks about what is there.
 */
export function OgTour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  // Opened by a click, so this only ever runs in the browser.
  const [list] = useState(() => steps.filter((s) => document.querySelector(s.target)))
  const [i, setI] = useState(0)
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number; ch: number } | null>(
    null
  )
  const card = useRef<HTMLDivElement>(null)
  const step = list[i]
  const last = i === list.length - 1

  const measure = useCallback(() => {
    const el = step && document.querySelector(step.target)
    if (!el) return
    const r = el.getBoundingClientRect()
    setBox({
      x: r.left,
      y: r.top,
      w: r.width,
      h: Math.min(r.height, window.innerHeight * 0.5),
      ch: card.current?.offsetHeight ?? 200,
    })
  }, [step])

  useEffect(() => {
    if (!step) return
    const el = document.querySelector(step.target)
    if (!el) return
    el.closest('details')?.setAttribute('open', '')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: Math.max(0, window.scrollY + el.getBoundingClientRect().top - 90),
      behavior: calm ? 'auto' : 'smooth',
    })
    const first = requestAnimationFrame(measure)
    const settle = window.setTimeout(measure, 450)
    card.current?.querySelector<HTMLElement>('[data-next]')?.focus({ preventScroll: true })
    return () => {
      cancelAnimationFrame(first)
      window.clearTimeout(settle)
    }
  }, [step, measure])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [measure, onClose])

  if (!step) return null
  const vw = typeof window === 'undefined' ? 1200 : window.innerWidth
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight
  const narrow = vw < 640
  let cardStyle: React.CSSProperties = {}
  if (!narrow && box) {
    const below = box.y + box.h + GAP
    const top =
      below + box.ch < vh - 12
        ? below
        : box.y - GAP - box.ch > 12
          ? box.y - GAP - box.ch
          : Math.max(12, vh - box.ch - 12)
    cardStyle = {
      top,
      left: Math.min(Math.max(12, box.x), vw - CARD_W - 12),
      width: CARD_W,
    }
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      {box && (
        <div
          aria-hidden="true"
          className="border-ds-accent absolute rounded-xl border-2 motion-safe:transition-all motion-safe:duration-200"
          style={{
            left: box.x - 6,
            top: box.y - 6,
            width: box.w + 12,
            height: box.h + 12,
            boxShadow: '0 0 0 100vmax rgba(8, 12, 20, 0.62)',
          }}
        />
      )}
      <div
        ref={card}
        role="dialog"
        aria-label={`Guided tour, step ${i + 1} of ${list.length}`}
        style={cardStyle}
        className={`border-ds-border bg-ds-surface pointer-events-auto absolute rounded-xl border p-4 shadow-xl ${
          narrow ? 'inset-x-3 bottom-3' : ''
        }`}
      >
        <p className="text-ds-muted font-mono text-xs">
          Step {i + 1} of {list.length}
        </p>
        <h2 className="text-ds-text mt-1 text-base font-semibold">{step.title}</h2>
        <p className="text-ds-muted mt-1.5 text-sm leading-relaxed">{step.body}</p>
        {step.action && (
          <div className="mt-3">
            <Button type="button" size="sm" variant="outline" onClick={step.action.run}>
              {step.action.label}
            </Button>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={i === 0}
          >
            Back
          </Button>
          <Button
            data-next=""
            type="button"
            size="sm"
            onClick={() => (last ? onClose() : setI((n) => n + 1))}
          >
            {last ? 'Done' : 'Next'}
          </Button>
          {!last && (
            <button
              type="button"
              onClick={onClose}
              className="text-ds-muted hover:text-ds-text ml-auto text-xs underline"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
