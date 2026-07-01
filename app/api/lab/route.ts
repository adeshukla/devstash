import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

// ─── Zod schema — discriminated union, one shape per /lab demo form ───────────

const LabSubmissionSchema = z.discriminatedUnion('formType', [
  z.object({
    formType: z.literal('saas-trial'),
    email: z.string().email('Invalid email address.'),
  }),
  z.object({
    formType: z.literal('marketing-audit'),
    url: z.string().url('Enter a full URL, including https://'),
    email: z.string().email('Invalid email address.'),
  }),
  z.object({
    formType: z.literal('real-estate'),
    name: z.string().min(2, 'Name must be at least 2 characters.').max(80, 'Name is too long.'),
    phone: z.string().min(7, 'Enter a valid phone number.').max(20, 'Enter a valid phone number.'),
  }),
])

const FORM_LABELS: Record<string, string> = {
  'saas-trial': 'Pulse — SaaS Trial Signup',
  'marketing-audit': 'Free Marketing Audit',
  'real-estate': 'Maple Court Residences — Tour Request',
}

// ─── Resend client (lazy init — only on server) ───────────────────────────────

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set.')
  return new Resend(key)
}

const FROM_EMAIL = 'DevStash Lab <hello@devstash.me>'
const TO_EMAIL = 'hello@devstash.me'

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
  }

  const parsed = LabSubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const label = FORM_LABELS[data.formType] ?? data.formType
  const fields = Object.entries(data)
    .filter(([key]) => key !== 'formType')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  try {
    const resend = getResend()

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: `[DevStash Lab Demo] ${label}`,
      text: `
A visitor submitted the "${label}" sample landing page form at devstash.me/lab.

${fields}

---
This is a portfolio sample form (see /lab pages) — not a real product or service.
      `.trim(),
    })

    if (error) {
      console.error('[api/lab] Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Submitted — this demo form sent a real email.' })
  } catch (err) {
    console.error('[api/lab] Unexpected error:', err)
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
