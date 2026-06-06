// components/ui/Input.tsx
'use client'

import { cn } from '@/lib/utils/cn'
import { useId } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

// ── Shared ────────────────────────────────────────────────────
interface FieldWrapperProps {
  id: string
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

function FieldWrapper({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldWrapperProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-ds-text text-[13px] font-medium">
          {label}
          {required && (
            <span className="text-ds-error ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {hint && !error && (
        <p id={hintId} className="text-ds-muted text-[12px]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-ds-error text-[12px]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const baseInput = cn(
  'w-full bg-ds-surface2 text-ds-text text-[14px]',
  'border border-ds-border rounded-lg',
  'px-4 placeholder:text-ds-muted',
  'outline-none transition-colors duration-200',
  'focus:border-ds-accent',
  'disabled:opacity-50 disabled:cursor-not-allowed'
)

const errorInput = 'border-ds-error focus:border-ds-error'

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string
  hint?: string
  error?: string
  wrapClass?: string
}

export function Input({
  label,
  hint,
  error,
  wrapClass,
  className,
  required,
  ...props
}: InputProps) {
  const id = useId()

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapClass}
    >
      <input
        id={id}
        required={required}
        aria-describedby={
          [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') ||
          undefined
        }
        aria-invalid={!!error}
        className={cn(baseInput, 'h-11', error && errorInput, className)}
        {...props}
      />
    </FieldWrapper>
  )
}

// ── Textarea ──────────────────────────────────────────────────
interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label?: string
  hint?: string
  error?: string
  wrapClass?: string
  rows?: number
}

export function Textarea({
  label,
  hint,
  error,
  wrapClass,
  className,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
  const id = useId()

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapClass}
    >
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-describedby={
          [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') ||
          undefined
        }
        aria-invalid={!!error}
        className={cn(baseInput, 'min-h-[100px] resize-y py-3', error && errorInput, className)}
        {...props}
      />
    </FieldWrapper>
  )
}
