'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface TerminalTypingProps {
  /** Phrases cycled through, typed then deleted. */
  phrases: string[]
  /** Mono prompt shown before the typed text, e.g. "adesh@devstash:~$".
   * Accepts JSX so callers can hide parts of it responsively (the full
   * host prefix doesn't fit a 375px viewport next to the longest phrase). */
  prompt?: ReactNode
  className?: string
  typeSpeed?: number
  deleteSpeed?: number
  pause?: number
}

type Phase = 'typing' | 'pausing' | 'deleting'

/**
 * A terminal-style typewriter: types a phrase, pauses, deletes it, and moves to
 * the next — with a blinking cursor. Decorative (`aria-hidden`); the page's real
 * heading conveys the meaning. Honors prefers-reduced-motion by showing the
 * first phrase statically.
 */
export function TerminalTyping({
  phrases,
  prompt = '$',
  className,
  typeSpeed = 65,
  deleteSpeed = 35,
  pause = 1600,
}: TerminalTypingProps) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('typing')
  const reduced = useRef(false)

  // Reduced motion → just show the first phrase, no animation loop.
  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced.current) setText(phrases[0] ?? '')
  }, [phrases])

  useEffect(() => {
    if (reduced.current || phrases.length === 0) return
    const current = phrases[index % phrases.length]
    let timeout: ReturnType<typeof setTimeout> | undefined

    if (phase === 'typing') {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeed)
      } else {
        timeout = setTimeout(() => setPhase('pausing'), pause)
      }
    } else if (phase === 'pausing') {
      timeout = setTimeout(() => setPhase('deleting'), pause)
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), deleteSpeed)
      } else {
        setIndex((n) => (n + 1) % phrases.length)
        setPhase('typing')
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [text, phase, index, phrases, typeSpeed, deleteSpeed, pause])

  return (
    <span
      className={cn('inline-flex items-center font-mono whitespace-nowrap', className)}
      aria-hidden="true"
    >
      <span className="text-ds-accent">{prompt}</span>
      <span className="text-ds-text ml-2">{text}</span>
      <span className="animate-blink text-ds-accent ml-0.5">▮</span>
    </span>
  )
}
