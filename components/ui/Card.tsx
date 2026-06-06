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

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-ds-surface border border-ds-border',
  hover: [
    'bg-ds-surface border border-ds-border',
    'cursor-pointer transition-colors duration-200',
    'hover:border-ds-accent/50',
  ].join(' '),
  accent: [
    'bg-ds-surface border border-ds-accent/25',
    'shadow-[0_0_0_1px_rgba(59,130,246,0.05)]',
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
