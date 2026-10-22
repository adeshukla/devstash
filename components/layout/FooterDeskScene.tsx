'use client'

import { useEffect, useRef } from 'react'

// Footer vignette: a developer walks in with a coffee, sits at the desk,
// leans back, and sips now and then while the steam rises.
//
// Drawn on tokens (desk, chair, shirt) plus the same theme-invariant skin /
// hair / shoe colours as the Lab's character engine (components/lab/
// characterEngine.tsx), so the two read as one illustration style.
//
// Every moving part is a <g> nested in a translated parent, so its CSS
// rotation pivots on the joint at (0,0) — never put a CSS-animated class on
// an element that also has a transform attribute (CSS would replace it).
//
// Without JS, or under reduced motion, the base styles in globals.css show
// the final pose: seated, leaning back, holding the mug. On mount the scene
// is "armed" (rewound to the walk-in start, paused) and plays the first time
// it scrolls into view.
const SKIN = '#c68642'
const HAIR = '#2b2320'
const FACE = '#2a2118'
const SHOE = '#20242e'
const PANTS = '#475569'
const PANTS_BACK = '#3a4556'
const MUG = '#ece4d6'
const COFFEE = '#6b3f1d'
const SCREEN = '#0f1420'

export function FooterDeskScene() {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.dataset.armed = ''
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        el.dataset.play = ''
        io.disconnect()
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <svg
      ref={ref}
      viewBox="0 0 340 139"
      className="desk-scene h-auto w-full max-w-[340px]"
      role="img"
      aria-label="A developer at a desk, leaning back in the chair with a coffee"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Desk */}
      <rect
        x="212"
        y="96"
        width="112"
        height="6"
        rx="2"
        className="fill-ds-surface2 stroke-ds-border2"
      />
      <rect x="219" y="102" width="5" height="36" rx="1.5" className="fill-ds-border2" />
      <rect x="312" y="102" width="5" height="36" rx="1.5" className="fill-ds-border2" />

      {/* Monitor with the >_ mark */}
      <rect x="262" y="82" width="6" height="14" className="fill-ds-border2" />
      <rect x="252" y="93" width="26" height="3" rx="1.5" className="fill-ds-border2" />
      <rect
        x="234"
        y="46"
        width="62"
        height="38"
        rx="4"
        fill={SCREEN}
        className="stroke-ds-border2"
        strokeWidth="1.5"
      />
      <path d="M247 58l8 6.5-8 6.5" className="stroke-ds-accent" strokeWidth="2.6" />
      <rect
        x="259"
        y="68.5"
        width="11"
        height="3"
        rx="1.5"
        className="fill-ds-purple animate-blink"
      />

      {/* Plant */}
      <path
        d="M306 85c-6-3-7-10-4-15 4 3 5 9 4 15zm0 0c5-4 11-4 13-1-3 4-9 4-13 1z"
        className="fill-ds-success/80"
      />
      <path d="M300 85h12l-2 11h-8z" className="fill-ds-border2" />

      {/* Chair: backrest reclines about its pivot when he leans back */}
      <g transform="translate(155 116)">
        <g className="desk-chair-back">
          <rect x="-6" y="-44" width="9" height="44" rx="4.5" className="fill-ds-border2" />
        </g>
      </g>
      <rect x="152" y="112" width="44" height="6" rx="3" className="fill-ds-border2" />
      <rect x="172" y="118" width="4" height="13" className="fill-ds-border2" />
      <path d="M158 133h32" className="stroke-ds-border2" strokeWidth="3" />
      <circle cx="159" cy="136" r="2.4" className="fill-ds-border2" />
      <circle cx="189" cy="136" r="2.4" className="fill-ds-border2" />

      {/* Character — hip at (0,0), facing right */}
      <g className="ch-root">
        <g className="ch-bob">
          {/* Back leg */}
          <g className="ch-leg-b">
            <path d="M0 0v20" stroke={PANTS_BACK} strokeWidth="7" />
            <g transform="translate(0 20)">
              <g className="ch-shin-b">
                <path d="M0 0v21" stroke={PANTS_BACK} strokeWidth="6" />
                <ellipse cx="3" cy="22.5" rx="5.5" ry="2.8" fill={SHOE} />
              </g>
            </g>
          </g>

          <g className="ch-torso">
            {/* Back arm */}
            <g transform="translate(0 -27)">
              <g className="ch-arm-b">
                <path d="M0 0v13" className="stroke-ds-accent" strokeWidth="6" />
                <g transform="translate(0 13)">
                  <path d="M0 0v12" stroke={SKIN} strokeWidth="4.5" />
                </g>
              </g>
            </g>

            <rect x="-8" y="-31" width="17" height="33" rx="8" className="fill-ds-accent" />
            <rect x="-1.5" y="-36" width="5" height="6" rx="2" fill={SKIN} />

            {/* Head pivots on the neck */}
            <g transform="translate(1 -35)">
              <g className="ch-head">
                <circle cx="0" cy="-7.5" r="9" fill={SKIN} />
                <path
                  d="M-9.3-8a9.3 9.3 0 0 1 18.6-1.4c-4-3.4-10.4-3.2-13.5.6-1.2 1.6-2.1 3.4-5.1 3.2z"
                  fill={HAIR}
                />
                <circle className="ch-eye-open" cx="5" cy="-8.5" r="1.15" fill={FACE} />
                <path
                  className="ch-eye-closed"
                  d="M3.8-8.3q1.2.9 2.4 0"
                  stroke={FACE}
                  strokeWidth="0.9"
                />
                <path d="M4.3-4q1.8 1.3 3.5 0" stroke={FACE} strokeWidth="0.9" />
              </g>
            </g>

            {/* Front arm, holding the mug */}
            <g transform="translate(0 -27)">
              <g className="ch-arm-f">
                <path d="M0 0v14" className="stroke-ds-accent" strokeWidth="6" />
                <g transform="translate(0 14)">
                  <g className="ch-fore-f">
                    <path d="M0 0h11" stroke={SKIN} strokeWidth="4.5" />
                    <rect x="10" y="-9" width="9" height="10" rx="1.8" fill={MUG} />
                    <path d="M10-6.5H8.3a2.2 2.2 0 0 0 0 4.4H10" stroke={MUG} strokeWidth="1.6" />
                    <path d="M11-7.8h7" stroke={COFFEE} strokeWidth="1.4" />
                    <circle cx="10.5" cy="-1.5" r="2.5" fill={SKIN} />
                    <g className="coffee-steam stroke-ds-muted" strokeWidth="1.3">
                      <path d="M12.5-11c-1-1.2 1-2 0-3.3s1-1.8 0-2.8" />
                      <path d="M16.5-11c-1-1.2 1-2 0-3.3s1-1.8 0-2.8" />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>

          {/* Front leg */}
          <g className="ch-leg-f">
            <path d="M0 0v20" stroke={PANTS} strokeWidth="7" />
            <g transform="translate(0 20)">
              <g className="ch-shin-f">
                <path d="M0 0v21" stroke={PANTS} strokeWidth="6" />
                <ellipse cx="3" cy="22.5" rx="5.5" ry="2.8" fill={SHOE} />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
