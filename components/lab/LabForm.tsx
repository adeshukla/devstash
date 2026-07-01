'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Input } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

type FormType = 'saas-trial' | 'marketing-audit' | 'real-estate'

interface LabFormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
  autoComplete?: string
  validate: (value: string) => string | undefined
}

// Field/validator definitions live here, not passed as props — Server
// Component pages can't pass functions (like `validate`) across the boundary
// to a Client Component, so each form's fields are looked up by formType.
const FIELD_CONFIGS: Record<FormType, LabFormField[]> = {
  'saas-trial': [
    {
      name: 'email',
      label: 'Work email',
      type: 'email',
      placeholder: 'you@company.com',
      autoComplete: 'email',
      validate: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : 'Enter a valid email address.',
    },
  ],
  'marketing-audit': [
    {
      name: 'url',
      label: 'Website URL',
      type: 'url',
      placeholder: 'https://yourbusiness.com',
      validate: (v) => {
        try {
          new URL(v)
          return undefined
        } catch {
          return 'Enter a full URL, including https://'
        }
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@company.com',
      autoComplete: 'email',
      validate: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : 'Enter a valid email address.',
    },
  ],
  'real-estate': [
    {
      name: 'name',
      label: 'Full name',
      type: 'text',
      placeholder: 'Full name',
      autoComplete: 'name',
      validate: (v) => (v.trim().length >= 2 ? undefined : 'Enter your full name.'),
    },
    {
      name: 'phone',
      label: 'Phone number',
      type: 'tel',
      placeholder: 'Phone number',
      autoComplete: 'tel',
      validate: (v) => (v.trim().length >= 7 ? undefined : 'Enter a valid phone number.'),
    },
  ],
}

interface LabFormProps {
  formType: FormType
  submitLabel: string
  loadingLabel: string
  successTitle: string
  successNote: string
  /** Tailwind color token driving the button + focus ring (matches each page's accent). */
  accent?: 'accent' | 'purple'
  layout?: 'row' | 'stack'
  className?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

/**
 * Shared, working submit-to-email form for the /lab sample landing pages.
 * Real client-side validation + a real POST to /api/lab (Resend), same
 * pattern as components/contact/ContactForm.tsx — these are demo products,
 * but the form itself is not a mockup.
 */
export function LabForm({
  formType,
  submitLabel,
  loadingLabel,
  successTitle,
  successNote,
  accent = 'accent',
  layout = 'row',
  className,
}: LabFormProps) {
  const fields = FIELD_CONFIGS[formType]
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, '']))
  )

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const errors: Record<string, string> = {}
    for (const field of fields) {
      const msg = field.validate(values[field.name] ?? '')
      if (msg) errors[field.name] = msg
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType, ...values }),
      })
      const data = (await res.json()) as { message?: string; error?: string }

      if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')

      setStatus('success')
      setValues(Object.fromEntries(fields.map((f) => [f.name, ''])))
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  const accentBg = accent === 'purple' ? 'bg-ds-purple' : 'bg-ds-accent'
  const accentRing =
    accent === 'purple' ? 'focus-visible:ring-ds-purple' : 'focus-visible:ring-ds-accent'

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'border-ds-success/30 bg-ds-success/10 flex flex-col items-center gap-2 rounded-xl border px-6 py-8 text-center',
          className
        )}
      >
        <span className="text-3xl" aria-hidden="true">
          ✓
        </span>
        <p className="text-ds-success font-semibold">{successTitle}</p>
        <p className="text-ds-muted text-sm">{successNote}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="text-ds-muted hover:text-ds-text mt-2 text-xs underline-offset-4 hover:underline"
        >
          Submit again
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={cn('flex flex-col gap-3', className)}>
      {status === 'error' && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-ds-error/30 bg-ds-error/10 text-ds-error rounded-lg border px-4 py-2.5 text-sm"
        >
          {errorMessage}
        </div>
      )}

      <div
        className={cn(layout === 'row' ? 'flex flex-col gap-3 sm:flex-row' : 'flex flex-col gap-3')}
      >
        {fields.map((field) => (
          <Input
            key={field.name}
            name={field.name}
            type={field.type}
            label={layout === 'stack' ? field.label : undefined}
            placeholder={field.placeholder ?? field.label}
            autoComplete={field.autoComplete}
            value={values[field.name] ?? ''}
            onChange={handleChange}
            error={fieldErrors[field.name]}
            disabled={isLoading}
            required
            wrapClass={layout === 'row' ? 'flex-1' : undefined}
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          accentBg,
          accentRing,
          'inline-flex h-12 shrink-0 items-center justify-center rounded-xl px-6 text-[15px] font-medium text-white transition-opacity',
          'hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          layout === 'row' && 'sm:w-auto'
        )}
      >
        {isLoading ? loadingLabel : submitLabel}
      </button>
    </form>
  )
}
