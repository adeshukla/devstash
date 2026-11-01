import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/events'

/**
 * Which Lab tool actions people use, so the Lab can be improved from facts.
 * Sends the tool and the action name only: never a link, a name, a report or
 * anything else the visitor typed. No-ops when analytics is not loaded.
 */
export function trackLab(tool: string, action: string, kind?: string) {
  trackEvent(ANALYTICS_EVENTS.labToolAction, kind ? { tool, action, kind } : { tool, action })
}
