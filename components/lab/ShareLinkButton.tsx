'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import { trackLab } from './track'

/** Copies a link that reopens the tool in its current state (see useUrlSync). */
export function ShareLinkButton({
  getUrl,
  className,
  tool,
}: {
  getUrl: () => string
  className?: string
  /** Tool name for usage tracking. */
  tool?: string
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function handleClick() {
    const ok = await copyText(getUrl())
    setState(ok ? 'copied' : 'failed')
    if (ok && tool) trackLab(tool, 'copy_share_link')
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} className={className}>
      <span aria-live="polite">
        {state === 'copied'
          ? 'Link copied ✓'
          : state === 'failed'
            ? 'Copy failed'
            : 'Copy share link'}
      </span>
    </Button>
  )
}
