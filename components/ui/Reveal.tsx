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
  /** Delay before the arrival animation starts, in milliseconds. */
  delay?: number
  /** Element/landmark to render as. Defaults to 'div'. */
  as?: ElementType
  /** Replay the arrival every time it comes back into view (it resets once
   *  fully off screen). Default: once per page load. */
  repeat?: boolean
}

/**
 * Marks its children `.is-visible` the first time they scroll into view,
 * which plays a short settle (`.reveal` in globals.css) and lets children
 * key their own arrival moments off it (e.g. the automation strip).
 *
 * Content is NEVER hidden while waiting: an earlier version clipped it to
 * zero width until the observer fired, and Chrome's IntersectionObserver
 * reports an element clipped to zero area as not intersecting — so it never
 * fired and whole sections (the contact form) stayed blank. Arrival only adds
 * motion; if JS is slow, broken or scrolled past, the content is already there.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  repeat = false,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.intersectionRatio >= 0.15) {
          setVisible(true)
          if (!repeat) observer.disconnect()
        } else if (repeat && !entry.isIntersecting) {
          setVisible(false)
        }
      },
      { threshold: [0, 0.15] }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [repeat])

  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
