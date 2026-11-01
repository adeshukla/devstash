'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { copyText } from '@/lib/utils/clipboard'
import { analyzeLink, MAX_CHECK_LINKS } from '@/lib/lab/utmCheck'
import { splitUtm, type SheetRow } from '@/lib/lab/utm'
import { mergeRows } from '@/lib/lab/workspace'
import { KEYS, readStored, writeStored } from './storage'

const EXAMPLE =
  'https://example.com/spring?utm_source=Google&utm_medium=cpc&UTM_Campaign=Spring Sale\nhttps://example.com/news?utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale-2026-03'

/**
 * Paste links, see what each tag says, which GA4 channel it lands in, what is
 * wrong, and a cleaned version. Runs in the browser; nothing is sent anywhere.
 */
export function UtmChecker() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState('')
  const [added, setAdded] = useState('')

  const lines = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    [text]
  )
  const results = useMemo(() => lines.slice(0, MAX_CHECK_LINKS).map(analyzeLink), [lines])
  const cleanedAll = results.map((r) => r.cleaned || r.input).filter((_, i) => !results[i].error)

  // Links that carry UTM tags can go to the saved list the builder uses.
  const addable = results.filter(
    (r) => !r.error && r.params.some((p) => p.key.toLowerCase().startsWith('utm'))
  )

  function addToSaved() {
    const rows: SheetRow[] = []
    for (const r of addable) {
      const url = r.cleaned || r.input
      const split = splitUtm(url)
      if (!split) continue
      rows.push({
        id: crypto.randomUUID(),
        url,
        fields: { url: split.base, ...split.fields },
        createdAt: new Date().toLocaleDateString('sv-SE'),
        owner: readStored<string>(KEYS.owner, '').trim(),
        rules: '',
      })
    }
    const merged = mergeRows(readStored<SheetRow[]>(KEYS.sheet, []), rows)
    writeStored(KEYS.sheet, merged.rows)
    const skipped = rows.length - merged.added
    setAdded(
      `Added ${merged.added} to your saved list${skipped ? ` (${skipped} already there)` : ''}.`
    )
  }

  async function copy(value: string, id: string) {
    if (!(await copyText(value))) return
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor="utm-check" className="text-ds-text mb-1.5 block text-[13px] font-medium">
          Paste your links, one per line
        </label>
        <textarea
          id="utm-check"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="https://yoursite.com/page?utm_source=…"
          className="border-ds-border bg-ds-surface2 text-ds-text placeholder:text-ds-muted focus:border-ds-accent w-full resize-y rounded-lg border px-4 py-3 font-mono text-xs leading-relaxed outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {!text && (
            <button
              type="button"
              onClick={() => setText(EXAMPLE)}
              className="text-ds-accent-strong text-sm hover:underline"
            >
              Not sure? Try an example
            </button>
          )}
          {lines.length > MAX_CHECK_LINKS && (
            <p className="text-ds-warning-strong text-sm">
              Only the first {MAX_CHECK_LINKS} links are checked.
            </p>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-4" aria-live="polite">
          {addable.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" size="sm" variant="outline" onClick={addToSaved}>
                Add {addable.length === 1 ? 'this link' : `these ${addable.length} links`} to my
                saved list
              </Button>
              {added && (
                <p className="text-ds-success text-sm" role="status">
                  {added}{' '}
                  <Link href="/lab/utm-builder" className="text-ds-accent-strong underline">
                    Open the builder
                  </Link>{' '}
                  for the CSV, QR codes and campaign pack.
                </p>
              )}
            </div>
          )}
          {results.length > 1 && cleanedAll.length > 0 && (
            <div>
              <Button type="button" size="sm" onClick={() => copy(cleanedAll.join('\n'), 'all')}>
                {copied === 'all' ? 'Copied ✓' : `Copy all ${cleanedAll.length} cleaned links`}
              </Button>
            </div>
          )}
          <ul className="flex flex-col gap-4">
            {results.map((r, i) => {
              const problems = r.issues.filter((x) => x.level === 'problem').length
              const tips = r.issues.length - problems
              return (
                <li
                  key={i}
                  className="border-ds-border bg-ds-surface2 rounded-xl border p-4"
                  aria-label={`Link ${i + 1}`}
                >
                  <p className="text-ds-text font-mono text-xs break-all">{r.input}</p>
                  {r.error ? (
                    <p className="text-ds-warning-strong mt-2 text-sm">{r.error}</p>
                  ) : (
                    <>
                      <p className="text-ds-text mt-3 text-sm font-medium">
                        {problems
                          ? `${problems} problem${problems === 1 ? '' : 's'}`
                          : 'No problems found'}
                        {tips > 0 && `, ${tips} tip${tips === 1 ? '' : 's'}`}
                      </p>
                      {r.channel && (
                        <p
                          className={`mt-1 text-sm ${r.channel === 'Unassigned' ? 'text-ds-warning-strong' : 'text-ds-muted'}`}
                        >
                          GA4 channel: <strong className="font-semibold">{r.channel}</strong>
                        </p>
                      )}
                      {r.issues.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-1 text-sm">
                          {r.issues.map((x) => (
                            <li
                              key={x.text}
                              className={
                                x.level === 'problem' ? 'text-ds-warning-strong' : 'text-ds-muted'
                              }
                            >
                              <strong className="font-semibold">
                                {x.level === 'problem' ? 'Problem: ' : 'Tip: '}
                              </strong>
                              {x.text}
                            </li>
                          ))}
                        </ul>
                      )}
                      {r.params.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-ds-muted hover:text-ds-accent cursor-pointer text-sm">
                            What each part says ({r.params.length})
                          </summary>
                          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
                            {r.params.map((p, j) => (
                              <div key={j} className="contents">
                                <dt className="text-ds-muted">{p.key}</dt>
                                <dd className="text-ds-text break-all">{p.value || '(empty)'}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      )}
                      {r.cleaned && (
                        <div className="border-ds-border bg-ds-surface mt-3 rounded-lg border p-3">
                          <p className="text-ds-muted text-xs">Cleaned link</p>
                          <p className="text-ds-text mt-1 font-mono text-xs break-all">
                            {r.cleaned}
                          </p>
                          <button
                            type="button"
                            onClick={() => copy(r.cleaned, `c${i}`)}
                            className="border-ds-border text-ds-muted hover:border-ds-accent hover:text-ds-accent mt-2 rounded-md border px-2.5 py-1 text-xs transition-colors"
                          >
                            {copied === `c${i}` ? 'Copied ✓' : 'Copy cleaned link'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="text-ds-muted text-sm">
            Old reports already split?{' '}
            <Link href="/lab/utm-report-cleaner" className="text-ds-accent-strong underline">
              Merge the rows
            </Link>
            . Building new links?{' '}
            <Link href="/lab/utm-builder" className="text-ds-accent-strong underline">
              Use the UTM builder
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  )
}
