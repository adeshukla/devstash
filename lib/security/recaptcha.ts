import 'server-only'

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
// Google's own suggested cutoff for v3 — 1.0 is definitely human, 0.0 is
// definitely a bot. Revisit once real traffic gives a sense of where
// legitimate submissions actually land.
const SCORE_THRESHOLD = 0.5

interface RecaptchaResult {
  ok: boolean
  reason?: string
}

interface SiteverifyResponse {
  success: boolean
  score?: number
  action?: string
  'error-codes'?: string[]
}

/** Verifies a reCAPTCHA v3 token server-side against the given action name.
 * Returns `{ ok: true }` as a no-op whenever RECAPTCHA_SECRET_KEY isn't set,
 * so the contact form keeps working before a real site/secret key pair is
 * configured — this is the only line to watch once keys are added. */
export async function verifyRecaptcha(
  token: string | undefined,
  action: string
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return { ok: true }

  if (!token) return { ok: false, reason: 'Missing reCAPTCHA token.' }

  let data: SiteverifyResponse
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    data = await res.json()
  } catch {
    return { ok: false, reason: 'Could not reach reCAPTCHA verification service.' }
  }

  if (!data.success) return { ok: false, reason: 'reCAPTCHA verification failed.' }
  if (data.action && data.action !== action) {
    return { ok: false, reason: 'reCAPTCHA action mismatch.' }
  }
  if (typeof data.score === 'number' && data.score < SCORE_THRESHOLD) {
    return { ok: false, reason: 'reCAPTCHA score too low.' }
  }

  return { ok: true }
}
