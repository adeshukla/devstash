'use client'

import { useEffect, useState, type ReactNode } from 'react'

const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

/**
 * Mounts children on the first user interaction, or after `fallbackMs`,
 * whichever comes first. Keeps third-party analytics scripts out of the load
 * window so they cannot add to Total Blocking Time.
 */
export function AfterInteraction({
  children,
  fallbackMs = 2000,
}: {
  children: ReactNode
  fallbackMs?: number
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const go = () => setReady(true)
    const timer = setTimeout(go, fallbackMs)
    EVENTS.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }))
    return () => {
      clearTimeout(timer)
      EVENTS.forEach((e) => window.removeEventListener(e, go))
    }
  }, [fallbackMs])

  return ready ? <>{children}</> : null
}
