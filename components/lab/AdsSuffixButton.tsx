'use client'

import { useState } from 'react'
import { copyText } from '@/lib/utils/clipboard'
import { adsSuffix } from '@/lib/lab/utmCheck'

/**
 * Google Ads: keep auto-tagging on and put the UTM part in the campaign's
 * Final URL suffix instead of in every ad URL. This copies just that part,
 * without the question mark.
 */
export function AdsSuffixButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const suffix = adsSuffix(url)
  if (!suffix) return null

  async function copy() {
    if (!(await copyText(suffix))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-ds-border mt-3 rounded-lg border p-3">
      <button
        type="button"
        onClick={copy}
        className="border-ds-border text-ds-text hover:border-ds-accent hover:text-ds-accent rounded-md border px-2.5 py-1 text-xs transition-colors"
      >
        <span aria-live="polite">
          {copied ? 'Copied ✓' : 'Copy for Google Ads (Final URL suffix)'}
        </span>
      </button>
      <p className="text-ds-muted mt-2 text-xs">
        Paste it into the campaign&apos;s Final URL suffix and keep auto-tagging on. Then your ad
        URLs stay clean and every ad is tagged the same way.
      </p>
    </div>
  )
}
