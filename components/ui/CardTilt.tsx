'use client'

import { useRef, type ReactNode, type MouseEvent } from 'react'

interface CardTiltProps {
  children: ReactNode
  className?: string
}

/**
 * Subtle perspective tilt tracking the cursor position within the card,
 * layered on top of the existing `card-glow` lift+shadow hover. Resets on
 * mouse leave. A no-op under prefers-reduced-motion.
 */
export function CardTilt({ children, className }: CardTiltProps) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.setProperty('--tilt-x', `${(-py * 6).toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${(px * 6).toFixed(2)}deg`)
  }

  function handleLeave() {
    ref.current?.style.setProperty('--tilt-x', '0deg')
    ref.current?.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{
        transform: 'perspective(800px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
        transition: 'transform 0.15s ease-out',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
