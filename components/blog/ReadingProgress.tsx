'use client'

import { useEffect, useState } from 'react'

/**
 * A thin blue→purple bar fixed to the top of the viewport that fills as the
 * reader scrolls through the article. Decorative (aria-hidden); no layout cost.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement
      const scrollable = el.scrollHeight - el.clientHeight
      const pct = scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0
      setProgress(Math.min(100, Math.max(0, pct)))
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
      <div
        className="h-full origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          transition: 'transform 80ms linear',
        }}
      />
    </div>
  )
}
