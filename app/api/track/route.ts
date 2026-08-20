// app/api/track/route.ts
//
// Lightweight server-side visit log. Receives fire-and-forget beacons from
// lib/analytics/events.ts `logVisit()` for key interactions (resume view/
// download, contact form submit, CTA clicks) and writes a structured line to
// the server log (visible in Vercel → Functions logs). No database, no PII
// storage beyond the standard request metadata a web server already sees.
//
// A subset of events (NOTIFY_EVENTS below) also trigger a branded email via
// Resend so real engagement — someone downloading the résumé, clicking
// through to GitHub, running the AI pipeline demo — shows up as a
// notification instead of only living in logs nobody reads. Deliberately
// NOT every event: contact_form_submitted already gets a much richer email
// from app/api/contact/route.ts (name/email/message), so notifying again
// here would just duplicate it with less detail. blog_post_read and
// exit_offer_shown are passive/high-frequency (scroll-depth, a popup just
// appearing) — real notification-worthy signal there is an aggregate trend,
// which is what GA4 is for, not a per-event email; both still only fire
// trackEvent (GA4-only), never reaching this route. ai_pipeline_tour_completed
// was the same until now — switched to trackAndLog in AiPipelineTour.tsx
// because finishing the Lab's guided tour is a real, low-frequency
// "genuinely interested" signal worth an email, same tier as ai_pipeline_run.

import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { sendNotification } from '@/lib/email/sendNotification'
import { renderNotificationEmail } from '@/lib/email/renderNotificationEmail'
import { summarizeUserAgent, getRequestGeo, formatGeo } from '@/lib/utils/requestContext'

const KNOWN_EVENTS = new Set([
  'cv_viewed',
  'contact_form_submitted',
  'github_link_clicked',
  'blog_post_read',
  'resource_clicked',
  'ai_pipeline_run',
  'ai_pipeline_tour_completed',
  'exit_offer_shown',
  'exit_offer_clicked',
])

const NOTIFY_EVENTS: Record<string, { icon: string; heading: string }> = {
  cv_viewed: { icon: '📄', heading: 'Résumé downloaded' },
  github_link_clicked: { icon: '🐙', heading: 'GitHub profile clicked' },
  resource_clicked: { icon: '🔗', heading: 'Resource link clicked' },
  exit_offer_clicked: { icon: '🎯', heading: 'Exit-offer CTA clicked' },
  ai_pipeline_run: { icon: '🤖', heading: 'AI Content Pipeline demo run' },
  ai_pipeline_tour_completed: { icon: '🧭', heading: 'AI Content Pipeline tour completed' },
}

// Best-effort in-memory de-dupe: the About page alone has two separate
// "Download résumé" buttons, so one visitor can trigger the same event twice
// in a single visit. Resets on cold start / doesn't share across regions —
// that's fine, it only needs to blunt the common case, not be airtight.
const recentlySent = new Map<string, number>()
const DEDUPE_WINDOW_MS = 15 * 60 * 1000

function shouldNotify(key: string): boolean {
  const now = Date.now()
  const last = recentlySent.get(key)
  if (last && now - last < DEDUPE_WINDOW_MS) return false
  recentlySent.set(key, now)
  // Opportunistic prune so this doesn't grow unbounded over a warm instance's
  // lifetime.
  if (recentlySent.size > 500) {
    for (const [k, t] of recentlySent) {
      if (now - t > DEDUPE_WINDOW_MS) recentlySent.delete(k)
    }
  }
  return true
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    // sendBeacon may deliver an empty/odd body — tolerate it.
  }

  const rawEvent = asString(body.event) ?? 'unknown'
  const event = KNOWN_EVENTS.has(rawEvent) ? rawEvent : 'unknown'

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    undefined

  const entry = {
    kind: 'visit',
    event,
    path: asString(body.path),
    href: asString(body.href),
    label: asString(body.label),
    method: asString(body.method),
    referrer: asString(body.referrer),
    ua: request.headers.get('user-agent') ?? undefined,
    ip,
    at: new Date().toISOString(),
  }

  // Structured single-line log for easy filtering in Vercel logs.
  console.log(`[visit] ${JSON.stringify(entry)}`)

  const notify = NOTIFY_EVENTS[event]
  if (notify && shouldNotify(`${ip ?? 'unknown'}:${event}`)) {
    // after() runs post-response, so the beacon still gets its 204
    // immediately — the visitor's page never waits on an email send.
    after(async () => {
      const geo = getRequestGeo(request.headers)
      const { html, text } = renderNotificationEmail({
        icon: notify.icon,
        heading: notify.heading,
        fields: [
          {
            label: 'When',
            value: new Date(entry.at).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          },
          { label: 'Page', value: entry.path ?? 'Unknown', mono: true },
          ...(entry.href
            ? [{ label: 'Link', value: entry.href, href: entry.href, mono: true }]
            : []),
          { label: 'Referrer', value: entry.referrer ?? 'Direct / no referrer' },
          { label: 'Location', value: formatGeo(geo) },
          { label: 'Device', value: summarizeUserAgent(entry.ua) },
        ],
        footerNote:
          'Automated notification from devstash.me — someone real, not you, triggered this.',
      })
      await sendNotification({
        subject: `${notify.icon} ${notify.heading} — devstash.me`,
        html,
        text,
      })
    })
  }

  // 204 No Content — beacons don't read the response.
  return new NextResponse(null, { status: 204 })
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
