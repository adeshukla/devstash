'use client'

import { useEffect, useRef } from 'react'
import type { AnimationItem } from 'lottie-web'

// "Working and Drinking Coffee in Office" by Muhammad Tahir —
// https://lottiefiles.com/free-animation/working-and-drinking-coffee-in-office-rFMTfNZTfQ
// Lottie Simple License (free for commercial use, no attribution required).
// The file is the original with numbers rounded to 3 decimals and a class
// (`lottie-bg`) on the background circle so CSS can theme it.
const SRC = '/images/animations/working-coffee.json'
// Frames 0–58 build the scene (desk, screen, then the developer appears);
// 58–154 is the loop: reach for the mug, sip (head tips back ~90), put it
// down, keep typing while code fills the screen.
const INTRO_END = 58
const STILL_FRAME = 140 // everything on screen, mug back on the desk

/**
 * Footer illustration. Costs nothing on page load: lottie-web (light SVG
 * build) and the animation file are fetched only once the visitor is within
 * ~600px of the footer, and it plays only while it's actually on screen.
 * Reduced motion gets a single still frame.
 */
export function FooterLottie() {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    let anim: AnimationItem | undefined
    let cancelled = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onScreen = new IntersectionObserver(
      ([entry]) => {
        if (!anim) return
        if (entry?.isIntersecting) anim.play()
        else anim.pause()
      },
      { threshold: 0.25 }
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
          const a = lottie.loadAnimation({
            container: el,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: data,
            rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
          })
          anim = a
          if (reduce) {
            a.goToAndStop(STILL_FRAME, true)
            return
          }
          // The intro builds the scene once; after that only the desk part
          // loops — otherwise he'd vanish and pop back in every 6 seconds.
          a.addEventListener('complete', () => {
            a.loop = true
            a.playSegments([INTRO_END, a.totalFrames], true)
          })
          onScreen.observe(el)
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
      ref={box}
      role="img"
      aria-label="Illustration: a developer coding at a desk with a cup of coffee"
      className="footer-lottie aspect-[3/2] w-full max-w-[360px]"
    />
  )
}
