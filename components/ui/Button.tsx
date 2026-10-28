// components/ui/Button.tsx
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'outline' | 'resume'
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

// Solid brand colours, no gradient/shine/glow (those read as template
// styling). Life comes from `.keycap` (globals.css): a darker bottom edge, a
// 1px lift on hover and a press on click, like a real key. Primary uses
// --color-ds-cta, not the accent: white on the accent blue fails AA (3.7:1).
const variantStyles: Record<Variant, string> = {
  primary:
    'keycap [--edge:var(--color-ds-cta-edge)] bg-ds-cta hover:bg-ds-cta-hover text-white disabled:opacity-50',
  // Hover keeps the keycap whole: the bottom edge (--edge) takes the same
  // colour as the hover border. A border that changed alone (blue on ghost,
  // full text-colour on outline) sat on a still-grey ledge and read as a box
  // on a shelf.
  ghost: [
    'keycap bg-transparent text-ds-muted border border-ds-border',
    'hover:border-ds-accent/70 hover:text-ds-accent-strong hover:bg-ds-accent/5',
    'hover:[--edge:color-mix(in_srgb,var(--color-ds-accent)_55%,var(--color-ds-border2))]',
    'disabled:opacity-50',
  ].join(' '),
  danger: [
    'keycap [--edge:color-mix(in_srgb,var(--color-ds-error)_60%,black)]',
    'bg-ds-error hover:bg-ds-error/90 text-white disabled:opacity-50',
  ].join(' '),
  // Every résumé download (nav, mobile nav, home CTA, /about): accent-tinted
  // so it stands out from outline/ghost buttons, but not a solid fill, so the
  // Contact CTA stays the one primary action. .resume-btn drops the download
  // icon once on hover (globals.css).
  resume: [
    'keycap resume-btn border-[1.5px] border-ds-accent/45 text-ds-accent-strong font-semibold',
    'bg-[color-mix(in_srgb,var(--color-ds-accent)_14%,var(--color-ds-surface2))]',
    '[--edge:color-mix(in_srgb,var(--color-ds-accent)_45%,var(--color-ds-border2))]',
    'hover:border-ds-accent/80 hover:bg-[color-mix(in_srgb,var(--color-ds-accent)_18%,var(--color-ds-surface2))]',
    'disabled:opacity-50',
  ].join(' '),
  outline: [
    'keycap bg-ds-surface2 text-ds-text border border-ds-border2',
    'hover:bg-[color-mix(in_srgb,var(--color-ds-text)_6%,var(--color-ds-surface2))]',
    'hover:border-[color-mix(in_srgb,var(--color-ds-text)_28%,var(--color-ds-border2))]',
    'hover:[--edge:color-mix(in_srgb,var(--color-ds-text)_28%,var(--color-ds-border2))]',
    'disabled:opacity-50',
  ].join(' '),
}

const sizeStyles: Record<Size, string> = {
  sm: 'min-h-8 px-3 py-1 text-[13px] gap-1.5 rounded-md',
  md: 'min-h-10 px-5 py-2 text-[14px] gap-2 rounded-lg',
  lg: 'min-h-12 px-6 py-2.5 text-[15px] gap-2.5 rounded-xl',
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
    'inline-flex items-center justify-center text-center font-medium select-none transition-colors duration-150',
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
    // A file download isn't a route: a plain <a>, so next/link doesn't prefetch
    // the PDF as a page (the nav résumé button is on screen on every page).
    const Anchor = download ? 'a' : Link
    return (
      <Anchor
        href={href}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        download={download}
        data-analytics-event={analyticsEvent}
        className={base}
        aria-disabled={disabled}
      >
        {inner}
      </Anchor>
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
