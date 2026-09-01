'use client'

import { useState } from 'react'
import { copyText } from '@/lib/utils/clipboard'

/**
 * Shows a real CSS snippet with a working copy button — same
 * navigator.clipboard.writeText pattern as the blog's CopyCodeButton, just
 * not tied to rehype-pretty-code's DOM structure so it can sit on any demo
 * card here. No syntax highlighting library — this is plain CSS, a few
 * lines, monospace is enough.
 */
export function CssCodeBlock({ code, label = 'CSS' }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!(await copyText(code))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-ds-border bg-ds-surface2 relative overflow-hidden rounded-lg border">
      <div className="border-ds-border flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-ds-muted font-mono text-[11px] tracking-wide uppercase">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={
            copied
              ? 'text-ds-success font-mono text-xs'
              : 'text-ds-muted hover:text-ds-accent font-mono text-xs transition-colors'
          }
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      {/* tabIndex + a role/label: a horizontally scrollable region has to be
          reachable and operable by keyboard, or its overflowing content is
          simply unavailable to anyone not using a mouse (axe:
          scrollable-region-focusable). */}
      <pre
        tabIndex={0}
        role="region"
        aria-label={label ? `${label} code` : 'Code'}
        className="focus-visible:ring-ds-accent overflow-x-auto p-3 text-xs leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
      >
        <code className="text-ds-text font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}
