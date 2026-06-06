// components/ui/Separator.tsx
import { cn } from '@/lib/utils/cn'

interface SeparatorProps {
  label?: string
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({ label, className, orientation = 'horizontal' }: SeparatorProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('bg-ds-border w-px self-stretch', className)}
      />
    )
  }

  if (label) {
    return (
      <div role="separator" className={cn('flex items-center gap-3', className)}>
        <div className="bg-ds-border h-px flex-1" />
        <span className="text-ds-muted font-mono text-[12px]">{label}</span>
        <div className="bg-ds-border h-px flex-1" />
      </div>
    )
  }

  return <hr role="separator" className={cn('bg-ds-border h-px border-none', className)} />
}
