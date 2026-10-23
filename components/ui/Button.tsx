// components/ui/Button.tsx
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  className?: string
  children: ReactNode
  // When href is provided, renders as <Link>
  href?: string
  target?: string
  rel?: string
  download?: boolean | string
  'data-analytics-event'?: string
  // Button-specific
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

// ── Style maps ────────────────────────────────────────────────

// Solid brand buttons: hover only changes colour — no lift, shine, glow or
// gradient (those read as template styling). Primary uses --color-ds-cta,
// not the accent: white on the accent blue fails WCAG AA (3.7:1).
const variantStyles: Record<Variant, string> = {
  primary: 'bg-ds-cta hover:bg-ds-cta-hover text-white disabled:opacity-50',
  ghost: [
    'bg-transparent text-ds-muted border border-ds-border',
    'hover:border-ds-accent hover:text-ds-accent',
    'disabled:opacity-50',
  ].join(' '),
  danger: 'bg-ds-error hover:bg-ds-error/90 text-white disabled:opacity-50',
  outline: [
    'bg-transparent text-ds-text border border-ds-border2',
    'hover:border-ds-text',
    'disabled:opacity-50',
  ].join(' '),
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8  px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-10 px-5 text-[14px] gap-2   rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl',
}

// ── Spinner ───────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  className,
  children,
  href,
  target,
  rel,
  download,
  'data-analytics-event': analyticsEvent,
  type = 'button',
  onClick,
}: ButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center font-medium select-none transition-colors duration-150',
    'aria-disabled:pointer-events-none disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ds-bg',
    'disabled:cursor-not-allowed',
    variantStyles[variant],
    sizeStyles[size],
    className
  )

  const inner = (
    <>
      {loading ? <Spinner /> : iconLeft && <span aria-hidden="true">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && !loading && <span aria-hidden="true">{iconRight}</span>}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        download={download}
        data-analytics-event={analyticsEvent}
        className={base}
        aria-disabled={disabled}
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={base}
      aria-busy={loading}
    >
      {inner}
    </button>
  )
}
