'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type View = 'design' | 'code' | 'live'
const VIEWS: View[] = ['design', 'code', 'live']
const KEYS = ['fast', 'acc', 'last'] as const
const IND_COLOR = {
  fast: 'var(--color-ds-accent)',
  acc: 'var(--color-ds-success)',
  last: 'var(--color-ds-purple)',
}
const SEEN_KEY = 'ds-hero-intro-seen'
const CYCLE_MS = 4200
const RESUME_MS = 6000 // auto-play picks up again after this long without interaction
const INTRO = { toCode: 1300, toLive: 2900 } // design → code → live, first visit only

// WCAG 2 relative-luminance contrast. Tokens can come back as short hex
// (#fff) once the CSS is minified, so expand those first.
const lum = (raw: string) => {
  const hex = raw.length === 4 ? `#${[...raw.slice(1)].map((c) => c + c).join('')}` : raw
  const [r, g, b] = [1, 3, 5].map((n) => {
    const v = parseInt(hex.slice(n, n + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/**
 * Behaviour for the home hero; all markup comes from HeroSection (server).
 * - First visit this session: design → code → live intro over the live hero
 *   (the inline script in HeroSection already raised the design overlay
 *   before first paint). Later visits and reduced motion start on Live.
 * - "View as" switch: Design / Code / Live on demand.
 * - The three words and the evidence panel tabs stay in sync and auto-cycle;
 *   hovering a word or clicking a tab takes over, and auto-play resumes after
 *   RESUME_MS of quiet.
 */
export function HeroStage({
  design,
  code,
  children,
}: {
  design: ReactNode
  code: ReactNode
  children: ReactNode
}) {
  const [view, setView] = useState<View>('live')
  const stage = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const ind = useRef<HTMLSpanElement>(null)
  const viewRef = useRef<View>('live')
  const startCycle = useRef<() => void>(() => {})
  const stopCycle = useRef<() => void>(() => {})

  // Switch indicator follows the selected view
  useEffect(() => {
    viewRef.current = view
    const btn = bar.current?.querySelector<HTMLButtonElement>(`[data-view="${view}"]`)
    if (btn && ind.current) {
      ind.current.style.left = `${btn.offsetLeft}px`
      ind.current.style.width = `${btn.offsetWidth}px`
    }
    if (view === 'live') startCycle.current()
    else stopCycle.current()
  }, [view])

  // Words ↔ tabs ↔ panel views, auto-cycling, live contrast
  useEffect(() => {
    const root = stage.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const panel = root.querySelector<HTMLElement>('.hero-panel')
    const words = [...root.querySelectorAll<HTMLElement>('.hero-w')]
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('.hero-tab')]
    const views = [...root.querySelectorAll<HTMLElement>('.hero-view')]
    const tabInd = root.querySelector<HTMLElement>('.hero-ind')
    let cur = 0
    let timer: number | undefined
    let resume: number | undefined

    const activate = (n: number, fromUser = false) => {
      cur = n
      const k = KEYS[n]
      for (const w of words) {
        w.classList.remove('on')
        if (w.dataset.k === k && !reduced) {
          void w.offsetWidth // restart the animation
          w.classList.add('on')
        }
      }
      tabs.forEach((t) => {
        const on = t.dataset.k === k
        t.setAttribute('aria-selected', String(on))
        t.tabIndex = on ? 0 : -1
        if (on && tabInd) {
          tabInd.style.left = `${t.offsetLeft}px`
          tabInd.style.width = `${t.offsetWidth}px`
          tabInd.style.setProperty('--c', IND_COLOR[k])
          const fill = tabInd.firstElementChild as HTMLElement | null
          if (fill) {
            fill.style.animation = 'none'
            void fill.offsetWidth
            fill.style.animation = ''
          }
        }
      })
      views.forEach((v) => {
        const on = v.dataset.k === k
        v.classList.toggle('on', on)
        v.inert = !on
      })
      if (fromUser) {
        stop()
        window.clearTimeout(resume)
        resume = window.setTimeout(start, RESUME_MS)
      }
    }
    const stop = () => {
      window.clearInterval(timer)
      panel?.removeAttribute('data-cycling')
    }
    const start = () => {
      stop()
      if (reduced || viewRef.current !== 'live') return
      panel?.setAttribute('data-cycling', '')
      panel?.style.setProperty('--cycle', `${CYCLE_MS}ms`)
      activate(cur)
      timer = window.setInterval(() => activate((cur + 1) % KEYS.length), CYCLE_MS)
    }
    startCycle.current = start
    stopCycle.current = stop

    const onWord = (e: Event) =>
      activate(
        KEYS.indexOf((e.currentTarget as HTMLElement).dataset.k as (typeof KEYS)[number]),
        true
      )
    words.forEach((w) => w.addEventListener('mouseenter', onWord))
    tabs.forEach((t) => t.addEventListener('click', onWord))
    const onTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      const n = (cur + (e.key === 'ArrowRight' ? 1 : KEYS.length - 1)) % KEYS.length
      activate(n, true)
      tabs[n]?.focus()
    }
    tabs.forEach((t) => t.addEventListener('keydown', onTabKey))

    // Live contrast from the page's own colour tokens; re-measured on theme change
    const measure = () => {
      const css = getComputedStyle(document.documentElement)
      const tok = (n: string) => css.getPropertyValue(n).trim()
      const pairs: Record<string, [string, string]> = {
        text: [tok('--color-ds-text'), tok('--color-ds-bg')],
        muted: [tok('--color-ds-muted'), tok('--color-ds-bg')],
        link: [tok('--color-ds-accent'), tok('--color-ds-bg')],
        btn: ['#ffffff', tok('--color-ds-cta')],
      }
      root.querySelectorAll<HTMLElement>('[data-pair]').forEach((row) => {
        const [fg, bg] = pairs[row.dataset.pair ?? ''] ?? []
        if (!fg?.startsWith('#') || !bg?.startsWith('#')) return
        const r = contrast(fg, bg)
        const sw = row.querySelector<HTMLElement>('.hero-sw')
        if (sw) {
          sw.style.color = fg
          sw.style.background = bg
        }
        const ratio = row.querySelector('.hero-ratio')
        if (ratio) ratio.textContent = `${r.toFixed(1)} : 1`
        const grade = row.querySelector<HTMLElement>('.hero-grade')
        if (grade) {
          const lv = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : 'fail'
          grade.textContent = lv
          grade.className = `hero-grade ml-2 rounded-md px-1.5 py-0.5 text-[11px] ${
            lv === 'AAA'
              ? 'bg-ds-success/20 text-ds-success'
              : lv === 'AA'
                ? 'bg-ds-accent/20 text-ds-accent-strong'
                : 'bg-ds-warning/20 text-ds-warning-strong'
          }`
        }
      })
    }
    measure()
    const themeWatch = new MutationObserver(measure)
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    activate(0)
    start()
    const onResize = () => activate(cur)
    window.addEventListener('resize', onResize)

    return () => {
      stop()
      window.clearTimeout(resume)
      themeWatch.disconnect()
      window.removeEventListener('resize', onResize)
      words.forEach((w) => w.removeEventListener('mouseenter', onWord))
      tabs.forEach((t) => {
        t.removeEventListener('click', onWord)
        t.removeEventListener('keydown', onTabKey)
      })
    }
  }, [])

  // First-visit intro: design (already up from first paint) → code → live
  useEffect(() => {
    const html = document.documentElement
    if (!html.hasAttribute('data-hero-intro')) return
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
    const t0 = window.setTimeout(() => setView('design'), 0)
    const t1 = window.setTimeout(() => {
      setView('code')
      html.removeAttribute('data-hero-intro')
    }, INTRO.toCode)
    const t2 = window.setTimeout(() => setView('live'), INTRO.toLive)
    return () => {
      ;[t0, t1, t2].forEach(window.clearTimeout)
      html.removeAttribute('data-hero-intro')
    }
  }, [])

  // Restart the code typing whenever Code is shown
  useEffect(() => {
    if (view !== 'code') return
    stage.current?.querySelectorAll<HTMLElement>('.hero-ln').forEach((l) => {
      l.style.animation = 'none'
      void l.offsetWidth
      l.style.animation = ''
    })
  }, [view])

  const choose = (v: View) => {
    document.documentElement.removeAttribute('data-hero-intro')
    setView(v)
  }

  return (
    <div>
      <div
        ref={bar}
        role="group"
        aria-label="View this hero as"
        // max-w-full + overflow-x-auto: on watch-size screens (~200px) the
        // three buttons can't fit, so the switch scrolls within itself
        // instead of pushing the whole page sideways.
        className="border-ds-border bg-ds-surface relative inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border p-1"
      >
        <span className="text-ds-muted px-2 font-mono text-[11px] tracking-wider uppercase max-[360px]:hidden">
          view as
        </span>
        <span
          ref={ind}
          aria-hidden="true"
          className="hero-vb-ind border-ds-border2 bg-ds-surface2 absolute top-1 bottom-1 rounded-lg border"
          style={{ left: 0, width: 0 }}
        />
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            data-view={v}
            aria-pressed={view === v}
            onClick={() => choose(v)}
            className="text-ds-muted aria-pressed:text-ds-text hover:text-ds-text relative z-[1] rounded-lg px-3.5 py-1.5 text-[13px] font-semibold capitalize transition-colors"
          >
            {v}
          </button>
        ))}
      </div>

      <div ref={stage} className="hero-stage" data-view={view}>
        {children}
        <div className="hero-ov hero-ov-design" aria-hidden="true" inert>
          {design}
        </div>
        <div className="hero-ov hero-ov-code" aria-hidden="true" inert>
          {code}
        </div>
      </div>
    </div>
  )
}
