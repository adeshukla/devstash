'use client'

import { useState } from 'react'
import { ga4Channel, normalizeValue } from '@/lib/lab/utm'
import { copyText } from '@/lib/utils/clipboard'

const GUIDE = 'https://support.google.com/analytics/answer/13051316'
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * One line under a link: which GA4 channel its source and medium land in.
 * Unassigned gets the warning colour because it is the usual reason campaign
 * traffic goes missing from reports, and a short fix guide opens below it.
 */
export function ChannelNote({ source, medium }: { source: string; medium: string }) {
  const [copied, setCopied] = useState(false)
  const channel = ga4Channel(source, medium)
  if (!channel) return null
  const lost = channel === 'Unassigned'
  const regex = `^${escapeRegex(normalizeValue(medium))}$`

  async function copyRegex() {
    if (!(await copyText(regex))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-1.5 text-sm">
      <p className={lost ? 'text-ds-warning-strong' : 'text-ds-muted'}>
        GA4 channel: <strong className="font-semibold">{channel}</strong>
        {lost && ' — not recognised.'}
      </p>
      {lost && normalizeValue(medium) && (
        <details className="mt-1">
          <summary className="text-ds-accent-strong cursor-pointer text-sm">
            How to fix this
          </summary>
          <div className="text-ds-muted mt-2 flex flex-col gap-2">
            <p>
              <strong className="text-ds-text">Easiest:</strong> use a standard type of traffic such
              as cpc, email, social or referral.
            </p>
            <p>
              <strong className="text-ds-text">To keep your own name:</strong> in GA4 open Admin,
              Data display, Channel groups. Copy the default group, add a channel, and set the
              condition Medium matches regex{' '}
              <code className="bg-ds-surface2 rounded px-1 font-mono text-xs">{regex}</code> (GA4
              regex is case sensitive). Move it above the other channels.{' '}
              <a href={GUIDE} className="text-ds-accent-strong underline" rel="noopener noreferrer">
                Google&apos;s guide
              </a>{' '}
              (menu names can change).
            </p>
            <button
              type="button"
              onClick={copyRegex}
              className="border-ds-border hover:border-ds-accent hover:text-ds-accent self-start rounded-md border px-2.5 py-1 text-xs transition-colors"
            >
              <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy the regex'}</span>
            </button>
          </div>
        </details>
      )}
    </div>
  )
}
