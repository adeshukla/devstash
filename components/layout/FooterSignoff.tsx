'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icons/Icon'

// Left half of the footer's closing band (the Lottie is the right half).
// A small terminal types three true lines the first time the footer comes
// into view — who, availability, and Adesh's live local time — then offers
// the two things a visitor who read this far might want: the email, one
// click to copy, and the contact page.
//
// It types each time the footer comes into view on a page (it used to play
// once per tab, so on later pages visitors only ever saw it already typed).
// Without JS the lines are simply visible (the base CSS); with reduced
// motion they show without typing.

const IST = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

const delay = (s: number) => ({ '--d': `${s}s` }) as CSSProperties

export function FooterSignoff({ email }: { email: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [time, setTime] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Live clock, client-only (the server doesn't know the visitor's "now")
  useEffect(() => {
    const tick = () => setTime(IST.format(new Date()))
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 30_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.dataset.armed = ''
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        el.dataset.play = ''
        io.disconnect()
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <div ref={ref} className="signoff max-w-md">
      <p className="text-ds-accent font-mono text-xs tracking-widest uppercase">
        {'// end of page'}
      </p>
      <p className="text-ds-text mt-3 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
        Thanks for scrolling all the way down.
      </p>

      <div className="border-ds-border bg-ds-bg/60 mt-6 rounded-xl border p-4 font-mono text-[13px] leading-relaxed backdrop-blur-sm">
        <p className="so-line" style={delay(0.2)}>
          <span className="text-ds-accent">$</span> <span className="so-cmd">whoami</span>
        </p>
        <p className="so-out text-ds-text" style={delay(0.75)}>
          Adesh Shukla — UI developer, Ghaziabad
        </p>
        <p className="so-line mt-2" style={delay(1.15)}>
          <span className="text-ds-accent">$</span> <span className="so-cmd">status</span>
        </p>
        <p className="so-out text-ds-text flex items-baseline gap-2" style={delay(1.7)}>
          <span className="bg-ds-success relative top-[-1px] inline-block h-2 w-2 shrink-0 rounded-full" />
          open to frontend roles · anywhere in India · remote/hybrid
        </p>
        <p className="so-line mt-2" style={delay(2.1)}>
          <span className="text-ds-accent">$</span> <span className="so-cmd">date</span>
        </p>
        <p className="so-out text-ds-muted" style={delay(2.65)}>
          <span className="text-ds-text">{time ?? '—'}</span> IST · replies within 24h
          <span className="bg-ds-accent animate-blink ml-1 inline-block h-3.5 w-1.5 translate-y-[2px]" />
        </p>
      </div>

      <div className="so-actions mt-5 flex flex-wrap items-center gap-3" style={delay(3.05)}>
        <button
          type="button"
          onClick={copyEmail}
          className="border-ds-border2 bg-ds-surface text-ds-text hover:border-ds-accent focus-visible:outline-ds-accent inline-flex max-w-full items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-[13px] [overflow-wrap:anywhere] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Icon
            name={copied ? 'check' : 'copy'}
            className={`h-4 w-4 ${copied ? 'text-ds-success' : ''}`}
          />
          {copied ? 'Copied!' : email}
        </button>
        <Link
          href="/contact"
          className="link-underline text-ds-accent font-mono text-[13px] font-medium"
        >
          or say hi →
        </Link>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Email address copied' : ''}
        </span>
      </div>
    </div>
  )
}
