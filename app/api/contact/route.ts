import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { verifyRecaptcha } from '@/lib/security/recaptcha'
import { renderNotificationEmail, escapeHtml } from '@/lib/email/renderNotificationEmail'

// Must match the `action` name grecaptcha.execute() is called with client-side.
const RECAPTCHA_ACTION = 'contact_form'

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
  let body: unknown

  try {
    body = await request.json()
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

  const { name, email, subject: rawSubject, message, recaptchaToken } = parsed.data
  // Strip line breaks so nothing can smuggle extra lines into the subject.
  const subject = rawSubject.replace(/[\r\n]+/g, ' ').trim()

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

    const { html, text } = renderNotificationEmail({
      icon: '📬',
      heading: 'New contact form submission',
      bodyHtml: escapeHtml(message),
      bodyText: message,
      fields: [
        { label: 'Name', value: name },
        { label: 'Email', value: email, href: `mailto:${email}` },
        { label: 'Subject', value: subject },
      ],
      footerNote: 'Sent via devstash.me/contact — reply to this email to respond directly.',
    })

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      replyTo: email,
      subject: `[DevStash Contact] ${subject}`,
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
      message: "Message received! I'll reply within 48 hours.",
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
