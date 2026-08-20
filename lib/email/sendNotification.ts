// lib/email/sendNotification.ts
//
// Shared Resend sender for owner-facing notification emails (contact form,
// CTA-click alerts). Centralized so FROM/TO and failure handling live in one
// place instead of being copy-pasted per route.

import 'server-only'
import { Resend } from 'resend'

const FROM_EMAIL = 'DevStash <hello@devstash.me>'
const TO_EMAIL = 'hello@devstash.me'

interface SendNotificationInput {
  subject: string
  html: string
  text: string
  /** Set the Reply-To for submissions that came from a real person (contact
   * form) so replying goes straight to them, not back to yourself. */
  replyTo?: string
}

/** Never throws — a failed notification email must not break the request
 * (a 204 beacon response, or a successful contact-form submission) that
 * triggered it. Logs instead. */
export async function sendNotification({
  subject,
  html,
  text,
  replyTo,
}: SendNotificationInput): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[sendNotification] RESEND_API_KEY not set — skipping:', subject)
    return
  }

  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    })
    if (error) console.error('[sendNotification] Resend error:', error)
  } catch (err) {
    console.error('[sendNotification] Unexpected error:', err)
  }
}
