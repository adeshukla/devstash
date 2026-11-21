'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import { checkCrawlers, KIND_LABEL, TRAINING_TOKENS, type Status } from '@/lib/lab/aiCrawlers'
import { str } from '@/lib/lab/sessions'
import { SessionsBar } from './SessionsBar'
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
 * See which known AI crawlers a robots.txt blocks. Paste it, or enter a site and the server reads
 * its robots.txt for you (only that one file, public hosts only). The reading itself happens in
 * the browser.
 */
export function AiCrawlerCheck() {
  const [text, setText] = useState('')
  const [site, setSite] = useState('')
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  async function load() {
    if (!site.trim() || loading) return
    setLoading(true)
    setNote('')
    trackLab('seo-kit', 'ai_check_fetch')
    try {
      const res = await fetch('/api/lab/robots', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: site }),
      })
      const data = (await res.json()) as { text?: string; missing?: boolean; error?: string }
      if (!res.ok) setNote(data.error ?? 'Could not read that site.')
      else if (data.missing) {
        setText('')
        setNote('That site has no robots.txt, so every crawler is allowed.')
      } else setText(data.text ?? '')
    } catch {
      setNote('Could not reach the checker. Paste the file instead.')
    } finally {
      setLoading(false)
    }
  }
  const results = useMemo(() => checkCrawlers(text), [text])
  const blocked = results.filter((r) => r.status === 'blocked').length

  return (
    <>
      <SessionsBar
        tool="ai-crawler"
        label="robots-check"
        heading="Robots check sessions"
        data={{ text }}
        blank={{ text: '' }}
        onApply={(d) => setText(str(d.text, '', 100_000))}
      />
      <div className="flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void load()
          }}
        >
          <label
            htmlFor="robots-site"
            className="text-ds-text mb-1.5 block text-[13px] font-medium"
          >
            Check a site
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="robots-site"
              type="text"
              inputMode="url"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="yoursite.com"
              className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent min-w-0 flex-1 rounded-lg border px-4 py-2.5 font-mono text-sm outline-none"
            />
            <Button type="submit" disabled={loading || !site.trim()} className="shrink-0">
              {loading ? 'Reading…' : 'Read robots.txt'}
            </Button>
          </div>
          {note && (
            <p className="text-ds-warning-strong mt-2 text-sm" role="status">
              {note}
            </p>
          )}
          <p className="text-ds-muted mt-2 text-xs">
            We fetch only that site’s robots.txt file. Or paste it below.
          </p>
        </form>
        <div>
          <label
            htmlFor="robots-check"
            className="text-ds-text mb-1.5 block text-[13px] font-medium"
          >
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
          {blocked < results.length && (
            <div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  const lines = TRAINING_TOKENS.map((t) => `User-agent: ${t}\nDisallow: /`).join(
                    '\n\n'
                  )
                  if (await copyText(lines)) {
                    trackLab('seo-kit', 'ai_check_copy_optout')
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }
                }}
              >
                {copied ? 'Copied ✓' : 'Copy lines that opt out of AI training'}
              </Button>
              <p className="text-ds-muted mt-1.5 text-xs">
                Add them to your robots.txt. Search and “when a person asks” crawlers are left
                alone.
              </p>
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li
                key={r.token}
                className="border-ds-border bg-ds-surface2 flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-ds-text text-sm">
                    <span className="font-mono font-medium [overflow-wrap:anywhere]">
                      {r.token}
                    </span>{' '}
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
    </>
  )
}
