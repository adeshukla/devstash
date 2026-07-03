'use client'

import { useState } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import { trackAndLog, ANALYTICS_EVENTS } from '@/lib/analytics/events'

// reCAPTCHA v3 (invisible) — the <Script> tag that loads the widget lives on
// the contact page itself (mounts regardless of this form's internal state);
// this just reads the already-loaded window.grecaptcha at submit time.
// Resolves to undefined when no site key is configured yet, or the script
// hasn't loaded — verifyRecaptcha() server-side no-ops in that case too.
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
const RECAPTCHA_ACTION = 'contact_form'

async function getRecaptchaToken(): Promise<string | undefined> {
  if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined' || !window.grecaptcha) {
    return undefined
  }
  return new Promise((resolve) => {
    window.grecaptcha!.ready(() => {
      window
        .grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION })
        .then(resolve)
        .catch(() => resolve(undefined))
    })
  })
}

interface FormState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
}

interface FieldErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

function validateForm(data: {
  name: string
  email: string
  subject: string
  message: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.name.trim() || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!data.email.trim() || !emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!data.subject.trim() || data.subject.trim().length < 4) {
    errors.subject = 'Subject must be at least 4 characters.'
  }

  if (!data.message.trim() || data.message.trim().length < 20) {
    errors.message = 'Message must be at least 20 characters.'
  }

  return errors
}

export function ContactForm() {
  const [formState, setFormState] = useState<FormState>({
    status: 'idle',
    message: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [values, setValues] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const isLoading = formState.status === 'loading'
  const isSuccess = formState.status === 'success'

  // ── Separate typed handlers for Input vs Textarea ──────────────
  function updateField(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateField(e.target.name as keyof typeof values, e.target.value)
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    updateField(e.target.name as keyof typeof values, e.target.value)
  }

  // ── Submit ──────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const errors = validateForm(values)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFormState({ status: 'loading', message: '' })

    try {
      const recaptchaToken = await getRecaptchaToken()
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, recaptchaToken }),
      })

      const data = (await res.json()) as { message?: string; error?: string }

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }

      setFormState({
        status: 'success',
        message: data.message ?? "Message sent! I'll get back to you soon.",
      })
      setValues({ name: '', email: '', subject: '', message: '' })
      // Conversion event — fire only on confirmed success. No PII (no email/
      // message content); only a non-identifying source label. Also writes a
      // server-side visit log via /api/track.
      trackAndLog(ANALYTICS_EVENTS.contactFormSubmitted, { form: 'contact' })
    } catch (err) {
      setFormState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    }
  }

  // ── Success state ───────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-ds-success/30 bg-ds-success/10 flex flex-col items-center gap-4 rounded-xl border px-8 py-12 text-center"
      >
        <span className="text-4xl" aria-hidden="true">
          ✓
        </span>
        <p className="text-ds-success text-lg font-semibold">Message sent!</p>
        <p className="text-ds-muted text-sm">{formState.message}</p>
        <Button
          type="button"
          onClick={() => setFormState({ status: 'idle', message: '' })}
          variant="ghost"
          size="sm"
          className="mt-2"
        >
          Send another message
        </Button>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Contact form"
      className="flex flex-col gap-5"
    >
      {/* Error banner */}
      {formState.status === 'error' && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-ds-error/30 bg-ds-error/10 text-ds-error rounded-lg border px-4 py-3 text-sm"
        >
          {formState.message}
        </div>
      )}

      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Input handles its own id via useId() internally */}
        <Input
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={handleInputChange}
          error={fieldErrors.name}
          disabled={isLoading}
          required
          placeholder="Adesh Shukla"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleInputChange}
          error={fieldErrors.email}
          disabled={isLoading}
          required
          placeholder="you@example.com"
        />
      </div>

      {/* Subject */}
      <Input
        label="Subject"
        name="subject"
        type="text"
        value={values.subject}
        onChange={handleInputChange}
        error={fieldErrors.subject}
        disabled={isLoading}
        required
        placeholder="Frontend role, collab, feedback..."
      />

      {/* Message — use Textarea component (same design system, handles own id) */}
      <Textarea
        label="Message"
        name="message"
        rows={6}
        value={values.message}
        onChange={handleTextareaChange}
        error={fieldErrors.message}
        disabled={isLoading}
        required
        placeholder="What's on your mind?"
      />

      <Button
        type="submit"
        size="lg"
        loading={isLoading}
        className="self-start"
        disabled={isLoading}
      >
        {isLoading ? 'Sending…' : 'Send Message'}
      </Button>

      {/* Required by Google's reCAPTCHA terms whenever the badge is hidden
          via CSS (see globals.css) instead of left visible. */}
      {RECAPTCHA_SITE_KEY && (
        <p className="text-ds-muted text-xs">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline hover:text-ds-accent"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline hover:text-ds-accent"
          >
            Terms of Service
          </a>{' '}
          apply.
        </p>
      )}
    </form>
  )
}
