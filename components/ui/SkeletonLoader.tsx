// components/ui/SkeletonLoader.tsx
import { cn } from '@/lib/utils/cn'

// ── Base skeleton pulse ───────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('bg-ds-surface2 animate-pulse rounded', className)} />
  )
}

// ── Card skeleton ─────────────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading..."
      className={cn('bg-ds-surface border-ds-border rounded-card border p-6', className)}
    >
      <Skeleton className="mb-5 h-40 w-full rounded-lg" />
      <Skeleton className="mb-3 h-4 w-3/4" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-5 h-3 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="rounded-pill h-5 w-16" />
        <Skeleton className="rounded-pill h-5 w-20" />
      </div>
    </div>
  )
}

// ── Blog card skeleton ────────────────────────────────────────
export function BlogCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading..."
      className={cn(
        'bg-ds-surface border-ds-border rounded-card overflow-hidden border',
        className
      )}
    >
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="rounded-pill mb-3 h-3 w-20" />
        <Skeleton className="mb-2 h-5 w-full" />
        <Skeleton className="mb-4 h-5 w-4/5" />
        <Skeleton className="mb-2 h-3 w-full" />
        <Skeleton className="mb-5 h-3 w-3/4" />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="rounded-pill h-4 w-14" />
            <Skeleton className="rounded-pill h-4 w-18" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

// ── Text skeleton ─────────────────────────────────────────────
export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-busy="true" aria-label="Loading..." className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

export { Skeleton }
