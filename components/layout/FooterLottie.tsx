'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import type { AnimationItem } from 'lottie-web'

// "Working and Drinking Coffee in Office" by Muhammad Tahir —
// https://lottiefiles.com/free-animation/working-and-drinking-coffee-in-office-rFMTfNZTfQ
// Lottie Simple License (free for commercial use, no attribution required).
// Edited from the original download: cyan recoloured to the DevStash blue,
// the four floating HTML/CSS/JS/PHP tags removed (their letters are glyph
// outlines, not text — the tags below replace them), a `lottie-bg` class on
// the backdrop circle so CSS can theme it, numbers rounded to 3 decimals.
const SRC = '/images/animations/working-coffee.json'
// Frames 0–58 build the scene (desk, screen, then the developer appears);
// 58–154 is the loop: reach for the mug, sip (head tips back ~90), put it
// down, keep typing.
const INTRO_END = 58
const STILL_FRAME = 140 // everything on screen, mug back on the desk
// Once the intro has played in this tab, later visits to the footer (other
// pages, a reload) go straight to the loop instead of rebuilding the scene.
const SEEN_KEY = 'ds-footer-intro-seen'

// Roughly where the original tags floated in the 750×500 artwork, as % of
// the frame — spread wider and staggered so the longer labels don't touch.
const TAGS: { label: string; x: number; y: number; ai?: boolean }[] = [
  { label: 'React', x: 27, y: 15 },
  { label: 'Next.js', x: 51, y: 8 },
  { label: 'TypeScript', x: 79, y: 14 },
  { label: 'AI', x: 67.7, y: 37.8, ai: true },
]

function readSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Footer illustration. Costs nothing on page load: lottie-web (light SVG
 * build) and the animation file are fetched only once the visitor is within
 * ~600px of the footer. It starts when the footer is actually in view, runs
 * the build-up intro once, then loops — pausing off screen and resuming
 * where it left off, never restarting. Reduced motion gets a still frame.
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
    const seen = readSeen()
    if (!reduce) root.dataset.armed = ''
    if (seen) root.dataset.seen = ''

    const loopForever = (a: AnimationItem) => {
      a.loop = true
      a.playSegments([INTRO_END, a.totalFrames], true)
    }

    const onScreen = new IntersectionObserver(
      ([entry]) => {
        const a = anim
        if (!a) return
        if (!entry?.isIntersecting) return a.pause()
        if (started) return a.play() // resume, don't restart
        started = true
        root.dataset.play = ''
        if (seen) return loopForever(a)
        a.addEventListener('complete', () => loopForever(a))
        a.play()
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
          // Show a finished frame until it starts (and for reduced motion, for good)
          anim.goToAndStop(reduce || seen ? STILL_FRAME : 0, true)
          if (!reduce) onScreen.observe(el)
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
      aria-label="Illustration: a developer coding at a desk with a cup of coffee, with React, Next.js, TypeScript and AI tags floating above"
      className="footer-lottie [container-type:inline-size] relative aspect-[3/2] w-full max-w-[400px]"
    >
      <div ref={box} className="absolute inset-0" />
      {TAGS.map(({ label, x, y, ai }, i) => (
        <span
          key={label}
          aria-hidden="true"
          className={`footer-tag border-ds-border2 bg-ds-surface text-ds-text absolute flex items-center gap-1 rounded-md border px-[1.6cqw] py-[0.7cqw] font-mono text-[clamp(9px,2.7cqw,12px)] leading-none font-medium whitespace-nowrap shadow-md ${ai ? 'border-ds-purple/70' : ''}`}
          style={{ left: `${x}%`, top: `${y}%`, '--i': i } as CSSProperties}
        >
          {ai && <span className="text-ds-purple">✦</span>}
          {label}
        </span>
      ))}
    </div>
  )
}
