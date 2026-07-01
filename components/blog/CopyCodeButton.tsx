'use client'

import { useRef, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { cn } from '@/lib/utils/cn'

/**
 * Sits inside the `pre` wrapper rendered by MDXComponents. Reads the sibling
 * <pre> element's text at click time instead of threading the raw code string
 * through props — keeps the pre/code rendering (rehype-pretty-code output)
 * untouched and this component fully decoupled from it.
 */
export function CopyCodeButton() {
  const [copied, setCopied] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  async function handleCopy() {
    const pre = wrapperRef.current?.parentElement?.querySelector('pre')
    const text = pre?.textContent ?? ''
    if (!text) return

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={wrapperRef} className="absolute top-2 right-2 z-10">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className={cn(
          'border-ds-border bg-ds-surface text-ds-muted hover:border-ds-accent hover:text-ds-accent',
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs opacity-0 backdrop-blur transition-opacity',
          'group-hover:opacity-100 focus-visible:opacity-100',
          copied && 'border-ds-success text-ds-success opacity-100'
        )}
      >
        <Icon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
