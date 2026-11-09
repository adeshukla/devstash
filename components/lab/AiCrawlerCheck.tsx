'use client'

import { useMemo, useState } from 'react'
import { checkCrawlers, KIND_LABEL, type Status } from '@/lib/lab/aiCrawlers'
import { trackLab } from './track'

const EXAMPLE = `User-agent: *
Allow: /
Disallow: /admin/

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

Sitemap: https://example.com/sitemap.xml`

const STATUS: Record<Status, { label: string; cls: string }> = {
  blocked: { label: 'Blocked', cls: 'border-ds-error/50 text-ds-error' },
  allowed: { label: 'Allowed', cls: 'border-ds-success/50 text-ds-success' },
  partial: { label: 'Some paths blocked', cls: 'border-ds-warning/50 text-ds-warning-strong' },
}

/**
 * Paste a robots.txt and see which known AI crawlers it blocks. Reads what you paste; it does
 * not fetch your site. Runs in the browser, nothing is sent anywhere.
 */
export function AiCrawlerCheck() {
  const [text, setText] = useState('')
  const results = useMemo(() => checkCrawlers(text), [text])
  const blocked = results.filter((r) => r.status === 'blocked').length

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="robots-check" className="text-ds-text mb-1.5 block text-[13px] font-medium">
          Paste your robots.txt
        </label>
        <textarea
          id="robots-check"
          rows={7}
          value={text}
          onChange={(e) => {
            if (!text && e.target.value) trackLab('seo-kit', 'ai_check_paste')
            setText(e.target.value)
          }}
          placeholder="Open yoursite.com/robots.txt in a browser and copy everything on the page."
          className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full resize-y rounded-lg border px-4 py-3 font-mono text-xs leading-relaxed outline-none"
        />
        {!text && (
          <button
            type="button"
            onClick={() => setText(EXAMPLE)}
            className="text-ds-accent-strong mt-2 text-sm hover:underline"
          >
            Not sure? Try an example
          </button>
        )}
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        <p className="text-ds-text font-medium">
          {text.trim()
            ? `${blocked} of ${results.length} AI crawlers blocked`
            : 'With no robots.txt, every crawler below is allowed.'}
        </p>
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <li
              key={r.token}
              className="border-ds-border bg-ds-surface2 flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="text-ds-text text-sm">
                  <span className="font-mono font-medium [overflow-wrap:anywhere]">{r.token}</span>{' '}
                  <span className="text-ds-muted">
                    · {r.owner} · {KIND_LABEL[r.kind]}
                  </span>
                </p>
                <p className="text-ds-muted mt-1 text-xs leading-relaxed">{r.note}</p>
              </div>
              <span
                className={`${STATUS[r.status].cls} shrink-0 self-start rounded-full border px-2.5 py-0.5 text-xs font-medium`}
              >
                {STATUS[r.status].label}
                {text.trim() && r.status !== 'blocked' && r.via === 'none' ? ' (no rule)' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
