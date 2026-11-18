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

  const show = consent === 'unset' || reopened
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
        Allow analytics (Google Analytics and Clarity)? Nothing loads until you choose, and you can
        change it in the footer.{' '}
        <Link href="/privacy" className="text-ds-accent-strong underline underline-offset-4">
          Privacy policy
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
