'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  CONSENT_OPEN_EVENT,
  openConsent,
  readConsent,
  subscribeConsent,
  writeConsent,
} from '@/lib/consent'

/**
 * Asks once whether analytics may run. Accept and Reject are the same size and style on purpose.
 * It appears only when no choice is saved, or when the footer link reopens it.
 */
export function ConsentBanner() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => 'granted' as const)
  const [reopened, setReopened] = useState(false)
  const first = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const open = () => setReopened(true)
    window.addEventListener(CONSENT_OPEN_EVENT, open)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open)
  }, [])

  // A first-time visitor sees the banner on their first scroll, tap or key press (or after 10 s if
  // they do nothing). Painted at once, its text can become the page's largest contentful element
  // and so the LCP, which then waits on JavaScript. The browser stops counting LCP candidates at the
  // first input, so a banner shown after one cannot. Nothing loads before a choice either way. The
  // footer link (reopened) still opens it immediately.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
    const done = () => setSettled(true)
    for (const e of events) window.addEventListener(e, done, { once: true, passive: true })
    const timer = window.setTimeout(done, 10_000)
    return () => {
      window.clearTimeout(timer)
      for (const e of events) window.removeEventListener(e, done)
    }
  }, [])

  const show = (consent === 'unset' && settled) || reopened
  useEffect(() => {
    if (reopened) first.current?.focus()
  }, [reopened])

  if (!show) return null

  const choose = (v: 'granted' | 'denied') => {
    setReopened(false)
    writeConsent(v)
  }
  const btn =
    'border-ds-border2 text-ds-text hover:border-ds-accent hover:text-ds-accent focus-visible:outline-ds-accent rounded-md border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

  return (
    <section
      aria-label="Analytics choice"
      className="border-ds-border2 bg-ds-surface fixed inset-x-3 bottom-3 z-50 rounded-lg border p-3 shadow-lg sm:right-auto sm:max-w-sm sm:p-4"
    >
      <p className="text-ds-text text-[13px] leading-snug sm:text-sm">
        Can I use analytics to see which pages are useful? That includes recordings of how you click
        and scroll. Nothing loads until you choose.{' '}
        <Link href="/privacy" className="text-ds-accent-strong underline underline-offset-4">
          Details
        </Link>
      </p>
      <div className="mt-2.5 flex gap-2">
        <button ref={first} type="button" className={btn} onClick={() => choose('denied')}>
          Reject
        </button>
        <button type="button" className={btn} onClick={() => choose('granted')}>
          Accept
        </button>
      </div>
    </section>
  )
}

export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsent} className={className}>
      Cookie settings
    </button>
  )
}
