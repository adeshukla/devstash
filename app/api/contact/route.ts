import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { verifyRecaptcha } from '@/lib/security/recaptcha'
import { clientKey, isSameOrigin, rateLimited } from '@/lib/security/requestGuard'
import { renderNotificationEmail, escapeHtml } from '@/lib/email/renderNotificationEmail'
import {
  summarizeUserAgent,
  getRequestGeo,
  formatGeo,
  validTimeZone,
  formatOwnerTime,
  formatVisitorTime,
} from '@/lib/utils/requestContext'

// Must match the `action` name grecaptcha.execute() is called with client-side.
const RECAPTCHA_ACTION = 'contact_form'

// ─── Topics ───────────────────────────────────────────────────────────────────
// Keys must match the <select> in components/contact/ContactForm.tsx.

const TOPICS = {
  hiring: { label: 'Hiring', color: '#166534', background: '#dcfce7' },
  freelance: { label: 'Freelance', color: '#92400e', background: '#fef3c7' },
  collaboration: { label: 'Collaboration', color: '#6b21a8', background: '#f3e8ff' },
  feedback: { label: 'Feedback', color: '#1e40af', background: '#dbeafe' },
  general: { label: 'General', color: '#475569', background: '#e2e8f0' },
} as const
type TopicKey = keyof typeof TOPICS

// ─── Zod schema ───────────────────────────────────────────────────────────────

const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(80, 'Name is too long.'),
  email: z.string().email('Invalid email address.'),
  subject: z
    .string()
    .min(4, 'Subject must be at least 4 characters.')
    .max(120, 'Subject is too long.'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters.')
    .max(5000, 'Message is too long.'),
  // Absent until the client-side widget is wired up with a real site key —
  // verifyRecaptcha() no-ops when RECAPTCHA_SECRET_KEY isn't set either way.
  recaptchaToken: z.string().optional(),
  topic: z.enum(Object.keys(TOPICS) as [TopicKey, ...TopicKey[]]).default('general'),
  // Optional. Digits with an optional leading +, spaces, dashes and brackets.
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[\d\s\-()]{7,20})?$/, 'Enter a valid phone number.')
    .optional(),
  // Untrusted, browser-reported context. Only ever rendered as escaped text.
  source: z
    .object({
      page: z.string().max(200).optional(),
      referrer: z.string().max(500).optional(),
      utm: z.string().max(200).optional(),
    })
    .optional(),
  tz: z.string().max(64).optional(),
  // Honeypot: hidden from people, so only bots fill it.
  website: z.string().max(200).optional(),
})

// ─── Resend client (lazy init — only on server) ───────────────────────────────

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set.')
  return new Resend(key)
}

// Resend sender + recipient. FROM must be on your verified Resend domain.
const FROM_EMAIL = 'DevStash <hello@devstash.me>'
const TO_EMAIL = 'hello@devstash.me'

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Cheapest checks first: nothing below runs for a cross-site, flooding or
  // oversized request.
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }
  // 5 messages per 10 minutes per IP is far above a real visitor.
  if (rateLimited(`contact:${clientKey(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many messages. Please try again in a few minutes.' },
      { status: 429 }
    )
  }

  let body: unknown

  try {
    // Max payload is ~6 KB of text; 20 KB leaves room for the JSON wrapper.
    const raw = await request.text()
    if (raw.length > 20_000) {
      return NextResponse.json({ error: 'Request too large.' }, { status: 413 })
    }
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  // Validate
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed.',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const {
    name: rawName,
    email,
    subject: rawSubject,
    message,
    recaptchaToken,
    topic,
    phone,
    source,
    tz,
    website,
  } = parsed.data

  // A bot filled the hidden field. Answer exactly like a success so it learns
  // nothing, and send nothing.
  if (website) {
    return NextResponse.json({ message: "Message received! I'll reply within 24 hours." })
  }

  // Strip control characters (line breaks included) so nothing can smuggle
  // extra lines into the subject or the plain-text email.
  const stripControl = (v: string) => v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim()
  const subject = stripControl(rawSubject)
  const name = stripControl(rawName)

  const recaptcha = await verifyRecaptcha(recaptchaToken, RECAPTCHA_ACTION)
  if (!recaptcha.ok) {
    console.warn('[contact/route] reCAPTCHA rejected submission:', recaptcha.reason)
    return NextResponse.json(
      { error: 'Could not verify you are human. Please try again.' },
      { status: 403 }
    )
  }

  try {
    const resend = getResend()

    const now = new Date()
    const t = TOPICS[topic]
    const firstName = name.split(/\s+/)[0]
    const phoneDigits = phone?.replace(/[^\d+]/g, '')
    const visitorTime = formatVisitorTime(now, validTimeZone(tz))
    const clean = (v?: string) => v?.replace(/[\r\n]+/g, ' ').trim() || undefined
    const referrer = clean(source?.referrer)
    const firstPage = clean(source?.page)
    const campaign = clean(source?.utm)

    const { html, text } = renderNotificationEmail({
      icon: '📬',
      heading: 'New contact form submission',
      badge: { text: t.label, color: t.color, background: t.background },
      preheader: `${t.label} · ${subject} — ${name}`,
      lead: `From ${name} <${email}>`,
      bodyHtml: escapeHtml(message),
      bodyText: message,
      actions: [
        {
          label: `Reply to ${firstName}`,
          href: `mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}&body=${encodeURIComponent(`Hi ${firstName},\n\nThanks for reaching out. `)}`,
          primary: true,
        },
        ...(phoneDigits ? [{ label: 'Call', href: `tel:${phoneDigits}` }] : []),
        ...(phoneDigits?.startsWith('+')
          ? [{ label: 'WhatsApp', href: `https://wa.me/${phoneDigits.slice(1)}` }]
          : []),
        {
          label: 'Find on LinkedIn',
          href: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`,
        },
      ],
      fields: [
        { label: 'Name', value: name, section: 'Contact' },
        { label: 'Email', value: email, href: `mailto:${email}` },
        ...(phone ? [{ label: 'Phone', value: phone, href: `tel:${phoneDigits}` }] : []),
        { label: 'Topic', value: t.label, section: 'This message' },
        { label: 'Subject', value: subject },
        { label: 'Received', value: formatOwnerTime(now) },
        ...(visitorTime ? [{ label: 'Their time', value: visitorTime }] : []),
        { label: 'Location', value: `${formatGeo(getRequestGeo(request.headers))} (approx.)` },
        { label: 'Device', value: summarizeUserAgent(request.headers.get('user-agent')) },
        ...(typeof recaptcha.score === 'number'
          ? [
              {
                label: 'Spam check',
                value: `${recaptcha.score.toFixed(1)} — ${recaptcha.score >= 0.7 ? 'likely human' : 'borderline'}`,
              },
            ]
          : []),
        {
          label: 'Came from',
          value: referrer ?? 'Direct / no referrer',
          section: 'How they found you',
        },
        ...(firstPage ? [{ label: 'First page', value: firstPage, mono: true }] : []),
        ...(campaign ? [{ label: 'Campaign', value: campaign }] : []),
      ],
      footerNote:
        'Sent via devstash.me/contact — reply to this email to respond directly. Location and source are approximate and browser-reported.',
    })

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      replyTo: email,
      subject: `[DevStash Contact][${t.label}] ${subject}`,
      html,
      text,
    })

    if (error) {
      console.error('[contact/route] Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Message received! I'll reply within 24 hours.",
    })
  } catch (err) {
    console.error('[contact/route] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Block all other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
