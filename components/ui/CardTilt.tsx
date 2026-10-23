'use client'

import {
  useRef,
  useEffect,
  useState,
  type ReactNode,
  type MouseEvent,
  type TouchEvent,
} from 'react'

interface CardTiltProps {
  children: ReactNode
  className?: string
}

// How long the glow stays visible after a tap, since touch has no hover to
// hold it open — long enough to actually register as an effect, short
// enough not to linger once attention has moved on.
const TOUCH_GLOW_MS = 900
// Max rotation in degrees. Went 6 (too jittery/wrong-direction) → 3 (read as
// "broken", under the threshold most people register on a quick hover) → 5
// → 8: an actually confident tilt, paired with a long (1400px) perspective
// distance so the corners stay believable instead of fisheye-ing.
const MAX_TILT_DEG = 8
// Fraction of the remaining distance to target closed per animation frame.
// This IS the easing — there's deliberately no CSS transition on transform
// alongside it, since two independent easings racing each other is exactly
// what read as "glitchy": the CSS transition would keep retargeting to a
// slightly-stale value every mousemove tick, producing a visible stutter on
// fast cursor movement. A single RAF-driven lerp is smooth at any speed and
// self-corrects if a mouseleave is ever missed (rare browser quirk when the
// cursor exits two adjacent cards in the same frame). 0.22 (up from an
// initial 0.15) closes the gap fast enough to feel responsive on a quick
// hover rather than always lagging a beat behind the cursor.
const LERP = 0.22
const SETTLE_EPSILON = 0.01

// ── Scroll-centered touch glow ──────────────────────────────────
// Touch has no hover, and requiring a tap to see the glow at all means most
// cards on a scrolled-through grid never show it. This makes scroll itself
// the trigger: as the user scrolls, whichever card's center is nearest the
// viewport's vertical center gets the same [data-touched] glow a tap gives —
// one card "lit" at a time, handing off to the next as it passes through,
// like a spotlight following the scroll. Module-scope (not per-instance)
// because "only one active at a time" is inherently a cross-card decision —
// each CardTilt registers its element + setter here and a single shared
// scroll listener (rAF-throttled, one getBoundingClientRect pass per frame)
// picks the winner and flips exactly two setters: the old active off, the
// new one on.
const centeredRegistry = new Map<HTMLElement, (active: boolean) => void>()
let centeredActive: HTMLElement | null = null
let centeredRaf: number | undefined
let centeredListenerAttached = false

function isCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

function recomputeCentered() {
  centeredRaf = undefined
  const viewportH = window.innerHeight
  const viewportCenter = viewportH / 2
  let winner: HTMLElement | null = null
  let winnerDist = Infinity
  for (const el of centeredRegistry.keys()) {
    const rect = el.getBoundingClientRect()
    if (rect.height === 0 || rect.bottom <= 0 || rect.top >= viewportH) continue
    const dist = Math.abs(rect.top + rect.height / 2 - viewportCenter)
    if (dist < winnerDist) {
      winnerDist = dist
      winner = el
    }
  }
  if (winner === centeredActive) return
  if (centeredActive) centeredRegistry.get(centeredActive)?.(false)
  centeredActive = winner
  if (centeredActive) centeredRegistry.get(centeredActive)?.(true)
}

function scheduleCenteredRecompute() {
  if (centeredRaf !== undefined) return
  centeredRaf = requestAnimationFrame(recomputeCentered)
}

/**
 * Subtle perspective tilt tracking the cursor position within the card,
 * layered on top of the existing `card-glow` lift+shadow hover. Also writes
 * --spot-x/--spot-y (cursor position as a percentage) for `.card-spotlight`
 * (see globals.css) — the same pointer math already running here, so the
 * cursor-tracking border glow doesn't need its own listener. A no-op under
 * prefers-reduced-motion.
 *
 * Tilt direction follows the standard "tilt card toward cursor" convention
 * (vanilla-tilt.js etc): the corner nearest the cursor lifts toward the
 * viewer. rotateX tracks vertical offset directly, rotateY tracks horizontal
 * offset inverted — getting either sign backwards is what makes a tilt
 * effect feel "wrong" in some directions even though nothing is throwing an
 * error.
 *
 * Touch devices have no cursor to track, so `:hover` never meaningfully
 * fires there — without this, every card would render completely inert on
 * mobile. On tap, this sets the glow's origin to the touch point and shows
 * it via `data-touched` (the CSS can't rely on `:hover` for this) for
 * TOUCH_GLOW_MS, then lets it fade — a deliberate, felt moment rather than
 * a silent no-op. No tilt on touch: a drag gesture on a touchscreen is
 * scrolling, not "tilt the card", and fighting that would feel broken.
 *
 * Beyond a direct tap, `data-touched` also lights up automatically as the
 * user scrolls past — see the scroll-centered registry above. Same
 * attribute, same CSS, so the two triggers (tap vs. scroll) are visually
 * identical; only how they get set differs.
 */
export function CardTilt({ children, className }: CardTiltProps) {
  const ref = useRef<HTMLDivElement>(null)
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [touched, setTouched] = useState(false)
  const [scrollCentered, setScrollCentered] = useState(false)

  const target = useRef({ tiltX: 0, tiltY: 0, spotX: 50, spotY: 50 })
  const current = useRef({ tiltX: 0, tiltY: 0, spotX: 50, spotY: 50 })
  const rafId = useRef<number | undefined>(undefined)

  function tick() {
    const el = ref.current
    if (!el) {
      rafId.current = undefined
      return
    }
    const c = current.current
    const t = target.current
    c.tiltX += (t.tiltX - c.tiltX) * LERP
    c.tiltY += (t.tiltY - c.tiltY) * LERP
    c.spotX += (t.spotX - c.spotX) * LERP
    c.spotY += (t.spotY - c.spotY) * LERP

    el.style.setProperty('--tilt-x', `${c.tiltX.toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${c.tiltY.toFixed(2)}deg`)
    el.style.setProperty('--spot-x', `${c.spotX.toFixed(1)}%`)
    el.style.setProperty('--spot-y', `${c.spotY.toFixed(1)}%`)

    const atRest =
      Math.abs(t.tiltX) < SETTLE_EPSILON &&
      Math.abs(t.tiltY) < SETTLE_EPSILON &&
      Math.abs(t.tiltX - c.tiltX) < SETTLE_EPSILON &&
      Math.abs(t.tiltY - c.tiltY) < SETTLE_EPSILON

    if (atRest) {
      rafId.current = undefined
      return
    }
    rafId.current = requestAnimationFrame(tick)
  }

  function ensureLoop() {
    if (rafId.current === undefined) {
      rafId.current = requestAnimationFrame(tick)
    }
  }

  useEffect(
    () => () => {
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current)
    },
    []
  )

  // Register/unregister with the shared scroll-centered tracker. Desktop
  // (a real hover pointer present) and reduced-motion both opt out entirely —
  // this is purely a touch stand-in for :hover, not a thing every device
  // needs running on scroll.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!isCoarsePointer()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    centeredRegistry.set(el, setScrollCentered)
    if (!centeredListenerAttached) {
      centeredListenerAttached = true
      window.addEventListener('scroll', scheduleCenteredRecompute, { passive: true })
      window.addEventListener('resize', scheduleCenteredRecompute, { passive: true })
    }
    scheduleCenteredRecompute()

    return () => {
      centeredRegistry.delete(el)
      if (centeredActive === el) centeredActive = null
      scheduleCenteredRecompute()
    }
  }, [])

  function setSpotTarget(el: HTMLDivElement, clientX: number, clientY: number) {
    const rect = el.getBoundingClientRect()
    const px = (clientX - rect.left) / rect.width - 0.5
    const py = (clientY - rect.top) / rect.height - 0.5
    target.current.spotX = (px + 0.5) * 100
    target.current.spotY = (py + 0.5) * 100
    return { px, py }
  }

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const { px, py } = setSpotTarget(el, e.clientX, e.clientY)
    target.current.tiltX = py * MAX_TILT_DEG
    target.current.tiltY = -px * MAX_TILT_DEG
    ensureLoop()
  }

  function handleLeave() {
    target.current.tiltX = 0
    target.current.tiltY = 0
    ensureLoop()
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    const el = ref.current
    const touch = e.touches[0]
    if (!el || !touch) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    setSpotTarget(el, touch.clientX, touch.clientY)
    // Snap instantly rather than lerping in — a tap has no preceding
    // pointer motion to ease from, so easing here would just read as lag.
    current.current.spotX = target.current.spotX
    current.current.spotY = target.current.spotY
    ensureLoop()
    setTouched(true)
    window.clearTimeout(touchTimer.current)
    touchTimer.current = setTimeout(() => setTouched(false), TOUCH_GLOW_MS)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onPointerLeave={handleLeave}
      onTouchStart={handleTouchStart}
      className={className}
      data-touched={touched || scrollCentered || undefined}
      style={{
        transform: 'perspective(1400px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
