// components/layout/MobileNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/icons/Icon'
import { siteConfig } from '@/content/metadata/site.config'

interface NavItem {
  label: string
  href: string
}

interface MobileNavProps {
  items: readonly NavItem[]
}

// Enter and exit share the SAME curve (just a shorter duration closing) —
// one consistent easing in both directions is what reads as calm rather
// than a different, sharper curve on the way out.
//
// This is a genuine "confident arrival" curve (cubic-bezier(0.16, 1, 0.3, 1)
// — control points already at y=1 by x≈0.3), not a generic linear/Material
// ease. That front-loaded shape only reads as a snap-then-pause when the
// duration is too short for the eye to register the tail end of the curve
// as motion at all — which 200-320ms was. A full-viewport drawer is a
// "deliberately authored" reveal (it's the primary mobile nav entry point),
// not a routine micro-interaction, so it gets the longer end of that
// timing band; the curve now has room to actually read as a glide instead
// of a jump-cut. Exit stays quicker than entrance (closing is a dismissal,
// not a moment to dwell on) but still long enough to see happen.
const ENTER_MS = 460
const EXIT_MS = 300
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function MobileNav({ items }: MobileNavProps) {
  // `open` = dialog is mounted/showModal()'d. `entered` = drawer is in its
  // settled on-screen position. Keeping these separate lets the panel paint
  // off-screen first, then transition in on the next frame (a real enter
  // transition instead of an animation applied at the same time the dialog
  // snaps open), and lets close play its own transition before unmounting.
  const [open, setOpen] = useState(false)
  const [entered, setEntered] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelWidthRef = useRef(281)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const scrollYRef = useRef(0)
  const pathname = usePathname()
  const gradientId = useId()
  const closeGradientId = useId()

  function requestClose() {
    setEntered(false)
    window.clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => setOpen(false), EXIT_MS)
  }

  // Close on route change — page already navigated, so snap shut immediately
  useEffect(() => {
    window.clearTimeout(closeTimeoutRef.current)
    setEntered(false)
    setOpen(false)
  }, [pathname])

  // Sync dialog mount + trigger the enter transition a frame after paint
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // showModal()/close() move focus (to the close button, then back to the
    // hamburger), and html has scroll-behavior:smooth globally for TOC anchor
    // links. Without this guard the browser's own focus-driven scrollIntoView
    // animates instead of jumping instantly, which read as the whole screen
    // shaking on every open/close. Force instant scrolling for just this
    // synchronous focus change, then restore.
    const html = document.documentElement
    const prevScrollBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    if (open) {
      // Height is CSS-only now (`h-dvh` + `max-h-none` on the dialog, `h-dvh`
      // on the panel below) — deliberately NOT JS-snapshotted. That used to
      // read `window.visualViewport.height` once and lock it in, which
      // seemed right (dvh is exactly the "collapsing address bar" unit) but
      // measured on a real phone, not an emulator, it wasn't: the snapshot
      // fires before the browser's OWN address-bar-collapse animation
      // finishes, so it captures a too-small height, and the resize listener
      // that was here to catch the later correction had nothing to smoothly
      // transition INTO — it just snapped, which is what read as content
      // (the footer) briefly overlapping the page mid-open. The dialog/panel
      // height only ever looked JS-snapshot-worthy because of the transform
      // compositor bug below (width, not height) — now that the slide
      // doesn't use `transform` at all, native `dvh` recalculation, which
      // the browser already handles smoothly on its own, is the more
      // correct source of truth than a one-time JS read ever was.
      //
      // Width is still computed here: it's what the off-screen starting
      // `right` position needs, and (unlike height) a phone's address bar
      // collapses vertically only — width has no equivalent staleness risk.
      const width = Math.round(Math.min(window.innerWidth * 0.75, 384))
      panelWidthRef.current = width
      if (panelRef.current) panelRef.current.style.width = `${width}px`
      // `overflow: hidden` alone does NOT reliably stop background touch-
      // scroll on iOS Safari — a well-known platform gap, not something
      // this project introduced. Pinning body with `position: fixed` at its
      // current scroll offset is the actual cross-browser lock; scrollTo()
      // on close restores the exact position instead of jumping to the top.
      scrollYRef.current = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollYRef.current}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
      void document.body.offsetHeight
      // Paint fully off-screen (no transition yet) before the dialog is even
      // shown — see the panel element's own note for why this now slides via
      // `right` instead of `transform: translateX()`.
      if (panelRef.current) {
        panelRef.current.style.transition = 'none'
        panelRef.current.style.right = `-${width}px`
        void panelRef.current.offsetHeight
      }
      dialog.showModal()
      // Not native `autoFocus` — that fights this same guard by focusing
      // during React's commit, outside our control. preventScroll is the
      // real fix: it stops the focus-triggered scrollIntoView outright
      // rather than just making it instant.
      closeButtonRef.current?.focus({ preventScroll: true })
      html.style.scrollBehavior = prevScrollBehavior
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true))
      })
      return () => cancelAnimationFrame(raf)
    } else {
      dialog.close()
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollYRef.current)
      html.style.scrollBehavior = prevScrollBehavior
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(closeTimeoutRef.current), [])

  // Close on Escape — intercept the native instant-close so it plays the
  // same exit transition as every other close path
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = (e: Event) => {
      e.preventDefault()
      requestClose()
    }
    dialog.addEventListener('cancel', handler)
    return () => dialog.removeEventListener('cancel', handler)
  }, [])

  // The actual slide, kept imperative (not a declarative JSX `style`) so it
  // can read the ref-tracked panel width rather than a percentage. Verified
  // live, exhaustively: animating `transform: translateX()` on this element
  // — position:absolute, inside a native <dialog>'s top layer — measurably
  // rendered it up to ~6px short of its real edge for the transition's ENTIRE
  // duration, snapping to the correct position only once the transition
  // ended (reproduced identically via CSS transitions, the Web Animations
  // API, and a hand-rolled rAF loop — so it's not a "which animation API"
  // bug). Confirmed via the same harness that animating `right` instead
  // shrinks that wrong-position window from ~400ms down to about one frame.
  // `right` is a layout property (triggers reflow, not compositor-only) —
  // normally the wrong call, but for one element, one at a time, under
  // 500ms, that cost is nothing next to shipping a panel that visibly
  // mis-renders itself for the length of its own opening animation.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    panel.style.transition = `right ${entered ? ENTER_MS : EXIT_MS}ms ${EASE}`
    panel.style.right = entered ? '0px' : `-${panelWidthRef.current}px`
  }, [entered])

  return (
    <>
      {/* Hamburger / Close button — carries the site's own signature
          accent→purple gradient (the same treatment the "Dev" in the
          wordmark and the active-nav-tab dot use) instead of a plain
          single-color icon, and picks up `.gradient-ring-hover`'s ring —
          the exact same ring the desktop GitHub/theme-toggle buttons use on
          hover — as a persistent "activated" state while the drawer is
          open. Reusing an existing system beats inventing a one-off. */}
      <button
        onClick={() => (open ? requestClose() : setOpen(true))}
        className={cn(
          'gradient-ring-hover border-ds-border flex h-9 w-9 items-center justify-center rounded-lg border transition-shadow duration-300',
          open && 'gradient-ring-active shadow-[0_0_16px_-2px_var(--color-ds-accent)]'
        )}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="mobile-nav-dialog"
      >
        {/* Hamburger↔X morph — one SVG whose three lines rotate/fade into
            place, instead of swapping two separate icons. Makes the toggle
            itself read as part of the same motion system as the drawer. */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="16"
              y2="16"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="var(--color-ds-accent)" />
              <stop offset="1" stopColor="var(--color-ds-purple)" />
            </linearGradient>
          </defs>
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.75"
            strokeLinecap="round"
            style={{
              transformBox: 'fill-box',
              transformOrigin: '50% 50%',
              transform: open ? 'translateY(4px) rotate(45deg)' : 'none',
              transition: `transform ${open ? 380 : 220}ms var(--ds-ease-smooth)`,
            }}
          />
          <line
            x1="2"
            y1="8"
            x2="14"
            y2="8"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.75"
            strokeLinecap="round"
            style={{
              transformBox: 'fill-box',
              transformOrigin: '50% 50%',
              opacity: open ? 0 : 1,
              transform: open ? 'scaleX(0)' : 'scaleX(1)',
              transition: `opacity ${open ? 220 : 140}ms var(--ds-ease-smooth), transform ${open ? 220 : 140}ms var(--ds-ease-smooth)`,
            }}
          />
          <line
            x1="2"
            y1="12"
            x2="14"
            y2="12"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.75"
            strokeLinecap="round"
            style={{
              transformBox: 'fill-box',
              transformOrigin: '50% 50%',
              transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none',
              transition: `transform ${open ? 380 : 220}ms var(--ds-ease-smooth)`,
            }}
          />
        </svg>
      </button>

      {/* Dialog — accessible, traps focus, closes on Escape. The native
          ::backdrop is left unstyled (bg-transparent below) because its
          transition support is inconsistent across browsers; a plain div
          fades it in/out instead, kept in lockstep with the panel slide so
          nothing pops in ahead of the other. */}
      <dialog
        ref={dialogRef}
        id="mobile-nav-dialog"
        aria-label="Navigation menu"
        // `h-dvh` + `max-h-none`: Chrome's UA stylesheet puts both
        // `height: fit-content` (resolves to 0 here — every child is
        // `position:absolute`, so none of them count as "content" for
        // fit-content to size against) and `max-height: calc(100% - 38px)`
        // on every `<dialog>` by default. Both need an explicit override,
        // not just one — either alone still left the dialog wrong.
        //
        // `overflow-hidden`: the panel's CLOSED position is `right:
        // -{width}px` — deliberately off-screen, to the right of the
        // viewport. Without clipping, that off-screen box still extends the
        // document's scrollable area, which is exactly what a real device
        // showed as a horizontal scrollbar flashing on for the width of the
        // open/close transition (and, on some renders, everything else in
        // the dialog reading as nudged a few px left while that extra
        // scroll width existed). The dialog already matches the viewport
        // exactly (`inset-0` + `h-dvh`), so clipping to its own bounds costs
        // nothing visible — the off-screen panel was never meant to be seen
        // squeezing the layout, only to be seen sliding in.
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-full overflow-hidden bg-transparent p-0"
        style={{ border: 'none' }}
      >
        {/* Plain opacity fade — no backdrop-filter transition. Animating
            blur forces the browser to re-composite everything behind it on
            every frame, which is a well-known source of jank on mobile
            GPUs; a slightly darker flat overlay reads just as intentional
            without the cost. Now that the panel is a 70%-width drawer (not
            full-screen), this backdrop is real tappable "outside" area —
            wired to close, the way every drawer/sheet pattern works. */}
        <div
          aria-hidden="true"
          onClick={requestClose}
          className="absolute inset-0 bg-black/70"
          style={{
            opacity: entered ? 1 : 0,
            transition: `opacity ${entered ? ENTER_MS : EXIT_MS}ms ${EASE}`,
          }}
        />
        <div
          ref={panelRef}
          // No `right-0` here, and no `transform` in the style below — the
          // slide itself is driven imperatively by the `[entered]` effect
          // above (animating `right`, not `transform: translateX()`; see
          // that effect for why). `right` starts unset only for an instant
          // during the very first mount, before that effect or the open
          // sequence ever runs; the panel is inert (dialog closed) then.
          className="bg-ds-surface border-ds-border absolute top-0 flex h-dvh w-[75%] max-w-sm flex-col border-l shadow-2xl"
          style={{
            opacity: entered ? 1 : 0,
            transition: `opacity ${entered ? ENTER_MS : EXIT_MS}ms ${EASE}`,
          }}
        >
          {/* Header — just the grid texture (same atmosphere every page
              header carries), no blob. */}
          <div className="border-ds-border relative flex h-[84px] shrink-0 items-center justify-between overflow-hidden border-b px-5 sm:px-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-ds-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ds-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-25"
            />
            <span
              className="text-ds-text text-[20px] font-bold tracking-tight"
              style={{ letterSpacing: '-0.04em' }}
            >
              <span className="text-ds-accent">Dev</span>Stash
            </span>
            <div className="flex items-center gap-1.5">
              <a
                href={siteConfig.author.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-ds-muted active:bg-ds-text/10 active:text-ds-text flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              >
                <Icon name="github" className="h-5 w-5" />
              </a>
              <ThemeToggle className="text-ds-muted active:bg-ds-text/10 active:text-ds-text flex h-10 w-10 items-center justify-center rounded-lg transition-colors" />
              <button
                ref={closeButtonRef}
                onClick={() => requestClose()}
                className="active:bg-ds-text/10 flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                aria-label="Close menu"
              >
                {/* Same accent→purple stroke as the trigger's hamburger/X —
                    this button IS that same toggle's other half (the drawer's
                    own close control), so it should carry the identical
                    brand treatment instead of falling back to a plain muted
                    X once inside the panel. */}
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient
                      id={closeGradientId}
                      x1="0"
                      y1="0"
                      x2="16"
                      y2="16"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="var(--color-ds-accent)" />
                      <stop offset="1" stopColor="var(--color-ds-purple)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M2 2l12 12M14 2L2 14"
                    stroke={`url(#${closeGradientId})`}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Nav links + footer, one scrollable region — simpler than
              trying to rearrange the layout to fit short viewports (a 2-col
              grid + side-by-side buttons was tried; the résumé button's
              label wrapped to two lines once squeezed to half-width, which
              looked worse than just scrolling). Nothing here changes size
              or shape between portrait and landscape — if it doesn't fit,
              this whole block scrolls, buttons included, instead of any
              element being resized, rearranged, or cropped. */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* No MOUNT animation of its own (opacity or a per-link stagger
                were both tried and read as compounding-with-the-panel-fade/
                busy respectively — see git history; one motion on open beats
                a cascade). What's here is purely interaction-driven, not
                entrance-driven, so it can't reintroduce either problem: each
                link grows an accent bar from its own center
                (transform: scaleY, not opacity) on hover/press/active, the
                same accent→purple the active-nav-tab dot used elsewhere on
                the site already carries, plus a small press-nudge. Both are
                GPU-only transforms fired by user interaction, not a timer,
                so they cost nothing idle and don't fight the mobile-perf-
                driven decision to keep continuous gradient-shift animation
                desktop-only (see .active-nav-gradient in globals.css). */}
            <nav className="flex flex-col gap-1 p-4 sm:px-6" aria-label="Mobile navigation">
              {items.map(({ label, href }) => {
                const isActive = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'group relative flex items-center gap-3 overflow-hidden rounded-lg px-4 py-3.5 pl-5 text-base font-medium transition-[color,background-color,transform] duration-200 active:scale-[0.98]',
                      isActive
                        ? 'bg-ds-accent/10 text-ds-accent'
                        : 'text-ds-muted hover:text-ds-text hover:bg-ds-text/5 active:bg-ds-text/10 active:text-ds-text'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'from-ds-accent to-ds-purple absolute inset-y-2.5 left-1 w-[3px] origin-center scale-y-0 rounded-full bg-gradient-to-b transition-transform duration-300 ease-out group-hover:scale-y-100 group-active:scale-y-100',
                        isActive && 'scale-y-100'
                      )}
                    />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Contact CTA + Résumé — `mt-auto` pins this to the bottom of
                the scroll container when the link list doesn't fill it
                (portrait, same as before the two blocks were merged into one
                scroll region), but auto margins can't go negative, so when
                content actually overflows (landscape) it just falls back to
                sitting right after the nav in normal flow — still reachable
                by scrolling, never forced off-screen either way. */}
            <div className="border-ds-border mt-auto flex flex-col gap-2.5 border-t p-4 sm:px-6 sm:py-6">
              <a
                href="/resume-adesh-shukla.pdf"
                download
                data-analytics-event="cv_viewed"
                className="border-ds-border text-ds-muted active:border-ds-accent active:text-ds-accent flex h-12 w-full items-center justify-center rounded-lg border text-[15px] font-medium transition-colors"
              >
                Download résumé ↓
              </a>
              <Button href="/contact" size="lg" className="w-full font-semibold">
                Contact
              </Button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
