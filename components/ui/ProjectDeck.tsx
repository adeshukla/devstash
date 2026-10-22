'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { Button } from './Button'

export interface DeckCard {
  slug: string
  title: string
  /** The project's own colour — tints the card's edge, top bar and glow */
  brandColor: string
  front: ReactNode
  back: ReactNode
}

interface ProjectDeckProps {
  cards: DeckCard[]
  label: string
}

// [x, y, rotate, scale] per stack position. Cards deeper than the last row
// wait under it, hidden (data-buried), so 6 cards still read as one tidy stack.
type Pose = readonly [number, number, number, number]
const REST: readonly Pose[] = [
  [0, 0, 0, 1],
  [18, -14, 5, 0.95],
  [-14, -26, -6, 0.91],
  [6, -38, 3, 0.87],
]
// Fanned out while a mouse is over the deck. x is scaled down on narrow decks.
const FAN: readonly Pose[] = [
  [0, -12, 0, 1.03],
  [-170, 14, -11, 0.9],
  [170, 14, 11, 0.9],
  [0, -44, 0, 0.82],
]
const VISIBLE = REST.length
const THROW_PX = 110 // drag further than this and the card is thrown to the back
const TAP_PX = 6 // moved less than this = a tap, which flips the card
const FLY_MS = 280

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The home page's project "stash": a deck of cards you handle. Mouse over to
 * fan it out, drag the top card away to send it to the back, tap/click it to
 * flip it over. Keyboard: Enter/Space flips, ←/→ cycle; the buttons below do
 * the same for anyone who never discovers the drag.
 *
 * Positions are written straight to the DOM (CSS custom properties), never
 * through React props — a drag updates them every pointermove, and React would
 * otherwise not know to put them back. React only owns structure, order and
 * the flipped state; `layout()` re-applies positions after each change.
 */
export function ProjectDeck({ cards, label }: ProjectDeckProps) {
  const n = cards.length
  const [order, setOrder] = useState(() => cards.map((_, i) => i))
  const [flipped, setFlipped] = useState(false)
  const [fanned, setFanned] = useState(false)
  const [nudging, setNudging] = useState(true)
  const deckRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const drag = useRef<{ x0: number; y0: number; dx: number; dy: number } | null>(null)
  const focusTopAfterMove = useRef(false)

  const layout = useCallback(() => {
    const deck = deckRef.current
    if (!deck) return
    const k = Math.min(1, deck.clientWidth / 680)
    const poses = fanned ? FAN : REST
    order.forEach((ci, pos) => {
      const el = cardRefs.current[ci]
      if (!el) return
      const [x, y, r, s] = poses[Math.min(pos, VISIBLE - 1)]
      el.dataset.state = ''
      el.style.setProperty('--x', `${x * k}px`)
      el.style.setProperty('--y', `${y}px`)
      el.style.setProperty('--r', `${r}deg`)
      el.style.setProperty('--s', String(s))
      el.style.zIndex = String(n - pos)
    })
  }, [order, fanned, n])

  useLayoutEffect(() => {
    layout()
    if (focusTopAfterMove.current) {
      focusTopAfterMove.current = false
      cardRefs.current[order[0]]?.focus()
    }
  }, [layout, order])

  useEffect(() => {
    window.addEventListener('resize', layout)
    return () => window.removeEventListener('resize', layout)
  }, [layout])

  const advance = () => {
    setFlipped(false)
    setOrder((o) => [...o.slice(1), o[0]])
  }

  function next(dir: 1 | -1 = 1) {
    setNudging(false)
    const el = cardRefs.current[order[0]]
    if (!el || reducedMotion()) return advance()
    el.dataset.state = 'flying'
    el.style.setProperty('--x', `${dir * Math.max(560, window.innerWidth * 0.6)}px`)
    el.style.setProperty('--r', `${dir * 26}deg`)
    window.setTimeout(advance, FLY_MS)
  }

  function prev() {
    setNudging(false)
    setFlipped(false)
    setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)])
  }

  function flip() {
    setNudging(false)
    setFlipped((f) => !f)
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as HTMLElement).closest('a, button')) return
    drag.current = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.dataset.state = 'dragging'
    setNudging(false)
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    d.dx = e.clientX - d.x0
    d.dy = e.clientY - d.y0
    const el = e.currentTarget
    el.style.setProperty('--x', `${d.dx}px`)
    el.style.setProperty('--y', `${d.dy * 0.6}px`)
    el.style.setProperty('--r', `${d.dx * 0.07}deg`)
  }

  function onPointerUp() {
    const d = drag.current
    if (!d) return
    drag.current = null
    if (Math.hypot(d.dx, d.dy) < TAP_PX) {
      flip()
      layout()
    } else if (Math.abs(d.dx) > THROW_PX) {
      next(d.dx > 0 ? 1 : -1)
    } else {
      layout()
    }
  }

  // Lost capture without a pointerup (OS gesture, alt-tab, the browser taking
  // over a scroll) — put the card back instead of leaving it mid-air.
  function onPointerCancel() {
    if (!drag.current) return
    drag.current = null
    layout()
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      flip()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusTopAfterMove.current = true
      next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusTopAfterMove.current = true
      prev()
    }
  }

  const top = cards[order[0]]

  return (
    <div>
      <div
        ref={deckRef}
        className="deck"
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        data-nudging={nudging || undefined}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setFanned(true)}
        onPointerLeave={() => !drag.current && setFanned(false)}
      >
        {cards.map((card, i) => {
          const pos = order.indexOf(i)
          const isTop = pos === 0
          const [x, y, r, s] = REST[Math.min(i, VISIBLE - 1)]
          return (
            <div
              key={card.slug}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              className="deck-card focus-visible:outline-ds-accent rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-4"
              // Initial pose only (static, so React never re-applies it over
              // a drag) — gives the server render a real stack before JS.
              style={
                {
                  '--x': `${x}px`,
                  '--y': `${y}px`,
                  '--r': `${r}deg`,
                  '--s': s,
                  '--brand': card.brandColor,
                  zIndex: n - i,
                } as CSSProperties
              }
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}: ${card.title}`}
              tabIndex={isTop ? 0 : -1}
              inert={!isTop}
              data-top={isTop || undefined}
              data-buried={pos >= VISIBLE || undefined}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onLostPointerCapture={onPointerCancel}
              onKeyDown={onKeyDown}
            >
              <div className="deck-wob">
                <div className="deck-inner" data-flipped={(isTop && flipped) || undefined}>
                  <div className="deck-face" inert={isTop && flipped}>
                    {card.front}
                  </div>
                  <div className="deck-face deck-back" inert={!(isTop && flipped)}>
                    {card.back}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="ghost" size="sm" onClick={prev}>
          <span aria-hidden="true">←</span> Back
        </Button>
        <p className="text-ds-muted min-w-16 text-center font-mono text-sm" aria-live="polite">
          <span className="sr-only">{top.title}, </span>
          {pad(order[0] + 1)} / {pad(n)}
        </p>
        <Button variant="outline" size="sm" onClick={flip}>
          {flipped ? 'Front' : 'Flip'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => next()}>
          Next <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  )
}
