'use client'

import { useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { copyText } from '@/lib/utils/clipboard'

/** The footer note's email: one click copies it; falls back to mailto. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (await copyText(email)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="footer-note-btn focus-visible:outline-ds-accent inline-flex max-w-full items-center gap-2 [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <Icon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5 shrink-0" />
      {copied ? 'Copied!' : email}
    </button>
  )
}
