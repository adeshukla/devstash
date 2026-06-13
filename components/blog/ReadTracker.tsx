'use client'

import { useEffect, useRef } from 'react'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics/events'

/**
 * Fires `blog_post_read` exactly once per page view when the reader scrolls
 * past ~75% of the document. Renders no visible UI.
 */
export function ReadTracker({ slug }: { slug: string }) {
  const fired = useRef(false)

  useEffect(() => {
    function onScroll() {
      if (fired.current) return
      const el = document.documentElement
      const pct = (el.scrollTop + window.innerHeight) / el.scrollHeight
      if (pct >= 0.75) {
        fired.current = true
        trackEvent(ANALYTICS_EVENTS.blogPostRead, { slug })
        window.removeEventListener('scroll', onScroll)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // Fire once on mount in case the post is short / already past 75%.
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [slug])

  return null
}
