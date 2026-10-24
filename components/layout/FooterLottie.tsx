'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import type { AnimationItem } from 'lottie-web'
import { LogoMark } from '@/components/ui/LogoMark'

// "Working and Drinking Coffee in Office" by Muhammad Tahir —
// https://lottiefiles.com/free-animation/working-and-drinking-coffee-in-office-rFMTfNZTfQ
// Lottie Simple License (free for commercial use, no attribution required).
// Edited from the original download: cyan recoloured to the DevStash blue,
// the four floating HTML/CSS/JS/PHP tags removed (their letters are glyph
// outlines, not text — the chips below replace them), a `lottie-bg` class on
// the backdrop circle so CSS can theme it, numbers rounded to 3 decimals.
const SRC = '/images/animations/working-coffee.json'
// Frames 0–58 build the scene (desk, screen, then the developer appears);
// 58–140: reach for the mug, sip, put it down. It plays once and holds on
// STILL_FRAME — looping made the monitor's scrolling page jump on restart.
const STILL_FRAME = 140
// Synced to the artwork: the monitor is in place by SCREEN_FRAME, so the
// DevStash logo boots on it; the stack bursts out once the developer is seated.
const SCREEN_FRAME = 44
const CHIPS_FRAME = 62
// After one play-through in this tab, later footers show the finished scene.
const SEEN_KEY = 'ds-footer-intro-seen'

// Where each chip settles (% of the 750×500 artwork) and the offset it bursts
// from — back toward the monitor (cqw, so it scales with the illustration).
const CHIPS: { label: string; x: number; y: number; fx: number; fy: number; ai?: boolean }[] = [
  { label: 'React', x: 22, y: 16, fx: 18.3, fy: 11.7 },
  { label: 'Next.js', x: 42, y: 7, fx: 5, fy: 13.3 },
  { label: 'TypeScript', x: 66, y: 10, fx: -10, fy: 12.5 },
  { label: 'Tailwind CSS', x: 86, y: 24, fx: -21.7, fy: 9.2 },
  { label: 'AI', x: 76, y: 40, fx: -15, fy: 1.7, ai: true },
]

function readSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The desk half of the footer room. Costs nothing on page load: lottie-web
 * (light SVG build) and the animation file load only when the visitor is
 * within ~600px of the footer. It plays once per tab when the footer is in
 * view, pausing off screen; the screen logo and chip burst key off its frames
 * (`data-screen` / `data-chips`). Reduced motion and later visits get the
 * finished scene (`data-still`). The overlays only show once the artwork has
 * loaded (`data-ready`), so they never float over an empty box.
 */
export function FooterLottie() {
  const wrap = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = wrap.current
    const el = box.current
    if (!root || !el) return
    let anim: AnimationItem | undefined
    let started = false
    let cancelled = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const still = reduce || readSeen()

    const onScreen = new IntersectionObserver(
      ([entry]) => {
        const a = anim
        if (!a) return
        if (!entry?.isIntersecting) return a.pause()
        if (started) return a.play() // resume, don't restart
        started = true
        a.addEventListener('enterFrame', (e) => {
          if (e.currentTime >= SCREEN_FRAME) root.dataset.screen = ''
          if (e.currentTime >= CHIPS_FRAME) root.dataset.chips = ''
        })
        a.addEventListener('complete', () => onScreen.disconnect())
        a.playSegments([0, STILL_FRAME], true)
        try {
          sessionStorage.setItem(SEEN_KEY, '1')
        } catch {}
      },
      { threshold: 0.4 }
    )

    const near = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return
        near.disconnect()
        try {
          const [{ default: lottie }, data] = await Promise.all([
            import('lottie-web/build/player/lottie_light'),
            fetch(SRC).then((r) => r.json()),
          ])
          if (cancelled) return
          anim = lottie.loadAnimation({
            container: el,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: data,
            rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
          })
          anim.goToAndStop(still ? STILL_FRAME : 0, true)
          root.dataset.ready = ''
          if (still) {
            root.dataset.still = ''
            root.dataset.screen = ''
            root.dataset.chips = ''
          } else onScreen.observe(el)
        } catch {
          // Decorative — if it can't load, the footer simply has no illustration.
        }
      },
      { rootMargin: '600px 0px' }
    )

    near.observe(el)
    return () => {
      cancelled = true
      near.disconnect()
      onScreen.disconnect()
      anim?.destroy()
    }
  }, [])

  return (
    <div
      ref={wrap}
      role="img"
      aria-label="Illustration: a developer at a desk with a cup of coffee; the DevStash logo is on the screen, with React, Next.js, TypeScript, Tailwind CSS and AI floating above"
      className="footer-lottie [container-type:inline-size] relative aspect-[3/2] w-full max-w-[600px]"
    >
      <div ref={box} className="absolute inset-0" />
      {/* The monitor's tilted face in the artwork, tuned by eye */}
      <div aria-hidden="true" className="footer-screen">
        <div className="footer-screen-face">
          <span className="block w-[24%] [&>svg]:h-auto [&>svg]:w-full">
            <LogoMark />
          </span>
          <span className="footer-screen-wm">
            <span className="text-[#3b82f6]">Dev</span>Stash
          </span>
        </div>
      </div>
      {CHIPS.map(({ label, x, y, fx, fy, ai }, i) => (
        <span
          key={label}
          aria-hidden="true"
          className={`footer-chip ${ai ? 'footer-chip-ai' : ''}`}
          style={
            {
              left: `${x}%`,
              top: `${y}%`,
              '--fx': `${fx}cqw`,
              '--fy': `${fy}cqw`,
              '--i': i,
            } as CSSProperties
          }
        >
          {ai && <span className="text-ds-purple">✦</span>}
          {label}
        </span>
      ))}
    </div>
  )
}
