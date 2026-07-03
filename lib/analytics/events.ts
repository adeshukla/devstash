// Typed, crash-proof analytics helpers. Safe to import from server or client
// components — no server-only imports. Event names are the single source of
// truth; all call sites send names from ANALYTICS_EVENTS.
//
// trackEvent  → client analytics (GA4 via gtag + GTM dataLayer push).
// logVisit    → fire-and-forget beacon to /api/track for server-side visit logs.

// Canonical event names (source of truth).
export const ANALYTICS_EVENTS = {
  cvViewed: 'cv_viewed',
  contactFormSubmitted: 'contact_form_submitted',
  githubLinkClicked: 'github_link_clicked',
  blogPostRead: 'blog_post_read',
  resourceClicked: 'resource_clicked',
  aiPipelineRun: 'ai_pipeline_run',
  aiPipelineTourCompleted: 'ai_pipeline_tour_completed',
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]
export type AnalyticsParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    clarity?: (...args: unknown[]) => void
  }
}

/**
 * Send a client analytics event. Pushes to GA4 (gtag) when present AND to the
 * GTM dataLayer so GTM triggers/tags can react. No-ops on the server or before
 * analytics has loaded. Never throws.
 */
export function trackEvent(name: AnalyticsEvent, params?: AnalyticsParams): void {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params ?? {})
  }
  // GTM dataLayer (works even if pushed before GTM finishes loading — GTM
  // processes the existing queue on init).
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event: name, ...(params ?? {}) })
}

/**
 * Record a server-side visit log for a key interaction. Fire-and-forget via
 * navigator.sendBeacon (falls back to keepalive fetch). Never throws; no-ops on
 * the server. Used for resume views/downloads and contact submissions so there
 * is an owner-visible log independent of GA4.
 */
export function logVisit(name: AnalyticsEvent, params?: AnalyticsParams): void {
  if (typeof window === 'undefined') return
  try {
    const payload = JSON.stringify({
      event: name,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      ...(params ?? {}),
    })
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
    } else {
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      })
    }
  } catch {
    // Never let analytics logging break the UI.
  }
}

/** Convenience: fire both the client event and the server visit log. */
export function trackAndLog(name: AnalyticsEvent, params?: AnalyticsParams): void {
  trackEvent(name, params)
  logVisit(name, params)
}
