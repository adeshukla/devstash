// components/layout/MobileNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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

// Match the timing/easing the rest of the site already uses for CTA motion
// (see --ds-ease-smooth in globals.css) so the drawer feels like the same
// system, not a bolted-on animation.
const ENTER_MS = 320
const EXIT_MS = 220
const ENTER_EASE = 'var(--ds-ease-smooth)' // cubic-bezier(0.22, 1, 0.36, 1) — settles in
const EXIT_EASE = 'cubic-bezier(0.4, 0, 1, 1)' // snappy close

export function MobileNav({ items }: MobileNavProps) {
  // `open` = dialog is mounted/showModal()'d. `entered` = drawer is in its
  // settled on-screen position. Keeping these separate lets the panel paint
  // off-screen first, then transition in on the next frame (a real enter
  // transition instead of an animation applied at the same time the dialog
  // snaps open), and lets close play its own transition before unmounting.
  const [open, setOpen] = useState(false)
  const [entered, setEntered] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pathname = usePathname()

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
    if (open) {
      dialog.showModal()
      document.body.style.overflow = 'hidden'
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true))
      })
      return () => cancelAnimationFrame(raf)
    } else {
      dialog.close()
      document.body.style.overflow = ''
    }
    return () => {
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

  return (
    <>
      {/* Hamburger / Close button */}
      <button
        onClick={() => (open ? requestClose() : setOpen(true))}
        className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="mobile-nav-dialog"
      >
        {/* Hamburger↔X morph — one SVG whose three lines rotate/fade into
            place, instead of swapping two separate icons. Makes the toggle
            itself read as part of the same motion system as the drawer. */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <line
            x1="2"
            y1="4"
            x2="14"
            y2="4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            style={{
              transformBox: 'fill-box',
              transformOrigin: '50% 50%',
              transform: open ? 'translateY(4px) rotate(45deg)' : 'none',
              transition: 'transform 280ms var(--ds-ease-smooth)',
            }}
          />
          <line
            x1="2"
            y1="8"
            x2="14"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            style={{
              transformBox: 'fill-box',
              transformOrigin: '50% 50%',
              opacity: open ? 0 : 1,
              transform: open ? 'scaleX(0)' : 'scaleX(1)',
              transition:
                'opacity 160ms var(--ds-ease-smooth), transform 160ms var(--ds-ease-smooth)',
            }}
          />
          <line
            x1="2"
            y1="12"
            x2="14"
            y2="12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            style={{
              transformBox: 'fill-box',
              transformOrigin: '50% 50%',
              transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none',
              transition: 'transform 280ms var(--ds-ease-smooth)',
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
        className="fixed inset-0 m-0 h-full max-h-full w-full max-w-full bg-transparent p-0"
        style={{ border: 'none' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose()
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/60"
          style={{
            opacity: entered ? 1 : 0,
            backdropFilter: entered ? 'blur(2px)' : 'blur(0px)',
            transition: `opacity ${entered ? ENTER_MS : EXIT_MS}ms ${entered ? ENTER_EASE : EXIT_EASE}, backdrop-filter ${entered ? ENTER_MS : EXIT_MS}ms ${entered ? ENTER_EASE : EXIT_EASE}`,
          }}
        />
        <div
          className="bg-ds-surface border-ds-border absolute top-0 right-0 flex h-full w-72 flex-col border-l shadow-2xl will-change-transform"
          style={{
            // Was `translateX(...) scale(...)` — on a full-height, right-
            // docked panel, scaling from center shrinks it away from the top
            // AND bottom edges mid-animation, briefly exposing the backdrop/
            // page underneath as a gap at the bottom of the screen (reported
            // as "shakes" / "layout shows up at the very bottom"). A
            // full-height drawer should only ever move along one axis.
            transform: entered ? 'translateX(0)' : 'translateX(100%)',
            transition: `transform ${entered ? ENTER_MS : EXIT_MS}ms ${entered ? ENTER_EASE : EXIT_EASE}`,
          }}
        >
          {/* Header */}
          <div className="border-ds-border flex h-[58px] items-center justify-between border-b px-5">
            <span
              className="text-ds-text text-[16px] font-bold tracking-tight"
              style={{ letterSpacing: '-0.04em' }}
            >
              <span className="text-ds-accent">Dev</span>Stash
            </span>
            <div className="flex items-center gap-2">
              <a
                href={siteConfig.author.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-ds-muted hover:text-ds-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              >
                <Icon name="github" className="h-4 w-4" />
              </a>
              <ThemeToggle className="text-ds-muted hover:text-ds-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors" />
              <button
                onClick={() => requestClose()}
                className="text-ds-muted hover:text-ds-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                aria-label="Close menu"
                autoFocus
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M2 2l12 12M14 2L2 14"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Nav links — each one fades/slides in with a small stagger after
              the panel settles, instead of all seven appearing at once. Only
              staggered on the way in; closing fades everything together so
              it doesn't outlast the panel's own exit. */}
          <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Mobile navigation">
            {items.map(({ label, href }, i) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-medium',
                    isActive
                      ? 'bg-ds-accent/10 text-ds-accent'
                      : 'text-ds-muted hover:text-ds-text hover:bg-ds-text/5'
                  )}
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'translateX(0)' : 'translateX(14px)',
                    // An inline `transition` shorthand fully overrides any
                    // class-based transition-property for the same element,
                    // so the hover color transition has to live in this same
                    // string rather than Tailwind's `transition-colors`.
                    transition: [
                      `opacity 320ms var(--ds-ease-smooth) ${entered ? 70 + i * 40 : 0}ms`,
                      `transform 320ms var(--ds-ease-smooth) ${entered ? 70 + i * 40 : 0}ms`,
                      'color 200ms ease',
                      'background-color 200ms ease',
                    ].join(', '),
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <span
                      className="active-nav-gradient h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Contact CTA + Résumé */}
          <div className="border-ds-border flex flex-col gap-2 border-t p-4">
            <a
              href="/resume-adesh-shukla.pdf"
              download
              data-analytics-event="cv_viewed"
              className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent flex h-11 w-full items-center justify-center rounded-lg border text-[14px] font-medium transition-colors"
            >
              Download résumé ↓
            </a>
            <Button href="/contact" className="w-full font-semibold">
              Contact
            </Button>
          </div>
        </div>
      </dialog>
    </>
  )
}
