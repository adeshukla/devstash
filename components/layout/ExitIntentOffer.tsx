'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/events'

const SESSION_KEY = 'devstash:exit-offer:shown'
const SCROLL_THRESHOLD = 0.7
const ARM_DELAY_MS = 4000
const EXCLUDED_PATHS = new Set(['/contact'])

/**
 * A single, non-blocking corner offer inviting visitors to try the AI
 * Content Pipeline demo before they leave — not a lead-capture form, just one
 * link. Desktop uses real exit-intent (cursor leaving toward the tab/URL
 * bar); touch devices have no such signal, so they use scroll depth instead.
 * Shown at most once per browser session (sessionStorage, not localStorage —
 * unlike the onboarding tour, this is a per-visit nudge, not a one-time-ever
 * intro).
 */
export function ExitIntentOffer() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const shownRef = useRef(false)

  const isExcluded = pathname ? EXCLUDED_PATHS.has(pathname) : false
  const isBlogPost = Boolean(pathname?.startsWith('/blog/') && pathname !== '/blog')

  useEffect(() => {
    if (isExcluded) return
    if (window.sessionStorage.getItem(SESSION_KEY)) return

    let armed = false
    const armTimer = setTimeout(() => {
      armed = true
    }, ARM_DELAY_MS)

    function show(trigger: string) {
      if (shownRef.current) return
      shownRef.current = true
      window.sessionStorage.setItem(SESSION_KEY, '1')
      setVisible(true)
      trackEvent(ANALYTICS_EVENTS.exitOfferShown, { path: pathname ?? '', trigger })
      cleanup()
    }

    function onMouseLeave(e: MouseEvent) {
      if (armed && e.clientY <= 0) show('mouseleave')
    }

    function onScroll() {
      if (!armed) return
      const el = document.documentElement
      const pct = (el.scrollTop + window.innerHeight) / el.scrollHeight
      if (pct >= SCROLL_THRESHOLD) show('scroll')
    }

    function cleanup() {
      clearTimeout(armTimer)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('scroll', onScroll)
    }

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    if (isTouchDevice) {
      window.addEventListener('scroll', onScroll, { passive: true })
    } else {
      document.addEventListener('mouseleave', onMouseLeave)
    }

    return cleanup
  }, [isExcluded, pathname])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Before you go"
      className="exit-offer-enter border-ds-border bg-ds-surface fixed inset-x-4 bottom-4 z-50 max-w-sm rounded-xl border p-5 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="text-ds-muted hover:text-ds-text absolute top-3 right-3 text-sm"
      >
        ✕
      </button>
      <p className="text-ds-accent mb-1 font-mono text-xs">BEFORE YOU GO</p>
      <p className="text-ds-text mb-3 pr-4 text-sm leading-relaxed">
        {isBlogPost
          ? 'Liked this post? See the AI pipeline that could draft a first version of one like it — a real 3-step LLM chain, not a mockup.'
          : 'I built an AI agent that drafts, humanizes, and SEO-optimizes its own blog posts — live, with real token usage shown for every step.'}
      </p>
      <Button
        href="/lab/ai-content-pipeline"
        size="sm"
        data-analytics-event={ANALYTICS_EVENTS.exitOfferClicked}
      >
        Try the demo →
      </Button>
    </div>
  )
}
