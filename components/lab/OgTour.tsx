'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { resolveTarget } from './tourTarget'

export interface TourStep {
  /** CSS selector of what to point at. A step whose target is not on the page is skipped. */
  target: string
  title: string
  body: string
  /** An optional "try it" button that does the thing for the visitor. */
  action?: { label: string; run: () => void }
}

/**
 * A guided tour: a small card docked to the bottom of the screen, and a plain outline on the part
 * it is talking about. Nothing is measured, positioned or dimmed while the page scrolls, so it
 * stays smooth: the browser scrolls once per step and the outline is just a CSS outline.
 * Next and Back move between steps, Escape or "Skip tour" closes it. Steps whose target is hidden
 * are left out, so the tour only talks about what is there.
 */
export function OgTour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  // Opened by a click, so this only ever runs in the browser.
  const [list] = useState(() => steps.filter((s) => resolveTarget(s.target)))
  const [i, setI] = useState(0)
  const card = useRef<HTMLDivElement>(null)
  const step = list[i]
  const last = i === list.length - 1

  useEffect(() => {
    if (!step) return
    const el = resolveTarget(step.target)
    if (!(el instanceof HTMLElement)) return
    // Open every collapsed section the target sits inside, outermost last.
    for (let d = el.closest('details'); d; d = d.parentElement?.closest('details') ?? null)
      d.setAttribute('open', '')
    el.setAttribute('data-tour-on', '')
    const before = [el.style.outline, el.style.outlineOffset, el.style.scrollMarginTop]
    el.style.outline = '2px solid var(--color-ds-accent)'
    el.style.outlineOffset = '4px'
    el.style.scrollMarginTop = '96px'
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' })
    card.current?.querySelector<HTMLElement>('[data-next]')?.focus({ preventScroll: true })
    return () => {
      el.removeAttribute('data-tour-on')
      ;[el.style.outline, el.style.outlineOffset, el.style.scrollMarginTop] = before
    }
  }, [step])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!step) return null

  return (
    <div
      ref={card}
      role="dialog"
      aria-label={`Guided tour, step ${i + 1} of ${list.length}`}
      className="border-ds-border bg-ds-surface fixed inset-x-3 bottom-3 z-[80] rounded-xl border p-4 text-left shadow-xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
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
  )
}
