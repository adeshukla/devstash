'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

/** Copies the address to the clipboard; falls back to a mailto if that is blocked. */
export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(email)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <Button variant="ghost" size="lg" onClick={copy}>
      <span aria-live="polite">{state === 'copied' ? 'Copied ✓' : email}</span>
    </Button>
  )
}
