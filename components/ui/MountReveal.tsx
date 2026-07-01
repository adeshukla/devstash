'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface MountRevealProps {
  children: ReactNode
  /** Delay before the reveal animation starts, in milliseconds. */
  delay?: number
  className?: string
}

/**
 * Fades + slides its children in once on mount — the same `.reveal` CSS as
 * `Reveal`, but triggered by a mount timer instead of IntersectionObserver.
 * For above-the-fold content (hero, page headers) that's already in the
 * viewport on load, so a scroll trigger would never fire.
 */
export function MountReveal({ children, delay = 0, className }: MountRevealProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Next tick, not immediate — lets the initial (pre-reveal) styles paint
    // first so the transition actually has something to animate from.
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className={cn('reveal', visible && 'is-visible', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
