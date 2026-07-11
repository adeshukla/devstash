import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { verifyRecaptcha } from '@/lib/security/recaptcha'

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
const FROM_EMAIL = 'DevStash Contact <hello@devstash.me>'
const TO_EMAIL = 'hello@devstash.me'

/** Escape a user-supplied string for interpolation into the HTML email.
 * Every field goes through this — the email renders in a mail client, and an
 * unescaped name/subject like `<img onerror=...>` is stored XSS there. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

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

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      replyTo: email,
      subject: `[DevStash Contact] ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent via devstash.me/contact
      `.trim(),
      // Optional HTML version
      html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#3b82f6;margin-bottom:4px">New contact form submission</h2>
  <p style="color:#9ca3af;font-size:13px;margin:0 0 24px">via devstash.me</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:8px 0;color:#9ca3af;width:80px">Name</td><td style="color:#f3f4f6">${escapeHtml(name)}</td></tr>
    <tr><td style="padding:8px 0;color:#9ca3af">Email</td><td style="color:#f3f4f6"><a href="mailto:${escapeHtml(email)}" style="color:#3b82f6">${escapeHtml(email)}</a></td></tr>
    <tr><td style="padding:8px 0;color:#9ca3af">Subject</td><td style="color:#f3f4f6">${escapeHtml(subject)}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #1f2937;margin:16px 0"/>
  <p style="color:#f3f4f6;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(message)}</p>
</div>
      `.trim(),
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
