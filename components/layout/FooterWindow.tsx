'use client'

import { useEffect, useState } from 'react'

// The footer room's window onto Ghaziabad: the sky follows the real local
// time (IST), with a caption saying what time it is there. Scene colours, not
// UI tokens — like the Lottie's own artwork, they illustrate a sky.
type Phase = 'dawn' | 'day' | 'dusk' | 'night'
const SKY: Record<
  Phase,
  {
    sky: string
    orb: string
    ox: string
    oy: string
    stars: number
    city: string
    lit: string
    note: string
  }
> = {
  dawn: {
    sky: 'linear-gradient(#fbcfe8, #fed7aa 70%)',
    orb: '#fde68a',
    ox: '60%',
    oy: '52%',
    stars: 0,
    city: '#475569',
    lit: '#fde68a',
    note: 'first coffee',
  },
  day: {
    sky: 'linear-gradient(#7dd3fc, #bae6fd 70%)',
    orb: '#fde047',
    ox: '62%',
    oy: '16%',
    stars: 0,
    city: '#64748b',
    lit: '#cbd5e1',
    note: 'at the desk',
  },
  dusk: {
    sky: 'linear-gradient(#6366f1, #f97316 80%)',
    orb: '#fb923c',
    ox: '22%',
    oy: '48%',
    stars: 0.25,
    city: '#1e293b',
    lit: '#fde68a',
    note: 'winding down',
  },
  night: {
    sky: 'linear-gradient(#0b1026, #1e1b4b 80%)',
    orb: '#e2e8f0',
    ox: '68%',
    oy: '14%',
    stars: 1,
    city: '#0f172a',
    lit: '#fbbf24',
    note: 'probably still coding',
  },
}
const HOUR = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  hourCycle: 'h23',
})
const CLOCK = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
})

function phaseAt(date: Date): Phase {
  const h = Number(HOUR.format(date))
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 19) return 'dusk'
  return 'night'
}

export function FooterWindow() {
  // Server render has no "now" for the visitor, so it shows night with no
  // clock; the real sky and time fill in after mount and every 30s.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 30_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  const phase = now ? phaseAt(now) : 'night'
  const s = SKY[phase]

  return (
    <div>
      <div
        aria-hidden="true"
        className="footer-window"
        style={
          {
            '--sky': s.sky,
            '--orb': s.orb,
            '--ox': s.ox,
            '--oy': s.oy,
            '--stars': s.stars,
            '--city': s.city,
            '--lit': s.lit,
          } as React.CSSProperties
        }
      >
        <span className="footer-window-stars" />
        <span className="footer-window-orb" />
        <svg className="footer-window-city" viewBox="0 0 200 76" preserveAspectRatio="none">
          <path d="M0 76V44h14V30h12v18h10V36h16v40zM52 76V22h18v54zM70 76V40h12V28h14v48zM96 76V46h10V34h20v42zM126 76V24h14v52zM140 76V38h16v-8h12v46zM168 76V42h12V32h20v44z" />
          <g className="lit">
            <rect x="56" y="30" width="4" height="4" />
            <rect x="62" y="40" width="4" height="4" />
            <rect x="129" y="32" width="4" height="4" />
            <rect x="133" y="44" width="4" height="4" />
            <rect x="100" y="52" width="4" height="4" />
            <rect x="172" y="50" width="4" height="4" />
            <rect x="18" y="38" width="4" height="4" />
          </g>
        </svg>
      </div>
      <p className="text-ds-muted mt-2.5 font-mono text-[12.5px]">
        {now ? (
          <>
            <span className="text-ds-text">{CLOCK.format(now)}</span> in Ghaziabad · {s.note}
          </>
        ) : (
          'Ghaziabad, India'
        )}
      </p>
    </div>
  )
}
