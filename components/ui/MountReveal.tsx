import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface MountRevealProps {
  children: ReactNode
  /** Delay before the reveal animation starts, in milliseconds. */
  delay?: number
  className?: string
}

/**
 * Fades + slides its children in once at first paint — for above-the-fold
 * content (hero, page headers) that's already in the viewport on load.
 *
 * Pure CSS (`animate-fade-up`) rather than a JS mount trigger on purpose:
 * content wrapped in this is usually the page's LCP element, and the previous
 * hydration-gated version (`.reveal` + useEffect) kept it at opacity 0 until
 * the whole JS bundle loaded — a measured 5.5s mobile LCP on the homepage
 * hero. A CSS animation starts the moment styles apply, with no JS in the
 * critical path; reduced-motion users see the content immediately.
 */
export function MountReveal({ children, delay = 0, className }: MountRevealProps) {
  return (
    <div
      className={cn('animate-fade-up motion-reduce:animate-none', className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
