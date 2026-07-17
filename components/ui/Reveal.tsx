'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Delay before the reveal animation starts, in milliseconds. */
  delay?: number
  /** Element/landmark to render as. Defaults to 'div'. */
  as?: ElementType
}

/**
 * Fades + slides its children into view once on scroll (IntersectionObserver).
 * Content is always in the DOM (only visually animated), and users with
 * `prefers-reduced-motion` see it immediately via the `.reveal` CSS guard.
 */
export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // No IntersectionObserver (or SSR) → just show it.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        }
      },
      // A section that starts a few px below the fold was staying invisible
      // until the user scrolled it 8-12% into view — read as "page still
      // loading" rather than a scroll animation. Trigger the moment any
      // sliver crosses the viewport (and slightly before, via the positive
      // bottom margin) so content already close to the fold isn't hidden.
      { threshold: 0.01, rootMargin: '0px 0px 120px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
