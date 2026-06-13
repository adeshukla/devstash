'use client'

import { useEffect } from 'react'
import {
  trackEvent,
  logVisit,
  ANALYTICS_EVENTS,
  type AnalyticsEvent,
  type AnalyticsParams,
} from '@/lib/analytics/events'

// Type guard: verify a raw attribute string is a known analytics event before
// handing it to the strictly-typed trackEvent (no `as any`/`@ts-ignore`).
function isAnalyticsEvent(value: string): value is AnalyticsEvent {
  return (Object.values(ANALYTICS_EVENTS) as string[]).includes(value)
}

/**
 * Delegated document-level click listener. Mounted once in the root layout, it
 * captures clicks on any anchor and fires the appropriate analytics event:
 *   - explicit `data-analytics-event` attribute (validated) takes priority
 *   - external http(s) links → github_link_clicked or resource_clicked
 *   - .pdf / resume / cv links → cv_viewed
 * Renders nothing.
 */
export function AnalyticsClicks() {
  useEffect(() => {
    function fire(name: AnalyticsEvent, params: AnalyticsParams) {
      // Client analytics (GA4 + GTM) and a server-side visit log.
      trackEvent(name, params)
      logVisit(name, params)
    }

    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest('a')
      if (!el) return

      const href = el.getAttribute('href') ?? ''
      const explicit = el.getAttribute('data-analytics-event')

      if (explicit) {
        if (isAnalyticsEvent(explicit)) {
          fire(explicit, { href })
        }
        return
      }

      if (/^https?:\/\//i.test(href)) {
        if (/github\.com/i.test(href)) {
          fire(ANALYTICS_EVENTS.githubLinkClicked, { href })
        } else {
          fire(ANALYTICS_EVENTS.resourceClicked, { href })
        }
      } else if (/\.pdf($|\?)/i.test(href) || /resume|\/cv\b/i.test(href)) {
        fire(ANALYTICS_EVENTS.cvViewed, { href })
      }
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
