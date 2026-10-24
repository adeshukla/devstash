'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils/cn'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Delay before the reveal animation starts, in milliseconds. */
  delay?: number
  /** Element/landmark to render as. Defaults to 'div'. */
  as?: ElementType
  /** Cards: show a dashed spec outline with this label before the content
   * wipes in (blueprint → live). Omit for section-sized blocks. */
  blueprint?: string
}

/**
 * Wipes its children into view once on scroll (IntersectionObserver) — the
 * site's blueprint → live scroll-in, see `.reveal` in globals.css. Content is
 * always in the DOM (only visually clipped), and `prefers-reduced-motion`
 * shows it immediately via the `.reveal` CSS guard.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  blueprint,
}: RevealProps) {
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
      // Sections trigger the moment a sliver is near the viewport (120px
      // early), so content close to the fold never reads as "still loading".
      // Blueprint cards wait until a third of the card is on screen — the
      // outline is the point, and it would otherwise play off-screen.
      blueprint ? { threshold: 0.35 } : { threshold: 0.01, rootMargin: '0px 0px 120px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [blueprint])

  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      data-blueprint={blueprint}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
