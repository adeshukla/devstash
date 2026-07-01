'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface MouseParallaxProps {
  children: ReactNode
  /** Max offset in px at the viewport edges. */
  strength?: number
  className?: string
}

/**
 * Subtly offsets its children toward the cursor position, tracked across the
 * whole viewport (not just while hovering this element) so background
 * elements feel alive without requiring a direct hover. rAF-throttled,
 * transform-only (GPU, no layout thrash), and a no-op under
 * prefers-reduced-motion.
 */
export function MouseParallax({ children, strength = 12, className }: MouseParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    function handleMove(e: MouseEvent) {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const dx = e.clientX / window.innerWidth - 0.5
        const dy = e.clientY / window.innerHeight - 0.5
        el!.style.setProperty('--px', `${dx * strength}px`)
        el!.style.setProperty('--py', `${dy * strength}px`)
      })
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [strength])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: 'translate3d(var(--px, 0px), var(--py, 0px), 0)',
        transition: 'transform 0.3s ease-out',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
