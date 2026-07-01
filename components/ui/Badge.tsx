// components/ui/Badge.tsx
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'blue' | 'purple' | 'green' | 'warn' | 'error' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-ds-surface   border-ds-border  text-ds-muted',
  blue: 'bg-ds-accent/10 border-ds-accent/25 text-ds-accent',
  purple: 'bg-ds-purple/10 border-ds-purple/25 text-ds-purple',
  green: 'bg-ds-success/10 border-ds-success/25 text-ds-success',
  warn: 'bg-ds-warning/10 border-ds-warning/25 text-ds-warning',
  error: 'bg-ds-error/10  border-ds-error/25  text-ds-error',
  muted: 'bg-ds-text/5    border-ds-text/10   text-ds-muted',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-ds-muted',
  blue: 'bg-ds-accent',
  purple: 'bg-ds-purple',
  green: 'bg-ds-success',
  warn: 'bg-ds-warning',
  error: 'bg-ds-error',
  muted: 'bg-ds-muted',
}

const sizeStyles = {
  sm: 'text-[10px] px-2   py-[3px] gap-1.5',
  md: 'text-[11px] px-3   py-[5px] gap-1.5',
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-medium',
        'rounded-pill border tracking-wide',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
