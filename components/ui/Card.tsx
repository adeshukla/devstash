// components/ui/Card.tsx
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

type CardVariant = 'default' | 'hover' | 'accent'

interface CardProps {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
  onClick?: () => void
  as?: 'div' | 'article' | 'section' | 'li'
}

// shadow-black/5 (light) + shadow-black/20 (dark via the CSS below) gives every
// card real edge definition instead of relying solely on the border token,
// which is too close to the surface color to read as a boundary on its own —
// especially in light mode where border + surface + bg sit close together.
// Every variant uses the animated accent→purple gradient border
// (.gradient-border-animated in globals.css) instead of a flat border color.
const variantStyles: Record<CardVariant, string> = {
  default: 'bg-ds-surface gradient-border-animated shadow-sm',
  hover: ['bg-ds-surface gradient-border-animated shadow-sm', 'card-glow cursor-pointer'].join(' '),
  accent: [
    'bg-ds-surface gradient-border-animated shadow-sm',
    'shadow-[0_0_0_1px] shadow-ds-accent/5',
  ].join(' '),
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  onClick,
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'rounded-card overflow-hidden',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </Tag>
  )
}

// ── Sub-components ────────────────────────────────────────────

interface CardHeaderProps {
  className?: string
  children: ReactNode
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return <div className={cn('border-ds-border mb-4 border-b pb-4', className)}>{children}</div>
}

export function CardFooter({ className, children }: CardHeaderProps) {
  return <div className={cn('border-ds-border mt-4 border-t pt-4', className)}>{children}</div>
}
